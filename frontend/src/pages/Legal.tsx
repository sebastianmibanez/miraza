import './Legal.css'

const WHATSAPP = 'https://wa.me/56933325788'

export default function Legal() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-tag">Legal</div>
          <h1>Privacidad y Términos</h1>
          <p>Cómo cuidamos tus datos y las reglas para usar Miraza.</p>
        </div>
      </section>

      <section className="legal">
        <p className="legal-updated">Última actualización: agosto de 2026</p>

        <nav className="legal-toc" aria-label="Contenido">
          <a href="#privacidad">Política de Privacidad</a>
          <a href="#terminos">Términos de Uso</a>
        </nav>

        {/* ── PRIVACIDAD ── */}
        <article id="privacidad" className="legal-block">
          <h2>Política de Privacidad</h2>
          <p>
            En Miraza Preuniversitario ("Miraza") cuidamos tus datos personales. Esta política
            explica qué información recogemos, para qué la usamos y qué derechos tienes sobre ella,
            en el marco de la Ley N.º 19.628 sobre Protección de la Vida Privada de Chile.
          </p>

          <h3>Qué información recopilamos</h3>
          <ul>
            <li>
              <strong>De quienes se inscriben:</strong> nombre, apellido, correo electrónico,
              teléfono, y el curso o plan de interés que indican en el formulario.
            </li>
            <li>
              <strong>De los profesores:</strong> nombre, correo, y la información que ellos mismos
              publican en su perfil (foto, biografía, especialidades, formación y material de muestra).
            </li>
            <li>
              <strong>Datos técnicos y de sesión:</strong> al iniciar sesión registramos la dirección
              IP y datos básicos de la conexión con fines de seguridad. Usamos el almacenamiento local
              de tu navegador para mantener tu sesión y tus preferencias (como el tema de color).
            </li>
          </ul>

          <h3>Para qué usamos tus datos</h3>
          <p>
            Usamos la información para gestionar las clases y el acompañamiento, mostrar los perfiles
            de los profesores en la vitrina pública, y comunicarnos contigo respecto de tu inscripción
            o tus clases. <strong>No vendemos tus datos ni los usamos para publicidad de terceros.</strong>
          </p>

          <h3>Con quién se comparten</h3>
          <p>
            Solo con los proveedores necesarios para que la plataforma funcione: Google (inicio de
            sesión), los servicios de alojamiento y base de datos donde vive la aplicación, el servicio
            de envío de correos de aviso, y las plataformas donde se alojan los videos que un profesor
            decida enlazar (por ejemplo YouTube o Google Drive). No compartimos tus datos con nadie más.
          </p>

          <h3>Menores de edad</h3>
          <p>
            Parte de nuestros alumnos son menores de 18 años. Si el alumno es menor de edad, su
            inscripción y uso de Miraza deben realizarse con el conocimiento y la autorización de su
            madre, padre o apoderado, quienes pueden ejercer los derechos sobre esos datos en su nombre.
          </p>

          <h3>Tus derechos</h3>
          <p>
            Puedes solicitar en cualquier momento acceder a tus datos, corregirlos si están erróneos,
            eliminarlos, u oponerte a que los sigamos usando. Los profesores pueden además pedir que su
            perfil deje de mostrarse en la vitrina. Para ejercer estos derechos, escríbenos por{' '}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a> y lo gestionamos.
          </p>

          <h3>Seguridad</h3>
          <p>
            Aplicamos medidas razonables para proteger tu información: conexión cifrada (HTTPS),
            contraseñas guardadas de forma cifrada, y acceso restringido a las cuentas del equipo.
            Ningún sistema es infalible, pero trabajamos para reducir los riesgos.
          </p>

          <h3>Cambios a esta política</h3>
          <p>
            Podemos actualizar esta política cuando sea necesario. Publicaremos la versión vigente en
            esta página con su fecha de última actualización.
          </p>
        </article>

        {/* ── TÉRMINOS ── */}
        <article id="terminos" className="legal-block">
          <h2>Términos de Uso</h2>
          <p>
            Al usar Miraza aceptas estos términos. Si no estás de acuerdo con ellos, por favor no uses
            la plataforma.
          </p>

          <h3>Qué es Miraza</h3>
          <p>
            Miraza es un preuniversitario en línea (preparación PAES, nivelación de estudios y apoyo
            sicopedagógico) que además ofrece una vitrina donde los profesores del equipo presentan su
            perfil y su material.
          </p>

          <h3>Cuentas</h3>
          <p>
            Las cuentas las crea Miraza; no hay registro automático. Eres responsable de mantener la
            confidencialidad de tu acceso y de la actividad que ocurra en tu cuenta. No compartas tus
            credenciales ni suplantes a otra persona.
          </p>

          <h3>Uso aceptable</h3>
          <p>
            No puedes usar Miraza para fines ilícitos, ni subir contenido que no te pertenezca o para el
            que no tengas permiso, ni intentar vulnerar la seguridad de la plataforma o de otras cuentas.
          </p>

          <h3>Contenido de los profesores</h3>
          <p>
            Cada profesor es responsable del material que publica (videos, documentos y enlaces). Miraza
            revisa el material antes de mostrarlo públicamente, pero no garantiza su exactitud ni su
            disponibilidad permanente. Los videos y documentos se alojan en servicios de terceros
            (YouTube, Drive u otros), sobre los que Miraza no tiene control.
          </p>

          <h3>Disponibilidad y garantías</h3>
          <p>
            El servicio se ofrece "tal cual". Hacemos lo posible por mantenerlo disponible y funcionando,
            pero no garantizamos que esté libre de interrupciones o errores en todo momento.
          </p>

          <h3>Cambios</h3>
          <p>
            Podemos modificar o suspender partes del servicio, y actualizar estos términos. Los cambios
            relevantes se reflejarán en esta página.
          </p>

          <h3>Ley aplicable</h3>
          <p>
            Estos términos se rigen por las leyes de la República de Chile.
          </p>
        </article>

        <p className="legal-contact">
          ¿Dudas sobre tu privacidad o quieres ejercer tus derechos sobre tus datos? Escríbenos por{' '}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a> y te ayudamos.
        </p>
      </section>
    </>
  )
}
