import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/dashboard/DashboardLayout'

import Home from './pages/Home'
import QuienesSomos from './pages/QuienesSomos'
import Planes from './pages/Planes'
import Aranceles from './pages/Aranceles'
import Apoyo from './pages/Apoyo'
import Contacto from './pages/Contacto'
import Testimonios from './pages/Testimonios'
import Login from './pages/Login'

import DashboardPaes from './pages/dashboards/DashboardPaes'
import DashboardNem from './pages/dashboards/DashboardNem'
import DashboardNivelacion from './pages/dashboards/DashboardNivelacion'
import DashboardEspecial from './pages/dashboards/DashboardEspecial'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public site */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="quienes-somos" element={<QuienesSomos />} />
            <Route path="planes" element={<Planes />} />
            <Route path="aranceles" element={<Aranceles />} />
            <Route path="apoyo" element={<Apoyo />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path="testimonios" element={<Testimonios />} />
          </Route>

          {/* Login (no Layout) */}
          <Route path="/login" element={<Login />} />

          {/* Protected dashboards */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/paes"       element={<DashboardPaes />} />
              <Route path="/dashboard/nem"        element={<DashboardNem />} />
              <Route path="/dashboard/nivelacion" element={<DashboardNivelacion />} />
              <Route path="/dashboard/especial"   element={<DashboardEspecial />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
