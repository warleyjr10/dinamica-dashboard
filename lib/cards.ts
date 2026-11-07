export const COLS = 4
export const ROWS = 3

export type CardId =
  | 'efic' | 'mass' | 'vol' | 'dens' | 'umi' | 'peso'
  | 'tend' | 'alar' | 'fluxo' | 'perf' | 'turbo' | 'custo'

export type CardDef = { n: string; w: number; h: number; html: string }
export type Placed = { id: CardId; x: number; y: number; w: number; h: number }

const barras = [8, 14, 19, 22, 24, 22, 20, 24, 21, 15, 10, 6]
  .map((v, i) => `<rect x="${i * 8.3 + 1}" y="${26 - v}" width="6" height="${v}" rx="1" fill="#E84E0F" opacity="${(0.45 + v / 45).toFixed(2)}"/>`)
  .join('')

// Valores ilustrativos: o dashboard da dinâmica é só uma brincadeira, não usa dado de cliente.
export const CARDS: Record<CardId, CardDef> = {
  efic: { n: 'Eficiência', w: 2, h: 1, html: `<div class="erow"><div><div class="l">Eficiência</div><div class="v">84,2<small>%</small></div></div><span class="cls">B</span></div>` },
  mass: { n: 'Vazão mássica', w: 1, h: 1, html: `<div class="l">Vazão mássica</div><div class="v">12,4<small>t/h</small></div>` },
  vol: { n: 'Vazão volumétrica', w: 1, h: 1, html: `<div class="l">Vazão volumétrica</div><div class="v">86<small>m³/h</small></div>` },
  dens: { n: 'Densidade', w: 1, h: 1, html: `<div class="l">Densidade</div><div class="v">144<small>kg/m³</small></div>` },
  umi: { n: 'Umidade', w: 1, h: 1, html: `<div class="l">Umidade</div><div class="v">38<small>%</small></div><div class="bar"><b style="width:38%"></b></div>` },
  peso: { n: 'Peso do dia', w: 1, h: 1, html: `<div class="l">Peso do dia</div><div class="v">287<small>t</small></div>` },
  tend: { n: 'Tendência', w: 2, h: 1, html: `<div class="l">Tendência</div><svg viewBox="0 0 100 26"><polyline fill="none" stroke="#D9D2CB" stroke-width="1.6" points="0,18 10,16 20,19 30,14 40,15 50,11 60,13 70,9 80,12 90,8 100,10"/><polyline fill="none" stroke="#E84E0F" stroke-width="1.8" points="0,20 10,18 20,15 30,16 40,12 50,13 60,8 70,10 80,6 90,7 100,4"/></svg>` },
  alar: { n: 'Alarmes', w: 1, h: 1, html: `<div class="l">Alarmes</div><div class="al"><span style="background:#E84E0F"></span>Umidade alta<br><span style="background:#F4B63F"></span>Tara em teste<br><span style="background:#4CAF7A"></span>PLCCOM ok</div>` },
  fluxo: { n: 'Fluxo de biomassa', w: 2, h: 1, html: `<div class="l">Fluxo de biomassa</div><div class="fl"><b>Silo</b><s>→</s><b>Correia</b><s>→</s><b>Caldeira</b></div>` },
  perf: { n: 'Perfil na correia', w: 2, h: 1, html: `<div class="l">Perfil da biomassa na correia</div><svg viewBox="0 0 100 26">${barras}</svg>` },
  turbo: { n: 'Turbogerador', w: 1, h: 1, html: `<div class="l">Turbogerador</div><div class="v">6,8<small>MW</small></div>` },
  custo: { n: 'Custo do vapor', w: 1, h: 1, html: `<div class="l">Custo do vapor</div><div class="v">92<small>R$/t</small></div>` },
}

export const IDS = Object.keys(CARDS) as CardId[]

function ocupacao(cards: Placed[]): number[][] {
  const o = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0))
  for (const c of cards) for (let j = c.y; j < c.y + c.h; j++) for (let i = c.x; i < c.x + c.w; i++) o[j][i] = 1
  return o
}

function cabe(o: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x + w > COLS || y + h > ROWS) return false
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (o[j][i]) return false
  return true
}

export function colocar(cards: Placed[], id: CardId): Placed[] | null {
  const o = ocupacao(cards)
  const d = CARDS[id]
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) if (cabe(o, x, y, d.w, d.h)) return [...cards, { id, x, y, w: d.w, h: d.h }]
  return null
}

export function espacosUsados(cards: Placed[]): number {
  return cards.reduce((s, c) => s + c.w * c.h, 0)
}

/** Validação do servidor: ids conhecidos, tamanhos oficiais, dentro da grade, sem sobreposição, sem repetir card. */
export function cardsValidos(cards: Placed[]): boolean {
  const o = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0))
  const vistos = new Set<string>()
  for (const c of cards) {
    const d = CARDS[c.id]
    if (!d || vistos.has(c.id)) return false
    vistos.add(c.id)
    if (c.w !== d.w || c.h !== d.h) return false
    if (!Number.isInteger(c.x) || !Number.isInteger(c.y) || c.x < 0 || c.y < 0) return false
    if (c.x + c.w > COLS || c.y + c.h > ROWS) return false
    for (let j = c.y; j < c.y + c.h; j++)
      for (let i = c.x; i < c.x + c.w; i++) {
        if (o[j][i]) return false
        o[j][i] = 1
      }
  }
  return true
}

export type Dashboard = { id: string; name: string; cards: Placed[]; criado: number; atualizado: number }
