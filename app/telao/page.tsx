'use client'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Dash from '@/components/Dash'
import LinkQR from '@/components/Link'
import { CARDS, IDS, type CardId, type Dashboard } from '@/lib/cards'

const POR_PAGINA = 6

function Telao() {
  const chave = useSearchParams().get('key') ?? ''
  const [lista, setLista] = useState<Dashboard[]>([])
  const [modo, setModo] = useState<string>('')
  const [online, setOnline] = useState(0)
  const [hostLivre, setHostLivre] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [zoom, setZoom] = useState<Dashboard | null>(null)
  const [recentes, setRecentes] = useState<Set<string>>(new Set())
  const vistos = useRef<Set<string> | null>(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/dashboards', { cache: 'no-store' })
      const j = (await r.json()) as { ok: boolean; data: { dashboards: Dashboard[]; armazenamento: string; online: number; hostLivre: boolean } }
      if (!j.ok) return
      const novos = j.data.dashboards
      setLista(novos)
      setModo(j.data.armazenamento)
      setOnline(j.data.online)
      setHostLivre(j.data.hostLivre)
      const ids = new Set(novos.map((d) => d.id))
      if (vistos.current) {
        const fresh = novos.filter((d) => !vistos.current!.has(d.id)).map((d) => d.id)
        if (fresh.length) {
          setRecentes((p) => new Set([...p, ...fresh]))
          setPagina(0)
          setTimeout(() => setRecentes((p) => new Set([...p].filter((x) => !fresh.includes(x)))), 4000)
        }
      }
      vistos.current = ids
    } catch {
      /* mantém o que já está na tela */
    }
  }, [])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 1500)
    return () => clearInterval(t)
  }, [carregar])

  const ordenada = [...lista].reverse()
  const paginas = Math.max(1, Math.ceil(ordenada.length / POR_PAGINA))
  useEffect(() => {
    if (paginas <= 1 || zoom) return
    const t = setInterval(() => setPagina((p) => (p + 1) % paginas), 9000)
    return () => clearInterval(t)
  }, [paginas, zoom])

  const atual = ordenada.slice((pagina % paginas) * POR_PAGINA, (pagina % paginas) * POR_PAGINA + POR_PAGINA)

  const cont: Record<string, number> = {}
  IDS.forEach((i) => (cont[i] = 0))
  lista.forEach((d) => d.cards.forEach((c) => (cont[c.id] += 1)))
  const top = [...IDS].sort((a, b) => cont[b] - cont[a]).slice(0, 5)
  const max = Math.max(1, cont[top[0]] ?? 1)

  async function apagar(id?: string) {
    if (!id && !confirm('Apagar todos os dashboards do telão?')) return
    await fetch(`/api/dashboards?${id ? `id=${encodeURIComponent(id)}&` : ''}key=${encodeURIComponent(chave)}`, { method: 'DELETE' })
    carregar()
  }

  const host = chave !== '' || hostLivre
  const semRedis = modo === 'memoria' && typeof window !== 'undefined' && window.location.hostname !== 'localhost'

  return (
    <div className="wall">
      <div className="wh">
        <div>
          <h1>Dashboards da plateia</h1>
          <div className="c">
            {lista.length} {lista.length === 1 ? 'dashboard montado' : 'dashboards montados'}
            {` · ${online} ${online === 1 ? 'pessoa online' : 'pessoas online'}`}
            {paginas > 1 ? ` · página ${(pagina % paginas) + 1} de ${paginas}` : ''}
          </div>
        </div>
        <div className="hostbar">
          {host && <button onClick={() => apagar()}>Limpar telão</button>}
          <LinkQR />
        </div>
      </div>
      {semRedis && <div className="aviso">Redis não configurado: os dashboards ficam só na memória do servidor e podem sumir. Conecte o Redis no projeto da Vercel.</div>}
      <div className="wb">
        <div className="tiles">
          {atual.length === 0 && <div className="vazio">Entre pelo QR code, escreva seu nome e monte o seu dashboard.</div>}
          {atual.map((d) => (
            <div key={d.id} className={`tile ${recentes.has(d.id) ? 'new' : ''}`} onClick={() => setZoom(d)}>
              {host && (
                <button
                  className="x"
                  title="Apagar"
                  onClick={(e) => {
                    e.stopPropagation()
                    apagar(d.id)
                  }}
                >
                  ×
                </button>
              )}
              <div className="tn">
                <span>{d.name}</span>
                {recentes.has(d.id) && <em>novo</em>}
              </div>
              <Dash cards={d.cards} fs={8} />
            </div>
          ))}
        </div>
        <div className="rk">
          <h3>Cards mais escolhidos</h3>
          {top.map((id: CardId) => (
            <div key={id}>
              <p>
                <span>{CARDS[id].n}</span>
                <b>{cont[id]}</b>
              </p>
              <div className="b">
                <i style={{ width: `${(cont[id] / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={`zoom ${zoom ? 'on' : ''}`} onClick={() => setZoom(null)}>
        {zoom && (
          <>
            <h2>{zoom.name}</h2>
            <div className="zw">
              <Dash cards={zoom.cards} fs={20} />
            </div>
            <span className="more">Clique para fechar</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Telao />
    </Suspense>
  )
}
