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

IS_PRODUCTION = bool(os.getenv('DATABASE_URL', '').strip())

# En producción SECRET_KEY es obligatorio: sin esto los JWT se firmarían con un
# secreto conocido y cualquiera podría forjarse un token de profesora.
SECRET_KEY = os.getenv('SECRET_KEY', '').strip()
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError(
            'SECRET_KEY no está definido. Es obligatorio en producción — '
            'configúralo en las variables de entorno de Render.'
        )
    SECRET_KEY = 'dev-only-insecure-secret'

JWT_EXPIRY_HOURS = 8
BLOQUEAR_EXTRANJERO = os.getenv('BLOQUEAR_LOGIN_EXTRANJERO', 'false').lower() == 'true'

# Client ID de Google (público, va en el navegador). Si no está definido, todo
# lo de Google queda apagado y la app sigue funcionando con contraseña.
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '').strip()

# Guardia contra un error fácil y caro: pegar el CLIENT SECRET donde va el
# CLIENT ID. /api/config es público (el client ID lo es por diseño), así que un
# secreto puesto acá se serviría abierto en internet. Un client ID legítimo
# siempre termina en .apps.googleusercontent.com; un secreto empieza con GOCSPX-.
if GOOGLE_CLIENT_ID and not GOOGLE_CLIENT_ID.endswith('.apps.googleusercontent.com'):
    logger.error(
        "GOOGLE_CLIENT_ID no parece un client ID de Google (debe terminar en "
        ".apps.googleusercontent.com). Si pegaste el client secret, BÓRRALO y "
        "rótalo: se habría publicado. El acceso con Google queda desactivado."
    )
    GOOGLE_CLIENT_ID = ''

GOOGLE_HABILITADO = bool(GOOGLE_CLIENT_ID)

# Usuarios de demo. Solo se crean si SEED_TEST_USERS=true, que jamás debe
# activarse en producción: las contraseñas están en el repo.
SEED_TEST_USERS = os.getenv('SEED_TEST_USERS', 'false').lower() == 'true'

TEST_USERS = [
    ('Florencia', 'Pérez',   'florencia.paes@miraza.cl',  'Test1234!',  'paes'),
    ('Wilson',    'Mora',    'wilson.nem@miraza.cl',       'Test1234!',  'nem'),
    ('Anacleto',  'Torres',  'anacleto.niv@miraza.cl',     'Test1234!',  'nivelacion'),
    ('Tadeo',     'Soto',    'tadeo.esp@miraza.cl',        'Test1234!',  'especial'),
    ('Valentina', 'Miraza',  'profevale@miraza.cl',        'Admin2024!', 'teacher'),
]


def seed_users():
    if not SEED_TEST_USERS:
        return
    if IS_PRODUCTION:
        logger.error("SEED_TEST_USERS está activo en producción. Ignorado por seguridad.")
        return

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
    logger.info("Usuarios de prueba (dev) verificados/creados.")


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


# ── Google Sign-In ────────────────────────────────────────────

def verificar_token_google(credential: str) -> dict:
    """Valida un ID token de Google y devuelve sus claims. Lanza si no sirve.

    google-auth hace lo esencial: verifica la firma contra las claves públicas
    de Google, que no esté vencido, y —lo más importante— que el 'aud' sea
    NUESTRO client ID. Sin esa comprobación, alguien podría entrar con un token
    legítimo de Google pero emitido para otra aplicación cualquiera.
    """
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    claims = google_id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )

    if claims.get('iss') not in ('accounts.google.com', 'https://accounts.google.com'):
        raise ValueError('Emisor inesperado')

    if not claims.get('email'):
        raise ValueError('El token no trae correo')

    # Google puede entregar cuentas con el correo sin verificar. Ese correo no
    # prueba nada, así que no lo aceptamos.
    if not claims.get('email_verified'):
        raise ValueError('Correo no verificado por Google')

    return claims


def _payload_login(row):
    """Respuesta común a los dos caminos de login (contraseña y Google)."""
    return {
        'ok': True,
        'token': make_token(row['id'], row['rol']),
        'user': {
            'id': row['id'],
            'nombre': row['nombre'],
            'apellido': row['apellido'],
            'email': row['email'],
            'rol': row['rol'],
        },
    }


# ── Routes ────────────────────────────────────────────────────

@auth_bp.route('/api/config', methods=['GET'])
def config_publica():
    """Config que el navegador necesita para dibujar el botón de Google.

    El client ID es público por diseño (viaja en el HTML de cualquier sitio con
    login de Google). Se sirve desde acá para no tener que recompilar el
    frontend cuando cambie: basta con la variable de entorno en Render.
    """
    return jsonify({
        'ok': True,
        'google_habilitado': GOOGLE_HABILITADO,
        'google_client_id': GOOGLE_CLIENT_ID,
    })


@auth_bp.route('/api/auth/google', methods=['POST'])
def login_google():
    if not GOOGLE_HABILITADO:
        return jsonify({'ok': False, 'error': 'El acceso con Google no está disponible.'}), 503

    data = request.get_json(silent=True) or {}
    credential = (data.get('credential') or '').strip()

    if not credential:
        return jsonify({'ok': False, 'error': 'Falta el token de Google'}), 400

    try:
        claims = verificar_token_google(credential)
    except Exception as e:
        logger.warning("Token de Google rechazado: %s", e)
        return jsonify({'ok': False, 'error': 'No pudimos validar tu cuenta de Google.'}), 401

    email = claims['email'].strip().lower()
    google_sub = claims.get('sub', '')

    with get_db() as conn:
        row = db_execute(conn, '''
            SELECT id, nombre, apellido, email, rol, activo FROM usuarios WHERE email = %s
        ''', (email,)).fetchone()

        if not row:
            # Identificarse con Google no es lo mismo que estar inscrito. La
            # cuenta la crea Miraza al aprobar la inscripción; si no existe,
            # no se entra. Esto es lo que impide que cualquiera con un Gmail
            # se meta gratis al panel.
            logger.info("Login con Google sin cuenta en Miraza: %s", email)
            return jsonify({
                'ok': False,
                'sin_cuenta': True,
                'error': 'Ese correo todavía no tiene acceso a Miraza. '
                         'Si ya te inscribiste, estamos activando tu cuenta.',
            }), 403

        if not row['activo']:
            return jsonify({'ok': False, 'error': 'Cuenta desactivada. Contacta a Miraza.'}), 403

        if google_sub:
            db_execute(conn, 'UPDATE usuarios SET google_sub = %s WHERE id = %s',
                       (google_sub, row['id']))

    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
    geo = get_geo(client_ip)
    log_session(row['id'], client_ip, request.headers.get('User-Agent', ''), geo)

    if BLOQUEAR_EXTRANJERO and geo['fuera_de_chile']:
        logger.warning("Login con Google bloqueado desde %s (%s)", client_ip, geo['pais'])
        return jsonify({'ok': False, 'error': 'Acceso no permitido desde tu ubicación'}), 403

    return jsonify(_payload_login(row))


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

    return jsonify(_payload_login(row))


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
