"""
Script para verificar y resetear la contraseña de un usuario.
Ejecutar: python verify_user.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile
from django.contrib.auth import authenticate

def verify_user(username_to_check=None):
    if not username_to_check:
        # Verificar todos los usuarios
        users = User.objects.all().order_by('username')
    else:
        users = User.objects.filter(username=username_to_check)
    
    if not users.exists():
        print(f"ERROR: No se encontraron usuarios")
        return
    
    for user in users:
        print(f"\n{'='*60}")
        print(f"Usuario: {user.username}")
        print(f"{'='*60}")
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
        
        # Verificar autenticación con diferentes contraseñas comunes
        passwords_to_try = ['123456', 'password', 'admin123', 'estudiante123']
        authenticated = False
        
        for password in passwords_to_try:
            auth_user = authenticate(username=user.username, password=password)
            if auth_user:
                print(f"  OK: Autenticacion exitosa con contraseña: {password}")
                authenticated = True
                break
        
        if not authenticated:
            print("  ERROR: No se pudo autenticar con ninguna contraseña común")
            print("  NOTA: Si olvidaste la contraseña, necesitas resetearla")
    
    print(f"\n{'='*60}")
    print("Si necesitas resetear una contraseña, usa:")
    print("  python manage.py shell")
    print("  >>> from django.contrib.auth.models import User")
    print(f"  >>> user = User.objects.get(username='nombre_usuario')")
    print(f"  >>> user.set_password('nueva_contraseña')")
    print(f"  >>> user.save()")

if __name__ == '__main__':
    import sys
    username = sys.argv[1] if len(sys.argv) > 1 else None
    verify_user(username)

