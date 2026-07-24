"""Gestión: inscripciones, ramos, horarios, alumnos y avisos.

Casi todo acá es solo para admin (las fundadoras). Las profesoras NO deciden
quién entra a su ramo ni cuántas horas dictan: con el modelo de pago por hora
asignada, eso sería dejarlas fijar su propio sueldo. Solo publican avisos en los
ramos que dictan.
"""
import logging
import re
import secrets
import string
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g
from werkzeug.security import generate_password_hash

from app_db import (
    get_db, db_execute, normalizar_email,
    ROLES_ALUMNO, DIAS, TIPOS_CLASE, TIPOS_AVISO,
)
from blueprints.auth import roles_required

admin_bp = Blueprint('admin_api', __name__)
logger = logging.getLogger(__name__)

ESTADOS = ('pendiente', 'aprobada', 'descartada', 'registrada')
PASSWORD_LARGO = 12
COLOR_POR_DEFECTO = '#1B4DB8'
EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def _ahora():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')


def _generar_password():
    alfabeto = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alfabeto) for _ in range(PASSWORD_LARGO))


def _texto(data, campo, largo=120):
    valor = (data.get(campo) or '').strip()
    return valor[:largo]


# ══════════════════════════════════════════════════════════════
#   INSCRIPCIONES
# ══════════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/inscripciones', methods=['GET'])
@roles_required('admin')
def listar_inscripciones():
    estado = request.args.get('estado', '').strip()
    if estado and estado not in ESTADOS:
        return jsonify({'ok': False, 'error': 'Estado inválido'}), 400

    sql = '''
        SELECT id, nombre, apellido, email, telefono, curso, materias,
               mensaje, fecha, estado, usuario_id, email_verificado, plan
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
@roles_required('admin')
def crear_cuenta(insc_id):
    data = request.get_json(silent=True) or {}
    rol = (data.get('rol') or '').strip()
    ramo_ids = data.get('ramos') or []

    if rol not in ROLES_ALUMNO:
        return jsonify({'ok': False, 'error': 'Plan inválido'}), 400

    if not isinstance(ramo_ids, list) or not all(isinstance(r, int) for r in ramo_ids):
        return jsonify({'ok': False, 'error': 'Ramos inválidos'}), 400

    password = _generar_password()
    ahora = _ahora()

    with get_db() as conn:
        insc = db_execute(conn, '''
            SELECT id, nombre, apellido, email, estado FROM inscripciones WHERE id = %s
        ''', (insc_id,)).fetchone()

        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404

        # 'registrada' = alta rápida de un profesor, sin cuenta todavía: dirección
        # puede formalizarla en cualquier momento, igual que una pendiente normal.
        if insc['estado'] not in ('pendiente', 'registrada'):
            return jsonify({'ok': False, 'error': 'Esta inscripción ya fue procesada.'}), 409

        email = (insc['email'] or '').strip().lower()
        if not EMAIL_REGEX.match(email):
            return jsonify({'ok': False, 'error': 'Este alumno no tiene un correo válido. Complétalo antes de crear su cuenta.'}), 400
        email_norm = normalizar_email(email)

        if db_execute(conn, 'SELECT id FROM usuarios WHERE email_norm = %s', (email_norm,)).fetchone():
            return jsonify({'ok': False, 'error': f'Ya existe una cuenta con {email}.'}), 409

        db_execute(conn, '''
            INSERT INTO usuarios (nombre, apellido, email, email_norm, password_hash, rol, activo, creado_en)
            VALUES (%s, %s, %s, %s, %s, %s, 1, %s)
        ''', (insc['nombre'], insc['apellido'], email, email_norm,
              generate_password_hash(password), rol, ahora))

        nuevo = db_execute(conn, 'SELECT id FROM usuarios WHERE email_norm = %s', (email_norm,)).fetchone()

        # Matrícula en los ramos elegidos al aprobar, para que el alumno vea su
        # horario desde el primer login en vez de un panel vacío.
        for ramo_id in ramo_ids:
            existe = db_execute(conn, 'SELECT id FROM ramos WHERE id = %s AND activo = 1', (ramo_id,)).fetchone()
            if existe:
                db_execute(conn, '''
                    INSERT INTO ramo_alumnos (ramo_id, alumno_id, creado_en) VALUES (%s, %s, %s)
                ''', (ramo_id, nuevo['id'], ahora))

        db_execute(conn, '''
            UPDATE inscripciones SET estado = 'aprobada', usuario_id = %s WHERE id = %s
        ''', (nuevo['id'], insc_id))

    logger.info("Cuenta creada desde inscripción %s: %s (rol %s, %s ramos)",
                insc_id, email, rol, len(ramo_ids))

    # La contraseña viaja UNA sola vez, acá. En la BD solo queda el hash.
    return jsonify({
        'ok': True,
        'password': password,
        'user': {
            'id': nuevo['id'], 'nombre': insc['nombre'], 'apellido': insc['apellido'],
            'email': email, 'rol': rol,
        },
    })


@admin_bp.route('/api/admin/inscripciones/<int:insc_id>', methods=['PATCH'])
@roles_required('admin')
def editar_inscripcion(insc_id):
    """Corrige datos de contacto — típicamente para completar el correo de un alta
    rápida ('registrada') antes de poder crearle la cuenta de acceso."""
    data = request.get_json(silent=True) or {}

    nombre = _texto(data, 'nombre', 80)
    apellido = _texto(data, 'apellido', 80)
    email = _texto(data, 'email', 120).lower()
    telefono = _texto(data, 'telefono', 20)
    plan = _texto(data, 'plan', 80)

    if not nombre:
        return jsonify({'ok': False, 'error': 'El nombre es obligatorio'}), 400
    if email and not EMAIL_REGEX.match(email):
        return jsonify({'ok': False, 'error': 'Correo inválido'}), 400

    with get_db() as conn:
        insc = db_execute(conn, 'SELECT id FROM inscripciones WHERE id = %s', (insc_id,)).fetchone()
        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404

        db_execute(conn, '''
            UPDATE inscripciones SET nombre = %s, apellido = %s, email = %s, telefono = %s, plan = %s
            WHERE id = %s
        ''', (nombre, apellido, email, telefono, plan, insc_id))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/inscripciones/<int:insc_id>', methods=['DELETE'])
@roles_required('admin')
def eliminar_inscripcion(insc_id):
    """Borra el registro por completo (no solo lo descarta) — para sacar altas de
    prueba o duplicadas. Si ya tenía cuenta de acceso, también borra esa cuenta."""
    with get_db() as conn:
        insc = db_execute(conn, 'SELECT usuario_id FROM inscripciones WHERE id = %s', (insc_id,)).fetchone()
        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404

        db_execute(conn, 'DELETE FROM horario_personal WHERE alumno_id = %s', (insc_id,))
        db_execute(conn, 'DELETE FROM inscripciones WHERE id = %s', (insc_id,))
        if insc['usuario_id']:
            db_execute(conn, 'DELETE FROM usuarios WHERE id = %s', (insc['usuario_id'],))

    logger.info("Inscripción %s eliminada por admin %s", insc_id, g.current_user['sub'])
    return jsonify({'ok': True})


@admin_bp.route('/api/admin/inscripciones/<int:insc_id>/descartar', methods=['POST'])
@roles_required('admin')
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
@roles_required('admin')
def reabrir_inscripcion(insc_id):
    with get_db() as conn:
        insc = db_execute(conn, 'SELECT estado FROM inscripciones WHERE id = %s', (insc_id,)).fetchone()
        if not insc:
            return jsonify({'ok': False, 'error': 'Inscripción no encontrada'}), 404
        if insc['estado'] != 'descartada':
            return jsonify({'ok': False, 'error': 'Solo se pueden reabrir inscripciones descartadas.'}), 409
        db_execute(conn, "UPDATE inscripciones SET estado = 'pendiente' WHERE id = %s", (insc_id,))

    return jsonify({'ok': True})


# ══════════════════════════════════════════════════════════════
#   RAMOS
# ══════════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/ramos', methods=['POST'])
@roles_required('admin')
def crear_ramo():
    data = request.get_json(silent=True) or {}
    nombre = _texto(data, 'nombre')
    plan = _texto(data, 'plan', 30)
    color = _texto(data, 'color', 9) or COLOR_POR_DEFECTO
    meet_url = _texto(data, 'meet_url', 300)
    profesor_id = data.get('profesor_id')

    if not nombre:
        return jsonify({'ok': False, 'error': 'El nombre del ramo es obligatorio'}), 400
    if not plan:
        return jsonify({'ok': False, 'error': 'El plan es obligatorio'}), 400

    with get_db() as conn:
        if profesor_id is not None:
            prof = db_execute(conn, "SELECT id FROM usuarios WHERE id = %s AND rol IN ('teacher','admin')",
                              (profesor_id,)).fetchone()
            if not prof:
                return jsonify({'ok': False, 'error': 'Esa profesora no existe'}), 400

        db_execute(conn, '''
            INSERT INTO ramos (nombre, plan, color, meet_url, profesor_id, activo, creado_en)
            VALUES (%s, %s, %s, %s, %s, 1, %s)
        ''', (nombre, plan, color, meet_url, profesor_id, _ahora()))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/ramos/<int:ramo_id>', methods=['PATCH'])
@roles_required('admin')
def editar_ramo(ramo_id):
    data = request.get_json(silent=True) or {}

    with get_db() as conn:
        if not db_execute(conn, 'SELECT id FROM ramos WHERE id = %s', (ramo_id,)).fetchone():
            return jsonify({'ok': False, 'error': 'Ramo no encontrado'}), 404

        if 'nombre' in data:
            nombre = _texto(data, 'nombre')
            if not nombre:
                return jsonify({'ok': False, 'error': 'El nombre no puede quedar vacío'}), 400
            db_execute(conn, 'UPDATE ramos SET nombre = %s WHERE id = %s', (nombre, ramo_id))

        if 'plan' in data:
            db_execute(conn, 'UPDATE ramos SET plan = %s WHERE id = %s', (_texto(data, 'plan', 30), ramo_id))

        if 'color' in data:
            db_execute(conn, 'UPDATE ramos SET color = %s WHERE id = %s', (_texto(data, 'color', 9), ramo_id))

        if 'meet_url' in data:
            db_execute(conn, 'UPDATE ramos SET meet_url = %s WHERE id = %s',
                       (_texto(data, 'meet_url', 300), ramo_id))

        if 'profesor_id' in data:
            profesor_id = data['profesor_id']
            if profesor_id is not None:
                prof = db_execute(conn, "SELECT id FROM usuarios WHERE id = %s AND rol IN ('teacher','admin')",
                                  (profesor_id,)).fetchone()
                if not prof:
                    return jsonify({'ok': False, 'error': 'Esa profesora no existe'}), 400
            db_execute(conn, 'UPDATE ramos SET profesor_id = %s WHERE id = %s', (profesor_id, ramo_id))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/ramos/<int:ramo_id>', methods=['DELETE'])
@roles_required('admin')
def borrar_ramo(ramo_id):
    """Baja lógica: el historial de quién estuvo en el ramo no se pierde."""
    with get_db() as conn:
        if not db_execute(conn, 'SELECT id FROM ramos WHERE id = %s', (ramo_id,)).fetchone():
            return jsonify({'ok': False, 'error': 'Ramo no encontrado'}), 404
        db_execute(conn, 'UPDATE ramos SET activo = 0 WHERE id = %s', (ramo_id,))

    return jsonify({'ok': True})


# ══════════════════════════════════════════════════════════════
#   PERSONAS (para poder asignarlas)
# ══════════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/profesores', methods=['GET'])
@roles_required('admin')
def listar_profesores():
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT id, nombre, apellido, email, rol, activo
            FROM usuarios WHERE rol IN ('teacher','admin') ORDER BY apellido, nombre
        ''').fetchall()
    return jsonify({'ok': True, 'profesores': [dict(f) for f in filas]})


