# Preuniversitario Miraza 🎓

Landing page + backend para inscripciones PAES.

## Stack
- **Backend:** Python + Flask
- **Base de datos:** SQLite (local) / PostgreSQL (producción en Render)
- **Frontend:** HTML/CSS/JS vanilla
- **Plataforma de clases:** Google Classroom
- **Deploy:** Render (gratis)

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

### Opción A: Blueprint automático (recomendado)

1. Sube el proyecto a GitHub:
   ```bash
   cd miraza
   git init
   git add .
   git commit -m "Initial commit"
   # Crear repo en github.com, luego:
   git remote add origin https://github.com/TU_USUARIO/miraza.git
   git branch -M main
   git push -u origin main
   ```

2. Ve a [dashboard.render.com](https://dashboard.render.com)

3. Click **New** → **Blueprint** → conecta tu repo de GitHub

4. Render detecta el `render.yaml` y crea automáticamente:
   - Un **Web Service** (Flask app)
   - Una **base de datos PostgreSQL** (gratis 90 días)
   - La variable `DATABASE_URL` conectada automáticamente

5. Click **Apply** y espera ~2 minutos. Listo 🚀

### Opción B: Configuración manual

1. Sube a GitHub (mismo paso 1 de arriba)

2. En Render, crea la base de datos:
   - **New** → **PostgreSQL** → Name: `miraza-db` → Plan: **Free** → **Create**
   - Espera a que se cree. Copia la **Internal Database URL**

3. En Render, crea el web service:
   - **New** → **Web Service** → conecta tu repo
   - **Runtime:** Python
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app`
   - En **Environment Variables**, agrega:
     - `DATABASE_URL` = (pega la Internal Database URL del paso anterior)
     - `PYTHON_VERSION` = `3.12.0`
   - Plan: **Free** → **Create Web Service**

4. Espera ~2 minutos. Listo 🚀

### Verificar que funciona

```bash
# Health check (reemplazar con tu URL de Render)
curl https://miraza.onrender.com/health

# Debería responder:
# {"db":"connected","status":"ok"}
```

### Después del deploy

- Cada `git push` a `main` hace deploy automático
- El cold start de ~30s es normal en el plan gratis (el servicio se duerme tras 15 min sin tráfico)
- Para eliminarlo: usa [UptimeRobot](https://uptimerobot.com/) (gratis) para hacer ping cada 14 min, o upgrade a $7/mes en Render
- La BD PostgreSQL gratis dura 90 días. Antes de que expire, evalúa si conviene pagar $7/mes o migrar a [Neon](https://neon.tech/) (PostgreSQL gratis sin límite de tiempo)

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
- [ ] Registrar dominio `miraza.cl`
- [ ] Reemplazar número de WhatsApp en el botón flotante (`569XXXXXXXXX`)
- [ ] Agregar imagen para Open Graph (`og:image`)
- [ ] Panel admin para ver inscripciones desde el navegador
- [ ] Configurar UptimeRobot para evitar cold start
