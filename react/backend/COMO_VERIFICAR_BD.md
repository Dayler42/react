# 🔍 Cómo Verificar que los Datos se Almacenan en PostgreSQL

## Método 1: Script de Verificación (Más Fácil) ⭐

Ejecuta el script que creamos:

```bash
cd backend
python verificar_bd.py
```

Este script te mostrará:
- ✅ Conexión a la base de datos
- 📊 Conteo de todos los registros
- 👤 Detalles de usuarios
- 📋 Detalles de tableros, listas y tarjetas
- 📝 Últimas actividades

---

## Método 2: Django Admin (Interfaz Gráfica)

1. **Abre el admin en tu navegador:**
   ```
   http://localhost:8001/admin/
   ```

2. **Inicia sesión con:**
   - Usuario: `dayler`
   - Contraseña: `yondu4225`

3. **Verás todas las tablas:**
   - Users (Usuarios)
   - Profiles (Perfiles)
   - Boards (Tableros)
   - Lists (Listas)
   - Cards (Tarjetas)
   - Labels (Etiquetas)
   - Comments (Comentarios)
   - Checklist items
   - Activity logs

4. **Puedes:**
   - Ver todos los registros
   - Crear nuevos registros
   - Editar existentes
   - Eliminar registros

---

## Método 3: PostgreSQL Directamente (Línea de Comandos)

### Opción A: Usando psql

```bash
# Conectar a PostgreSQL
psql -U postgres -d kanban_db

# Ver todas las tablas
\dt

# Contar usuarios
SELECT COUNT(*) FROM auth_user;

# Ver usuarios
SELECT id, username, email, is_superuser FROM auth_user;

# Ver perfiles
SELECT * FROM api_profile;

# Ver tableros
SELECT * FROM api_board;

# Ver listas
SELECT * FROM api_list;

# Ver tarjetas
SELECT * FROM api_card;

# Salir
\q
```

### Opción B: Usando pgAdmin (Interfaz Gráfica)

1. Abre pgAdmin
2. Conecta al servidor PostgreSQL
3. Expande: Servers → PostgreSQL → Databases → kanban_db → Schemas → public → Tables
4. Click derecho en cualquier tabla → View/Edit Data → All Rows

---

## Método 4: Desde el Frontend (Crear Datos y Verificar)

1. **Inicia el frontend:**
   ```bash
   cd gestor-tareas
   npm run dev
   ```

2. **Inicia sesión:**
   - Usuario: `dayler`
   - Contraseña: `yondu4225`

3. **Crea un tablero/curso:**
   - El frontend debería guardarlo en la BD

4. **Verifica inmediatamente:**
   ```bash
   cd backend
   python verificar_bd.py
   ```
   Deberías ver el nuevo tablero en la lista.

---

## Método 5: API REST (Postman o cURL)

### Obtener token JWT:

```bash
curl -X POST http://localhost:8001/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "dayler", "password": "yondu4225"}'
```

### Crear un tablero:

```bash
curl -X POST http://localhost:8001/api/boards/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mi Tablero de Prueba", "description": "Descripción de prueba"}'
```

### Ver todos los tableros:

```bash
curl -X GET http://localhost:8001/api/boards/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Verificar en la BD:

```bash
python verificar_bd.py
```

---

## Método 6: Django Shell (Interactivo)

```bash
cd backend
python manage.py shell
```

Dentro del shell:

```python
# Importar modelos
from django.contrib.auth.models import User
from api.models import Board, List, Card, Profile

# Ver usuarios
User.objects.all()

# Contar tableros
Board.objects.count()

# Crear un tablero de prueba
user = User.objects.get(username='dayler')
board = Board.objects.create(name='Tablero de Prueba', teacher=user)
print(f"Tablero creado: {board.id}")

# Verificar que se guardó
Board.objects.filter(name='Tablero de Prueba').exists()

# Ver todos los tableros
for board in Board.objects.all():
    print(f"{board.id}: {board.name} - {board.teacher.username}")

# Salir
exit()
```

---

## ✅ Checklist de Verificación

- [ ] Script `verificar_bd.py` muestra conexión exitosa
- [ ] Puedes acceder al admin (http://localhost:8001/admin/)
- [ ] Puedes iniciar sesión con `dayler` / `yondu4225`
- [ ] Ves el usuario `dayler` en el admin
- [ ] Puedes crear un tablero desde el frontend
- [ ] El tablero aparece en `verificar_bd.py`
- [ ] El tablero aparece en el admin
- [ ] Puedes ver los datos en pgAdmin

---

## 🐛 Solución de Problemas

### Si no ves datos después de crear algo:

1. **Verifica que el backend esté corriendo:**
   ```bash
   netstat -ano | findstr :8001
   ```

2. **Verifica la conexión a la BD:**
   ```bash
   python verificar_bd.py
   ```

3. **Revisa los logs del servidor Django** en la terminal donde corre `runserver`

4. **Verifica que estés usando PostgreSQL (no SQLite):**
   - Revisa `backend/.env` → `USE_SQLITE=False`

### Si hay errores de conexión:

1. Verifica que PostgreSQL esté corriendo
2. Verifica las credenciales en `.env`
3. Verifica que la base de datos `kanban_db` exista

---

## 📊 Ejemplo de Salida del Script

```
============================================================
VERIFICACION DE BASE DE DATOS POSTGRESQL
============================================================

[OK] Conexion a la BD: kanban_db
  Host: localhost
  Puerto: 5432

------------------------------------------------------------
CONTEO DE REGISTROS:
------------------------------------------------------------
  Usuarios: 1
  Perfiles: 1
  Tableros: 2
  Listas: 5
  Tarjetas: 12
  Etiquetas: 3
  Comentarios: 8
  Items de Checklist: 15
  Logs de Actividad: 25
```

---

**💡 Recomendación:** Usa el **Método 1** (script) para verificación rápida y el **Método 2** (admin) para gestión visual de datos.





