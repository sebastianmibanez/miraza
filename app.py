from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from contextlib import contextmanager
from collections import defaultdict
from functools import wraps
import os
import re
import secrets
import time
import logging
from datetime import datetime, timezone

# ── Configuración ──────────────────────────────────────────────
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1MB max request
app.secret_key = os.getenv('SECRET_KEY', os.urandom(32))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Detectar motor de BD: PostgreSQL en producción, SQLite en desarrollo
DATABASE_URL = os.getenv('DATABASE_URL')
USE_POSTGRES = DATABASE_URL is not None

if USE_POSTGRES:
    # Render usa "postgres://" pero psycopg2 necesita "postgresql://"
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    import psycopg2
    import psycopg2.extras
else:
    import sqlite3
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'miraza.db')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ── Constantes de validación ───────────────────────────────────
MATERIAS_VALIDAS = {'Matemática', 'Lenguaje', 'Historia', 'Ciencias'}
CURSOS_VALIDOS = {'3ro Medio', '4to Medio', 'Egresado'}

MAX_LENGTHS = {
    'nombre': 100,
    'apellido': 100,
    'email': 254,
    'telefono': 20,
    'curso': 30,
    'mensaje': 2000,
}

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
TELEFONO_REGEX = re.compile(r'^[\d\s\+\-\(\)]{7,20}$')

# ── Rate limiting simple (en memoria) ─────────────────────────
_rate_store = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 3600


def is_rate_limited(ip):
    """Retorna True si la IP excedió el rate limit."""
    now = time.time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return True
    _rate_store[ip].append(now)
    return False


# ── Base de datos ──────────────────────────────────────────────
# Capa de abstracción que funciona con SQLite y PostgreSQL

@contextmanager
def get_db():
    """Context manager que conecta a PostgreSQL o SQLite según el entorno."""
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_execute(conn, query, params=None):
    """Ejecuta una query adaptando el placeholder al motor de BD.
    Escribe queries con %s (estilo PostgreSQL).
    En SQLite se reemplazan automáticamente a ?.
    """
    if not USE_POSTGRES:
        query = query.replace('%s', '?')
    cur = conn.cursor()
    cur.execute(query, params or ())
    return cur


def init_db():
    """Crear tabla si no existe. Compatible con SQLite y PostgreSQL."""
    if not USE_POSTGRES:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    if USE_POSTGRES:
        create_sql = '''
            CREATE TABLE IF NOT EXISTS inscripciones (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                email TEXT NOT NULL,
                telefono TEXT NOT NULL,
                curso TEXT NOT NULL,
                materias TEXT NOT NULL,
                mensaje TEXT DEFAULT '',
                fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ip TEXT DEFAULT ''
            )
        '''
    else:
        create_sql = '''
            CREATE TABLE IF NOT EXISTS inscripciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                email TEXT NOT NULL,
                telefono TEXT NOT NULL,
                curso TEXT NOT NULL,
                materias TEXT NOT NULL,
                mensaje TEXT DEFAULT '',
                fecha TEXT NOT NULL,
                ip TEXT DEFAULT ''
            )
        '''

    with get_db() as conn:
        conn.cursor().execute(create_sql)
        if not USE_POSTGRES:
            conn.cursor().execute('''
                CREATE INDEX IF NOT EXISTS idx_inscripciones_email
                ON inscripciones(email)
            ''')
        else:
            conn.cursor().execute('''
                CREATE INDEX IF NOT EXISTS idx_inscripciones_email
                ON inscripciones(email)
            ''')

    motor = 'PostgreSQL' if USE_POSTGRES else f'SQLite ({DB_PATH})'
    logger.info("Base de datos inicializada — motor: %s", motor)


# Inicializar BD al importar (funciona con gunicorn)
init_db()


# ── Security headers ──────────────────────────────────────────
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "script-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )
    return response


# ── Rutas ──────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/robots.txt')
def robots():
    return app.send_static_file('robots.txt')


@app.route('/health')
def health():
    """Health check para Render."""
    try:
        with get_db() as conn:
            db_execute(conn, 'SELECT 1')
        return jsonify({'status': 'ok', 'db': 'connected'}), 200
    except Exception:
        return jsonify({'status': 'error', 'db': 'disconnected'}), 500


