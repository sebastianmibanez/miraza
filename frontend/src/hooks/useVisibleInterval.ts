import { useEffect, useRef } from 'react'

export function useVisibleInterval(callback: () => void, delay: number) {
  const savedCb = useRef(callback)

  useEffect(() => { savedCb.current = callback }, [callback])

  useEffect(() => {
    let id: ReturnType<typeof setInterval>

    const start = () => { id = setInterval(() => savedCb.current(), delay) }
    const stop  = () => clearInterval(id)

    const handleVisibility = () => document.hidden ? stop() : start()

    start()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [delay])
}
