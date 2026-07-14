# Preuniversitario Miraza 🎓

Landing page + backend para inscripciones PAES.

## Stack
- **Backend:** Python + Flask
- **Base de datos:** PostgreSQL en [Neon](https://neon.tech) (producción) / SQLite (local)
- **Frontend:** React + TypeScript + Vite
- **Auth:** JWT (alumnos y profesoras) + sesión Flask (panel admin)
- **Deploy:** Render (plan gratis)

## Seguridad incluida
- Queries parametrizadas (sin SQL injection)
- Rate limiting (10 requests/hora por IP)
- Validación completa de inputs (email, teléfono, largo, whitelist)
- Honeypot anti-bot
- Security headers (CSP, X-Frame-Options, etc.)
- Protección CSRF (validación Content-Type)
- Health check endpoint

## Estructura del proyecto

```
miraza/
├── app.py                  # Flask app (auto-detecta SQLite/PostgreSQL)
├── requirements.txt        # flask, gunicorn, psycopg2-binary
├── render.yaml             # Blueprint para deploy automático en Render
├── Dockerfile              # Solo para desarrollo local con Docker
├── docker-compose.yml      # Solo para desarrollo local con Docker
├── .gitignore
├── .dockerignore
├── static/
│   └── robots.txt
├── database/               # Solo en desarrollo local (SQLite)
└── templates/
    └── index.html          # Landing page completa
```

---

## Deploy en Render (producción)

> ⚠️ **`DATABASE_URL` es obligatorio en producción.**
> El disco de Render (plan gratis) es **efímero**: se borra en cada deploy, cada
> reinicio y cada vez que el servicio despierta tras dormirse. Si la app corre sin
> `DATABASE_URL`, escribe en un SQLite local y **todos los datos se pierden** —
> inscripciones, cuentas de alumnos y contraseñas incluidas.
> La base va en Neon, fuera de Render.

### 1. Crear la base de datos en Neon (gratis, no expira)

1. Entra a [neon.tech](https://neon.tech) y crea un proyecto (ej. `miraza`).
2. Copia el **connection string**. Se ve así:
   ```
   postgresql://usuario:password@ep-xxx.us-east-2.aws.neon.tech/miraza?sslmode=require
   ```

### 2. Crear el web service en Render

1. Sube el repo a GitHub.
2. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** → conecta el repo.
   Render lee `render.yaml` y arma el servicio solo.
3. En **Environment**, define las variables marcadas como `sync: false`:
   - `DATABASE_URL` → el connection string de Neon del paso anterior
   - `ADMIN_USER` y `ADMIN_PASSWORD` → para entrar al panel `/admin`

   (`SECRET_KEY` la genera Render automáticamente. **No la borres**: sin ella la app
   se niega a arrancar en producción, a propósito — firma los JWT.)
4. **Apply**. Las tablas se crean solas en el primer arranque.

### 3. Crear las cuentas reales

Render → tu servicio → pestaña **Shell**:

```bash
python manage.py crear-usuario
```

Ver [Gestión de cuentas](#gestión-de-cuentas) más abajo.

### Verificar que funciona

```bash
curl https://miraza.cl/api/health
# {"db":"connected","status":"ok"}
```

Si responde `"db":"disconnected"`, `DATABASE_URL` está mal o falta.

### Después del deploy

- Cada `git push` a `main` hace deploy automático.
- El cold start de ~30s es normal en el plan gratis (el servicio duerme tras 15 min
  sin tráfico). Los datos ya **no** se pierden al dormirse, porque viven en Neon.
- Para evitar el cold start: [UptimeRobot](https://uptimerobot.com/) haciendo ping
  cada 14 min, o subir a $7/mes en Render.

---

## Gestión de cuentas

No hay registro público: las cuentas las crea Miraza. `manage.py` corre contra la
misma base que la app (Neon en producción, SQLite en local).

```bash
# Crear una cuenta (pregunta lo que falte)
python manage.py crear-usuario

# O todo de una, con contraseña generada automáticamente
python manage.py crear-usuario --nombre Ana --apellido Soto \
    --email ana@ejemplo.cl --rol paes --generar-password

python manage.py listar-usuarios
python manage.py cambiar-password ana@ejemplo.cl
python manage.py desactivar ana@ejemplo.cl   # bloquea el acceso sin borrar nada
python manage.py activar ana@ejemplo.cl
```

**Roles:** `paes`, `nem`, `nivelacion`, `especial` (alumnos) y `teacher` (profesoras).
El rol decide a qué panel entra la persona al iniciar sesión.

La contraseña generada **se muestra una sola vez**. Entrégala por un canal privado.

### Usuarios de prueba

Las cuentas demo (`profevale@miraza.cl`, etc.) tienen contraseñas escritas en el
repo, así que **solo existen en desarrollo local** y hay que pedirlas explícitamente:

```bash
SEED_TEST_USERS=true python app.py
```

En producción el seed está bloqueado por código, aunque alguien active la variable
por error. Si alguna quedó viva en la base: `python manage.py purgar-usuarios-demo`.

---

## Desarrollo local

### Sin Docker (recomendado)

```bash
cd miraza

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Correr (usa SQLite automáticamente, sin DATABASE_URL)
FLASK_DEBUG=true python app.py
```

Abrir: http://localhost:5000

### Con Docker

```bash
docker compose up --build
```

Abrir: http://localhost:5000

### Ver inscripciones locales (SQLite)

```bash
sqlite3 database/miraza.db "SELECT * FROM inscripciones;"
```

### Ver inscripciones en producción (PostgreSQL)

Desde el dashboard de Render → tu PostgreSQL → **PSQL Command** → copiar y ejecutar:
```sql
SELECT * FROM inscripciones ORDER BY fecha DESC;
```

---

## Dominio personalizado

Cuando registres `miraza.cl`:

1. En Render → tu Web Service → **Settings** → **Custom Domains** → agregar `miraza.cl`
2. Render te dará un registro CNAME o A que debes configurar en tu registrador de dominio
3. HTTPS se configura automáticamente (Let's Encrypt)
4. Actualiza la URL canónica en `templates/index.html` (meta tags) y `static/robots.txt`

---

## Cambiar colores

En `templates/index.html`, editar las variables CSS:

```css
:root {
  --navy:   #0A1F44;
  --blue:   #1B4DB8;
  --gold:   #F5A623;
}
```

## TODO

### Antes de abrir a alumnos reales
- [x] Base de datos persistente (Neon) — sin esto se perdía todo
- [x] Sacar los usuarios de prueba de producción
- [x] Herramienta para crear cuentas (`manage.py`)
- [ ] Definir `DATABASE_URL` en Render y crear las cuentas reales
- [ ] Avisar por correo cada inscripción nueva (hoy los leads no notifican a nadie)
- [ ] Reemplazar el WhatsApp de ejemplo en `Login.tsx` (`56912345678`)

### Para que el panel sirva de verdad
- [ ] El dashboard docente usa datos falsos (`blueprints/dashboard.py`): horarios,
      anuncios y alumnos están hardcodeados. Falta que la profesora pueda gestionar
      sus ramos, alumnos y horarios desde la app.
- [ ] Recuperación de contraseña ("olvidé mi clave")
- [ ] Chat IA: falta `anthropic` en `requirements.txt` y `ANTHROPIC_API_KEY` en Render

### Otros
- [ ] Agregar imagen para Open Graph (`og:image`)
- [ ] Configurar UptimeRobot para evitar el cold start
