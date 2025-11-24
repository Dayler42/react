"""
Script para verificar que los datos se están almacenando en PostgreSQL
Ejecutar: python verificar_bd.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile, Board, List, Card, Label, Comment, ChecklistItem, ActivityLog

def verificar_bd():
    print("=" * 60)
    print("VERIFICACION DE BASE DE DATOS POSTGRESQL")
    print("=" * 60)
    
    # Verificar conexión
    from django.db import connection
    print(f"\n[OK] Conexion a la BD: {connection.settings_dict['NAME']}")
    print(f"  Host: {connection.settings_dict['HOST']}")
    print(f"  Puerto: {connection.settings_dict['PORT']}")
    
    # Contar registros
    print("\n" + "-" * 60)
    print("CONTEO DE REGISTROS:")
    print("-" * 60)
    print(f"  Usuarios: {User.objects.count()}")
    print(f"  Perfiles: {Profile.objects.count()}")
    print(f"  Tableros: {Board.objects.count()}")
    print(f"  Listas: {List.objects.count()}")
    print(f"  Tarjetas: {Card.objects.count()}")
    print(f"  Etiquetas: {Label.objects.count()}")
    print(f"  Comentarios: {Comment.objects.count()}")
    print(f"  Items de Checklist: {ChecklistItem.objects.count()}")
    print(f"  Logs de Actividad: {ActivityLog.objects.count()}")
    
    # Detalles de usuarios
    print("\n" + "-" * 60)
    print("USUARIOS:")
    print("-" * 60)
    for user in User.objects.all():
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else 'sin perfil'
        print(f"  - {user.username}")
        print(f"    Email: {user.email}")
        print(f"    Superuser: {'Sí' if user.is_superuser else 'No'}")
        print(f"    Rol: {role}")
        print()
    
    # Detalles de tableros
    if Board.objects.exists():
        print("-" * 60)
        print("TABLEROS:")
        print("-" * 60)
        for board in Board.objects.all():
            print(f"  - {board.name}")
            print(f"    Docente: {board.teacher.username}")
            print(f"    Listas: {board.lists.count()}")
            print(f"    Tarjetas: {sum(lista.cards.count() for lista in board.lists.all())}")
            print(f"    Creado: {board.created_at}")
            print()
    
    # Últimas actividades
    if ActivityLog.objects.exists():
        print("-" * 60)
        print("ÚLTIMAS 5 ACTIVIDADES:")
        print("-" * 60)
        for activity in ActivityLog.objects.all()[:5]:
            print(f"  - {activity.get_activity_type_display()}")
            print(f"    Usuario: {activity.user.username}")
            print(f"    Tablero: {activity.board.name}")
            print(f"    Fecha: {activity.created_at}")
            print()
    
    print("=" * 60)
    print("[OK] Verificacion completada")
    print("=" * 60)

if __name__ == '__main__':
    verificar_bd()

