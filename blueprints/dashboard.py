"""Lecturas del panel. Todo sale de la base: acá ya no hay datos inventados.

El horario del alumno y el de la profesora son la MISMA tabla (clases) vista
desde dos lados: el alumno ve las clases de los ramos en los que está, y la
profesora las de los ramos que dicta.
"""
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from app_db import get_db, db_execute, DIAS, ROLES_ALUMNO
from blueprints.auth import jwt_required, roles_required

dashboard_bp = Blueprint('dashboard', __name__)


def _ahora():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

# Esto sí es configuración, no datos falsos: cómo se llama y se pinta cada plan.
PLAN_META = {
    'paes':       {'label': 'Preparación PAES',      'color': '#2563eb', 'icon': '📘'},
    'nem':        {'label': 'Mejora tu NEM',         'color': '#16a34a', 'icon': '📗'},
    'nivelacion': {'label': 'Nivelación de Estudios','color': '#9333ea', 'icon': '📙'},
    'especial':   {'label': 'Clases Especializadas', 'color': '#0e7490', 'icon': '📓'},
    'teacher':    {'label': 'Docente',               'color': '#b45309', 'icon': '🎓'},
    'admin':      {'label': 'Dirección',             'color': '#b45309', 'icon': '⭐'},
}


def _orden_dia(dia):
    return DIAS.index(dia) if dia in DIAS else len(DIAS)


def _ordenar_horario(filas):
    return sorted(filas, key=lambda c: (_orden_dia(c['dia']), c['hora']))


@dashboard_bp.route('/api/dashboard/info', methods=['GET'])
@jwt_required
def dashboard_info():
    rol = g.current_user.get('rol', 'paes')
    meta = dict(PLAN_META.get(rol, PLAN_META['paes']))
    meta['rol'] = rol
    meta['es_admin'] = rol == 'admin'
    return jsonify({'ok': True, 'plan': meta})


@dashboard_bp.route('/api/dashboard/schedule', methods=['GET'])
@jwt_required
def dashboard_schedule():
    uid = g.current_user['sub']
    rol = g.current_user.get('rol', 'paes')

    with get_db() as conn:
        if rol in ROLES_ALUMNO:
            filas = db_execute(conn, '''
                SELECT c.dia, c.hora, c.tipo, r.nombre AS materia, r.plan, r.color
                FROM clases c
                JOIN ramos r ON r.id = c.ramo_id
                JOIN ramo_alumnos ra ON ra.ramo_id = r.id
                WHERE ra.alumno_id = %s AND r.activo = 1
            ''', (uid,)).fetchall()

        elif rol == 'teacher':
            filas = db_execute(conn, '''
                SELECT c.dia, c.hora, c.tipo, r.nombre AS materia, r.plan, r.color,
                       (SELECT COUNT(*) FROM ramo_alumnos ra WHERE ra.ramo_id = r.id) AS alumnos
                FROM clases c
                JOIN ramos r ON r.id = c.ramo_id
                WHERE r.profesor_id = %s AND r.activo = 1
            ''', (uid,)).fetchall()

        else:  # admin ve todo
            filas = db_execute(conn, '''
                SELECT c.dia, c.hora, c.tipo, r.nombre AS materia, r.plan, r.color,
                       (SELECT COUNT(*) FROM ramo_alumnos ra WHERE ra.ramo_id = r.id) AS alumnos
                FROM clases c
                JOIN ramos r ON r.id = c.ramo_id
                WHERE r.activo = 1
            ''').fetchall()

    return jsonify({'ok': True, 'schedule': _ordenar_horario([dict(f) for f in filas])})


# ── Registro rápido de alumnos (base compartida para el horario propio) ──
# Un mismo punto de partida: el alumno se registra una vez (nombre, contacto,
# plan) y de ahí en adelante se elige de una lista al armar el horario, en
# vez de tipear el nombre cada vez. Reutiliza la tabla `inscripciones` pero
# con estado 'registrada': a diferencia de 'aprobada' (que en el resto del
# código significa "tiene cuenta de acceso creada"), esto NO crea cuenta —
# es solo un registro de datos básicos. Si más adelante se le crea cuenta de
# verdad, sigue el flujo normal en Inscripciones y su estado pasa a 'aprobada'.

