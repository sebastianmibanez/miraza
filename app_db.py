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


GMAIL_DOMINIOS = ('gmail.com', 'googlemail.com')


def normalizar_email(email: str) -> str:
    """Forma canónica de un correo, para comparar cuentas.

    Gmail ignora los puntos del nombre y todo lo que venga después de un '+':
    juan.perez+preu@gmail.com y juanperez@gmail.com son el MISMO buzón, y el
    token de Google trae solo una de esas formas. Sin esto, alguien que se
    inscribe escribiendo su correo con puntos y luego entra con Google no
    calzaría con su propia cuenta, y quedaría encerrado afuera.

    Solo se aplica a Gmail: en otros dominios los puntos sí distinguen buzones,
    y normalizarlos haría que dos personas distintas colisionaran.
    """
    email = (email or '').strip().lower()
    if '@' not in email:
        return email

    usuario, dominio = email.rsplit('@', 1)
    if dominio in GMAIL_DOMINIOS:
        usuario = usuario.split('+', 1)[0].replace('.', '')
        dominio = 'gmail.com'
    return f'{usuario}@{dominio}'


def _columna_existe(conn, tabla, columna):
    """PostgreSQL soporta ADD COLUMN IF NOT EXISTS; SQLite no. Preguntamos antes."""
    if USE_POSTGRES:
        fila = db_execute(conn, '''
            SELECT 1 FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
        ''', (tabla, columna)).fetchone()
        return fila is not None

    cur = conn.cursor()
    cur.execute(f'PRAGMA table_info({tabla})')
    return any(fila[1] == columna for fila in cur.fetchall())


def _agregar_columna(conn, tabla, columna, definicion):
    if not _columna_existe(conn, tabla, columna):
        db_execute(conn, f'ALTER TABLE {tabla} ADD COLUMN {columna} {definicion}')


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

        # Une las dos mitades de la app: hasta ahora una inscripción moría en su
        # tabla y la cuenta del alumno había que tipearla a mano en otro lado.
        #   estado     -> pendiente | aprobada | descartada
        #   usuario_id -> la cuenta creada a partir de esta inscripción
        _agregar_columna(conn, 'inscripciones', 'estado', "TEXT NOT NULL DEFAULT 'pendiente'")
        _agregar_columna(conn, 'inscripciones', 'usuario_id', 'INTEGER')

        # Se pone en 1 cuando la persona se inscribió con Google: entonces el
        # correo está probado, no es lo que alguien tipeó en un formulario.
        _agregar_columna(conn, 'inscripciones', 'email_verificado', 'INTEGER NOT NULL DEFAULT 0')

        # El identificador estable de la cuenta de Google (claim 'sub'). Queda
        # registrado al primer login con Google. El match se hace por correo,
        # porque la cuenta ya existe antes de que la persona entre.
        _agregar_columna(conn, 'usuarios', 'google_sub', 'TEXT')

        # Forma canónica del correo. Es la que se usa para buscar la cuenta al
        # iniciar sesión, para que juan.perez@gmail.com y juanperez@gmail.com
        # lleguen a la misma cuenta en vez de dejar al alumno afuera.
        _agregar_columna(conn, 'usuarios', 'email_norm', 'TEXT')

        # Rellena las cuentas que ya existían antes de esta columna.
        pendientes = db_execute(conn, '''
            SELECT id, email FROM usuarios WHERE email_norm IS NULL OR email_norm = ''
        ''').fetchall()
        for fila in pendientes:
            db_execute(conn, 'UPDATE usuarios SET email_norm = %s WHERE id = %s',
                       (normalizar_email(fila['email']), fila['id']))

        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_usuarios_email_norm ON usuarios(email_norm)
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_inscripciones_estado ON inscripciones(estado)
        ''')
