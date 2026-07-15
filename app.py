from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import re
import logging
from datetime import datetime, timezone

import requests as http

# ── Configuración ──────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173", "http://localhost:3000",
    "https://miraza.cl", "https://www.miraza.cl"
]}}, supports_credentials=True)
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ── Base de datos (shared utilities) ──────────────────────────
from app_db import get_db, db_execute, init_db, is_rate_limited

# ── Blueprints ─────────────────────────────────────────────────
from blueprints.auth import auth_bp, seed_users, SECRET_KEY, verificar_token_google
from blueprints.dashboard import dashboard_bp
from blueprints.chat import chat_bp
from blueprints.admin import admin_bp
from blueprints.materiales import materiales_bp

# El mismo secreto que firma los JWT (auth.py valida su presencia en prod).
app.secret_key = SECRET_KEY

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(materiales_bp)

# ── Constantes de validación ───────────────────────────────────
MATERIAS_VALIDAS = {'Matemática', 'Lenguaje', 'Historia', 'Ciencias'}

# Tienen que calzar EXACTO con el <select> de Contacto.tsx. Faltaban 1ro y 2do
# medio, que el formulario sí ofrece: esos alumnos elegían su curso y el backend
# les respondía "Curso inválido". Son justamente el público de Nivelación y NEM.
CURSOS_VALIDOS = {'1ro Medio', '2do Medio', '3ro Medio', '4to Medio', 'Egresado'}

MAX_LENGTHS = {
    'nombre': 100, 'apellido': 100, 'email': 254,
    'telefono': 20, 'curso': 30, 'mensaje': 2000,
}

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
TELEFONO_REGEX = re.compile(r'^[\d\s\+\-\(\)]{7,20}$')

# ── Aviso de inscripciones nuevas (Resend) ─────────────────────
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
AVISO_EMAIL = os.getenv('AVISO_EMAIL', '')


def avisar_inscripcion(campos, materias):
    """Manda el aviso por correo. Best-effort: jamás rompe la inscripción.

    El remitente onboarding@resend.dev funciona sin configurar nada, pero solo
    entrega al correo dueño de la cuenta Resend. Para avisar a otros correos
    hay que verificar el dominio miraza.cl en Resend y cambiar el 'from'.
    """
    if not RESEND_API_KEY or not AVISO_EMAIL:
        return
    try:
        texto = '\n'.join(
            [f'{k.capitalize()}: {v}' for k, v in campos.items() if v]
            + [f'Materias: {materias or "—"}']
        )
        resp = http.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f'Bearer {RESEND_API_KEY}'},
            json={
                'from': 'Miraza <onboarding@resend.dev>',
                'to': [AVISO_EMAIL],
                'subject': f"Nueva inscripción: {campos['nombre']} {campos['apellido']}",
                'text': texto,
            },
            timeout=5,
        )
        if resp.status_code >= 400:
            logger.warning("Resend respondió %s: %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.warning("No se pudo enviar el aviso de inscripción: %s", e)


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
    # El botón de Google carga su script desde accounts.google.com, se dibuja
    # dentro de un iframe de ese mismo origen y habla con gstatic. Sin estos
    # permisos la CSP lo bloquea entero y en silencio.
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; "
        # https: (no solo hosts fijos) para que las profesoras peguen la URL de
        # su foto de perfil desde cualquier lado. Una imagen no ejecuta código;
        # el riesgo es a lo más un pixel de tracking. ponytail: si molesta, pasar
        # a fotos subidas a un bucket propio y volver a lista blanca.
        "img-src 'self' data: https:; "
        "connect-src 'self' https://accounts.google.com; "
        "frame-src https://www.youtube.com https://drive.google.com https://accounts.google.com; "
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

    # Si vino con "Continuar con Google", el correo lo dicta Google y no lo que
    # se haya escrito en el formulario. Así el lead trae un correo probado y no
    # un asdf@asdf.cl que nadie va a poder contactar.
    email_verificado = 0
    credential = data.get('google_credential')
    if credential and isinstance(credential, str):
        try:
            claims = verificar_token_google(credential)
            email = claims['email'].strip().lower()
            email_verificado = 1
        except Exception as e:
            logger.warning("Inscripción con token de Google inválido: %s", e)
            return jsonify({'ok': False, 'error': 'No pudimos validar tu cuenta de Google.'}), 401

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
                (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, ip, email_verificado)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, client_ip,
                  email_verificado))
        logger.info("Nueva inscripción: %s %s <%s>%s", nombre, apellido, email,
                    ' [correo verificado con Google]' if email_verificado else '')
        avisar_inscripcion(campos, materias)
        return jsonify({'ok': True, 'mensaje': '¡Inscripción recibida! Te contactaremos pronto.'})
    except Exception:
        logger.exception("Error guardando inscripción para %s", email)
        return jsonify({'ok': False, 'error': 'Error al guardar. Intenta de nuevo.'}), 500


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
    # Un /api/* que llega hasta acá es una ruta que no existe. Sin este corte,
    # la SPA se devolvía con HTTP 200 y el frontend recibía HTML donde esperaba
    # JSON: un endpoint mal escrito parecía "funcionar".
    if path.startswith('api/'):
        return jsonify({'ok': False, 'error': 'Endpoint no encontrado'}), 404

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
