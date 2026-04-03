import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import './Planes.css';
function Planes() {
    const planes = [
        {
            id: 'paes',
            name: 'Preparación PAES',
            icon: '📝',
            color: '#0A1F44',
            tagline: 'Cumple tu meta de puntaje en la prueba de selección',
            options: [
                { title: 'PAES General', desc: 'Cobertura completa de todas las materias' },
                { title: 'PAES Selectiva', desc: 'Enfoque en tus 2-3 materias clave' },
            ],
            features: [
                'Clases sincrónicas 3 veces por semana',
                'Material de estudio digital actualizado',
                'Ensayos simulados mensuales',
                'Asesorías uno a uno',
                'Acceso a comunidad de estudiantes',
            ]
        },
        {
            id: 'nem',
            name: 'Mejora de NEM',
            icon: '📊',
            color: '#1a3a1a',
            tagline: 'Aumenta tu promedio para una mejor selección universitaria',
            options: [
                { title: 'NEM Anual', desc: 'Acompañamiento de todo el año académico' },
                { title: 'NEM Semestral', desc: 'Recuperación rápida de asignaturas' },
            ],
            features: [
                'Tutorías personalizadas semanales',
                'Seguimiento de calificaciones',
                'Estrategias de estudio efectivas',
                'Orientación académica',
                'Evaluaciones de diagnosis',
            ]
        },
        {
            id: 'nivel',
            name: 'Nivelación de Estudios',
            icon: '🎯',
            color: '#3d1a00',
            tagline: 'Refuerza bases y conceptos que te falta consolidar',
            options: [
                { title: 'Nivelación Básica', desc: 'Fundamentos de materias principales' },
                { title: 'Nivelación Avanzada', desc: 'Profundización en temas complejos' },
            ],
            features: [
                'Diagnóstico inicial personalizado',
                'Fichas y ejercicios progresivos',
                'Retroalimentación inmediata',
                'Flexibilidad horaria',
                'Materiales adaptados a tu nivel',
            ]
        },
        {
            id: 'espec',
            name: 'Apoyo Especializado',
            icon: '💡',
            color: '#2d0a44',
            tagline: 'Clases específicas orientadas a tu objetivo educativo',
            options: [
                { title: 'Apoyo Sicopedagógico', desc: 'Estrategias de aprendizaje personalizadas' },
                { title: 'Tutorías Temáticas', desc: 'Profundización en temas puntuales' },
            ],
            features: [
                'Evaluación psicopedagógica inicial',
                'Técnicas de estudio adaptadas',
                'Gestión de ansiedad ante exámenes',
                'Clases a medida',
                'Seguimiento integral',
            ]
        }
    ];
    return (_jsxs("div", { className: "planes-wrap", style: { maxWidth: '1100px', margin: '0 auto', padding: '80px 6vw 100px' }, children: [_jsxs("div", { className: "section-header", style: { marginBottom: '60px' }, children: [_jsx("span", { className: "section-tag", children: "Nuestras Propuestas" }), _jsx("h2", { className: "section-title", children: "Planes Dise\u00F1ados para Ti" }), _jsx("p", { className: "section-sub", children: "Elige el plan que mejor se adapte a tus necesidades educativas" })] }), _jsx("div", { className: "planes-grid", style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '72px' }, children: planes.map(plan => (_jsxs("div", { className: `plan-card ${plan.id}`, style: { background: 'var(--white)', border: '1.5px solid rgba(10,31,68,0.09)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s, transform 0.3s', boxShadow: '0 2px 12px rgba(10,31,68,0.06)' }, children: [_jsxs("div", { className: "plan-card-header", style: {
                                padding: '36px 36px 28px',
                                background: `linear-gradient(135deg, ${plan.color}, ${plan.color}22)`,
                                position: 'relative',
                                overflow: 'hidden',
                                color: 'white'
                            }, children: [_jsx("div", { className: "plan-icon", style: { fontSize: '2rem', marginBottom: '12px', display: 'block' }, children: plan.icon }), _jsx("h3", { className: "plan-name", style: { fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'white', marginBottom: '10px', lineHeight: 1.2 }, children: plan.name }), _jsx("p", { style: { color: 'rgba(255,255,255,0.72)', fontSize: '0.9rem', lineHeight: 1.6 }, children: plan.tagline })] }), _jsxs("div", { style: { padding: '32px 36px', flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsx("ul", { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }, children: plan.options.map((opt, idx) => (_jsxs("li", { style: { display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', background: 'var(--light)', borderRadius: '10px', fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }, children: [_jsx("span", { style: { fontSize: '1rem', color: 'var(--blue)', fontWeight: 700 }, children: "\u2713" }), _jsxs("div", { children: [_jsx("strong", { style: { display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)', marginBottom: '2px' }, children: opt.title }), opt.desc] })] }, idx))) }), _jsx("ul", { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }, children: plan.features.map((feature, idx) => (_jsxs("li", { style: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.87rem', color: 'var(--muted)' }, children: [_jsx("span", { style: { color: 'var(--blue)', fontWeight: 700 }, children: "\u2713" }), feature] }, idx))) }), _jsx("div", { style: { marginTop: 'auto' }, children: _jsx(Link, { to: "/contacto", className: "btn-gold", style: { display: 'block', padding: '13px 20px', borderRadius: '10px', fontSize: '0.87rem', fontWeight: 700, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: "'Outfit', sans-serif", textDecoration: 'none', transition: 'all 0.25s', background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: 'white' }, children: "Solicitar Informaci\u00F3n" }) })] })] }, plan.id))) }), _jsxs("section", { style: { background: 'linear-gradient(135deg, var(--navy) 0%, #1a3870 100%)', borderRadius: '20px', padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }, children: [_jsx("h2", { style: { fontFamily: "'Playfair Display', serif", color: 'white', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', marginBottom: '14px', position: 'relative', zIndex: 1 }, children: "\u00BFNo est\u00E1s seguro cu\u00E1l es el mejor plan?" }), _jsx("p", { style: { color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '32px', position: 'relative', zIndex: 1 }, children: "Nuestro equipo te ayudar\u00E1 a elegir la opci\u00F3n perfecta para tus objetivos" }), _jsx(Link, { to: "/contacto", className: "btn-gold", style: { display: 'inline-block', marginRight: '16px' }, children: "Hablar con un asesor" })] })] }));
}
export default Planes;
