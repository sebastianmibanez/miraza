"""Shared database utilities — imported by app.py and all blueprints."""
import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'miraza.db')


@contextmanager
def get_db():
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
    """Accepts %s-style placeholders (PostgreSQL-compatible), converts to ? for SQLite."""
    query = query.replace('%s', '?')
    cur = conn.cursor()
    cur.execute(query, params or ())
    return cur


def init_db():
    with get_db() as conn:
        # inscripciones (existing)
        db_execute(conn, '''
            CREATE TABLE IF NOT EXISTS inscripciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL, apellido TEXT NOT NULL,
                email TEXT NOT NULL, telefono TEXT NOT NULL,
                curso TEXT NOT NULL, materias TEXT NOT NULL,
                mensaje TEXT DEFAULT '', fecha TEXT NOT NULL, ip TEXT DEFAULT ''
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_inscripciones_email ON inscripciones(email)
        ''')

        # usuarios
        db_execute(conn, '''
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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

        # sesiones_log
        db_execute(conn, '''
            CREATE TABLE IF NOT EXISTS sesiones_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
