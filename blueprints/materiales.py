"""Vitrina: cada profesora sube y administra SU propio material.

El video no se hostea acá — se guarda solo el link (YouTube / Vimeo / Drive).
Autoservicio para staff (teacher y admin): cada quien ve y borra lo suyo.

Ojo: todavía no hay grilla pública ni gate de aprobación. Se agrega cuando
entren profesoras externas (los ~90 postulantes); por ahora son 2 dueños de
confianza subiendo lo suyo.
ponytail: sin estado/aprobación, agregar columna 'estado' + vista admin cuando
haya autores externos que curar.
"""
import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from app_db import get_db, db_execute, TIPOS_MATERIAL
from blueprints.auth import roles_required

materiales_bp = Blueprint('materiales', __name__)
logger = logging.getLogger(__name__)

URL_MAX = 500


def _ahora():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')


@materiales_bp.route('/api/materiales', methods=['GET'])
def vitrina():
    """Grilla pública: todo el material, con el nombre de quien lo subió.

    Sin auth — es la vitrina que ve cualquier visitante. No se expone el correo.
    ponytail: cuando haya autores externos, filtrar por estado='aprobada'.
    """
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT m.id, m.titulo, m.descripcion, m.tipo, m.url, m.creado_en,
                   m.autor_id, u.nombre AS autor_nombre, u.apellido AS autor_apellido,
                   u.foto_url AS autor_foto
            FROM materiales m
            JOIN usuarios u ON u.id = m.autor_id
            ORDER BY m.id DESC
        ''').fetchall()
    return jsonify({'ok': True, 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/profes/<int:prof_id>', methods=['GET'])
def perfil_publico(prof_id):
    """Perfil público de una profesora: sus datos + su material. Sin auth."""
    with get_db() as conn:
        prof = db_execute(conn, '''
            SELECT id, nombre, apellido, foto_url, bio
            FROM usuarios WHERE id = %s AND rol IN ('teacher','admin')
        ''', (prof_id,)).fetchone()
        if not prof:
            return jsonify({'ok': False, 'error': 'Profesor no encontrado'}), 404

        filas = db_execute(conn, '''
            SELECT id, titulo, descripcion, tipo, url, creado_en
            FROM materiales WHERE autor_id = %s ORDER BY id DESC
        ''', (prof_id,)).fetchall()

    return jsonify({'ok': True, 'profesor': dict(prof), 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/materiales/mios', methods=['GET'])
@roles_required('teacher', 'admin')
def mis_materiales():
    uid = g.current_user['sub']
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT id, titulo, descripcion, tipo, url, creado_en
            FROM materiales WHERE autor_id = %s ORDER BY id DESC
        ''', (uid,)).fetchall()
    return jsonify({'ok': True, 'materiales': [dict(f) for f in filas]})


@materiales_bp.route('/api/materiales', methods=['POST'])
@roles_required('teacher', 'admin')
def crear_material():
    uid = g.current_user['sub']
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
        db_execute(conn, '''
            INSERT INTO materiales (autor_id, titulo, descripcion, tipo, url, creado_en)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (uid, titulo, descripcion, tipo, url, _ahora()))

    return jsonify({'ok': True})


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


# ── Mi perfil (foto + bio para la vitrina) ────────────────────

@materiales_bp.route('/api/mi-perfil', methods=['GET'])
@roles_required('teacher', 'admin')
def mi_perfil():
    uid = g.current_user['sub']
    with get_db() as conn:
        fila = db_execute(conn,
            'SELECT nombre, apellido, foto_url, bio FROM usuarios WHERE id = %s', (uid,)
        ).fetchone()
    return jsonify({'ok': True, 'perfil': dict(fila)})


@materiales_bp.route('/api/mi-perfil', methods=['PATCH'])
@roles_required('teacher', 'admin')
def editar_mi_perfil():
    uid = g.current_user['sub']
    data = request.get_json(silent=True) or {}

    foto_url = (data.get('foto_url') or '').strip()[:URL_MAX]
    bio = (data.get('bio') or '').strip()[:600]

    if foto_url and not (foto_url.startswith('https://') or foto_url.startswith('http://')):
        return jsonify({'ok': False, 'error': 'El enlace de la foto debe empezar con http:// o https://'}), 400

    with get_db() as conn:
        db_execute(conn, 'UPDATE usuarios SET foto_url = %s, bio = %s WHERE id = %s',
                   (foto_url, bio, uid))

    return jsonify({'ok': True})
