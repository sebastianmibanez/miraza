"""Gestión de inscripciones: aprobar una y crear la cuenta del alumno.

Cierra el hueco entre las dos tablas: antes una inscripción llegaba del
formulario público y ahí moría; había que releer los datos y tipearlos a mano
para dar de alta al alumno.
"""
import logging
import secrets
import string
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from app_db import get_db, db_execute, normalizar_email
from blueprints.auth import roles_required

admin_bp = Blueprint('admin_api', __name__)
logger = logging.getLogger(__name__)

# Roles asignables al aprobar una inscripción. 'teacher' NO está aquí a
# propósito: esta pantalla jamás debe poder crear una cuenta con permisos de
# profesora. Esas se crean con manage.py, a mano.
ROLES_ALUMNO = ('paes', 'nem', 'nivelacion', 'especial')

ESTADOS = ('pendiente', 'aprobada', 'descartada')

PASSWORD_LARGO = 12


def _generar_password():
    alfabeto = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alfabeto) for _ in range(PASSWORD_LARGO))


@admin_bp.route('/api/admin/inscripciones', methods=['GET'])
@roles_required('teacher')
def listar_inscripciones():
    estado = request.args.get('estado', '').strip()
    if estado and estado not in ESTADOS:
        return jsonify({'ok': False, 'error': 'Estado inválido'}), 400

    sql = '''
        SELECT id, nombre, apellido, email, telefono, curso, materias,
               mensaje, fecha, estado, usuario_id, email_verificado
        FROM inscripciones
    '''
    params = ()
    if estado:
        sql += ' WHERE estado = %s'
        params = (estado,)
    sql += ' ORDER BY fecha DESC'

    with get_db() as conn:
        filas = [dict(f) for f in db_execute(conn, sql, params).fetchall()]
        resumen = {e: 0 for e in ESTADOS}
        for f in db_execute(conn, 'SELECT estado, COUNT(*) AS n FROM inscripciones GROUP BY estado').fetchall():
            resumen[f['estado']] = f['n']

    return jsonify({'ok': True, 'inscripciones': filas, 'resumen': resumen})


@admin_bp.route('/api/admin/inscripciones/<int:insc_id>/crear-cuenta', methods=['POST'])
@roles_required('teacher')
def crear_cuenta(insc_id):
    data = request.get_json(silent=True) or {}
    rol = (data.get('rol') or '').strip()

    if rol not in ROLES_ALUMNO:
        return jsonify({'ok': False, 'error': 'Plan inválido'}), 400

    password = _generar_password()
    ahora = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    with get_db() as conn:
        insc = db_execute(conn, '''
            SELECT id, nombre, apellido, email, estado
            FROM inscripciones WHERE id = %s
        ''', (insc_id,)).fetchone()

        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404

        if insc['estado'] != 'pendiente':
            return jsonify({
                'ok': False,
                'error': 'Esta inscripción ya fue procesada.'
            }), 409

        email = insc['email'].strip().lower()
        email_norm = normalizar_email(email)

        # Se compara por la forma canónica: si ya hay una cuenta con el mismo
        # Gmail escrito con puntos, es la misma persona y no debe duplicarse.
        if db_execute(conn, 'SELECT id FROM usuarios WHERE email_norm = %s', (email_norm,)).fetchone():
            return jsonify({
                'ok': False,
                'error': f'Ya existe una cuenta con {email}.'
            }), 409

        db_execute(conn, '''
            INSERT INTO usuarios (nombre, apellido, email, email_norm, password_hash, rol, activo, creado_en)
            VALUES (%s, %s, %s, %s, %s, %s, 1, %s)
        ''', (insc['nombre'], insc['apellido'], email, email_norm,
              generate_password_hash(password), rol, ahora))

        nuevo = db_execute(conn, 'SELECT id FROM usuarios WHERE email_norm = %s', (email_norm,)).fetchone()

        db_execute(conn, '''
            UPDATE inscripciones SET estado = 'aprobada', usuario_id = %s WHERE id = %s
        ''', (nuevo['id'], insc_id))

    logger.info("Cuenta creada desde inscripción %s: %s (rol %s)", insc_id, email, rol)

    # La contraseña viaja UNA sola vez, aquí. En la BD solo queda el hash.
    return jsonify({
        'ok': True,
        'password': password,
        'user': {
            'id': nuevo['id'],
            'nombre': insc['nombre'],
            'apellido': insc['apellido'],
            'email': email,
            'rol': rol,
        },
    })


@admin_bp.route('/api/admin/inscripciones/<int:insc_id>/descartar', methods=['POST'])
@roles_required('teacher')
def descartar_inscripcion(insc_id):
    with get_db() as conn:
        insc = db_execute(conn, 'SELECT estado FROM inscripciones WHERE id = %s', (insc_id,)).fetchone()

        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404

        if insc['estado'] == 'aprobada':
            return jsonify({
                'ok': False,
                'error': 'Esta inscripción ya tiene una cuenta creada. Desactiva la cuenta en su lugar.'
            }), 409

        db_execute(conn, "UPDATE inscripciones SET estado = 'descartada' WHERE id = %s", (insc_id,))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/inscripciones/<int:insc_id>/reabrir', methods=['POST'])
@roles_required('teacher')
def reabrir_inscripcion(insc_id):
    """Deshace un descarte. No toca las aprobadas: esas ya tienen cuenta."""
    with get_db() as conn:
        insc = db_execute(conn, 'SELECT estado FROM inscripciones WHERE id = %s', (insc_id,)).fetchone()

        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404

        if insc['estado'] != 'descartada':
            return jsonify({'ok': False, 'error': 'Solo se pueden reabrir inscripciones descartadas.'}), 409

        db_execute(conn, "UPDATE inscripciones SET estado = 'pendiente' WHERE id = %s", (insc_id,))

    return jsonify({'ok': True})
