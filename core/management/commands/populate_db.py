# core/management/commands/populate_db.py

import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from faker import Faker

from core.models import (
    Profile, Unit, Vehicle, Pet, FamilyMember, ExpenseType, Fee,
    CommonArea, Notice, MaintenanceRequest
)

User = get_user_model()
fake = Faker('es_ES') # Usaremos datos en español

class Command(BaseCommand):
    help = 'Populates the database with realistic seed data for Smart Condominium.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Wipes the database clean before populating.'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['clean']:
            self.stdout.write(self.style.WARNING('🚨 Limpiando la base de datos...'))
            
            # 👇 --- ORDEN DE BORRADO CORREGIDO --- 👇
            # Primero, borramos todos los modelos que tienen una relación protegida o en cascada con User.
            MaintenanceRequest.objects.all().delete()
            Notice.objects.all().delete()
            Fee.objects.all().delete()
            Pet.objects.all().delete()
            Vehicle.objects.all().delete()
            FamilyMember.objects.all().delete()
            Unit.objects.all().delete() # Unit debe borrarse antes que User
            
            # Ahora sí podemos borrar los usuarios (excepto superusuarios)
            User.objects.exclude(is_superuser=True).delete()

            # También limpiamos entidades globales para un reinicio completo
            ExpenseType.objects.all().delete()
            CommonArea.objects.all().delete()
            
            self.stdout.write(self.style.SUCCESS('🧹 Base de datos limpiada.'))

        # --- 1. Crear Superusuario y Personal de Staff ---
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@smart.com', 'is_staff': True, 'is_superuser': True}
        )
        if not admin.password:
            admin.set_password('admin123')
            admin.save()
        Profile.objects.get_or_create(user=admin, defaults={'full_name': 'Administrador Principal', 'role': 'ADMIN'})

        staff_user, _ = User.objects.get_or_create(
            username='staff',
            defaults={'email': 'staff@smart.com', 'is_staff': True}
        )
        if not staff_user.password:
            staff_user.set_password('staff123')
            staff_user.save()
        Profile.objects.get_or_create(user=staff_user, defaults={'full_name': 'Juan Personal', 'role': 'STAFF'})

        # --- 2. Crear Entidades Globales (Tipos de Gasto, Áreas Comunes) ---
        ExpenseType.objects.get_or_create(name='Cuota de Mantenimiento', defaults={'amount_default': 1500.00})
        ExpenseType.objects.get_or_create(name='Fondo de Reserva', defaults={'amount_default': 500.00})

        CommonArea.objects.get_or_create(name='Piscina', defaults={'capacity': 20})
        CommonArea.objects.get_or_create(name='Gimnasio', defaults={'capacity': 10})
        CommonArea.objects.get_or_create(name='Salón de Eventos', defaults={'capacity': 50})

        self.stdout.write('   - Superusuario, Staff y entidades globales creadas.')

        # --- 3. Crear 50 Familias (Usuarios Residentes) y sus activos ---
        num_families = 50
        for i in range(num_families):
            first_name = fake.first_name()
            last_name = fake.last_name()
            username = f'{first_name.lower()}.{last_name.lower()}{random.randint(1,99)}'
            email = f'{username}@example.com'
            full_name = f'{first_name} {last_name}'

            resident = User.objects.create_user(username=username, email=email, password='password123')
            Profile.objects.create(user=resident, full_name=full_name, phone=fake.phone_number(), role='RESIDENT')

             # Crear una unidad para cada residente (CON VERIFICACIÓN DE UNICIDAD)
            while True:
                tower = random.choice(['A', 'B', 'C'])
                number = f'{random.randint(1, 25)}-{random.choice(["A", "B", "C", "D"])}'
                unit_code = f'T{tower}-{number}'
                # Verificamos si ya existe una unidad con este código
                if not Unit.objects.filter(code=unit_code).exists():
                    # Si no existe, rompemos el bucle y usamos este código
                    break
            
            # Ahora creamos la unidad con el código único garantizado
            unit = Unit.objects.create(
                owner=resident,
                code=unit_code, # Usamos la variable que verificamos
                tower=tower,
                number=number
            )

            # 80% de probabilidad de tener un vehículo
            if random.random() < 0.8:
                Vehicle.objects.create(
                    owner=resident,
                    plate=f'{random.randint(1000, 9999)} {random.choice(["ABC", "XYZ", "KLM"])}',
                    brand=random.choice(['Toyota', 'Nissan', 'Kia', 'Suzuki']),
                    model=random.choice(['Corolla', 'Sentra', 'Sportage', 'Swift']),
                    color=fake.color_name()
                )

            # 50% de probabilidad de tener una mascota
            if random.random() < 0.5:
                Pet.objects.create(
                    owner=resident,
                    name=fake.first_name(),
                    species=random.choice(['Perro', 'Gato']),
                    breed=random.choice(['Mestizo', 'Labrador', 'Siamés', 'Poodle'])
                )
        
        self.stdout.write(f'   - ✅ Creados {num_families} usuarios residentes con sus unidades, vehículos y mascotas.')

        # --- 4. Generar Datos Históricos (Cuotas, Avisos, etc.) ---
        all_units = Unit.objects.all()
        expense_types = ExpenseType.objects.all()
        
        # Crear cuotas para los últimos 3 meses
        for month in range(1, 4):
            period = f'2025-0{9-month}' # Generará 2025-08, 2025-07, 2025-06
            for unit in all_units:
                for et in expense_types:
                    fee, created = Fee.objects.get_or_create(
                        unit=unit,
                        expense_type=et,
                        period=period,
                        defaults={'amount': et.amount_default}
                    )
                    # Marcar aleatoriamente algunas como pagadas
                    if random.random() < 0.7:
                        fee.status = 'PAID'
                        fee.save()

        self.stdout.write('   - ✅ Generadas cuotas históricas para todas las unidades.')

        # Crear un par de avisos
        Notice.objects.create(
            title="Recordatorio de Mantenimiento de Ascensores",
            body="Estimados residentes, les recordamos que el mantenimiento programado de los ascensores se realizará este viernes.",
            created_by=admin
        )
        Notice.objects.create(
            title="Campaña de Fumigación General",
            body="Se realizará una fumigación en todas las áreas comunes el próximo lunes a las 9:00 a.m.",
            created_by=admin
        )
        self.stdout.write('   - ✅ Creados avisos generales.')

        # Crear algunas solicitudes de mantenimiento
        residents_with_units = User.objects.filter(profile__role='RESIDENT')
        for _ in range(5):
            reporter = random.choice(residents_with_units)
            unit_reported = reporter.units.first()
            if unit_reported:
                MaintenanceRequest.objects.create(
                    reported_by=reporter,
                    unit=unit_reported,
                    title=random.choice(['Fuga de agua en el baño', 'Luz del pasillo quemada', 'Puerta del garaje no abre']),
                    description='Por favor, revisar lo antes posible.',
                    status=random.choice(['PENDING', 'IN_PROGRESS'])
                )
        self.stdout.write('   - ✅ Creadas solicitudes de mantenimiento de ejemplo.')
        
        self.stdout.write(self.style.SUCCESS('🎉 ¡Base de datos poblada con éxito!'))