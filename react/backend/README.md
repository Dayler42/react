# Backend Django - Kanban Académico

Backend completo con Django 5, DRF, JWT, PostgreSQL y drf-spectacular.

## Configuración

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

2. Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

3. Configurar PostgreSQL y actualizar variables en `.env`:
- Crear base de datos: `CREATE DATABASE kanban_db;`
- Actualizar `DB_NAME`, `DB_USER`, `DB_PASSWORD` en `.env`

4. Ejecutar migraciones:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Crear superusuario:
```bash
python manage.py createsuperuser
```

O usar el script automático:
```bash
python create_superuser.py
```
(Crea usuario: admin / password: admin123 / role: teacher)

6. Ejecutar servidor:
```bash
python manage.py runserver
```

## Endpoints

- API Base: `http://localhost:8000/api/`
- Admin: `http://localhost:8000/admin/`
- Swagger UI: `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

## Autenticación

- Registro: `POST /api/register/`
- Login: `POST /api/token/`
- Refresh: `POST /api/token/refresh/`

## Modelos

- Profile (student/teacher)
- Board
- List
- Card
- Label
- Comment
- ChecklistItem
- ActivityLog

