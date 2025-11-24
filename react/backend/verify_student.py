"""
Script para verificar y resetear la contraseña del estudiante.
Ejecutar: python verify_student.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile
from django.contrib.auth import authenticate

def verify_student():
    username = 'estudiante'
    password = 'estudiante123'
    
    try:
        user = User.objects.get(username=username)
        print(f"Usuario encontrado: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Nombre: {user.first_name} {user.last_name}")
        print(f"  Activo: {user.is_active}")
        print(f"  Staff: {user.is_staff}")
        print(f"  Superuser: {user.is_superuser}")
        
        # Verificar perfil
        if hasattr(user, 'profile'):
            print(f"  Rol: {user.profile.role}")
        else:
            print("  ERROR: No tiene perfil asignado")
            # Crear perfil si no existe
            Profile.objects.create(user=user, role='student')
            print("  OK: Perfil creado correctamente")
        
        # Verificar autenticación
        authenticated_user = authenticate(username=username, password=password)
        if authenticated_user:
            print(f"  OK: Autenticacion exitosa")
        else:
            print(f"  ERROR: La contrasena no es correcta")
            # Resetear contraseña
            user.set_password(password)
            user.save()
            print(f"  OK: Contrasena reseteada correctamente")
            
            # Verificar nuevamente
            authenticated_user = authenticate(username=username, password=password)
            if authenticated_user:
                print(f"  OK: Verificacion: Autenticacion exitosa despues del reset")
            else:
                print(f"  ERROR: Aun hay problemas con la autenticacion")
        
        print()
        print("=" * 60)
        print("CREDENCIALES CORRECTAS:")
        print("=" * 60)
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"Rol a seleccionar en login: ESTUDIANTE")
        print("=" * 60)
        
    except User.DoesNotExist:
        print(f"ERROR: El usuario '{username}' no existe")
        print("Ejecuta: python create_student.py")

if __name__ == '__main__':
    verify_student()

