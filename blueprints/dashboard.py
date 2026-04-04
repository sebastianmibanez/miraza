from flask import Blueprint, jsonify, g
from blueprints.auth import jwt_required

dashboard_bp = Blueprint('dashboard', __name__)

# ── Plan metadata ──────────────────────────────────────────────
PLAN_META = {
    'paes': {
        'label': 'Preparación PAES',
        'color': '#2563eb',
        'icon': '📘',
        'materias': ['Matemática', 'Lenguaje', 'Historia', 'Ciencias'],
    },
    'nem': {
        'label': 'Mejora tu NEM',
        'color': '#16a34a',
        'icon': '📗',
        'materias': ['Matemática', 'Lenguaje', 'Historia', 'Ciencias'],
    },
    'nivelacion': {
        'label': 'Nivelación de Estudios',
        'color': '#9333ea',
        'icon': '📙',
        'materias': ['Matemática', 'Lenguaje'],
    },
    'especial': {
        'label': 'Clases Especializadas',
        'color': '#0e7490',
        'icon': '📓',
        'materias': ['Apoyo Sicopedagógico', 'Tutorías'],
    },
    'teacher': {
        'label': 'Profesora',
        'color': '#b45309',
        'icon': '🎓',
        'materias': [],
    },
}

# ── Weekly schedule (static per plan) ────────────────────────
SCHEDULE = {
    'paes': [
        {'dia': 'Lunes',     'hora': '18:00', 'materia': 'Matemática', 'tipo': 'clase'},
        {'dia': 'Miércoles', 'hora': '18:00', 'materia': 'Lenguaje',   'tipo': 'clase'},
        {'dia': 'Viernes',   'hora': '17:00', 'materia': 'Historia',   'tipo': 'ensayo'},
        {'dia': 'Sábado',    'hora': '10:00', 'materia': 'Ciencias',   'tipo': 'clase'},
    ],
    'nem': [
        {'dia': 'Lunes',     'hora': '17:00', 'materia': 'Matemática', 'tipo': 'clase'},
        {'dia': 'Miércoles', 'hora': '17:00', 'materia': 'Lenguaje',   'tipo': 'clase'},
        {'dia': 'Jueves',    'hora': '18:00', 'materia': 'Historia',   'tipo': 'tutoría'},
    ],
    'nivelacion': [
        {'dia': 'Martes',    'hora': '16:00', 'materia': 'Matemática', 'tipo': 'clase'},
        {'dia': 'Jueves',    'hora': '16:00', 'materia': 'Lenguaje',   'tipo': 'clase'},
    ],
    'especial': [
        {'dia': 'Lunes',     'hora': '16:00', 'materia': 'Tutoría personalizada',    'tipo': 'tutoría'},
        {'dia': 'Miércoles', 'hora': '16:00', 'materia': 'Apoyo sicopedagógico',     'tipo': 'apoyo'},
    ],
    'teacher': [],
}

ANNOUNCEMENTS = [
    {
        'id': 1,
        'titulo': '¡Bienvenidos al nuevo período!',
        'texto': 'Comenzamos el 7 de abril. Revisa tu horario en el panel.',
        'fecha': '2026-04-04',
        'tipo': 'info',
    },
    {
        'id': 2,
        'titulo': 'Clases en vivo por Google Meet',
        'texto': 'Recibirás el enlace de tu sala por correo 30 minutos antes de cada clase.',
        'fecha': '2026-04-04',
        'tipo': 'aviso',
    },
]


@dashboard_bp.route('/api/dashboard/info', methods=['GET'])
@jwt_required
def dashboard_info():
    rol = g.current_user.get('rol', 'paes')
    return jsonify({
        'ok': True,
        'plan': PLAN_META.get(rol, PLAN_META['paes']),
    })


@dashboard_bp.route('/api/dashboard/schedule', methods=['GET'])
@jwt_required
def dashboard_schedule():
    rol = g.current_user.get('rol', 'paes')
    return jsonify({
        'ok': True,
        'schedule': SCHEDULE.get(rol, []),
    })


@dashboard_bp.route('/api/dashboard/announcements', methods=['GET'])
@jwt_required
def dashboard_announcements():
    return jsonify({'ok': True, 'announcements': ANNOUNCEMENTS})
