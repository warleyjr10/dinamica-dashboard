import { getStore } from '@/lib/store'
import type { Dashboard } from '@/lib/cards'

/**
 * Tudo vive em UM hash do Redis, para a leitura gastar 1 comando só:
 *   d:<id> : JSON do dashboard de cada participante
 *   v:<id> : última vez que o aparelho avisou presença
 */
export const H = 'congresso:dash:h'
export const TTL = 60 * 60 * 48
export const LIMITE = 400
const CACHE_MS = 2000
const JANELA_ONLINE = 50_000

type Cache = { t: number; bruto: Record<string, string> }
const g = globalThis as unknown as { __dashCache?: Cache | null }

/** Leitura com cache de 2 segundos por instância: vários telões e envios juntos gastam 1 comando só. */
export async function lerBruto(): Promise<Record<string, string>> {
  const c = g.__dashCache
  if (c && Date.now() - c.t < CACHE_MS) return c.bruto
  const bruto = await getStore().hgetall(H)
  g.__dashCache = { t: Date.now(), bruto }
  return bruto
}

export function invalidar() {
  g.__dashCache = null
}

export function montar(b: Record<string, string>) {
  const agora = Date.now()
  const dashboards: Dashboard[] = []
  let online = 0
  for (const [k, v] of Object.entries(b)) {
    if (k.startsWith('d:')) {
      try {
        dashboards.push(JSON.parse(v) as Dashboard)
      } catch {
        /* ignora registro quebrado */
      }
    } else if (k.startsWith('v:') && agora - Number(v) < JANELA_ONLINE) online++
  }
  dashboards.sort((a, b) => a.criado - b.criado)
  return { dashboards, online, agora }
}

export async function registrarPresenca(id: string) {
  await getStore().hset(H, `v:${id}`, String(Date.now()))
}

/** Sem HOST_KEY configurada, o telão mostra os botões do host sem precisar de chave na URL. */
export const hostLivre = () => !process.env.HOST_KEY
