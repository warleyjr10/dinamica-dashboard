import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, erro } from '@/lib/api'
import { getStore } from '@/lib/store'
import { H, TTL, LIMITE, lerBruto, montar, invalidar, hostLivre } from '@/lib/dash-servidor'
import { CARDS, IDS, cardsValidos, type Dashboard, type Placed } from '@/lib/cards'

export const dynamic = 'force-dynamic'

const corpo = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'Identificador inválido'),
  name: z.string().trim().min(1, 'Escreva seu nome').max(20, 'O nome pode ter até 20 letras'),
  cards: z
    .array(z.object({ id: z.enum(IDS as [string, ...string[]]), x: z.number(), y: z.number(), w: z.number(), h: z.number() }))
    .min(1, 'Escolha pelo menos um card')
    .max(Object.keys(CARDS).length),
})

function hostLiberado(req: NextRequest): boolean {
  const chave = process.env.HOST_KEY
  if (!chave) return true
  return req.nextUrl.searchParams.get('key') === chave
}

export async function GET() {
  const m = montar(await lerBruto())
  return ok({ dashboards: m.dashboards, agora: m.agora, armazenamento: getStore().modo, online: m.online, hostLivre: hostLivre() })
}

export async function POST(req: NextRequest) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return erro('DADOS_INVALIDOS', 'Dados inválidos')
  }
  const p = corpo.safeParse(json)
  if (!p.success) return erro('DADOS_INVALIDOS', p.error.issues[0]?.message ?? 'Dados inválidos')
  const cards = p.data.cards as Placed[]
  if (!cardsValidos(cards)) return erro('DADOS_INVALIDOS', 'O dashboard tem cards fora do lugar. Monte de novo.')

  const s = getStore()
  const atual = await lerBruto()
  const anterior = atual[`d:${p.data.id}`]
  if (!anterior && Object.keys(atual).filter((k) => k.startsWith('d:')).length >= LIMITE) return erro('CONFLITO', 'A sala está cheia')

  let criado = Date.now()
  if (anterior) {
    try {
      criado = (JSON.parse(anterior) as Dashboard).criado
    } catch {
      /* mantém agora */
    }
  }
  const reg: Dashboard = { id: p.data.id, name: p.data.name, cards, criado, atualizado: Date.now() }
  await s.hset(H, `d:${reg.id}`, JSON.stringify(reg))
  if (!anterior) await s.expire(H, TTL)
  invalidar()
  return ok({ id: reg.id })
}

export async function DELETE(req: NextRequest) {
  if (!hostLiberado(req)) return erro('SEM_PERMISSAO', 'Chave do host incorreta')
  const s = getStore()
  const id = req.nextUrl.searchParams.get('id')
  if (id) await s.hdel(H, [`d:${id}`])
  else await s.hdel(H, Object.keys(await lerBruto()).filter((k) => k.startsWith('d:')))
  invalidar()
  return ok({ removido: id ?? 'todos' })
}
