"""Utilidades de base de datos — usadas por app.py y todos los blueprints.

PostgreSQL cuando existe DATABASE_URL (producción, Neon).
SQLite cuando no existe (desarrollo local).

Las queries se escriben SIEMPRE con placeholders %s (estilo PostgreSQL);
db_execute las traduce a ? cuando corre sobre SQLite.
"""
import os
import sqlite3
from contextlib import contextmanager

DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
USE_POSTGRES = bool(DATABASE_URL)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'miraza.db')

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras


@contextmanager
def get_db():
    """Abre una conexión nueva por uso.

    No usamos pool a propósito: Neon suspende la base tras unos minutos de
    inactividad y las conexiones en pool quedan muertas. Conectar por request
    cuesta unos ms más y evita ese fallo por completo.
    """
    if USE_POSTGRES:
        conn = psycopg2.connect(
            DATABASE_URL,
            cursor_factory=psycopg2.extras.RealDictCursor,
            connect_timeout=10,
        )
    else:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys = ON')

    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_execute(conn, query, params=None):
    """Ejecuta una query. Acepta placeholders %s en ambos motores."""
    if not USE_POSTGRES:
        query = query.replace('%s', '?')
    cur = conn.cursor()
    cur.execute(query, params or ())
    return cur


def init_db():
    # Único punto donde el DDL difiere entre motores.
    pk = 'SERIAL PRIMARY KEY' if USE_POSTGRES else 'INTEGER PRIMARY KEY AUTOINCREMENT'

    with get_db() as conn:
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS inscripciones (
                id {pk},
                nombre TEXT NOT NULL, apellido TEXT NOT NULL,
                email TEXT NOT NULL, telefono TEXT NOT NULL,
                curso TEXT NOT NULL, materias TEXT NOT NULL,
                mensaje TEXT DEFAULT '', fecha TEXT NOT NULL, ip TEXT DEFAULT ''
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_inscripciones_email ON inscripciones(email)
        ''')

        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS usuarios (
                id {pk},
                nombre TEXT NOT NULL, apellido TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                rol TEXT NOT NULL CHECK(rol IN ('paes','nem','nivelacion','especial','teacher')),
                activo INTEGER NOT NULL DEFAULT 1,
                creado_en TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)
        ''')

        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS sesiones_log (
                id {pk},
                usuario_id INTEGER NOT NULL,
                ip TEXT NOT NULL,
                user_agent TEXT DEFAULT '',
                pais TEXT DEFAULT '',
                ciudad TEXT DEFAULT '',
                fuera_de_chile INTEGER NOT NULL DEFAULT 0,
                timestamp TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_log(usuario_id)
        ''')
