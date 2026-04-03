import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import QuienesSomos from './pages/QuienesSomos';
import Planes from './pages/Planes';
import Aranceles from './pages/Aranceles';
import Apoyo from './pages/Apoyo';
import Contacto from './pages/Contacto';
import Testimonios from './pages/Testimonios';
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsxs(Route, { element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Home, {}) }), _jsx(Route, { path: "quienes-somos", element: _jsx(QuienesSomos, {}) }), _jsx(Route, { path: "planes", element: _jsx(Planes, {}) }), _jsx(Route, { path: "aranceles", element: _jsx(Aranceles, {}) }), _jsx(Route, { path: "apoyo", element: _jsx(Apoyo, {}) }), _jsx(Route, { path: "contacto", element: _jsx(Contacto, {}) }), _jsx(Route, { path: "testimonios", element: _jsx(Testimonios, {}) })] }) }) }));
}
export default App;
