import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../assets/miraza.png';
import './Navbar.css';
function Navbar() {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        setMenuOpen(false);
        document.body.style.overflow = '';
    }, [location]);
    const toggleMenu = () => {
        setMenuOpen(prev => {
            document.body.style.overflow = !prev ? 'hidden' : '';
            return !prev;
        });
    };
    const closeMenu = () => {
        setMenuOpen(false);
        document.body.style.overflow = '';
    };
    return (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "navbar", children: [_jsx(Link, { to: "/", className: "nav-logo", children: _jsx("img", { src: logoImg, alt: "Miraza", height: 88 }) }), _jsxs("ul", { className: "nav-links", children: [_jsx("li", { children: _jsx(Link, { to: "/quienes-somos", className: isActive('/quienes-somos') ? 'active' : '', children: "Qui\u00E9nes Somos" }) }), _jsx("li", { children: _jsx(Link, { to: "/planes", className: isActive('/planes') ? 'active' : '', children: "Planes" }) }), _jsx("li", { children: _jsx(Link, { to: "/aranceles", className: isActive('/aranceles') ? 'active' : '', children: "Aranceles" }) }), _jsx("li", { children: _jsx(Link, { to: "/apoyo", className: isActive('/apoyo') ? 'active' : '', children: "Apoyo Sicoped." }) }), _jsx("li", { children: _jsx(Link, { to: "/testimonios", className: isActive('/testimonios') ? 'active' : '', children: "Testimonios" }) }), _jsx("li", { children: _jsx(Link, { to: "/contacto", className: isActive('/contacto') ? 'active' : '', children: "Cont\u00E1ctanos" }) })] }), _jsxs("div", { className: "nav-right", children: [_jsx(Link, { to: "/contacto", className: "nav-cta", children: "Inscr\u00EDbete" }), _jsxs("button", { className: `hamburger${menuOpen ? ' active' : ''}`, onClick: toggleMenu, "aria-label": "Abrir men\u00FA", "aria-expanded": menuOpen, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] })] })] }), _jsxs("div", { className: `mobile-menu${menuOpen ? ' open' : ''}`, role: "navigation", "aria-label": "Men\u00FA m\u00F3vil", children: [_jsx(Link, { to: "/quienes-somos", onClick: closeMenu, children: "Qui\u00E9nes Somos" }), _jsx(Link, { to: "/planes", onClick: closeMenu, children: "Planes" }), _jsx(Link, { to: "/aranceles", onClick: closeMenu, children: "Aranceles" }), _jsx(Link, { to: "/apoyo", onClick: closeMenu, children: "Apoyo Sicopedag\u00F3gico" }), _jsx(Link, { to: "/testimonios", onClick: closeMenu, children: "Testimonios" }), _jsx(Link, { to: "/contacto", onClick: closeMenu, children: "Cont\u00E1ctanos" })] })] }));
}
export default Navbar;
