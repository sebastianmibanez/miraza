import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Testimonios.css';
const testimonios = [
    {
        nombre: 'Sofía M.',
        meta: '4° Medio · Matemática M1 y M2',
        texto: 'Entré con muchísimo miedo a la Matemática y salí con estrategias claras para cada tipo de pregunta. Subí más de 70 puntos en mis ensayos durante el año. Los profes explican diferente, te hacen entender de verdad.',
        color: 'linear-gradient(135deg,#1B4DB8,#3A6FD8)',
        inicial: 'S',
        badge: 'PAES 2024',
    },
    {
        nombre: 'Diego R.',
        meta: 'Egresado · Lenguaje y Comunicación',
        texto: 'El profesor de Lenguaje me cambió completamente la forma de leer. Aprendí que no hay que leer todo, sino leer con intención. Con esa sola estrategia mejoré mucho en los ensayos. Lo recomiendo al 100%.',
        color: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
        inicial: 'D',
        badge: 'PAES 2024',
    },
    {
        nombre: 'Valentina P.',
        meta: '4° Medio · Historia y Ciencias',
        texto: 'Historia era mi punto más débil y gracias a Miraza pude estructurar todo el contenido de una manera que nunca olvidé. El seguimiento personalizado marcó la diferencia: sentí que les importaba mi progreso de verdad.',
        color: 'linear-gradient(135deg,#065F46,#059669)',
        inicial: 'V',
        badge: 'PAES 2024',
    },
    {
        nombre: 'Matías C.',
        meta: 'Egresado · Todas las materias',
        texto: 'Lo que más valoro de Miraza es que no eres un número. Te monitorean, te preguntan cómo vas, ajustan el ritmo si necesitas. Los ensayos tipo PAES me prepararon mentalmente para el día de la prueba. ¡Entré sin nervios!',
        color: 'linear-gradient(135deg,#B45309,#D97706)',
        inicial: 'M',
        badge: 'PAES 2024',
    },
    {
        nombre: 'Claudia M.',
        meta: 'Apoderada · Apoyo Sicopedagógico',
        texto: 'Mi hijo tiene dislexia y siempre había tenido malas experiencias en colegios y academias. En Miraza encontramos un equipo que realmente entendió su forma de aprender. Los resultados al final del año fueron increíbles.',
        color: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
        inicial: 'C',
        badge: '2024',
    },
];
function Testimonios() {
    const [current, setCurrent] = useState(0);
    const trackRef = useRef(null);
    const total = testimonios.length;
    const goTo = (idx) => {
        setCurrent((idx + total) % total);
    };
    useEffect(() => {
        // Scroll reveal
        const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
        } }), { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("section", { className: "page-hero", children: _jsxs("div", { className: "page-hero-inner", children: [_jsx("div", { className: "page-hero-tag", children: "Testimonios" }), _jsxs("h1", { children: ["Lo que dicen nuestros ", _jsx("em", { children: "alumnos" })] }), _jsx("p", { children: "Experiencias reales de estudiantes que se prepararon con nosotros" })] }) }), _jsxs("section", { className: "testim-summary reveal", children: [_jsxs("div", { className: "testim-rating", children: [_jsx("span", { className: "stars", children: "\u2605\u2605\u2605\u2605\u2605" }), _jsx("span", { className: "score", children: "4.9" }), _jsx("span", { className: "of", children: "/ 5" })] }), _jsx("div", { className: "testim-sep" }), _jsxs("span", { className: "testim-stat", children: ["M\u00E1s de ", _jsx("strong", { children: "120 alumnos" }), " satisfechos"] }), _jsx("div", { className: "testim-sep" }), _jsx("span", { className: "testim-stat", children: "100% recomendar\u00EDa Miraza" })] }), _jsx("section", { className: "testim-section", children: _jsxs("div", { className: "carousel-wrapper", ref: trackRef, children: [_jsx("div", { className: "carousel-track", style: { transform: `translateX(-${current * 100}%)` }, children: testimonios.map((t, i) => (_jsx("div", { className: "testim-card", children: _jsxs("div", { className: "testim-inner", children: [_jsx("span", { className: "testim-stars", children: "\u2605\u2605\u2605\u2605\u2605" }), _jsx("p", { className: "testim-text", children: t.texto }), _jsxs("div", { className: "testim-author", children: [_jsx("div", { className: "testim-avatar", style: { background: t.color }, children: t.inicial }), _jsxs("div", { children: [_jsx("div", { className: "testim-name", children: t.nombre }), _jsx("div", { className: "testim-meta", children: t.meta })] }), _jsx("div", { className: "testim-badge", children: t.badge })] })] }) }, i))) }), _jsx("button", { className: "carousel-btn carousel-prev", onClick: () => goTo(current - 1), "aria-label": "Anterior", children: "\u2190" }), _jsx("button", { className: "carousel-btn carousel-next", onClick: () => goTo(current + 1), "aria-label": "Siguiente", children: "\u2192" }), _jsx("div", { className: "carousel-dots", children: testimonios.map((_, i) => (_jsx("button", { className: `dot${i === current ? ' active' : ''}`, onClick: () => goTo(i), "aria-label": `Testimonio ${i + 1}` }, i))) })] }) }), _jsxs("section", { className: "testim-grid-section", children: [_jsxs("div", { className: "section-header reveal", children: [_jsx("div", { className: "section-tag", children: "Todos los testimonios" }), _jsx("h2", { className: "section-title", children: "Historias que nos inspiran" })] }), _jsx("div", { className: "testim-grid", children: testimonios.map((t, i) => (_jsxs("div", { className: "testim-grid-card reveal", children: [_jsx("span", { className: "testim-stars", children: "\u2605\u2605\u2605\u2605\u2605" }), _jsx("p", { className: "testim-text", children: t.texto }), _jsxs("div", { className: "testim-author", children: [_jsx("div", { className: "testim-avatar", style: { background: t.color }, children: t.inicial }), _jsxs("div", { children: [_jsx("div", { className: "testim-name", children: t.nombre }), _jsx("div", { className: "testim-meta", children: t.meta })] })] })] }, i))) })] }), _jsxs("section", { className: "testim-cta reveal", children: [_jsx("h2", { children: "\u00BFListo para escribir tu propia historia?" }), _jsx("p", { children: "\u00DAnete a los m\u00E1s de 120 alumnos que ya transformaron su rendimiento con Miraza." }), _jsx(Link, { to: "/contacto", className: "btn-gold", children: "Inscr\u00EDbete ahora" })] })] }));
}
export default Testimonios;
