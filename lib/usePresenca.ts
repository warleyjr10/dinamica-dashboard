'use client'
import { useEffect } from 'react'

/** Avisa o servidor a cada 10 segundos que este aparelho está com a página aberta. */
export function usePresenca(id: string) {
  useEffect(() => {
    if (!id) return
    const bater = () => {
      fetch('/api/presenca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }), keepalive: true }).catch(() => {})
    }
    bater()
    const t = setInterval(bater, 10_000)
    return () => clearInterval(t)
  }, [id])
}
