from flask import Blueprint, jsonify, request, g
from blueprints.auth import jwt_required, roles_required

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
    'teacher': [
        {'dia': 'Lunes',     'hora': '18:00', 'materia': 'Matemática M1', 'tipo': 'clase',   'plan': 'PAES', 'alumnos': 8},
        {'dia': 'Lunes',     'hora': '19:30', 'materia': 'Matemática M2', 'tipo': 'clase',   'plan': 'PAES', 'alumnos': 6},
        {'dia': 'Miércoles', 'hora': '18:00', 'materia': 'Matemática',    'tipo': 'clase',   'plan': 'NEM',  'alumnos': 5},
        {'dia': 'Jueves',    'hora': '17:00', 'materia': 'Ensayo PAES',   'tipo': 'ensayo',  'plan': 'PAES', 'alumnos': 14},
        {'dia': 'Viernes',   'hora': '18:00', 'materia': 'Matemática M2', 'tipo': 'clase',   'plan': 'PAES', 'alumnos': 6},
        {'dia': 'Sábado',    'hora': '10:00', 'materia': 'Matemática',    'tipo': 'tutoría', 'plan': 'NEM',  'alumnos': 3},
    ],
}

TEACHER_RAMOS = [
    {'id': 1, 'nombre': 'Matemática M1', 'plan': 'PAES', 'color': '#1B4DB8', 'alumnos': 8,  'clases_semana': 2, 'proxima': 'Lunes 18:00'},
    {'id': 2, 'nombre': 'Matemática M2', 'plan': 'PAES', 'color': '#065F46', 'alumnos': 6,  'clases_semana': 2, 'proxima': 'Lunes 19:30'},
    {'id': 3, 'nombre': 'Matemática',    'plan': 'NEM',  'color': '#B45309', 'alumnos': 5,  'clases_semana': 2, 'proxima': 'Miércoles 18:00'},
]

TEACHER_ALUMNOS = [
    {'id': 1,  'nombre': 'Sofía',      'apellido': 'Martínez', 'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 2,  'nombre': 'Diego',      'apellido': 'Ramírez',  'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': 'Egresado',  'estado': 'activo'},
    {'id': 3,  'nombre': 'Valentina',  'apellido': 'Ponce',    'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 4,  'nombre': 'Matías',     'apellido': 'Carrasco', 'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': 'Egresado',  'estado': 'activo'},
    {'id': 5,  'nombre': 'Camila',     'apellido': 'Vega',     'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 6,  'nombre': 'Ignacio',    'apellido': 'Fuentes',  'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': '3° Medio',  'estado': 'inactivo'},
    {'id': 7,  'nombre': 'Javiera',    'apellido': 'Lagos',    'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 8,  'nombre': 'Benjamín',   'apellido': 'Rojas',    'ramo': 'Matemática M1', 'plan': 'PAES', 'nivel': 'Egresado',  'estado': 'activo'},
    {'id': 9,  'nombre': 'Isidora',    'apellido': 'Muñoz',    'ramo': 'Matemática M2', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 10, 'nombre': 'Felipe',     'apellido': 'Soto',     'ramo': 'Matemática M2', 'plan': 'PAES', 'nivel': 'Egresado',  'estado': 'activo'},
    {'id': 11, 'nombre': 'Amanda',     'apellido': 'Torres',   'ramo': 'Matemática M2', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 12, 'nombre': 'Cristóbal',  'apellido': 'Medina',   'ramo': 'Matemática M2', 'plan': 'PAES', 'nivel': 'Egresado',  'estado': 'activo'},
    {'id': 13, 'nombre': 'Renata',     'apellido': 'Araya',    'ramo': 'Matemática M2', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'inactivo'},
    {'id': 14, 'nombre': 'Tomás',      'apellido': 'Díaz',     'ramo': 'Matemática M2', 'plan': 'PAES', 'nivel': '4° Medio',  'estado': 'activo'},
    {'id': 15, 'nombre': 'Paula',      'apellido': 'Herrera',  'ramo': 'Matemática',    'plan': 'NEM',  'nivel': '2° Medio',  'estado': 'activo'},
    {'id': 16, 'nombre': 'Sebastián',  'apellido': 'Gutiérrez','ramo': 'Matemática',    'plan': 'NEM',  'nivel': '3° Medio',  'estado': 'activo'},
    {'id': 17, 'nombre': 'Martina',    'apellido': 'Flores',   'ramo': 'Matemática',    'plan': 'NEM',  'nivel': '1° Medio',  'estado': 'activo'},
    {'id': 18, 'nombre': 'Andrés',     'apellido': 'Castillo', 'ramo': 'Matemática',    'plan': 'NEM',  'nivel': '2° Medio',  'estado': 'activo'},
    {'id': 19, 'nombre': 'Carla',      'apellido': 'Reyes',    'ramo': 'Matemática',    'plan': 'NEM',  'nivel': '3° Medio',  'estado': 'inactivo'},
]

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


@dashboard_bp.route('/api/dashboard/teacher/ramos', methods=['GET'])
@jwt_required
def teacher_ramos():
    if g.current_user.get('rol') != 'teacher':
        return jsonify({'ok': False, 'error': 'Forbidden'}), 403
    return jsonify({'ok': True, 'ramos': TEACHER_RAMOS})


@dashboard_bp.route('/api/dashboard/teacher/alumnos', methods=['GET'])
@jwt_required
def teacher_alumnos():
    if g.current_user.get('rol') != 'teacher':
        return jsonify({'ok': False, 'error': 'Forbidden'}), 403
    ramo = request.args.get('ramo', '')
    alumnos = TEACHER_ALUMNOS if not ramo else [a for a in TEACHER_ALUMNOS if a['ramo'] == ramo]
    return jsonify({'ok': True, 'alumnos': alumnos})
