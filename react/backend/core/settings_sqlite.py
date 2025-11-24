"""
Configuración alternativa usando SQLite para desarrollo rápido.
Copia este contenido a settings.py si quieres usar SQLite temporalmente.
"""

# En settings.py, reemplaza la sección DATABASES con esto:

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# El resto de la configuración permanece igual






