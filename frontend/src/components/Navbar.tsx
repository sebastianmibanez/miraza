import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoImg from '../assets/miraza.png'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    document.body.style.overflow = ''
  }, [location])

  const toggleMenu = () => {
    setMenuOpen(prev => {
      document.body.style.overflow = !prev ? 'hidden' : ''
      return !prev
    })
  }

  const closeMenu = () => {
    setMenuOpen(false)
    document.body.style.overflow = ''
  }

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-logo">
          <img src={logoImg} alt="Miraza" height={88} />
        </Link>
        <ul className="nav-links">
          <li><Link to="/quienes-somos" className={isActive('/quienes-somos') ? 'active' : ''}>Quiénes Somos</Link></li>
          <li><Link to="/planes" className={isActive('/planes') ? 'active' : ''}>Planes</Link></li>
          <li><Link to="/aranceles" className={isActive('/aranceles') ? 'active' : ''}>Aranceles</Link></li>
          <li><Link to="/apoyo" className={isActive('/apoyo') ? 'active' : ''}>Apoyo Sicoped.</Link></li>
          <li><Link to="/testimonios" className={isActive('/testimonios') ? 'active' : ''}>Testimonios</Link></li>
          <li><Link to="/contacto" className={isActive('/contacto') ? 'active' : ''}>Contáctanos</Link></li>
        </ul>
        <div className="nav-right">
          <Link to="/contacto" className="nav-cta">Inscríbete</Link>
          <button
            className={`hamburger${menuOpen ? ' active' : ''}`}
            onClick={toggleMenu}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Menú móvil">
        <Link to="/quienes-somos" onClick={closeMenu}>Quiénes Somos</Link>
        <Link to="/planes" onClick={closeMenu}>Planes</Link>
        <Link to="/aranceles" onClick={closeMenu}>Aranceles</Link>
        <Link to="/apoyo" onClick={closeMenu}>Apoyo Sicopedagógico</Link>
        <Link to="/testimonios" onClick={closeMenu}>Testimonios</Link>
        <Link to="/contacto" onClick={closeMenu}>Contáctanos</Link>
      </div>
    </>
  )
}

export default Navbar
