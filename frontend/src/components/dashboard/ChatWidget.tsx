import { useState, useRef, useEffect, FormEvent } from 'react'
import { sendChatMessage } from '../../services/api'
import './ChatWidget.css'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  accentColor: string
}

export default function ChatWidget({ accentColor }: Props) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await sendChatMessage(text)
      if (res.data.ok && res.data.respuesta) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.respuesta! }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.error || 'Error al responder.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error de conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        className="chat-bubble"
        style={{ background: accentColor }}
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir chat de ayuda"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header" style={{ background: accentColor }}>
            <span>🤖 Tutor IA</span>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-hint">
                ¡Hola! Soy tu tutor de IA. Pregúntame cualquier duda sobre tu materia.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant chat-typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              maxLength={2000}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ background: accentColor }}>
              ➤
            </button>
          </form>

          <p className="chat-powered">Powered by Claude · Anthropic</p>
        </div>
      )}
    </>
  )
}
