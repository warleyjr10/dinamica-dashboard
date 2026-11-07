import { Redis } from '@upstash/redis'

export type Store = {
  modo: 'redis' | 'memoria'
  hgetall(chave: string): Promise<Record<string, string>>
  hset(chave: string, campo: string, valor: string): Promise<void>
  hdel(chave: string, campos: string[]): Promise<void>
  del(chave: string): Promise<void>
  expire(chave: string, segundos: number): Promise<void>
}

type Memoria = Map<string, Map<string, string>>
const g = globalThis as unknown as { __mem?: Memoria; __store?: Store }

function criar(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    const r = new Redis({ url, token, automaticDeserialization: false })
    return {
      modo: 'redis',
      async hgetall(chave) {
        // Com a desserialização automática desligada, o SDK devolve uma lista plana [campo, valor, campo, valor...].
        const v: unknown = await r.hgetall<Record<string, unknown>>(chave)
        const out: Record<string, string> = {}
        if (!v) return out
        if (Array.isArray(v)) {
          for (let i = 0; i + 1 < v.length; i += 2) out[String(v[i])] = String(v[i + 1])
          return out
        }
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = typeof x === 'string' ? x : JSON.stringify(x)
        return out
      },
      async hset(chave, campo, valor) {
        await r.hset(chave, { [campo]: valor })
      },
      async hdel(chave, campos) {
        if (campos.length) await r.hdel(chave, ...campos)
      },
      async del(chave) {
        await r.del(chave)
      },
      async expire(chave, segundos) {
        await r.expire(chave, segundos)
      },
    }
  }
  // Sem Redis configurado: memória local. Serve só para testar no computador.
  const mem: Memoria = (g.__mem ??= new Map())
  const h = (c: string) => {
    let m = mem.get(c)
    if (!m) mem.set(c, (m = new Map()))
    return m
  }
  return {
    modo: 'memoria',
    async hgetall(chave) {
      return Object.fromEntries(h(chave))
    },
    async hset(chave, campo, valor) {
      h(chave).set(campo, valor)
    },
    async hdel(chave, campos) {
      for (const c of campos) h(chave).delete(c)
    },
    async del(chave) {
      mem.delete(chave)
    },
    async expire() {},
  }
}

export function getStore(): Store {
  return (g.__store ??= criar())
}
