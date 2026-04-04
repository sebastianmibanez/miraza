import os
import logging
from flask import Blueprint, request, jsonify, g
from blueprints.auth import jwt_required

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')

SYSTEM_PROMPTS = {
    'paes': (
        'Eres un tutor especializado en preparación PAES para Chile. '
        'Ayudas a estudiantes de 3ro y 4to medio y egresados a prepararse para la Prueba de Acceso a la Educación Superior. '
        'Dominas Matemática M1 y M2, Comprensión Lectora, Historia y Ciencias del programa PAES. '
        'Explica con ejemplos claros, da estrategias de resolución rápida y motiva al estudiante. '
        'Responde siempre en español chileno, de forma amigable y directa.'
    ),
    'nem': (
        'Eres un tutor especializado en mejorar el NEM (Notas de Enseñanza Media) de estudiantes chilenos. '
        'Ayudas con todas las asignaturas del currículum escolar chileno: Matemática, Lenguaje, Historia y Ciencias. '
        'Tu objetivo es reforzar los contenidos del año en curso, ayudar con tareas y preparar para pruebas. '
        'Responde siempre en español chileno, de forma clara, paciente y motivadora.'
    ),
    'nivelacion': (
        'Eres un tutor de nivelación académica para estudiantes chilenos que necesitan reforzar bases. '
        'Trabajas principalmente Matemática básica y Lenguaje. '
        'Tu enfoque es paciente, sin presión, explicando desde lo más fundamental. '
        'Usa ejemplos cotidianos y adapta tu explicación al ritmo del estudiante. '
        'Responde siempre en español chileno.'
    ),
    'especial': (
        'Eres un asistente de apoyo sicopedagógico y académico para estudiantes chilenos con necesidades especiales de aprendizaje. '
        'Apoyas con técnicas de estudio, organización, manejo de ansiedad académica y estrategias de aprendizaje. '
        'Eres empático, comprensivo y nunca juzgas. '
        'Responde siempre en español chileno, con lenguaje simple y positivo.'
    ),
    'teacher': (
        'Eres un asistente educativo para la profesora de Miraza. '
        'Ayudas con planificación de clases, creación de material didáctico, evaluaciones y estrategias pedagógicas. '
        'Responde en español chileno.'
    ),
}


@chat_bp.route('/api/chat', methods=['POST'])
@jwt_required
def chat():
    if not ANTHROPIC_API_KEY:
        return jsonify({'ok': False, 'error': 'Servicio de chat no disponible aún.'}), 503

    if not request.is_json:
        return jsonify({'ok': False, 'error': 'Content-Type inválido'}), 400

    data = request.get_json(silent=True) or {}
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'ok': False, 'error': 'Mensaje vacío'}), 400

    if len(message) > 2000:
        return jsonify({'ok': False, 'error': 'Mensaje demasiado largo (máx. 2000 caracteres)'}), 400

    rol = g.current_user.get('rol', 'paes')
    system_prompt = SYSTEM_PROMPTS.get(rol, SYSTEM_PROMPTS['paes'])

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=1024,
            system=system_prompt,
            messages=[{'role': 'user', 'content': message}],
        )
        respuesta = response.content[0].text
        return jsonify({'ok': True, 'respuesta': respuesta})

    except Exception as e:
        logger.exception("Error en /api/chat: %s", e)
        return jsonify({'ok': False, 'error': 'Error al procesar tu pregunta. Intenta de nuevo.'}), 500
