import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import QuienesSomos from './pages/QuienesSomos'
import Planes from './pages/Planes'
import Aranceles from './pages/Aranceles'
import Apoyo from './pages/Apoyo'
import Contacto from './pages/Contacto'
import Testimonios from './pages/Testimonios'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="quienes-somos" element={<QuienesSomos />} />
          <Route path="planes" element={<Planes />} />
          <Route path="aranceles" element={<Aranceles />} />
          <Route path="apoyo" element={<Apoyo />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="testimonios" element={<Testimonios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
