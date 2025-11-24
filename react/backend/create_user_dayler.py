"""
Script para crear superusuario dayler
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

def create_user_dayler():
    username = 'dayler'
    email = 'dayler@example.com'
    password = 'yondu4225'
    
    # Eliminar usuario si existe
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.delete()
        print(f"Usuario '{username}' existente eliminado. Creando nuevo...")
    
    # Crear superusuario
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    
    # Crear perfil
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
    create_user_dayler()






