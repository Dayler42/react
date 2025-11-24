"""
Script para crear un superusuario de forma no interactiva.
Ejecutar: python create_superuser.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

def create_superuser():
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    if User.objects.filter(username=username).exists():
        print(f"El usuario '{username}' ya existe.")
        return
    
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    
    # Crear perfil si no existe
    Profile.objects.get_or_create(
        user=user,
        defaults={'role': 'teacher'}
    )
    
    print(f"Superusuario creado exitosamente:")
    print(f"  Username: {username}")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print(f"  Role: teacher")

if __name__ == '__main__':
    create_superuser()






