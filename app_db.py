"""Utilidades de base de datos — usadas por app.py y todos los blueprints.

PostgreSQL cuando existe DATABASE_URL (producción, Neon).
SQLite cuando no existe (desarrollo local).

Las queries se escriben SIEMPRE con placeholders %s (estilo PostgreSQL);
db_execute las traduce a ? cuando corre sobre SQLite.
"""
import os
import sqlite3
import time
from collections import defaultdict
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
    """Ejecuta una query. Acepta placeholders %s en ambos motores.

    Los dos motores quieren cosas distintas cuando no hay parámetros:

    - psycopg2 interpola siempre que reciba algo distinto de None. Con una tupla
      vacía trataría cualquier % literal de la query (un LIKE '%algo%') como un
      placeholder y reventaría. Necesita None.
    - sqlite3 no acepta None: exige una secuencia. Necesita ().
    """
    cur = conn.cursor()

    if USE_POSTGRES:
        cur.execute(query, params if params else None)
    else:
        cur.execute(query.replace('%s', '?'), params or ())

    return cur


# ── Rate limiting (en memoria) ─────────────────────────────────
# ponytail: el store vive en cada worker de gunicorn (2 workers ⇒ el límite
# efectivo se duplica). Suficiente a esta escala; si algún día importa de
# verdad, moverlo a la BD o a Redis.
_rate_store = defaultdict(list)


def is_rate_limited(key, limit=10, window=3600):
    """True si `key` ya agotó sus `limit` intentos en los últimos `window` seg."""
    now = time.time()
    _rate_store[key] = [t for t in _rate_store[key] if now - t < window]
    if len(_rate_store[key]) >= limit:
        return True
    _rate_store[key].append(now)
    return False


GMAIL_DOMINIOS = ('gmail.com', 'googlemail.com')

# ── Roles ─────────────────────────────────────────────────────
# admin   → fundadoras. Aprueban inscripciones, crean cuentas y ramos, asignan
#           profesoras y meten alumnos a los ramos. Definen el horario, que es
#           lo que determina cuánto se le paga a cada profesora.
# teacher → dictan. Ven sus ramos y sus alumnos, publican avisos en sus ramos.
#           NO deciden quién entra a su ramo ni cuántas horas dictan: eso sería
#           dejarlas fijar su propio sueldo.
ROLES_ALUMNO = ('paes', 'nem', 'nivelacion', 'especial')
ROLES_STAFF = ('teacher', 'admin')
ROLES = ROLES_ALUMNO + ROLES_STAFF

DIAS = ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
TIPOS_CLASE = ('clase', 'ensayo', 'tutoría', 'apoyo')
TIPOS_AVISO = ('info', 'aviso', 'urgente')
TIPOS_MATERIAL = ('video', 'documento')


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


