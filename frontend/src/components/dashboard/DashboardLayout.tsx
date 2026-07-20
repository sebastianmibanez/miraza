import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import './DashboardLayout.css'

export const TEMAS = [
  { id: 'ejecutivo',     nombre: 'Ejecutivo',         bg: '#14161C', accent: '#C9A227', accent2: '#6E86A8' },
  { id: 'papel',         nombre: 'Papel corporativo', bg: '#F6F3EC', accent: '#A9781E', accent2: '#3F5C86' },
  { id: 'azul-profundo', nombre: 'Azul profundo',     bg: '#0B1424', accent: '#D1A53A', accent2: '#7C93B8' },
]

export default function DashboardLayout() {
  const [tema, setTema] = useState(() => localStorage.getItem('miraza_theme') || 'ejecutivo')
  useEffect(() => { localStorage.setItem('miraza_theme', tema) }, [tema])
  return (
    <div className="dash-shell" data-theme={tema}>
      <Sidebar tema={tema} setTema={setTema} />
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  )
}