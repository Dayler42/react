"""
Script para listar todos los usuarios y sus roles.
Ejecutar: python list_users.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

def list_users():
    print("=" * 60)
    print("LISTA DE USUARIOS Y SUS ROLES")
    print("=" * 60)
    print()
    
    # Obtener todos los usuarios con sus perfiles
    users = User.objects.all().select_related('profile').order_by('username')
    
    if not users.exists():
        print("No hay usuarios en el sistema.")
        return
    
    # Separar por roles
    teachers = []
    students = []
    no_role = []
    
    for user in users:
        role_display = "Sin rol"
        if hasattr(user, 'profile'):
            role = user.profile.role
            if role == 'teacher':
                role_display = "Docente"
                teachers.append(user)
            elif role == 'student':
                role_display = "Estudiante"
                students.append(user)
            else:
                no_role.append(user)
        else:
            no_role.append(user)
        
        is_superuser = " (SUPERUSER)" if user.is_superuser else ""
        is_staff = " (STAFF)" if user.is_staff else ""
        
        print(f"Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Nombre: {user.first_name} {user.last_name}")
        print(f"  Rol: {role_display}{is_superuser}{is_staff}")
        print(f"  Fecha de creación: {user.date_joined}")
        print()
    
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"Total de usuarios: {users.count()}")
    print(f"  - Docentes: {len(teachers)}")
    print(f"  - Estudiantes: {len(students)}")
    print(f"  - Sin rol asignado: {len(no_role)}")
    print()
    
    if teachers:
        print("DOCENTES:")
        for user in teachers:
            print(f"  - {user.username} ({user.email})")
        print()
    
    if students:
        print("ESTUDIANTES:")
        for user in students:
            print(f"  - {user.username} ({user.email})")
        print()
    
    if no_role:
        print("USUARIOS SIN ROL:")
        for user in no_role:
            print(f"  - {user.username} ({user.email})")

if __name__ == '__main__':
    list_users()

