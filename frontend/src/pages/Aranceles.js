import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import './Aranceles.css';
function Aranceles() {
    const plans = [
        {
            name: 'Plan Básico',
            price: 49.99,
            period: 'mes',
            features: [
                'Acceso a materiales de estudio',
                ' 2 tutorías por semana',
                'Comunidad de estudiantes',
                'Evaluaciones mensuales',
            ]
        },
        {
            name: 'Plan Premium',
            price: 99.99,
            period: 'mes',
            featured: true,
            features: [
                'Todo del Plan Básico',
                '4 tutorías personalizadas',
                'Asesoría académica uno a uno',
                '2 ensayos simulados',
                'Acceso a recursos premium',
                'Prioridad en consultas',
            ]
        },
        {
            name: 'Plan Profesional',
            price: 149.99,
            period: 'mes',
            features: [
                'Todo del Plan Premium',
                'Clases ilimitadas',
                'Plan de estudio personalizado',
                'Revisión de pruebas',
                'Seguimiento semanal',
            ]
        }
    ];
    const faqs = [
        {
            question: '¿Puedo cambiar de plan cuando quiera?',
            answer: 'Sí, puedes cambiar, cancelar o pausar tu plan en cualquier momento. Solo requiere 24 horas de aviso previo.'
        },
        {
            question: '¿Hay contrato de largo plazo?',
            answer: 'No, todos nuestros planes son mensuales sin contrato. Puedes cancelar tu suscripción cuando lo desees.'
        },
        {
            question: '¿Los precios incluyen IVA?',
            answer: 'Sí, todos los precios mostrados ya incluyen IVA. No hay cargos ocultos.'
        },
        {
            question: '¿Ofrecen período de prueba?',
            answer: 'Sí, ofrece primera semana con 50% de descuento para que pruebes nuestro servicio.'
        },
        {
            question: '¿Puedo pedir reembolso?',
            answer: 'Contamos con garantía de 7 días. Si no estás satisfecho, devolvemos tu dinero sin preguntas.'
        },
    ];
    return (_jsxs("div", { className: "aranceles-wrap", style: { maxWidth: '1100px', margin: '0 auto', padding: '80px 6vw 100px' }, children: [_jsxs("div", { className: "section-header", style: { marginBottom: '60px' }, children: [_jsx("span", { className: "section-tag", children: "Precios mensuales" }), _jsx("h2", { className: "section-title", children: "Sin letras chicas, sin sorpresas" }), _jsx("p", { className: "section-sub", children: "Todos los valores incluyen IVA. Pago mensual, sin contratos de largo plazo." })] }), _jsx("div", { className: "pricing-grid", style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '72px', alignItems: 'start' }, children: plans.map((plan, idx) => (_jsxs("div", { className: `pricing-card ${plan.featured ? 'featured' : ''}`, style: { background: 'var(--white)', border: '1.5px solid rgba(10,31,68,0.1)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s, transform 0.3s', boxShadow: '0 2px 12px rgba(10,31,68,0.06)', ...(plan.featured && { borderColor: 'var(--gold)', boxShadow: '0 8px 32px rgba(245,166,35,0.18)', transform: 'translateY(-8px)' }) }, children: [plan.featured && (_jsx("div", { style: { background: 'var(--gold)', color: 'var(--navy)', textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, padding: '7px 16px', letterSpacing: '0.08em', textTransform: 'uppercase' }, children: "M\u00E1s Popular" })), _jsxs("div", { style: { padding: '32px 28px 24px', borderBottom: '1px solid rgba(10,31,68,0.07)' }, children: [_jsx("p", { style: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '10px' }, children: plan.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }, children: [_jsx("span", { style: { fontSize: '1rem', fontWeight: 600, color: 'var(--muted)' }, children: "$" }), _jsx("span", { style: { fontFamily: "'Playfair Display', serif", fontSize: '2.6rem', fontWeight: 900, color: plan.featured ? 'var(--blue)' : 'var(--navy)', lineHeight: 1 }, children: plan.price })] }), _jsxs("p", { style: { fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 500 }, children: ["por ", plan.period] })] }), _jsxs("div", { style: { padding: '28px 28px 32px', flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsx("ul", { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px', flex: 1 }, children: plan.features.map((feature, fidx) => (_jsxs("li", { style: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.5 }, children: [_jsx("span", { style: { width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(27,77,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--blue)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }, children: "\u2713" }), feature] }, fidx))) }), _jsx(Link, { to: "/contacto", className: "btn-pricing", style: { display: 'block', width: '100%', padding: '14px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: "'Outfit', sans-serif", textDecoration: 'none', transition: 'all 0.25s', background: plan.featured ? 'var(--gold)' : 'linear-gradient(135deg, var(--navy), var(--blue))', color: plan.featured ? 'var(--navy)' : 'white' }, children: "Elegir Plan" })] })] }, idx))) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '72px' }, children: [_jsxs("div", { style: { background: 'var(--light)', borderRadius: '14px', padding: '24px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }, children: [_jsx("span", { style: { fontSize: '1.4rem', flexShrink: 0 }, children: "\uD83C\uDF81" }), _jsxs("div", { children: [_jsx("h4", { style: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }, children: "Primera Semana" }), _jsx("p", { style: { fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6 }, children: "Acceso con 50% de descuento para que pruebes Miraza sin compromiso." })] })] }), _jsxs("div", { style: { background: 'var(--light)', borderRadius: '14px', padding: '24px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }, children: [_jsx("span", { style: { fontSize: '1.4rem', flexShrink: 0 }, children: "\u2705" }), _jsxs("div", { children: [_jsx("h4", { style: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }, children: "Garant\u00EDa de Satisfacci\u00F3n" }), _jsx("p", { style: { fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6 }, children: "7 d\u00EDas de garant\u00EDa. Si no est\u00E1s conforme, devolvemos tu dinero." })] })] }), _jsxs("div", { style: { background: 'var(--light)', borderRadius: '14px', padding: '24px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }, children: [_jsx("span", { style: { fontSize: '1.4rem', flexShrink: 0 }, children: "\uD83D\uDCB3" }), _jsxs("div", { children: [_jsx("h4", { style: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }, children: "Sin Contrato" }), _jsx("p", { style: { fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6 }, children: "Cancela en cualquier momento. No hay compromisos de largo plazo." })] })] })] }), _jsxs("div", { style: { marginBottom: '72px' }, children: [_jsx("h3", { style: { fontSize: '1.5rem', color: 'var(--navy)', marginBottom: '32px', textAlign: 'center', fontFamily: "'Playfair Display', serif" }, children: "Preguntas Frecuentes" }), _jsx("div", { children: faqs.map((faq, idx) => (_jsxs("details", { style: { border: '1px solid rgba(10,31,68,0.1)', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }, children: [_jsxs("summary", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', cursor: 'pointer', background: 'var(--white)', fontWeight: 600, fontSize: '0.94rem', color: 'var(--navy)', userSelect: 'none' }, children: [faq.question, _jsx("span", { style: { transition: 'transform 0.3s', fontSize: '1.2rem' }, children: "\u203A" })] }), _jsx("div", { style: { padding: '0 24px 20px', background: 'var(--white)', fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.75 }, children: faq.answer })] }, idx))) })] }), _jsxs("section", { style: { background: 'linear-gradient(135deg, var(--navy) 0%, #1a3870 100%)', borderRadius: '20px', padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }, children: [_jsx("h2", { style: { fontFamily: "'Playfair Display', serif", color: 'white', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', marginBottom: '14px', position: 'relative', zIndex: 1 }, children: "Comienza tu transformaci\u00F3n educativa hoy" }), _jsx("p", { style: { color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '32px', position: 'relative', zIndex: 1 }, children: "Cientos de estudiantes ya conf\u00EDan en Miraza para cumplir sus metas" }), _jsx(Link, { to: "/contacto", className: "btn-gold", style: { display: 'inline-block' }, children: "Inscribirse Ahora" })] })] }));
}
export default Aranceles;