def _soltar_check_de_rol(conn):
    """Quita el CHECK viejo de usuarios.rol, que no conocía el rol 'admin'.

    Los roles se validan en Python (ROLES), que es donde ya se validaban de
    todas formas. Mantener además un CHECK en la tabla obliga a una migración
    de esquema cada vez que se agrega un rol, y en SQLite eso significa
    reconstruir la tabla entera.
    """
    if USE_POSTGRES:
        db_execute(conn, 'ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check')
        return

    # SQLite no permite soltar un CHECK: hay que rehacer la tabla.
    cur = conn.cursor()
    cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'")
    fila = cur.fetchone()
    if not fila or 'CHECK' not in (fila[0] or ''):
        return

    db_execute(conn, '''
        CREATE TABLE usuarios_nueva (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL, apellido TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            rol TEXT NOT NULL,
            activo INTEGER NOT NULL DEFAULT 1,
            creado_en TEXT NOT NULL,
            google_sub TEXT,
            email_norm TEXT
        )
    ''')
    db_execute(conn, '''
        INSERT INTO usuarios_nueva (id, nombre, apellido, email, password_hash, rol, activo, creado_en)
        SELECT id, nombre, apellido, email, password_hash, rol, activo, creado_en FROM usuarios
    ''')
    db_execute(conn, 'DROP TABLE usuarios')
    db_execute(conn, 'ALTER TABLE usuarios_nueva RENAME TO usuarios')


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

        # Sin CHECK sobre rol: los roles se validan en Python (ROLES). Un CHECK
        # aquí obligaría a migrar el esquema cada vez que se agregue un rol.
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS usuarios (
                id {pk},
                nombre TEXT NOT NULL, apellido TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                rol TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1,
                creado_en TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)
        ''')

        _soltar_check_de_rol(conn)

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

        # Perfil público de la profesora en la vitrina: foto (URL a una imagen
        # externa, no la hosteamos) y bio corta.
        _agregar_columna(conn, 'usuarios', 'foto_url', "TEXT DEFAULT ''")
        _agregar_columna(conn, 'usuarios', 'bio', "TEXT DEFAULT ''")

        # Ficha tipo CV al costado del perfil público: formación, especialidades
        # (chips, separadas por coma) e intereses. Todo opcional.
        _agregar_columna(conn, 'usuarios', 'estudios', "TEXT DEFAULT ''")
        _agregar_columna(conn, 'usuarios', 'especialidades', "TEXT DEFAULT ''")
        _agregar_columna(conn, 'usuarios', 'intereses', "TEXT DEFAULT ''")

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

        # ── Lo que antes eran constantes inventadas en dashboard.py ──────────

        # Un ramo tiene UNA profesora. profesor_id puede quedar NULL mientras
        # todavía no se le asigna a nadie.
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS ramos (
                id {pk},
                nombre TEXT NOT NULL,
                plan TEXT NOT NULL,
                color TEXT NOT NULL DEFAULT '#1B4DB8',
                profesor_id INTEGER,
                activo INTEGER NOT NULL DEFAULT 1,
                creado_en TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_ramos_profesor ON ramos(profesor_id)
        ''')

        # Sala de Google Meet del ramo. Sin esto el botón "Entrar a la clase"
        # del panel del alumno apuntaba a '#' y no llevaba a ninguna parte.
        _agregar_columna(conn, 'ramos', 'meet_url', "TEXT DEFAULT ''")

        # Quién está en qué ramo. Lo decide SIEMPRE un admin: es una decisión de
        # negocio (define las horas de la profesora, y por tanto su sueldo).
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS ramo_alumnos (
                id {pk},
                ramo_id INTEGER NOT NULL,
                alumno_id INTEGER NOT NULL,
                creado_en TEXT NOT NULL,
                UNIQUE (ramo_id, alumno_id)
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_ramo_alumnos_ramo ON ramo_alumnos(ramo_id)
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_ramo_alumnos_alumno ON ramo_alumnos(alumno_id)
        ''')

        # El horario. De acá salen tanto el horario de la profesora como el del
        # alumno: son la misma tabla vista desde dos lados.
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS clases (
                id {pk},
                ramo_id INTEGER NOT NULL,
                dia TEXT NOT NULL,
                hora TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'clase',
                creado_en TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_clases_ramo ON clases(ramo_id)
        ''')

        # ramo_id NULL = aviso general, lo ve todo Miraza.
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS avisos (
                id {pk},
                titulo TEXT NOT NULL,
                texto TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'info',
                ramo_id INTEGER,
                autor_id INTEGER NOT NULL,
                fecha TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_avisos_ramo ON avisos(ramo_id)
        ''')

        # Vitrina: cada profesora sube su propio material (videos demo, cursos,
        # shorts) para mostrarse. El video NO se hostea acá: url apunta a YouTube
        # / Vimeo / Drive y solo guardamos el link.
        #   tipo -> video | documento
        db_execute(conn, f'''
            CREATE TABLE IF NOT EXISTS materiales (
                id {pk},
                autor_id INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                descripcion TEXT DEFAULT '',
                tipo TEXT NOT NULL DEFAULT 'video',
                url TEXT NOT NULL,
                creado_en TEXT NOT NULL
            )
        ''')
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_materiales_autor ON materiales(autor_id)
        ''')

        # Gate de aprobación: el material de las profesoras externas queda oculto
        # hasta que dirección lo apruebe. DEFAULT 'aprobado' para no ocultar lo
        # que ya estaba subido antes de este cambio; lo nuevo de un teacher entra
        # 'pendiente' (lo decide materiales.py según el rol).
        #   estado -> pendiente | aprobado | rechazado
        _agregar_columna(conn, 'materiales', 'estado', "TEXT NOT NULL DEFAULT 'aprobado'")
        db_execute(conn, '''
            CREATE INDEX IF NOT EXISTS idx_materiales_estado ON materiales(estado)
        ''')