@dashboard_bp.route('/api/alumnos-registro', methods=['GET'])
@roles_required('teacher', 'admin')
def alumnos_registro_listar():
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT id, nombre, apellido, plan
            FROM inscripciones WHERE estado IN ('registrada', 'aprobada')
            ORDER BY nombre, apellido
        ''').fetchall()
    return jsonify({'ok': True, 'alumnos': [dict(f) for f in filas]})


@dashboard_bp.route('/api/alumnos-registro', methods=['POST'])
@roles_required('teacher', 'admin')
def alumnos_registro_crear():
    data = request.get_json(silent=True) or {}

    nombre = (data.get('nombre') or '').strip()[:80]
    apellido = (data.get('apellido') or '').strip()[:80]
    email = (data.get('email') or '').strip()[:120]
    telefono = (data.get('telefono') or '').strip()[:20]
    plan = (data.get('plan') or '').strip()[:80]

    if not nombre:
        return jsonify({'ok': False, 'error': 'El nombre es obligatorio'}), 400

    with get_db() as conn:
        db_execute(conn, '''
            INSERT INTO inscripciones
                (nombre, apellido, email, telefono, curso, materias, mensaje, fecha, ip, estado, plan)
            VALUES (%s, %s, %s, %s, '', '', '', %s, '', 'registrada', %s)
        ''', (nombre, apellido, email, telefono, _ahora(), plan))

    return jsonify({'ok': True})


# ── Horario propio (alumnos particulares, sin pasar por ramos) ──────────
# Autoservicio: cada profesor(a) agenda sus propios alumnos por día/hora,
# reemplazando el cuaderno. No requiere que dirección cree un ramo primero.

@dashboard_bp.route('/api/horario-personal', methods=['GET'])
@roles_required('teacher', 'admin')
def horario_personal_listar():
    uid = g.current_user['sub']
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT h.id, h.dia, h.hora_inicio, h.hora_fin, h.nota,
                   i.id AS alumno_id, i.nombre AS alumno_nombre, i.apellido AS alumno_apellido, i.plan AS alumno_plan
            FROM horario_personal h
            JOIN inscripciones i ON i.id = h.alumno_id
            WHERE h.profesor_id = %s
        ''', (uid,)).fetchall()
    filas = [dict(f) for f in filas]
    filas.sort(key=lambda f: (_orden_dia(f['dia']), f['hora_inicio']))
    return jsonify({'ok': True, 'horario': filas})


