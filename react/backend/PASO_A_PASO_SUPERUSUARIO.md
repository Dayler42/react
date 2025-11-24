# 📋 PASO A PASO: Crear Superusuario

## ⚠️ IMPORTANTE: Primero debes resolver el problema de PostgreSQL

Antes de crear el superusuario, necesitas que las migraciones estén ejecutadas correctamente.

---

## 🔧 PASO 1: Resolver el problema de base de datos

### Opción A: Usar SQLite (Más rápido - Recomendado para empezar)

**1.1** Abre el archivo `backend/core/settings.py` con cualquier editor

**1.2** Busca la línea 74 que dice:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        ...
    }
}
```

**1.3** Reemplázala completamente con:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**1.4** Guarda el archivo

### Opción B: Configurar PostgreSQL correctamente

**1.1** Verifica que PostgreSQL esté corriendo:
- Abre "Servicios" (presiona Win+R, escribe `services.msc`)
- Busca "postgresql" y verifica que esté "En ejecución"

**1.2** Crea la base de datos:
- Abre pgAdmin o psql
- Ejecuta: `CREATE DATABASE kanban_db;`

**1.3** Edita el archivo `.env`:
- Abre `backend/.env` con Notepad o VS Code
- Cambia `DB_PASSWORD=postgres` por tu contraseña real de PostgreSQL
- Guarda el archivo en UTF-8

---

## 📦 PASO 2: Ejecutar las migraciones

Abre PowerShell o CMD y ejecuta:

```bash
cd C:\Users\CADCAM\Documents\djangojose\react\backend
python manage.py makemigrations
python manage.py migrate
```

**Si todo sale bien, verás:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions, api
Running migrations:
  Applying api.0001_initial... OK
  ...
```

---

## 👤 PASO 3: Crear el Superusuario

### Método 1: Script Automático (Más fácil) ⭐

**3.1** En la misma terminal, ejecuta:
```bash
python create_superuser.py
```

**3.2** Verás un mensaje como:
```
Superusuario creado exitosamente:
  Username: admin
  Email: admin@example.com
  Password: admin123
  Role: teacher
```

**¡Listo!** Ya tienes tu superusuario creado.

### Método 2: Manual (Interactivo)

**3.1** Ejecuta:
```bash
python manage.py createsuperuser
```

**3.2** Te pedirá:
```
Username: admin
Email address: admin@example.com
Password: (escribe tu contraseña)
Password (again): (escribe la misma contraseña)
```

**3.3** Después de crear el usuario, crea el perfil:
```bash
python manage.py shell
```

**3.4** Dentro del shell, ejecuta:
```python
from django.contrib.auth.models import User
from api.models import Profile
user = User.objects.get(username='admin')
Profile.objects.get_or_create(user=user, defaults={'role': 'teacher'})
exit()
```

---

## ✅ PASO 4: Verificar que funciona

**4.1** Inicia el servidor:
```bash
python manage.py runserver
```

**4.2** Abre tu navegador y ve a:
- Admin: http://localhost:8000/admin/
- API: http://localhost:8000/api/
- Swagger: http://localhost:8000/api/schema/swagger-ui/

**4.3** Inicia sesión en el admin con:
- Username: `admin`
- Password: `admin123` (si usaste el script) o la que pusiste manualmente

---

## 🎯 Resumen de Comandos

```bash
# 1. Ir al directorio del backend
cd C:\Users\CADCAM\Documents\djangojose\react\backend

# 2. Crear migraciones
python manage.py makemigrations

# 3. Aplicar migraciones
python manage.py migrate

# 4. Crear superusuario (automático)
python create_superuser.py

# 5. Iniciar servidor
python manage.py runserver
```

---

## ❓ Solución de Problemas

### Error: "No module named django"
```bash
pip install -r requirements.txt
```

### Error: "database does not exist"
- Crea la base de datos en PostgreSQL: `CREATE DATABASE kanban_db;`
- O cambia a SQLite (Opción A del Paso 1)

### Error: "password authentication failed"
- Verifica la contraseña en `backend/.env`
- Asegúrate de que el archivo esté guardado en UTF-8

### Error: "UnicodeDecodeError"
- Abre `.env` en VS Code
- Click en la codificación (esquina inferior derecha)
- Selecciona "UTF-8"
- Guarda el archivo

---

## 📝 Credenciales del Superusuario (Script)

Si usaste `create_superuser.py`:
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `teacher`
- **Email:** `admin@example.com`

**⚠️ IMPORTANTE:** Cambia la contraseña después del primer login en producción.