@app.route('/inscripcion', methods=['POST'])
def inscripcion():
    # ── Rate limiting ──
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    if is_rate_limited(client_ip):
        logger.warning("Rate limit excedido para IP: %s", client_ip)
        return jsonify({
            'ok': False,
            'error': 'Demasiados intentos. Intenta de nuevo en una hora.'
        }), 429

    # ── Validar Content-Type ──
    if not request.is_json:
        return jsonify({'ok': False, 'error': 'Content-Type inválido'}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'ok': False, 'error': 'Request inválido'}), 400

    # ── Honeypot anti-bot ──
    if data.get('website'):
        logger.info("Honeypot activado desde IP: %s", client_ip)
        return jsonify({'ok': True, 'mensaje': '¡Inscripción recibida! Te contactaremos pronto.'})

    # ── Campos requeridos ──
    required = ['nombre', 'apellido', 'email', 'telefono', 'curso']
    for field in required:
        value = data.get(field, '')
        if not isinstance(value, str) or not value.strip():
            return jsonify({'ok': False, 'error': f'El campo {field} es requerido'}), 400

    # ── Sanitizar ──
    nombre = data['nombre'].strip()
    apellido = data['apellido'].strip()
    email = data['email'].strip().lower()
    telefono = data['telefono'].strip()
    curso = data['curso'].strip()
    mensaje = data.get('mensaje', '').strip() if isinstance(data.get('mensaje'), str) else ''

    # ── Validar largo máximo ──
    campos = {'nombre': nombre, 'apellido': apellido, 'email': email,
              'telefono': telefono, 'curso': curso, 'mensaje': mensaje}
    for field, value in campos.items():
        max_len = MAX_LENGTHS.get(field, 100)
        if len(value) > max_len:
            return jsonify({
                'ok': False,
                'error': f'{field} excede el largo máximo ({max_len} caracteres)'
            }), 400

    # ── Validar formato email ──
    if not EMAIL_REGEX.match(email):
        return jsonify({'ok': False, 'error': 'Correo electrónico inválido'}), 400

    # ── Validar formato teléfono ──
    if not TELEFONO_REGEX.match(telefono):
        return jsonify({'ok': False, 'error': 'Teléfono inválido'}), 400

    # ── Validar curso contra whitelist ──
    if curso not in CURSOS_VALIDOS:
        return jsonify({'ok': False, 'error': 'Curso inválido'}), 400

    # ── Validar materias contra whitelist ──
    materias_input = data.get('materias', [])
    if not isinstance(materias_input, list):
        return jsonify({'ok': False, 'error': 'Formato de materias inválido'}), 400
    for m in materias_input:
        if not isinstance(m, str) or m not in MATERIAS_VALIDAS:
            return jsonify({'ok': False, 'error': f'Materia inválida: {m}'}), 400

    materias = ', '.join(materias_input)
    fecha = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    # ── Guardar ──
    try:
        with get_db() as conn:
            db_execute(conn, '''
                INSERT INTO inscripciones
                (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, ip)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, client_ip))

        logger.info("Nueva inscripción: %s %s <%s> — %s — %s",
                     nombre, apellido, email, curso, materias)
        return jsonify({'ok': True, 'mensaje': '¡Inscripción recibida! Te contactaremos pronto.'})

    except Exception:
        logger.exception("Error guardando inscripción para %s", email)
        return jsonify({'ok': False, 'error': 'Error al guardar. Intenta de nuevo.'}), 500


# ── Admin ──────────────────────────────────────────────────────
ADMIN_USER = os.getenv('ADMIN_USER', '')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '')


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if not ADMIN_USER or not ADMIN_PASSWORD:
        return 'Admin no configurado. Define ADMIN_USER, ADMIN_PASSWORD y SECRET_KEY en Render.', 503

    error = None
    if request.method == 'POST':
        user = request.form.get('usuario', '')
        pwd  = request.form.get('password', '')
        user_ok = secrets.compare_digest(user, ADMIN_USER)
        pwd_ok  = secrets.compare_digest(pwd, ADMIN_PASSWORD)
        if user_ok and pwd_ok:
            session['admin_logged_in'] = True
            return redirect(url_for('admin'))
        error = 'Usuario o contraseña incorrectos.'

    return render_template('admin_login.html', error=error)


@app.route('/admin/logout')
def admin_logout():
    session.clear()
    return redirect(url_for('admin_login'))


@app.route('/admin')
@login_required
def admin():
    with get_db() as conn:
        cur = db_execute(conn, '''
            SELECT id, nombre, apellido, email, telefono, curso, materias, mensaje, fecha
            FROM inscripciones
            ORDER BY fecha DESC
        ''')
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    return render_template('admin.html', inscripciones=rows)


# ── Error handlers ─────────────────────────────────────────────
@app.errorhandler(413)
def too_large(e):
    return jsonify({'ok': False, 'error': 'Request demasiado grande'}), 413


@app.errorhandler(404)
def not_found(e):
    return jsonify({'ok': False, 'error': 'Página no encontrada'}), 404


# ── Desarrollo local ───────────────────────────────────────────
if __name__ == '__main__':
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true',
        host='0.0.0.0',
        port=5000
    )
