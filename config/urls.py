# condominio_backend/config/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from core import views as v

router = DefaultRouter()
router.register(r"me", v.MeViewSet, basename="me")
router.register(r"users", v.UserViewSet)
router.register(r"units", v.UnitViewSet)
router.register(r"expense-types", v.ExpenseTypeViewSet)
router.register(r"fees", v.FeeViewSet)
router.register(r"notices", v.NoticeViewSet, basename="notice")
router.register(r"notice-categories", v.NoticeCategoryViewSet, basename="noticecategory")
router.register(r"common-areas", v.CommonAreaViewSet)
router.register(r"reservations", v.ReservationViewSet)
router.register(r"maintenance-requests", v.MaintenanceRequestViewSet)
router.register(r"activity-logs", v.ActivityLogViewSet, basename="activitylog")
router.register(r"maintenance-request-comments", v.MaintenanceRequestCommentViewSet)
router.register(r"vehicles", v.VehicleViewSet, basename="vehicle")
router.register(r"pets", v.PetViewSet, basename="pet")
router.register(r"family-members", v.FamilyMemberViewSet, basename="familymember")
router.register(r"notifications", v.NotificationViewSet, basename="notification")
router.register(r"maintenance-attachments", v.MaintenanceRequestAttachmentViewSet, basename="maintenanceattachment")

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth & util
    path("api/auth/login/", v.LoginView.as_view()),
    path("api/auth/logout/", v.LogoutView.as_view(), name="auth-logout"),
    path("api/log/page-access/", v.PageAccessLogView.as_view(), name="page-access-log"),
    path("api/auth/token/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),

    # Reports / payments
    path("api/reports/finance/", v.FinanceReportView.as_view()),
    path("api/reports/dashboard-stats/", v.DashboardStatsView.as_view()),
    path("api/fees/<int:fee_id>/create-payment-preference/", v.FeePaymentPreferenceView.as_view()),
    path("api/payments/webhook/mercadopago/", v.MercadoPagoWebhookView.as_view()),

    # DRF routers y urls de apps
    path("api/", include(router.urls)),
    path("api/", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
