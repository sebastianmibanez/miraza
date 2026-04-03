import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { inscribir } from '../services/api';
import './Contacto.css';
function Contacto() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        curso: '',
        materias: [],
        mensaje: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleMateriaChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            materias: checked
                ? [...prev.materias, value]
                : prev.materias.filter(m => m !== value)
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await inscribir(formData);
            if (response.ok) {
                setMessage({ type: 'success', text: response.mensaje || '¡Inscripción recibida!' });
                setFormData({ nombre: '', apellido: '', email: '', telefono: '', curso: '', materias: [], mensaje: '' });
            }
            else {
                setMessage({ type: 'error', text: response.error || 'Error en la inscripción' });
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "contacto-container", children: [_jsx("h1", { children: "Contacto & Inscripci\u00F3n" }), _jsxs("form", { onSubmit: handleSubmit, className: "contacto-form", children: [_jsxs("div", { className: "form-row", children: [_jsx("input", { type: "text", name: "nombre", placeholder: "Nombre", value: formData.nombre, onChange: handleChange, required: true }), _jsx("input", { type: "text", name: "apellido", placeholder: "Apellido", value: formData.apellido, onChange: handleChange, required: true })] }), _jsxs("div", { className: "form-row", children: [_jsx("input", { type: "email", name: "email", placeholder: "Correo electr\u00F3nico", value: formData.email, onChange: handleChange, required: true }), _jsx("input", { type: "tel", name: "telefono", placeholder: "Tel\u00E9fono", value: formData.telefono, onChange: handleChange, required: true })] }), _jsxs("select", { name: "curso", value: formData.curso, onChange: handleChange, required: true, children: [_jsx("option", { value: "", children: "Selecciona un curso" }), _jsx("option", { value: "3ro Medio", children: "3ro Medio" }), _jsx("option", { value: "4to Medio", children: "4to Medio" }), _jsx("option", { value: "Egresado", children: "Egresado" })] }), _jsxs("div", { className: "materias-group", children: [_jsx("label", { children: "Selecciona materias de inter\u00E9s:" }), ['Matemática', 'Lenguaje', 'Historia', 'Ciencias'].map(materia => (_jsxs("label", { className: "checkbox", children: [_jsx("input", { type: "checkbox", value: materia, checked: formData.materias.includes(materia), onChange: handleMateriaChange }), materia] }, materia)))] }), _jsx("textarea", { name: "mensaje", placeholder: "Mensaje (opcional)", value: formData.mensaje, onChange: handleChange, rows: 5 }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Enviando...' : 'Inscribirse' }), message && (_jsx("div", { className: `message ${message.type}`, children: message.text }))] })] }));
}
export default Contacto;
