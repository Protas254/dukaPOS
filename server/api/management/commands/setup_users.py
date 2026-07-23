from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seeds the initial Superadmin and Admin users'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        
        # 1. Create Superadmin
        superadmin_email = 'protasjunior254@gmail.com'
        if not User.objects.filter(email=superadmin_email).exists():
            User.objects.create_superuser(
                username='Protas',
                email=superadmin_email,
                password='Protas@01'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created Superadmin: {superadmin_email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Superadmin {superadmin_email} already exists.'))
            
        # 2. Create Admin
        admin_email = 'protas490@gmail.com'
        if not User.objects.filter(email=admin_email).exists():
            admin_user = User.objects.create_user(
                username='AdminUser',
                email=admin_email,
                password='Admin@123',
                first_name='Admin',
                is_staff=True,
                is_superuser=False
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created Admin: {admin_email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin {admin_email} already exists.'))
