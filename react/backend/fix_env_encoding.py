"""
Script para corregir la codificación del archivo .env
"""
import os

# Leer el archivo .env con diferentes codificaciones
env_path = os.path.join(os.path.dirname(__file__), '.env')

# Intentar leer con diferentes codificaciones
encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']

content = None
used_encoding = None

for encoding in encodings:
    try:
        with open(env_path, 'r', encoding=encoding) as f:
            content = f.read()
            used_encoding = encoding
            print(f"Archivo leido correctamente con codificacion: {encoding}")
            break
    except Exception as e:
        continue

if content is None:
    print("No se pudo leer el archivo .env")
    exit(1)

# Escribir el archivo en UTF-8
with open(env_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Archivo .env reescrito en UTF-8")
print("\nContenido del archivo:")
print(content)






