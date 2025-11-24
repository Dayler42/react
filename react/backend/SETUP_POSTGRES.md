# Configuración de PostgreSQL

## 1. Instalar PostgreSQL

Si no tienes PostgreSQL instalado:
- Windows: Descarga desde https://www.postgresql.org/download/windows/
- O usa un instalador como PostgreSQL Installer

## 2. Crear la base de datos

Abre PostgreSQL (pgAdmin o línea de comandos) y ejecuta:

```sql
CREATE DATABASE kanban_db;
```

O desde la línea de comandos (psql):
```bash
psql -U postgres
CREATE DATABASE kanban_db;
\q
```

## 3. Configurar el archivo .env

**IMPORTANTE:** Primero ejecuta el script para crear el archivo .env:

```bash
cd backend
python create_env.py
```

Luego edita el archivo `backend/.env` y ajusta estos valores según tu configuración:

```env
# Base de datos PostgreSQL
USE_SQLITE=False           # Cambiar a False para usar PostgreSQL
DB_NAME=kanban_db          # Nombre de la base de datos que creaste
DB_USER=postgres           # Usuario de PostgreSQL (por defecto: postgres)
DB_PASSWORD=tu_password     # Contraseña que configuraste al instalar PostgreSQL
DB_HOST=localhost          # Host (localhost si es local)
DB_PORT=5432              # Puerto (5432 es el predeterminado)
```

**Nota:** El script `create_env.py` crea el archivo con valores por defecto. Debes editar manualmente `DB_PASSWORD` con tu contraseña real de PostgreSQL y agregar `USE_SQLITE=False`.

## 4. Verificar conexión

Ejecuta las migraciones para verificar que la conexión funciona:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Si hay errores de conexión, verifica:
- ✅ PostgreSQL está corriendo
- ✅ La base de datos `kanban_db` existe
- ✅ El usuario y contraseña en `.env` son correctos
- ✅ El puerto 5432 está disponible

## 5. Valores comunes por defecto

Si instalaste PostgreSQL con valores por defecto:
- **Usuario**: `postgres`
- **Contraseña**: La que configuraste durante la instalación
- **Puerto**: `5432`
- **Host**: `localhost`

## Alternativa: SQLite para desarrollo

Si prefieres usar SQLite (más simple, no requiere instalación), puedes cambiar en `settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

Pero PostgreSQL es recomendado para producción.


