"""
Verificar usuario dayler
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

try:
    user = User.objects.get(username='dayler')
    profile = Profile.objects.get(user=user)
    print("Usuario 'dayler' encontrado:")
    print(f"   Username: {user.username}")
    print(f"   Email: {user.email}")
    print(f"   Es superusuario: {user.is_superuser}")
    print(f"   Role: {profile.role}")
    print(f"   Password: yondu4225")
except User.DoesNotExist:
    print("Usuario 'dayler' no encontrado")