@admin_bp.route('/api/admin/profesoras', methods=['POST'])
@roles_required('admin')
def crear_profesora():
    """Alta de una profesora desde el panel.

    Sin esto, con ~100 postulantes la única forma de crear cuentas era la
    Shell de Render (manage.py) — no escala. Siempre crea rol 'teacher'; las
    cuentas admin son para las fundadoras y se crean aparte, a mano.
    """
    data = request.get_json(silent=True) or {}
    nombre = _texto(data, 'nombre', 100)
    apellido = _texto(data, 'apellido', 100)
    email = (data.get('email') or '').strip().lower()

    if not nombre:
        return jsonify({'ok': False, 'error': 'El nombre es obligatorio'}), 400
    if not apellido:
        return jsonify({'ok': False, 'error': 'El apellido es obligatorio'}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({'ok': False, 'error': 'Correo electrónico inválido'}), 400

    email_norm = normalizar_email(email)
    password = _generar_password()
    ahora = _ahora()

    with get_db() as conn:
        if db_execute(conn, 'SELECT id FROM usuarios WHERE email_norm = %s', (email_norm,)).fetchone():
            return jsonify({'ok': False, 'error': f'Ya existe una cuenta con {email}.'}), 409

        db_execute(conn, '''
            INSERT INTO usuarios (nombre, apellido, email, email_norm, password_hash, rol, activo, creado_en)
            VALUES (%s, %s, %s, %s, %s, 'teacher', 1, %s)
        ''', (nombre, apellido, email, email_norm, generate_password_hash(password), ahora))

        nueva = db_execute(conn, 'SELECT id FROM usuarios WHERE email_norm = %s', (email_norm,)).fetchone()

    logger.info("Profesora creada desde el panel: %s %s <%s>", nombre, apellido, email)

    # La contraseña viaja UNA sola vez, acá. En la BD solo queda el hash.
    return jsonify({
        'ok': True,
        'password': password,
        'user': {'id': nueva['id'], 'nombre': nombre, 'apellido': apellido, 'email': email, 'rol': 'teacher'},
    })


@admin_bp.route('/api/admin/profesores/<int:prof_id>/activo', methods=['PATCH'])
@roles_required('admin')
def cambiar_activo_profesor(prof_id):
    """Bloquea o reactiva el acceso de una profesora, sin borrar nada de lo suyo.

    Solo aplica a rol 'teacher': una cuenta admin no se desactiva desde acá
    para que dirección no pueda bloquearse a sí misma por error.
    """
    data = request.get_json(silent=True) or {}
    activo = data.get('activo')
    if activo not in (0, 1, True, False):
        return jsonify({'ok': False, 'error': 'Valor inválido'}), 400

    with get_db() as conn:
        fila = db_execute(conn, "SELECT id FROM usuarios WHERE id = %s AND rol = 'teacher'", (prof_id,)).fetchone()
        if not fila:
            return jsonify({'ok': False, 'error': 'Profesora no encontrada'}), 404
        db_execute(conn, 'UPDATE usuarios SET activo = %s WHERE id = %s', (1 if activo else 0, prof_id))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/alumnos', methods=['GET'])
@roles_required('admin')
def listar_alumnos():
    """Todos los alumnos, con los ramos en los que ya está cada uno."""
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT id, nombre, apellido, email, rol AS plan, activo
            FROM usuarios
            WHERE rol IN ('paes','nem','nivelacion','especial')
            ORDER BY apellido, nombre
        ''').fetchall()

        alumnos = []
        for f in filas:
            d = dict(f)
            ramos = db_execute(conn, '''
                SELECT r.id, r.nombre FROM ramo_alumnos ra
                JOIN ramos r ON r.id = ra.ramo_id
                WHERE ra.alumno_id = %s AND r.activo = 1
                ORDER BY r.nombre
            ''', (d['id'],)).fetchall()
            d['ramos'] = [dict(r) for r in ramos]
            d['estado'] = 'activo' if d.pop('activo') else 'inactivo'
            alumnos.append(d)

    return jsonify({'ok': True, 'alumnos': alumnos})


# ══════════════════════════════════════════════════════════════
#   MATRÍCULA — quién está en qué ramo. SOLO admin.
# ══════════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/ramos/<int:ramo_id>/alumnos', methods=['POST'])
@roles_required('admin')
def matricular(ramo_id):
    data = request.get_json(silent=True) or {}
    alumno_id = data.get('alumno_id')

    if not isinstance(alumno_id, int):
        return jsonify({'ok': False, 'error': 'Alumno inválido'}), 400

    with get_db() as conn:
        if not db_execute(conn, 'SELECT id FROM ramos WHERE id = %s AND activo = 1', (ramo_id,)).fetchone():
            return jsonify({'ok': False, 'error': 'Ramo no encontrado'}), 404

        alumno = db_execute(conn, '''
            SELECT id FROM usuarios WHERE id = %s AND rol IN ('paes','nem','nivelacion','especial')
        ''', (alumno_id,)).fetchone()
        if not alumno:
            return jsonify({'ok': False, 'error': 'Alumno no encontrado'}), 404

        ya = db_execute(conn, 'SELECT id FROM ramo_alumnos WHERE ramo_id = %s AND alumno_id = %s',
                        (ramo_id, alumno_id)).fetchone()
        if ya:
            return jsonify({'ok': False, 'error': 'El alumno ya está en este ramo'}), 409

        db_execute(conn, 'INSERT INTO ramo_alumnos (ramo_id, alumno_id, creado_en) VALUES (%s, %s, %s)',
                   (ramo_id, alumno_id, _ahora()))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/ramos/<int:ramo_id>/alumnos/<int:alumno_id>', methods=['DELETE'])
@roles_required('admin')
def desmatricular(ramo_id, alumno_id):
    with get_db() as conn:
        db_execute(conn, 'DELETE FROM ramo_alumnos WHERE ramo_id = %s AND alumno_id = %s',
                   (ramo_id, alumno_id))
    return jsonify({'ok': True})


# ══════════════════════════════════════════════════════════════
#   HORARIO — las horas son el sueldo. SOLO admin.
# ══════════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/ramos/<int:ramo_id>/clases', methods=['POST'])
@roles_required('admin')
def crear_clase(ramo_id):
    data = request.get_json(silent=True) or {}
    dia = _texto(data, 'dia', 12)
    hora = _texto(data, 'hora', 5)
    tipo = _texto(data, 'tipo', 12) or 'clase'

    if dia not in DIAS:
        return jsonify({'ok': False, 'error': 'Día inválido'}), 400
    if not hora or ':' not in hora:
        return jsonify({'ok': False, 'error': 'Hora inválida (formato HH:MM)'}), 400
    if tipo not in TIPOS_CLASE:
        return jsonify({'ok': False, 'error': 'Tipo de clase inválido'}), 400

    with get_db() as conn:
        if not db_execute(conn, 'SELECT id FROM ramos WHERE id = %s AND activo = 1', (ramo_id,)).fetchone():
            return jsonify({'ok': False, 'error': 'Ramo no encontrado'}), 404

        db_execute(conn, '''
            INSERT INTO clases (ramo_id, dia, hora, tipo, creado_en) VALUES (%s, %s, %s, %s, %s)
        ''', (ramo_id, dia, hora, tipo, _ahora()))

    return jsonify({'ok': True})


@admin_bp.route('/api/admin/clases/<int:clase_id>', methods=['DELETE'])
@roles_required('admin')
def borrar_clase(clase_id):
    with get_db() as conn:
        db_execute(conn, 'DELETE FROM clases WHERE id = %s', (clase_id,))
    return jsonify({'ok': True})


@admin_bp.route('/api/admin/ramos/<int:ramo_id>/clases', methods=['GET'])
@roles_required('teacher', 'admin')
def listar_clases(ramo_id):
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')

    with get_db() as conn:
        ramo = db_execute(conn, 'SELECT profesor_id FROM ramos WHERE id = %s', (ramo_id,)).fetchone()
        if not ramo:
            return jsonify({'ok': False, 'error': 'Ramo no encontrado'}), 404
        if rol == 'teacher' and ramo['profesor_id'] != uid:
            return jsonify({'ok': False, 'error': 'Ese ramo no es tuyo'}), 403

        filas = db_execute(conn, 'SELECT id, dia, hora, tipo FROM clases WHERE ramo_id = %s',
                           (ramo_id,)).fetchall()

    return jsonify({'ok': True, 'clases': [dict(f) for f in filas]})


# ══════════════════════════════════════════════════════════════
#   AVISOS — admin publica a todos; la profesora, solo en sus ramos.
# ══════════════════════════════════════════════════════════════

@admin_bp.route('/api/avisos', methods=['POST'])
@roles_required('teacher', 'admin')
def crear_aviso():
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')

    data = request.get_json(silent=True) or {}
    titulo = _texto(data, 'titulo')
    texto = _texto(data, 'texto', 1000)
    tipo = _texto(data, 'tipo', 12) or 'info'
    ramo_id = data.get('ramo_id')

    if not titulo:
        return jsonify({'ok': False, 'error': 'El título es obligatorio'}), 400
    if not texto:
        return jsonify({'ok': False, 'error': 'El texto es obligatorio'}), 400
    if tipo not in TIPOS_AVISO:
        return jsonify({'ok': False, 'error': 'Tipo de aviso inválido'}), 400

    with get_db() as conn:
        if ramo_id is not None:
            ramo = db_execute(conn, 'SELECT profesor_id FROM ramos WHERE id = %s AND activo = 1',
                              (ramo_id,)).fetchone()
            if not ramo:
                return jsonify({'ok': False, 'error': 'Ramo no encontrado'}), 404
            # Una profesora solo publica en los ramos que dicta.
            if rol == 'teacher' and ramo['profesor_id'] != uid:
                return jsonify({'ok': False, 'error': 'Ese ramo no es tuyo'}), 403
        elif rol != 'admin':
            # Los avisos generales los ve todo Miraza: solo dirección.
            return jsonify({
                'ok': False,
                'error': 'Solo dirección puede publicar avisos generales. Elige uno de tus ramos.'
            }), 403

        db_execute(conn, '''
            INSERT INTO avisos (titulo, texto, tipo, ramo_id, autor_id, fecha)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (titulo, texto, tipo, ramo_id, uid, _ahora()[:10]))

    return jsonify({'ok': True})


@admin_bp.route('/api/avisos/<int:aviso_id>', methods=['DELETE'])
@roles_required('teacher', 'admin')
def borrar_aviso(aviso_id):
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')

    with get_db() as conn:
        aviso = db_execute(conn, 'SELECT autor_id FROM avisos WHERE id = %s', (aviso_id,)).fetchone()
        if not aviso:
            return jsonify({'ok': False, 'error': 'Aviso no encontrado'}), 404
        if rol != 'admin' and aviso['autor_id'] != uid:
            return jsonify({'ok': False, 'error': 'Ese aviso no es tuyo'}), 403

        db_execute(conn, 'DELETE FROM avisos WHERE id = %s', (aviso_id,))

    return jsonify({'ok': True})
