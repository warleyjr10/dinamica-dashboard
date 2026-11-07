import { getStore } from '@/lib/store'

export const CHAVE_PRESENCA = 'congresso:dash:presenca'
const JANELA = 30_000
const TTL = 60 * 60 * 48

export async function registrar(id: string) {
  const s = getStore()
  await s.hset(CHAVE_PRESENCA, id, String(Date.now()))
  await s.expire(CHAVE_PRESENCA, TTL)
}

/** Quantos aparelhos avisaram presença nos últimos 30 segundos. */
export async function contarOnline(): Promise<number> {
  const brutos = await getStore().hgetall(CHAVE_PRESENCA)
  const agora = Date.now()
  return Object.values(brutos).filter((v) => agora - Number(v) < JANELA).length
}

/** Sem HOST_KEY configurada, o telão mostra os botões do host sem precisar de chave na URL. */
export const hostLivre = () => !process.env.HOST_KEY
