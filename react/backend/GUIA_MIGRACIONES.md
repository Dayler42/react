# Guía: Ejecutar Migraciones y Crear Superusuario

## Problema Actual
Hay un error de conexión a PostgreSQL. Esto puede deberse a:
1. PostgreSQL no está corriendo
2. La base de datos `kanban_db` no existe
3. La contraseña en `.env` es incorrecta
4. Problema de codificación en la contraseña

## Solución 1: Usar SQLite (Rápido para desarrollo)

Si quieres probar rápidamente sin configurar PostgreSQL, puedes usar SQLite temporalmente.

### Cambiar a SQLite temporalmente:

Edita `backend/core/settings.py` y cambia la configuración de base de datos:

```python
# Comentar la configuración de PostgreSQL
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         ...
#     }
# }

# Usar SQLite temporalmente
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

Luego ejecuta:
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python create_superuser.py
```

## Solución 2: Configurar PostgreSQL Correctamente

### Paso 1: Verificar que PostgreSQL esté corriendo

En Windows:
- Abre "Servicios" (services.msc)
- Busca "postgresql" y verifica que esté "En ejecución"

O desde PowerShell:
```powershell
Get-Service -Name postgresql*
```

### Paso 2: Crear la base de datos

Abre pgAdmin o psql y ejecuta:
```sql
CREATE DATABASE kanban_db;
```

O desde línea de comandos:
```bash
psql -U postgres
CREATE DATABASE kanban_db;
\q
```

### Paso 3: Editar el archivo .env

Abre `backend/.env` con un editor de texto (Notepad, VS Code, etc.) y verifica:

```env
DB_NAME=kanban_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real_aqui
DB_HOST=localhost
DB_PORT=5432
```

**IMPORTANTE:** 
- Si tu contraseña tiene caracteres especiales, asegúrate de que el archivo `.env` esté guardado en UTF-8
- Si tu contraseña es "postgres", déjala así
- Si no recuerdas tu contraseña, puedes cambiarla en PostgreSQL

### Paso 4: Ejecutar migraciones

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Crear Superusuario

### Opción 1: Script automático (Recomendado)
```bash
cd backend
python create_superuser.py
```

Esto crea:
- Username: `admin`
- Password: `admin123`
- Role: `teacher`

### Opción 2: Manual (Interactivo)
```bash
cd backend
python manage.py createsuperuser
```

Te pedirá:
- Username
- Email (opcional)
- Password (2 veces)

Luego crea el perfil manualmente en el admin o con:
```python
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from api.models import Profile
>>> user = User.objects.get(username='admin')
>>> Profile.objects.get_or_create(user=user, defaults={'role': 'teacher'})
```

## Verificar que todo funciona

```bash
cd backend
python manage.py runserver
```

Luego visita:
- Admin: http://localhost:8000/admin/
- API: http://localhost:8000/api/
- Swagger: http://localhost:8000/api/schema/swagger-ui/

## Cómo editar el archivo .env

### Método 1: Editor de texto
1. Abre `backend/.env` con Notepad, VS Code, o cualquier editor
2. Edita los valores necesarios
3. Guarda el archivo (asegúrate de guardar en UTF-8)

### Método 2: Desde PowerShell
```powershell
cd backend
notepad .env
```

### Método 3: Desde VS Code
```bash
cd backend
code .env
```

## Resolver el error de codificación

Si ves errores de "UnicodeDecodeError", puede ser por:
1. Caracteres especiales en la contraseña
2. El archivo .env no está en UTF-8

Solución:
1. Abre `.env` en VS Code
2. Click en la esquina inferior derecha donde dice la codificación
3. Selecciona "UTF-8"
4. Guarda el archivo
5. Vuelve a intentar las migraciones






