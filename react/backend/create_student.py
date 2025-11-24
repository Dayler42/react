"""
Script para crear un usuario estudiante.
Ejecutar: python create_student.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

def create_student():
    username = 'estudiante'
    email = 'estudiante@example.com'
    password = 'estudiante123'
    first_name = 'Juan'
    last_name = 'Pérez'
    
    # Eliminar usuario si existe
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.delete()
        print(f"Usuario '{username}' existente eliminado. Creando nuevo...")
    
    # Crear usuario estudiante
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # Crear perfil con rol estudiante
    Profile.objects.get_or_create(
        user=user,
        defaults={'role': 'student'}
    )
    
    print(f"Usuario estudiante creado exitosamente:")
    print(f"  Username: {username}")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print(f"  Nombre: {first_name} {last_name}")
    print(f"  Role: student")

if __name__ == '__main__':
    create_student()

