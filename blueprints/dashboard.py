"""Lecturas del panel. Todo sale de la base: acá ya no hay datos inventados.

El horario del alumno y el de la profesora son la MISMA tabla (clases) vista
desde dos lados: el alumno ve las clases de los ramos en los que está, y la
profesora las de los ramos que dicta.
"""
from flask import Blueprint, jsonify, request, g

from app_db import get_db, db_execute, DIAS, ROLES_ALUMNO
from blueprints.auth import jwt_required, roles_required

dashboard_bp = Blueprint('dashboard', __name__)

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
