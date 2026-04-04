from flask import Blueprint, request, jsonify, g
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta
import os
import jwt
import requests as http
import logging

from app_db import get_db, db_execute

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-prod')
JWT_EXPIRY_HOURS = 8
BLOQUEAR_EXTRANJERO = os.getenv('BLOQUEAR_LOGIN_EXTRANJERO', 'false').lower() == 'true'

# ── Test users seeded on every cold start ─────────────────────
TEST_USERS = [
    ('Florencia', 'Pérez',   'florencia.paes@miraza.cl',  'Test1234!',  'paes'),
    ('Wilson',    'Mora',    'wilson.nem@miraza.cl',       'Test1234!',  'nem'),
    ('Anacleto',  'Torres',  'anacleto.niv@miraza.cl',     'Test1234!',  'nivelacion'),
    ('Tadeo',     'Soto',    'tadeo.esp@miraza.cl',        'Test1234!',  'especial'),
    ('Valentina', 'Miraza',  'profevale@miraza.cl',        'Admin2024!', 'teacher'),
]


def seed_users():
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    with get_db() as conn:
        for nombre, apellido, email, password, rol in TEST_USERS:
            existing = db_execute(conn, 'SELECT id FROM usuarios WHERE email = %s', (email,)).fetchone()
            if not existing:
                hashed = generate_password_hash(password)
                db_execute(conn, '''
                    INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, activo, creado_en)
                    VALUES (%s, %s, %s, %s, %s, 1, %s)
                ''', (nombre, apellido, email, hashed, rol, now))
    logger.info("Usuarios de prueba verificados/creados.")


# ── JWT helpers ───────────────────────────────────────────────

def make_token(user_id: int, rol: str) -> str:
    payload = {
        'sub': user_id,
        'rol': rol,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'ok': False, 'error': 'Token requerido'}), 401
        try:
            payload = decode_token(auth_header[7:])
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'ok': False, 'error': 'Sesión expirada, inicia sesión de nuevo'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'ok': False, 'error': 'Token inválido'}), 401
        return f(*args, **kwargs)
    return decorated


def roles_required(*roles):
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated(*args, **kwargs):
            if g.current_user.get('rol') not in roles:
                return jsonify({'ok': False, 'error': 'Sin permiso'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ── Geolocation ───────────────────────────────────────────────

def get_geo(ip: str) -> dict:
    """Returns {pais, ciudad, fuera_de_chile}. Never raises."""
    try:
        # Skip for local/private IPs
        if ip in ('127.0.0.1', '::1') or ip.startswith('10.') or ip.startswith('192.168.'):
            return {'pais': 'CL', 'ciudad': 'local', 'fuera_de_chile': 0}
        resp = http.get(f'https://ipapi.co/{ip}/json/', timeout=3)
        data = resp.json()
        country = data.get('country_code', '')
        city = data.get('city', '')
        return {
            'pais': country,
            'ciudad': city,
            'fuera_de_chile': 0 if country == 'CL' else 1,
        }
    except Exception:
        return {'pais': '', 'ciudad': '', 'fuera_de_chile': 0}


def log_session(usuario_id: int, ip: str, user_agent: str, geo: dict):
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    try:
        with get_db() as conn:
            db_execute(conn, '''
                INSERT INTO sesiones_log (usuario_id, ip, user_agent, pais, ciudad, fuera_de_chile, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (usuario_id, ip, user_agent, geo['pais'], geo['ciudad'], geo['fuera_de_chile'], now))
    except Exception as e:
        logger.warning("No se pudo registrar sesión: %s", e)


# ── Routes ────────────────────────────────────────────────────

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({'ok': False, 'error': 'Content-Type inválido'}), 400

    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'ok': False, 'error': 'Email y contraseña requeridos'}), 400

    with get_db() as conn:
        row = db_execute(conn,
            'SELECT id, nombre, apellido, email, password_hash, rol, activo FROM usuarios WHERE email = %s',
            (email,)
        ).fetchone()

    if not row or not check_password_hash(row['password_hash'], password):
        return jsonify({'ok': False, 'error': 'Correo o contraseña incorrectos'}), 401

    if not row['activo']:
        return jsonify({'ok': False, 'error': 'Cuenta desactivada. Contacta a Miraza.'}), 403

    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
    user_agent = request.headers.get('User-Agent', '')
    geo = get_geo(client_ip)
    log_session(row['id'], client_ip, user_agent, geo)

    if BLOQUEAR_EXTRANJERO and geo['fuera_de_chile']:
        logger.warning("Login bloqueado desde %s (%s)", client_ip, geo['pais'])
        return jsonify({'ok': False, 'error': 'Acceso no permitido desde tu ubicación'}), 403

    token = make_token(row['id'], row['rol'])
    return jsonify({
        'ok': True,
        'token': token,
        'user': {
            'id': row['id'],
            'nombre': row['nombre'],
            'apellido': row['apellido'],
            'email': row['email'],
            'rol': row['rol'],
        }
    })


@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required
def me():
    user_id = g.current_user['sub']
    with get_db() as conn:
        row = db_execute(conn,
            'SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = %s AND activo = 1',
            (user_id,)
        ).fetchone()

    if not row:
        return jsonify({'ok': False, 'error': 'Usuario no encontrado'}), 404

    return jsonify({
        'ok': True,
        'user': {
            'id': row['id'],
            'nombre': row['nombre'],
            'apellido': row['apellido'],
            'email': row['email'],
            'rol': row['rol'],
        }
    })