@dashboard_bp.route('/api/horario-personal', methods=['POST'])
@roles_required('teacher', 'admin')
def horario_personal_crear():
    uid = g.current_user['sub']
    data = request.get_json(silent=True) or {}

    dia = (data.get('dia') or '').strip()
    hora_inicio = (data.get('hora_inicio') or '').strip()[:5]
    hora_fin = (data.get('hora_fin') or '').strip()[:5]
    nota = (data.get('nota') or '').strip()[:120]
    try:
        alumno_id = int(data.get('alumno_id'))
    except (TypeError, ValueError):
        return jsonify({'ok': False, 'error': 'Elige un alumno'}), 400

    if dia not in DIAS:
        return jsonify({'ok': False, 'error': 'Día inválido'}), 400
    if not hora_inicio:
        return jsonify({'ok': False, 'error': 'La hora de inicio es obligatoria'}), 400
    if hora_fin and hora_fin <= hora_inicio:
        return jsonify({'ok': False, 'error': 'La hora de término debe ser posterior a la de inicio'}), 400

    with get_db() as conn:
        existe = db_execute(conn,
            "SELECT id FROM inscripciones WHERE id = %s AND estado IN ('registrada', 'aprobada')",
            (alumno_id,)).fetchone()
        if not existe:
            return jsonify({'ok': False, 'error': 'Ese alumno no existe'}), 400

        db_execute(conn, '''
            INSERT INTO horario_personal (profesor_id, alumno_id, dia, hora_inicio, hora_fin, nota, creado_en)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (uid, alumno_id, dia, hora_inicio, hora_fin, nota, _ahora()))

    return jsonify({'ok': True})


@dashboard_bp.route('/api/horario-personal/<int:entrada_id>', methods=['PATCH'])
@roles_required('teacher', 'admin')
def horario_personal_editar(entrada_id):
    """Edita una entrada: día/hora (drag and drop o edición completa), y opcionalmente
    alumno/nota si vienen en el body — el drag and drop solo manda día/hora."""
    uid = g.current_user['sub']
    data = request.get_json(silent=True) or {}

    dia = (data.get('dia') or '').strip()
    hora_inicio = (data.get('hora_inicio') or '').strip()[:5]
    hora_fin = (data.get('hora_fin') or '').strip()[:5]
    nota = data.get('nota')

    if dia not in DIAS:
        return jsonify({'ok': False, 'error': 'Día inválido'}), 400
    if not hora_inicio:
        return jsonify({'ok': False, 'error': 'La hora de inicio es obligatoria'}), 400
    if hora_fin and hora_fin <= hora_inicio:
        return jsonify({'ok': False, 'error': 'La hora de término debe ser posterior a la de inicio'}), 400

    with get_db() as conn:
        fila = db_execute(conn, 'SELECT profesor_id FROM horario_personal WHERE id = %s',
                           (entrada_id,)).fetchone()
        if not fila:
            return jsonify({'ok': False, 'error': 'No encontrada'}), 404
        if fila['profesor_id'] != uid:
            return jsonify({'ok': False, 'error': 'Esa entrada no es tuya'}), 403

        alumno_id = data.get('alumno_id')
        if alumno_id is not None:
            try:
                alumno_id = int(alumno_id)
            except (TypeError, ValueError):
                return jsonify({'ok': False, 'error': 'Alumno inválido'}), 400
            existe = db_execute(conn,
                "SELECT id FROM inscripciones WHERE id = %s AND estado IN ('registrada', 'aprobada')",
                (alumno_id,)).fetchone()
            if not existe:
                return jsonify({'ok': False, 'error': 'Ese alumno no existe'}), 400
            db_execute(conn, 'UPDATE horario_personal SET alumno_id = %s WHERE id = %s', (alumno_id, entrada_id))

        if nota is not None:
            db_execute(conn, 'UPDATE horario_personal SET nota = %s WHERE id = %s',
                       ((nota or '').strip()[:120], entrada_id))

        db_execute(conn, '''
            UPDATE horario_personal SET dia = %s, hora_inicio = %s, hora_fin = %s WHERE id = %s
        ''', (dia, hora_inicio, hora_fin, entrada_id))

    return jsonify({'ok': True})


@dashboard_bp.route('/api/horario-personal/<int:entrada_id>', methods=['DELETE'])
@roles_required('teacher', 'admin')
def horario_personal_borrar(entrada_id):
    uid = g.current_user['sub']
    with get_db() as conn:
        fila = db_execute(conn, 'SELECT profesor_id FROM horario_personal WHERE id = %s',
                           (entrada_id,)).fetchone()
        if not fila:
            return jsonify({'ok': False, 'error': 'No encontrada'}), 404
        if fila['profesor_id'] != uid:
            return jsonify({'ok': False, 'error': 'Esa entrada no es tuya'}), 403
        db_execute(conn, 'DELETE FROM horario_personal WHERE id = %s', (entrada_id,))

    return jsonify({'ok': True})


@dashboard_bp.route('/api/dashboard/announcements', methods=['GET'])
@jwt_required
def dashboard_announcements():
    uid = g.current_user['sub']
    rol = g.current_user.get('rol', 'paes')

    with get_db() as conn:
        if rol == 'admin':
            filas = db_execute(conn, '''
                SELECT a.id, a.titulo, a.texto, a.tipo, a.fecha, a.ramo_id, r.nombre AS ramo
                FROM avisos a
                LEFT JOIN ramos r ON r.id = a.ramo_id
                ORDER BY a.fecha DESC, a.id DESC
            ''').fetchall()

        elif rol == 'teacher':
            # Los generales, más los de los ramos que dicta.
            filas = db_execute(conn, '''
                SELECT a.id, a.titulo, a.texto, a.tipo, a.fecha, a.ramo_id, r.nombre AS ramo
                FROM avisos a
                LEFT JOIN ramos r ON r.id = a.ramo_id
                WHERE a.ramo_id IS NULL OR r.profesor_id = %s
                ORDER BY a.fecha DESC, a.id DESC
            ''', (uid,)).fetchall()

        else:
            # Alumno: los generales, más los de los ramos en los que está.
            filas = db_execute(conn, '''
                SELECT a.id, a.titulo, a.texto, a.tipo, a.fecha, a.ramo_id, r.nombre AS ramo
                FROM avisos a
                LEFT JOIN ramos r ON r.id = a.ramo_id
                WHERE a.ramo_id IS NULL
                   OR a.ramo_id IN (SELECT ramo_id FROM ramo_alumnos WHERE alumno_id = %s)
                ORDER BY a.fecha DESC, a.id DESC
            ''', (uid,)).fetchall()

    return jsonify({'ok': True, 'announcements': [dict(f) for f in filas]})


@dashboard_bp.route('/api/dashboard/mis-ramos', methods=['GET'])
@jwt_required
def mis_ramos():
    """Los ramos del alumno, con su profesora."""
    uid = g.current_user['sub']

    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT r.id, r.nombre, r.plan, r.color, r.meet_url,
                   p.nombre AS profesor_nombre, p.apellido AS profesor_apellido,
                   (SELECT COUNT(*) FROM clases c WHERE c.ramo_id = r.id) AS clases_semana
            FROM ramos r
            JOIN ramo_alumnos ra ON ra.ramo_id = r.id
            LEFT JOIN usuarios p ON p.id = r.profesor_id
            WHERE ra.alumno_id = %s AND r.activo = 1
            ORDER BY r.nombre
        ''', (uid,)).fetchall()

    return jsonify({'ok': True, 'ramos': [dict(f) for f in filas]})


