from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from flask_cors import CORS
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
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173", "http://localhost:3000",
    "https://miraza.cl", "https://www.miraza.cl"
]}}, supports_credentials=True)
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024
app.secret_key = os.getenv('SECRET_KEY', os.urandom(32))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ── Base de datos (shared utilities) ──────────────────────────
from app_db import get_db, db_execute, init_db

# ── Blueprints ─────────────────────────────────────────────────
from blueprints.auth import auth_bp, seed_users
from blueprints.dashboard import dashboard_bp
from blueprints.chat import chat_bp

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(chat_bp)

# ── Constantes de validación ───────────────────────────────────
MATERIAS_VALIDAS = {'Matemática', 'Lenguaje', 'Historia', 'Ciencias'}
CURSOS_VALIDOS = {'3ro Medio', '4to Medio', 'Egresado'}

MAX_LENGTHS = {
    'nombre': 100, 'apellido': 100, 'email': 254,
    'telefono': 20, 'curso': 30, 'mensaje': 2000,
}

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
TELEFONO_REGEX = re.compile(r'^[\d\s\+\-\(\)]{7,20}$')

# ── Rate limiting ──────────────────────────────────────────────
_rate_store = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 3600


def is_rate_limited(ip):
    now = time.time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return True
    _rate_store[ip].append(now)
    return False


# ── Inicializar BD + seed ──────────────────────────────────────
init_db()
seed_users()


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
        "img-src 'self' data: https://i.ytimg.com; "
        "connect-src 'self'; "
        "frame-src https://www.youtube.com https://drive.google.com; "
        "frame-ancestors 'none'"
    )
    return response


# ── API pública ────────────────────────────────────────────────
@app.route('/api/health')
def health():
    try:
        with get_db() as conn:
            db_execute(conn, 'SELECT 1')
        return jsonify({'status': 'ok', 'db': 'connected'}), 200
    except Exception:
        return jsonify({'status': 'error', 'db': 'disconnected'}), 500


@app.route('/api/inscripcion', methods=['POST'])
def inscripcion():
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    if is_rate_limited(client_ip):
        return jsonify({'ok': False, 'error': 'Demasiados intentos. Intenta de nuevo en una hora.'}), 429

    if not request.is_json:
        return jsonify({'ok': False, 'error': 'Content-Type inválido'}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'ok': False, 'error': 'Request inválido'}), 400

    if data.get('website'):
        return jsonify({'ok': True, 'mensaje': '¡Inscripción recibida! Te contactaremos pronto.'})

    required = ['nombre', 'apellido', 'email', 'telefono', 'curso']
    for field in required:
        value = data.get(field, '')
        if not isinstance(value, str) or not value.strip():
            return jsonify({'ok': False, 'error': f'El campo {field} es requerido'}), 400

    nombre   = data['nombre'].strip()
    apellido = data['apellido'].strip()
    email    = data['email'].strip().lower()
    telefono = data['telefono'].strip()
    curso    = data['curso'].strip()
    mensaje  = data.get('mensaje', '').strip() if isinstance(data.get('mensaje'), str) else ''

    campos = {'nombre': nombre, 'apellido': apellido, 'email': email,
              'telefono': telefono, 'curso': curso, 'mensaje': mensaje}
    for field, value in campos.items():
        if len(value) > MAX_LENGTHS.get(field, 100):
            return jsonify({'ok': False, 'error': f'{field} excede el largo máximo'}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({'ok': False, 'error': 'Correo electrónico inválido'}), 400

    if not TELEFONO_REGEX.match(telefono):
        return jsonify({'ok': False, 'error': 'Teléfono inválido'}), 400

    if curso not in CURSOS_VALIDOS:
        return jsonify({'ok': False, 'error': 'Curso inválido'}), 400

    materias_input = data.get('materias', [])
    if not isinstance(materias_input, list):
        return jsonify({'ok': False, 'error': 'Formato de materias inválido'}), 400
    for m in materias_input:
        if not isinstance(m, str) or m not in MATERIAS_VALIDAS:
            return jsonify({'ok': False, 'error': f'Materia inválida: {m}'}), 400

    materias = ', '.join(materias_input)
    fecha = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    try:
        with get_db() as conn:
            db_execute(conn, '''
                INSERT INTO inscripciones
                (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, ip)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, client_ip))
        logger.info("Nueva inscripción: %s %s <%s>", nombre, apellido, email)
        return jsonify({'ok': True, 'mensaje': '¡Inscripción recibida! Te contactaremos pronto.'})
    except Exception:
        logger.exception("Error guardando inscripción para %s", email)
        return jsonify({'ok': False, 'error': 'Error al guardar. Intenta de nuevo.'}), 500


# ── Admin (sesión Flask, panel servidor) ───────────────────────
ADMIN_USER     = os.getenv('ADMIN_USER', '')
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
        return 'Admin no configurado. Define ADMIN_USER y ADMIN_PASSWORD en Render.', 503
    error = None
    if request.method == 'POST':
        user_ok = secrets.compare_digest(request.form.get('usuario', ''), ADMIN_USER)
        pwd_ok  = secrets.compare_digest(request.form.get('password', ''), ADMIN_PASSWORD)
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
            FROM inscripciones ORDER BY fecha DESC
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
    return jsonify({'ok': False, 'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'ok': False, 'error': 'Error interno del servidor'}), 500


# ── Estáticos y SPA ───────────────────────────────────────────
@app.route('/robots.txt')
def robots():
    return app.send_static_file('robots.txt')


REACT_BUILD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path:
        file_path = os.path.join(REACT_BUILD, path)
        if os.path.isfile(file_path):
            return send_from_directory(REACT_BUILD, path)
    return send_from_directory(REACT_BUILD, 'index.html')


# ── Desarrollo local ───────────────────────────────────────────
if __name__ == '__main__':
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true',
        host='0.0.0.0',
        port=5000
    )
