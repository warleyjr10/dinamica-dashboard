'use client'
import { useEffect, useState } from 'react'
import Dash from '@/components/Dash'
import { usePresenca } from '@/lib/usePresenca'
import { CARDS, IDS, colocar, espacosUsados, type CardId, type Placed } from '@/lib/cards'

type Passo = 'nome' | 'montar' | 'fim'
const KEY = 'congresso-dash-participante'

function novoId(): string {
  const a = new Uint8Array(12)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

export default function Participante() {
  const [passo, setPasso] = useState<Passo>('nome')
  const [id, setId] = useState('')
  const [nome, setNome] = useState('')
  const [cards, setCards] = useState<Placed[]>([])
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  usePresenca(id)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) {
        const o = JSON.parse(s) as { id: string; nome: string }
        setId(o.id)
        setNome(o.nome)
        return
      }
    } catch {
      /* segue sem memória do aparelho */
    }
    setId(novoId())
  }, [])

  function guardar(n: string, i: string) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ id: i, nome: n }))
    } catch {
      /* sem armazenamento */
    }
  }

  async function enviar() {
    setEnviando(true)
    setMsg('')
    try {
      const r = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: nome.trim(), cards }),
      })
      const j = (await r.json()) as { ok: boolean; erro?: { mensagem: string } }
      if (!j.ok) setMsg(j.erro?.mensagem ?? 'Não foi possível enviar. Tente de novo.')
      else {
        guardar(nome.trim(), id)
        setPasso('fim')
      }
    } catch {
      setMsg('Sem conexão. Confira o Wi-Fi e tente de novo.')
    }
    setEnviando(false)
  }

  const logo = <img className="logo" src="/logo.png" alt="COONTROL" />

  if (passo === 'nome')
    return (
      <main className="pg">
        {logo}
        <h2>Monte o dashboard do SMB</h2>
        <p className="s">Escreva seu nome e escolha os cards que você colocaria na tela do operador. Ele vai aparecer no telão.</p>
        <div className="grow" />
        <input className="txt" maxLength={20} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <button className="btn" disabled={!nome.trim()} onClick={() => setPasso('montar')}>
          Começar
        </button>
      </main>
    )

  if (passo === 'montar') {
    const u = espacosUsados(cards)
    return (
      <main className="pg">
        {logo}
        <h2>{nome.trim()}, monte o seu</h2>
        <div className="meter">
          <span>Espaços usados</span>
          <span>{u} de 12</span>
        </div>
        <Dash cards={cards} fs={11} edit onCard={(cid) => setCards(cards.filter((c) => c.id !== cid))} />
        <div className="hint">Toque num card abaixo para adicionar. Toque num card montado para tirar.</div>
        <div className="pal">
          {IDS.map((cid: CardId) => {
            const d = CARDS[cid]
            const ja = cards.some((c) => c.id === cid)
            const pode = !ja && colocar(cards, cid) !== null
            return (
              <button key={cid} className="chip" disabled={!pode} onClick={() => setCards(colocar(cards, cid) ?? cards)}>
                {d.n}
                <i>
                  {d.w}×{d.h}
                </i>
              </button>
            )
          })}
        </div>
        <div className="grow" />
        {msg && <div className="erro">{msg}</div>}
        <div className="row">
          <button className="btn g" onClick={() => setCards([])}>
            Limpar
          </button>
          <button className="btn" disabled={!cards.length || enviando} onClick={enviar}>
            {enviando ? 'Enviando...' : 'Enviar ao telão'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="pg">
      {logo}
      <div className="grow" />
      <h2>Pronto, {nome.trim()}!</h2>
      <p className="s">Seu dashboard já está no telão. Olhe para frente.</p>
      <Dash cards={cards} fs={11} />
      <div className="grow" />
      <button className="btn g" onClick={() => setPasso('montar')}>
        Editar o meu
      </button>
    </main>
  )
}
