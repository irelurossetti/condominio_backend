# condominio_backend/core/views.py

from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Sum, F, Func
from django.conf import settings
from rest_framework import viewsets, permissions, filters, status, serializers, decorators
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied

import mercadopago
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import (
    ActivityLog, CommonArea, ExpenseType, FamilyMember, Fee, MaintenanceRequest,
    MaintenanceRequestComment, Notice, NoticeCategory, Notification,
    Payment, Pet, Profile, Reservation, Unit, Vehicle, MaintenanceRequestAttachment
)
from .serializers import (
    ActivityLogSerializer, AdminUserWriteSerializer, CommonAreaSerializer,
    ExpenseTypeSerializer, FamilyMemberSerializer, FeeSerializer,
    MaintenanceRequestCommentSerializer, MaintenanceRequestSerializer,
    NoticeCategorySerializer, NoticeSerializer, NotificationSerializer,
    MaintenanceRequestAttachmentSerializer, PaymentSerializer, PetSerializer,
    ProfileSerializer, ReservationSerializer, UnitSerializer,
    UserWithProfileSerializer, VehicleSerializer,
)
from .permissions import IsAdmin, IsOwnerOrAdmin
from .services.fees import register_payment

User = get_user_model()


# --- Serializer local para disponibilidad (no requiere tocar serializers.py) ---
class SlotSerializer(serializers.Serializer):
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    status = serializers.ChoiceField(choices=['free', 'booked'])
    reservation_id = serializers.IntegerField(required=False)
    resident = serializers.CharField(required=False)
    unit = serializers.CharField(required=False)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        identifier = (data.get("email") or data.get("username") or "").strip()
        password = (data.get("password") or "").strip()

        if not identifier or not password:
            return Response({"detail": "Faltan credenciales"}, status=status.HTTP_400_BAD_REQUEST)

        user_lookup = {"email__iexact": identifier} if "@" in identifier else {"username__iexact": identifier}
        user_obj = User.objects.filter(**user_lookup).first()
        if not user_obj:
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        ActivityLog.objects.create(user=user, action="USER_LOGIN_SUCCESS")
        refresh = RefreshToken.for_user(user)
        return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ActivityLog.objects.create(user=request.user, action="USER_LOGOUT")
        return Response({"detail": "Sesión cerrada correctamente."})


class MeViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        serializer = UserWithProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["patch"])
    def update_profile(self, request):
        prof, _ = Profile.objects.get_or_create(user=request.user)
        ser = ProfileSerializer(prof, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related('profile', 'vehicles', 'pets', 'family_members').all().order_by("id")
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        return AdminUserWriteSerializer if self.action in ("create", "update", "partial_update") else UserWithProfileSerializer

    @action(detail=False, methods=['get'])
    def staff_members(self, request):
        staff_users = User.objects.filter(profile__role='STAFF').order_by('username')
        serializer = self.get_serializer(staff_users, many=True)
        return Response(serializer.data)


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.select_related("owner").all().order_by("id")
    serializer_class = UnitSerializer
    permission_classes = [IsAdmin]


class ExpenseTypeViewSet(viewsets.ModelViewSet):
    queryset = ExpenseType.objects.all().order_by("id")
    serializer_class = ExpenseTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action not in ('list', 'retrieve'):
            return [IsAdmin()]
        return super().get_permissions()


class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.select_related("unit", "expense_type", "unit__owner").all()
    serializer_class = FeeSerializer
    ordering = ["-issued_at"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()] if self.action in ("list", "retrieve") else [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("mine") == "1" and self.request.user.is_authenticated:
            qs = qs.filter(unit__owner=self.request.user)
        if period := self.request.query_params.get("period"):
            qs = qs.filter(period=period)
        return qs


class NoticeCategoryViewSet(viewsets.ModelViewSet):
    queryset = NoticeCategory.objects.all()
    serializer_class = NoticeCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action not in ('list', 'retrieve'):
            return [IsAdmin()]
        return super().get_permissions()


class NoticeViewSet(viewsets.ModelViewSet):
    serializer_class = NoticeSerializer

    def get_queryset(self):
        return Notice.objects.filter(publish_date__lte=timezone.now()).select_related("created_by").order_by("-publish_date")

    def get_permissions(self):
        return [permissions.IsAuthenticated()] if self.action in ("list", "retrieve") else [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CommonAreaViewSet(viewsets.ModelViewSet):
    queryset = CommonArea.objects.all()
    serializer_class = CommonAreaSerializer

    @decorators.action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Devuelve slots free/booked usando start_datetime/end_datetime actuales."""
        from datetime import timedelta
        from django.utils.dateparse import parse_datetime

        amenity = self.get_object()
        start = parse_datetime(request.query_params.get('from'))
        end   = parse_datetime(request.query_params.get('to'))
        if not start or not end:
            return Response([], status=200)

        slot_m = int(request.query_params.get('slot', getattr(amenity, 'slot_minutes', 60)))
        delta = timedelta(minutes=slot_m)

        # reservas que pisan el rango pedido: (start < end_req) AND (end > start_req)
        qs = (Reservation.objects
              .filter(area=amenity, start_time__lt=end, end_time__gt=start)
              .select_related('user')
              .values('id', 'start_time', 'end_time',
                      'user__first_name', 'user__last_name', 'user__username'))

        # timeline a slots
        slots = []
        t = start
        while t < end:
            t2 = min(t + delta, end)
            choque = next((r for r in qs if not (t2 <= r['start_time'] or t >= r['end_time'])), None)
            if choque:
                who = (f"{(choque['user__first_name'] or '').strip()} {(choque['user__last_name'] or '').strip()}").strip() \
                      or choque['user__username']
                data = {'start': t, 'end': t2, 'status': 'booked', 'reservation_id': choque['id']}
                if getattr(amenity, 'show_who_booked', True):
                    data['resident'] = who
                slots.append(data)
            else:
                slots.append({'start': t, 'end': t2, 'status': 'free'})
            t = t2

        return Response(SlotSerializer(slots, many=True).data)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('area', 'user').order_by('-start_time')
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user
        # Admin/Staff ven todo; residentes ven solo lo suyo
        if not (u.is_staff or getattr(getattr(u, 'profile', None), 'role', '').upper() == 'ADMIN'):
            qs = qs.filter(user=u)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.all().order_by('-created_at')
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not (user.is_staff or getattr(user.profile, 'role', 'RESIDENT') == 'ADMIN'):
            return self.queryset.filter(reported_by=user)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class MaintenanceRequestCommentViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequestComment.objects.all()
    serializer_class = MaintenanceRequestCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MaintenanceRequestAttachmentViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequestAttachment.objects.all()
    serializer_class = MaintenanceRequestAttachmentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAdmin]


class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAdmin]


class FamilyMemberViewSet(viewsets.ModelViewSet):
    queryset = FamilyMember.objects.all()
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAdmin]


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdmin]


class PageAccessLogView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        page_name = request.data.get('page_name')
        if page_name:
            ActivityLog.objects.create(user=request.user, action="PAGE_ACCESS", details=f"Accedió a: {page_name}")
        return Response(status=status.HTTP_201_CREATED)


class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "total_users": User.objects.count(),
            "active_units": Unit.objects.count(),
            "pending_fees_total": Fee.objects.filter(status__in=["ISSUED", "OVERDUE"]).aggregate(total=Sum('amount'))['total'] or 0,
            "open_maintenance_requests": MaintenanceRequest.objects.filter(status__in=["PENDING", "IN_PROGRESS"]).count(),
        })


class FinanceReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({})


class FeePaymentPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, fee_id):
        try:
            fee_lookup = {'pk': fee_id}
            if not (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'):
                fee_lookup['unit__owner'] = request.user
            Fee.objects.get(**fee_lookup)
        except Fee.DoesNotExist:
            return Response({"detail": "Cuota no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # DEMO (QR visible)
        fake_link = f"https://www.mercadopago.com.ar/pagar/con/qr/{fee_id}"
        placeholder_qr_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEX///8AAABVwtN+AAABbklEQVR4nO2WsQ3DMAxEFXqBJRgQ3QWLsAwLMEaowGBLYIZgCf5/lW6ECIZ/uW/yvB5k3zJ2lO/ncsP5P+H8IeE/IfwnhP+E8J8Q/hPCf0L4Twh/CeE/IfwnhP+E8J8Q/hPCf0L4Twh/CeE/IfwnhP+E8J8Q/hPCf0L4Twh/CeE/IfwnhP+E8J8Q/hPCf0L4Twh/CeE/IfwnhP+E8J8Q/hPCf0L4Twh/CeE/IfwnhP+E8J8Q/hPCf0L4Twh/CeE/IfwnhP+E8J/s38A2gUzC8oVoRBAAAAAElFTkSuQmCC'
        mock_response = {
            "init_point": fake_link,
            "point_of_interaction": {"transaction_data": {"qr_code_base64": placeholder_qr_base64}}
        }
        return Response(mock_response, status=status.HTTP_200_OK)


class MercadoPagoWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        return Response(status=status.HTTP_200_OK)
