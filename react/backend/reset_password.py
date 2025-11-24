"""
Script para resetear la contraseña de un usuario.
Ejecutar: python reset_password.py [username] [nueva_contraseña]
Ejemplo: python reset_password.py Enid 123456
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

def reset_password(username, new_password=None):
    if not new_password:
        # Si no se proporciona contraseña, usar una por defecto
        new_password = '123456'
    
    try:
        user = User.objects.get(username=username)
        print(f"Usuario encontrado: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Nombre: {user.first_name} {user.last_name}")
        
        # Resetear contraseña
        user.set_password(new_password)
        user.save()
        print(f"\nOK: Contrasena reseteada exitosamente")
        
        # Verificar que funciona
        authenticated_user = authenticate(username=username, password=new_password)
        if authenticated_user:
            print(f"OK: Verificacion: Autenticacion exitosa")
            print(f"\n{'='*60}")
            print("CREDENCIALES ACTUALIZADAS:")
            print("="*60)
            print(f"Username: {username}")
            print(f"Password: {new_password}")
            print("="*60)
        else:
            print(f"ERROR: Aun hay problemas con la autenticacion")
            
    except User.DoesNotExist:
        print(f"ERROR: El usuario '{username}' no existe")
        print("\nUsuarios disponibles:")
        users = User.objects.all().order_by('username')
        for u in users:
            print(f"  - {u.username} ({u.email})")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python reset_password.py [username] [nueva_contraseña]")
        print("Ejemplo: python reset_password.py Enid 123456")
        sys.exit(1)
    
    username = sys.argv[1]
    new_password = sys.argv[2] if len(sys.argv) > 2 else None
    reset_password(username, new_password)

