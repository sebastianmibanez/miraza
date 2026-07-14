#!/usr/bin/env python3
"""Administración de cuentas de Miraza.

Corre contra la misma base que la app: si DATABASE_URL está definida usa
PostgreSQL (producción), si no usa el SQLite local.

Comandos:
    python manage.py crear-usuario [--nombre N --apellido A --email E --rol R [--password P]]
    python manage.py listar-usuarios
    python manage.py cambiar-password <email> [--password P]
    python manage.py activar <email>
    python manage.py desactivar <email>
    python manage.py purgar-usuarios-demo

Lo que no pases por flag se pregunta de forma interactiva.
Si omites --password, se genera una contraseña segura y se muestra una sola vez.

En Render: Dashboard → tu servicio → pestaña "Shell" → correr el comando ahí.
"""
import argparse
import getpass
import re
import secrets
import string
import sys
from datetime import datetime, timezone

from werkzeug.security import generate_password_hash

from app_db import get_db, db_execute, init_db, USE_POSTGRES

ROLES = {
    'paes':       'Preparación PAES',
    'nem':        'Mejora tu NEM',
    'nivelacion': 'Nivelación de Estudios',
    'especial':   'Clases Especializadas',
    'teacher':    'Profesora / Docente',
}

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
MIN_PASSWORD = 8

DEMO_EMAILS = [
    'florencia.paes@miraza.cl',
    'wilson.nem@miraza.cl',
    'anacleto.niv@miraza.cl',
    'tadeo.esp@miraza.cl',
    'profevale@miraza.cl',
]


class Error(Exception):
    """Error esperable: se muestra limpio, sin traceback."""


def _now():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')


def _generar_password(largo=14):
    alfabeto = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alfabeto) for _ in range(largo))


def _preguntar(texto, validar=None):
    """Pide un valor por consola hasta que sea válido."""
    while True:
        try:
            valor = input(texto).strip()
        except EOFError:
            raise Error('No hay entrada disponible. Pasa el dato por flag (ej: --nombre).')
        if not valor:
            print('  No puede quedar vacío.')
            continue
        if validar:
            error = validar(valor)
            if error:
                print(f'  {error}')
                continue
        return valor


def _validar_email(valor):
    return None if EMAIL_REGEX.match(valor) else 'Email inválido.'


def _validar_rol(valor):
    return None if valor in ROLES else f'Rol inválido. Elige uno de: {", ".join(ROLES)}'


def _validar_password(valor):
    if len(valor) < MIN_PASSWORD:
        return f'La contraseña debe tener al menos {MIN_PASSWORD} caracteres.'
    return None


def _resolver_password(args):
    """Devuelve (password, fue_generada).

    Orden: --password explícita > --generar-password > prompt (si hay terminal)
    > generar. El chequeo de isatty evita que el prompt cuelgue cuando esto
    corre en un script o sin terminal.
    """
    if args.password:
        error = _validar_password(args.password)
        if error:
            raise Error(error)
        return args.password, False

    if args.generar_password or not sys.stdin.isatty():
        return _generar_password(), True

    try:
        escrita = getpass.getpass('Contraseña (Enter = generar una segura): ')
    except (EOFError, OSError):
        return _generar_password(), True

    if not escrita:
        return _generar_password(), True

    error = _validar_password(escrita)
    if error:
        raise Error(error)
    return escrita, False


def _mostrar_password(password, email):
    print(f'\n  Contraseña de {email}: {password}')
    print('  Entrégasela por un canal privado. No vuelve a mostrarse.\n')


def _buscar_por_email(conn, email):
    fila = db_execute(conn, 'SELECT id, nombre, apellido FROM usuarios WHERE email = %s', (email,)).fetchone()
    if not fila:
        raise Error(f'No existe una cuenta con {email}.')
    return fila


# ── Comandos ──────────────────────────────────────────────────

def crear_usuario(args):
    print(f'\n── Crear cuenta ── (base: {"PostgreSQL" if USE_POSTGRES else "SQLite local"})\n')

    nombre = args.nombre or _preguntar('Nombre: ')
    apellido = args.apellido or _preguntar('Apellido: ')

    if args.email:
        error = _validar_email(args.email)
        if error:
            raise Error(error)
        email = args.email
    else:
        email = _preguntar('Email: ', _validar_email)
    email = email.strip().lower()

    if args.rol:
        error = _validar_rol(args.rol)
        if error:
            raise Error(error)
        rol = args.rol
    else:
        print('\nRoles disponibles:')
        for clave, etiqueta in ROLES.items():
            print(f'  {clave:<12} {etiqueta}')
        rol = _preguntar('\nRol: ', _validar_rol)

    password, generada = _resolver_password(args)

    with get_db() as conn:
        existe = db_execute(conn, 'SELECT id FROM usuarios WHERE email = %s', (email,)).fetchone()
        if existe:
            raise Error(f'Ya existe una cuenta con {email}.')

        db_execute(conn, '''
            INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, activo, creado_en)
            VALUES (%s, %s, %s, %s, %s, 1, %s)
        ''', (nombre, apellido, email, generate_password_hash(password), rol, _now()))

    print(f'\n✓ Cuenta creada: {nombre} {apellido} <{email}> — rol {rol}')
    if generada:
        _mostrar_password(password, email)


