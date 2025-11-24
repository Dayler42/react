"""
Script para verificar y crear el perfil del superusuario si falta
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

def verify_superuser():
    username = 'admin'
    
    try:
        user = User.objects.get(username=username)
        print(f"Usuario '{username}' encontrado.")
        print(f"  Es superusuario: {user.is_superuser}")
        print(f"  Email: {user.email}")
        
        # Verificar o crear perfil
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={'role': 'teacher'}
        )
        
        if created:
            print(f"  Perfil creado con role: {profile.role}")
        else:
            print(f"  Perfil existente con role: {profile.role}")
        
        print("\nCredenciales:")
        print(f"  Username: {username}")
        print(f"  Password: (la que configuraste)")
        print(f"  Role: {profile.role}")
        
    except User.DoesNotExist:
        print(f"El usuario '{username}' no existe.")
        print("Ejecuta: python create_superuser.py")

if __name__ == '__main__':
    verify_superuser()