@dashboard_bp.route('/api/dashboard/teacher/ramos', methods=['GET'])
@roles_required('teacher', 'admin')
def teacher_ramos():
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')

    with get_db() as conn:
        sql = '''
            SELECT r.id, r.nombre, r.plan, r.color, r.meet_url, r.profesor_id,
                   p.nombre AS profesor_nombre, p.apellido AS profesor_apellido,
                   (SELECT COUNT(*) FROM ramo_alumnos ra WHERE ra.ramo_id = r.id) AS alumnos,
                   (SELECT COUNT(*) FROM clases c WHERE c.ramo_id = r.id) AS clases_semana
            FROM ramos r
            LEFT JOIN usuarios p ON p.id = r.profesor_id
            WHERE r.activo = 1
        '''
        if rol == 'teacher':
            filas = db_execute(conn, sql + ' AND r.profesor_id = %s ORDER BY r.nombre', (uid,)).fetchall()
        else:
            filas = db_execute(conn, sql + ' ORDER BY r.nombre').fetchall()

        ramos = []
        for f in filas:
            d = dict(f)
            prox = db_execute(conn, 'SELECT dia, hora FROM clases WHERE ramo_id = %s', (d['id'],)).fetchall()
            prox = _ordenar_horario([dict(p) for p in prox])
            d['proxima'] = f"{prox[0]['dia']} {prox[0]['hora']}" if prox else None
            ramos.append(d)

    return jsonify({'ok': True, 'ramos': ramos})


@dashboard_bp.route('/api/dashboard/teacher/alumnos', methods=['GET'])
@roles_required('teacher', 'admin')
def teacher_alumnos():
    """Los alumnos de mis ramos. Una profesora solo ve los suyos."""
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')
    ramo = request.args.get('ramo', '').strip()

    with get_db() as conn:
        sql = '''
            SELECT u.id, u.nombre, u.apellido, u.email, u.rol AS plan, u.activo,
                   r.nombre AS ramo, r.id AS ramo_id
            FROM ramo_alumnos ra
            JOIN usuarios u ON u.id = ra.alumno_id
            JOIN ramos r ON r.id = ra.ramo_id
            WHERE r.activo = 1
        '''
        params = []
        if rol == 'teacher':
            sql += ' AND r.profesor_id = %s'
            params.append(uid)
        if ramo:
            sql += ' AND r.nombre = %s'
            params.append(ramo)
        sql += ' ORDER BY u.apellido, u.nombre'

        filas = db_execute(conn, sql, tuple(params)).fetchall()

    alumnos = []
    for f in filas:
        d = dict(f)
        d['estado'] = 'activo' if d.pop('activo') else 'inactivo'
        alumnos.append(d)

    return jsonify({'ok': True, 'alumnos': alumnos})
