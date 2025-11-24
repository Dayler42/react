"""
Script para crear el archivo .env con configuración de PostgreSQL
"""
import os

env_content = """SECRET_KEY=django-insecure-change-this-in-production-use-a-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos - Cambiar USE_SQLITE=False para usar PostgreSQL
USE_SQLITE=False
DB_NAME=kanban_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
"""

# Obtener el directorio del script
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')

# Escribir el archivo .env
with open(env_path, 'w', encoding='utf-8') as f:
    f.write(env_content)

print(f"Archivo .env creado exitosamente en: {env_path}")
print("\nConfiguracion:")
print("   USE_SQLITE=False")
print("   DB_NAME=kanban_db")
print("   DB_USER=postgres")
print("   DB_PASSWORD=postgres")
print("   DB_HOST=localhost")
print("   DB_PORT=5432")
print("\nIMPORTANTE:")
print("   1. Ajusta DB_PASSWORD con tu contraseña real de PostgreSQL")
print("   2. Asegúrate de que PostgreSQL esté instalado y corriendo")
print("   3. Crea la base de datos 'kanban_db' antes de ejecutar las migraciones")

