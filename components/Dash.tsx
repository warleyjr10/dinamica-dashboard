'use client'
import { CARDS, COLS, ROWS, type Placed } from '@/lib/cards'

type Props = { cards: Placed[]; fs: number; edit?: boolean; onCard?: (id: Placed['id']) => void }

export default function Dash({ cards, fs, edit, onCard }: Props) {
  const vagas: { x: number; y: number }[] = []
  if (edit) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) vagas.push({ x, y })
  return (
    <div className={`dash ${edit ? 'canvas' : ''}`} style={{ fontSize: fs }}>
      {vagas.map((v) => (
        <div key={`${v.x}-${v.y}`} className="slot" style={{ gridColumn: v.x + 1, gridRow: v.y + 1 }} />
      ))}
      {cards.map((c) => (
        <div
          key={c.id}
          className="card"
          onClick={edit && onCard ? () => onCard(c.id) : undefined}
          style={{ gridColumn: `${c.x + 1} / span ${c.w}`, gridRow: `${c.y + 1} / span ${c.h}` }}
          dangerouslySetInnerHTML={{ __html: CARDS[c.id].html }}
        />
      ))}
    </div>
  )
}
