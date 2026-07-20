"""Vitrina: cada profesora sube y administra SU propio material.

El video no se hostea acá — se guarda solo el link (YouTube / Vimeo / Drive).
Autoservicio para staff (teacher y admin): cada quien ve y borra lo suyo.

Gate de aprobación: lo que sube un teacher queda 'pendiente' y no aparece en la
vitrina pública hasta que dirección (admin) lo aprueba. Lo que sube un admin
entra 'aprobado' directo — son las dueñas.
"""
import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from app_db import get_db, db_execute, TIPOS_MATERIAL
from blueprints.auth import roles_required

materiales_bp = Blueprint('materiales', __name__)
logger = logging.getLogger(__name__)

URL_MAX = 500
ESTADOS = ('pendiente', 'aprobado', 'rechazado')


def _ahora():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')


@materiales_bp.route('/api/materiales', methods=['GET'])
def vitrina():
    """Grilla pública: solo material aprobado, con el nombre de quien lo subió.

    Sin auth — es la vitrina que ve cualquier visitante. No se expone el correo.
    """
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT m.id, m.titulo, m.descripcion, m.tipo, m.url, m.creado_en,
                   m.autor_id, u.nombre AS autor_nombre, u.apellido AS autor_apellido,
                   u.foto_url AS autor_foto
            FROM materiales m
            JOIN usuarios u ON u.id = m.autor_id
            WHERE m.estado = 'aprobado'
            ORDER BY m.id DESC
        ''').fetchall()
    return jsonify({'ok': True, 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/profes/<int:prof_id>', methods=['GET'])
def perfil_publico(prof_id):
    """Perfil público de una profesora: sus datos + su material. Sin auth."""
    with get_db() as conn:
        prof = db_execute(conn, '''
            SELECT id, nombre, apellido, foto_url, bio, estudios, especialidades, intereses
            FROM usuarios WHERE id = %s AND rol IN ('teacher','admin')
        ''', (prof_id,)).fetchone()
        if not prof:
            return jsonify({'ok': False, 'error': 'Profesor no encontrado'}), 404

        filas = db_execute(conn, '''
            SELECT id, titulo, descripcion, tipo, url, creado_en
            FROM materiales WHERE autor_id = %s AND estado = 'aprobado' ORDER BY id DESC
        ''', (prof_id,)).fetchall()

    return jsonify({'ok': True, 'profesor': dict(prof), 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/materiales/mios', methods=['GET'])
@roles_required('teacher', 'admin')
def mis_materiales():
    uid = g.current_user['sub']
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT id, titulo, descripcion, tipo, url, creado_en, estado
            FROM materiales WHERE autor_id = %s ORDER BY id DESC
        ''', (uid,)).fetchall()
    return jsonify({'ok': True, 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/materiales', methods=['POST'])
@roles_required('teacher', 'admin')
def crear_material():
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')
    data = request.get_json(silent=True) or {}

    titulo = (data.get('titulo') or '').strip()[:120]
    descripcion = (data.get('descripcion') or '').strip()[:1000]
    tipo = (data.get('tipo') or '').strip()
    url = (data.get('url') or '').strip()[:URL_MAX]

    if not titulo:
        return jsonify({'ok': False, 'error': 'El título es obligatorio'}), 400
    if tipo not in TIPOS_MATERIAL:
        return jsonify({'ok': False, 'error': 'Tipo inválido'}), 400
    if not (url.startswith('https://') or url.startswith('http://')):
        return jsonify({'ok': False, 'error': 'El enlace debe empezar con http:// o https://'}), 400

    with get_db() as conn:
        # Admin puede subir a nombre de otra profesora: muchas van a preferir
        # mandar el link por WhatsApp antes que loguearse a subirlo ellas mismas.
        autor_id = uid
        if rol == 'admin' and data.get('autor_id') not in (None, ''):
            try:
                autor_id = int(data['autor_id'])
            except (TypeError, ValueError):
                return jsonify({'ok': False, 'error': 'Autor inválido'}), 400
            existe = db_execute(conn, "SELECT id FROM usuarios WHERE id = %s AND rol IN ('teacher','admin')",
                                (autor_id,)).fetchone()
            if not existe:
                return jsonify({'ok': False, 'error': 'Esa profesora no existe'}), 400

        # Admin publica directo (sea para sí misma o a nombre de otra profesora);
        # cuando una teacher sube lo suyo, queda pendiente de aprobación.
        estado = 'aprobado' if rol == 'admin' else 'pendiente'

        db_execute(conn, '''
            INSERT INTO materiales (autor_id, titulo, descripcion, tipo, url, creado_en, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (autor_id, titulo, descripcion, tipo, url, _ahora(), estado))

    return jsonify({'ok': True, 'estado': estado})


@materiales_bp.route('/api/materiales/<int:material_id>', methods=['DELETE'])
@roles_required('teacher', 'admin')
def borrar_material(material_id):
    uid = g.current_user['sub']
    rol = g.current_user.get('rol')

    with get_db() as conn:
        mat = db_execute(conn, 'SELECT autor_id FROM materiales WHERE id = %s', (material_id,)).fetchone()
        if not mat:
            return jsonify({'ok': False, 'error': 'Material no encontrado'}), 404
        # Cada quien borra lo suyo; admin puede borrar cualquiera (cura la vitrina).
        if rol != 'admin' and mat['autor_id'] != uid:
            return jsonify({'ok': False, 'error': 'Ese material no es tuyo'}), 403
        db_execute(conn, 'DELETE FROM materiales WHERE id = %s', (material_id,))

    return jsonify({'ok': True})


# ── Aprobación (solo dirección) ───────────────────────────────

@materiales_bp.route('/api/admin/materiales/pendientes', methods=['GET'])
@roles_required('admin')
def materiales_pendientes():
    """Material esperando revisión, con su autor. Para el panel de dirección."""
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT m.id, m.titulo, m.descripcion, m.tipo, m.url, m.creado_en,
                   u.nombre AS autor_nombre, u.apellido AS autor_apellido
            FROM materiales m
            JOIN usuarios u ON u.id = m.autor_id
            WHERE m.estado = 'pendiente'
            ORDER BY m.id ASC
        ''').fetchall()
    return jsonify({'ok': True, 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/admin/materiales/<int:material_id>/estado', methods=['POST'])
@roles_required('admin')
def revisar_material(material_id):
    data = request.get_json(silent=True) or {}
    estado = (data.get('estado') or '').strip()

    # Desde el panel solo se aprueba o se rechaza.
    if estado not in ('aprobado', 'rechazado'):
        return jsonify({'ok': False, 'error': 'Estado inválido'}), 400

    with get_db() as conn:
        mat = db_execute(conn, 'SELECT id FROM materiales WHERE id = %s', (material_id,)).fetchone()
        if not mat:
            return jsonify({'ok': False, 'error': 'Material no encontrado'}), 404
        db_execute(conn, 'UPDATE materiales SET estado = %s WHERE id = %s', (estado, material_id))

    logger.info("Material %s → %s por admin %s", material_id, estado, g.current_user['sub'])
    return jsonify({'ok': True})


# ── Mi perfil (foto + bio para la vitrina) ────────────────────

@materiales_bp.route('/api/mi-perfil', methods=['GET'])
@roles_required('teacher', 'admin')
def mi_perfil():
    uid = g.current_user['sub']
    with get_db() as conn:
        fila = db_execute(conn,
            'SELECT nombre, apellido, foto_url, bio, estudios, especialidades, intereses '
            'FROM usuarios WHERE id = %s', (uid,)
        ).fetchone()
    return jsonify({'ok': True, 'perfil': dict(fila)})


@materiales_bp.route('/api/mi-perfil', methods=['PATCH'])
@roles_required('teacher', 'admin')
def editar_mi_perfil():
    uid = g.current_user['sub']
    data = request.get_json(silent=True) or {}

    foto_url = (data.get('foto_url') or '').strip()[:URL_MAX]
    bio = (data.get('bio') or '').strip()[:600]
    estudios = (data.get('estudios') or '').strip()[:300]
    especialidades = (data.get('especialidades') or '').strip()[:200]
    intereses = (data.get('intereses') or '').strip()[:200]

    if foto_url and not (foto_url.startswith('https://') or foto_url.startswith('http://')):
        return jsonify({'ok': False, 'error': 'El enlace de la foto debe empezar con http:// o https://'}), 400

    with get_db() as conn:
        db_execute(conn, '''
            UPDATE usuarios SET foto_url = %s, bio = %s, estudios = %s,
                especialidades = %s, intereses = %s WHERE id = %s
        ''', (foto_url, bio, estudios, especialidades, intereses, uid))

    return jsonify({'ok': True})