def listar_usuarios(args):
    with get_db() as conn:
        filas = db_execute(conn, '''
            SELECT id, nombre, apellido, email, rol, activo, creado_en
            FROM usuarios ORDER BY rol, apellido
        ''').fetchall()

    if not filas:
        print('\nNo hay cuentas creadas todavía.\n')
        return

    print(f'\n{"ID":<5} {"NOMBRE":<25} {"EMAIL":<32} {"ROL":<12} {"ESTADO":<12}')
    print('─' * 90)
    for f in filas:
        nombre = f'{f["nombre"]} {f["apellido"]}'
        estado = 'activo' if f['activo'] else 'DESACTIVADO'
        print(f'{f["id"]:<5} {nombre:<25} {f["email"]:<32} {f["rol"]:<12} {estado:<12}')
    print(f'\nTotal: {len(filas)} cuenta(s).\n')


def cambiar_password(args):
    email = args.email.strip().lower()
    with get_db() as conn:
        _buscar_por_email(conn, email)
        password, generada = _resolver_password(args)
        db_execute(conn, 'UPDATE usuarios SET password_hash = %s WHERE email = %s',
                   (generate_password_hash(password), email))

    print(f'\n✓ Contraseña actualizada para {email}.')
    if generada:
        _mostrar_password(password, email)


def cambiar_estado(args):
    email = args.email.strip().lower()
    activo = 1 if args.comando == 'activar' else 0
    with get_db() as conn:
        _buscar_por_email(conn, email)
        db_execute(conn, 'UPDATE usuarios SET activo = %s WHERE email = %s', (activo, email))

    print(f'\n✓ Cuenta {email} {"activada" if activo else "desactivada"}.\n')


def purgar_usuarios_demo(args):
    """Borra las cuentas de demo con contraseña conocida, por si alguna quedó viva."""
    borradas = []
    with get_db() as conn:
        for email in DEMO_EMAILS:
            fila = db_execute(conn, 'SELECT id FROM usuarios WHERE email = %s', (email,)).fetchone()
            if fila:
                db_execute(conn, 'DELETE FROM sesiones_log WHERE usuario_id = %s', (fila['id'],))
                db_execute(conn, 'DELETE FROM usuarios WHERE email = %s', (email,))
                borradas.append(email)

    if borradas:
        print('\n✓ Cuentas de demo eliminadas:')
        for email in borradas:
            print(f'    {email}')
        print()
    else:
        print('\n✓ No había cuentas de demo. Nada que hacer.\n')


# ── CLI ───────────────────────────────────────────────────────

def build_parser():
    parser = argparse.ArgumentParser(
        prog='manage.py',
        description='Administración de cuentas de Miraza.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest='comando', required=True)

    crear = sub.add_parser('crear-usuario', help='Crear una cuenta nueva.')
    crear.add_argument('--nombre')
    crear.add_argument('--apellido')
    crear.add_argument('--email')
    crear.add_argument('--rol', choices=list(ROLES))
    crear.add_argument('--password', help=f'Mínimo {MIN_PASSWORD} caracteres.')
    crear.add_argument('--generar-password', action='store_true',
                       help='Generar una contraseña segura sin preguntar.')
    crear.set_defaults(func=crear_usuario)

    listar = sub.add_parser('listar-usuarios', help='Listar todas las cuentas.')
    listar.set_defaults(func=listar_usuarios)

    passwd = sub.add_parser('cambiar-password', help='Cambiar la contraseña de una cuenta.')
    passwd.add_argument('email')
    passwd.add_argument('--password', help=f'Mínimo {MIN_PASSWORD} caracteres.')
    passwd.add_argument('--generar-password', action='store_true',
                        help='Generar una contraseña segura sin preguntar.')
    passwd.set_defaults(func=cambiar_password)

    for nombre_cmd, ayuda in [('activar', 'Reactivar una cuenta.'), ('desactivar', 'Bloquear el acceso de una cuenta.')]:
        p = sub.add_parser(nombre_cmd, help=ayuda)
        p.add_argument('email')
        p.set_defaults(func=cambiar_estado)

    purgar = sub.add_parser('purgar-usuarios-demo', help='Borrar las cuentas de demo del repo.')
    purgar.set_defaults(func=purgar_usuarios_demo)

    return parser


def main():
    args = build_parser().parse_args()
    init_db()
    try:
        args.func(args)
    except Error as e:
        print(f'\n✗ {e}\n', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
