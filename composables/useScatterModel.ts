// Model bodového (korelačního) grafu: dvě statistiky proti sobě, jedna země = bublina.
// Velikost bubliny = populace, barva = kontinent. Osy lze přepnout na log.

import { useWorldStats } from './useWorldStats'
import { useGeo } from './useGeo'
import { getIndicator } from './useIndicators'
import { loadIndicatorData, valueAtOrNearest, type IndicatorData } from './useStatsData'
import { continentOf, isEuropean, CONTINENTS, type Continent } from './useContinents'
import { compactNumber } from './useFormat'

export const SCATTER = { width: 680, height: 460 }
export const SPAD = { top: 20, right: 24, bottom: 52, left: 72 }

export const CONTINENT_COLORS: Record<Continent, string> = {
  Evropa: '#2563eb',
  Asie: '#ef4444',
  Afrika: '#f59e0b',
  'Severní Amerika': '#16a34a',
  'Jižní Amerika': '#a855f7',
  Oceánie: '#0891b2',
  Ostatní: '#94a3b8',
}

export interface ScatterPoint {
  iso: string
  name: string
  x: number
  y: number
  pop: number | null
  continent: Continent
  r: number
  cx: number
  cy: number
  color: string
}

export function useScatterModel() {
  const s = useWorldStats()
  const { nameFor, countryIds } = useGeo()

  const xData = ref<IndicatorData | null>(null)
  const yData = ref<IndicatorData | null>(null)
  const xLog = ref(false)
  const yLog = ref(false)

  const xInd = computed(() => getIndicator(s.scatterX.value, s.region.value))
  const yInd = computed(() => getIndicator(s.scatterY.value, s.region.value))

  let xTok = 0
  let yTok = 0
  async function loadX() {
    const ind = getIndicator(s.scatterX.value, s.region.value)
    if (!ind) return
    const t = ++xTok
    const d = await loadIndicatorData(ind)
    if (t === xTok) xData.value = d
  }
  async function loadY() {
    const ind = getIndicator(s.scatterY.value, s.region.value)
    if (!ind) return
    const t = ++yTok
    const d = await loadIndicatorData(ind)
    if (t === yTok) yData.value = d
  }

  watch(
    [() => s.scatterX.value, () => s.region.value, () => s.showScatter.value],
    () => { if (s.showScatter.value) loadX() },
    { immediate: true }
  )
  watch(
    [() => s.scatterY.value, () => s.region.value, () => s.showScatter.value],
    () => { if (s.showScatter.value) loadY() },
    { immediate: true }
  )

  /** dvojice (x,y) pro každou zemi regionu, která má obě hodnoty */
  const rawPoints = computed(() => {
    const xd = xData.value
    const yd = yData.value
    if (!xd || !yd) return [] as Omit<ScatterPoint, 'r' | 'cx' | 'cy' | 'color'>[]
    const year = s.selectedYear.value
    const europe = s.region.value === 'europe'
    const pop = s.populationData.value
    const out: Omit<ScatterPoint, 'r' | 'cx' | 'cy' | 'color'>[] = []
    for (const iso of countryIds.value) {
      if (europe && !isEuropean(iso)) continue
      const xv = valueAtOrNearest(xd, iso, year)
      const yv = valueAtOrNearest(yd, iso, year)
      if (!xv || !yv) continue
      const p = pop ? valueAtOrNearest(pop, iso, year)?.value ?? null : null
      out.push({ iso, name: nameFor(iso), x: xv.value, y: yv.value, pop: p, continent: continentOf(iso) })
    }
    return out
  })

  const xLogFeasible = computed(() => rawPoints.value.every((p) => p.x > 0) && rawPoints.value.length > 0)
  const yLogFeasible = computed(() => rawPoints.value.every((p) => p.y > 0) && rawPoints.value.length > 0)

  /** Pearsonův korelační koeficient (na zobrazených, příp. log hodnotách). */
  function pearson(pts: { vx: number; vy: number }[]): number | null {
    const n = pts.length
    if (n < 3) return null
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0
    for (const { vx, vy } of pts) {
      sx += vx; sy += vy; sxx += vx * vx; syy += vy * vy; sxy += vx * vy
    }
    const cov = sxy - (sx * sy) / n
    const dx = Math.sqrt(sxx - (sx * sx) / n)
    const dy = Math.sqrt(syy - (sy * sy) / n)
    if (dx === 0 || dy === 0) return null
    return cov / (dx * dy)
  }

  const chart = computed(() => {
    const pts = rawPoints.value
    if (pts.length < 2) return { enough: false } as const

    const useXLog = xLog.value && xLogFeasible.value
    const useYLog = yLog.value && yLogFeasible.value
    const tx = (v: number) => (useXLog ? Math.log10(v) : v)
    const ty = (v: number) => (useYLog ? Math.log10(v) : v)

    const xs = pts.map((p) => tx(p.x))
    const ys = pts.map((p) => ty(p.y))
    let xMin = Math.min(...xs), xMax = Math.max(...xs)
    let yMin = Math.min(...ys), yMax = Math.max(...ys)
    if (xMin === xMax) { xMin -= 1; xMax += 1 }
    if (yMin === yMax) { yMin -= 1; yMax += 1 }

    const innerW = SCATTER.width - SPAD.left - SPAD.right
    const innerH = SCATTER.height - SPAD.top - SPAD.bottom
    const sx = (v: number) => SPAD.left + ((tx(v) - xMin) / (xMax - xMin)) * innerW
    const sy = (v: number) => SPAD.top + (1 - (ty(v) - yMin) / (yMax - yMin)) * innerH

    const maxPop = Math.max(...pts.map((p) => p.pop ?? 0), 1)
    const radius = (pop: number | null) => {
      if (!pop) return 4
      return 4 + 22 * Math.sqrt(pop / maxPop)
    }

    const points: ScatterPoint[] = pts.map((p) => ({
      ...p,
      r: radius(p.pop),
      cx: sx(p.x),
      cy: sy(p.y),
      color: CONTINENT_COLORS[p.continent],
    }))

    const N = 4
    const xticks = Array.from({ length: N + 1 }, (_, i) => {
      const t = xMin + ((xMax - xMin) * i) / N
      return { x: SPAD.left + (i / N) * innerW, label: compactNumber(useXLog ? Math.pow(10, t) : t) }
    })
    const yticks = Array.from({ length: N + 1 }, (_, i) => {
      const t = yMin + ((yMax - yMin) * i) / N
      return { y: SPAD.top + (1 - i / N) * innerH, label: compactNumber(useYLog ? Math.pow(10, t) : t) }
    })

    const r = pearson(pts.map((p) => ({ vx: tx(p.x), vy: ty(p.y) })))

    // legenda kontinentů jen pro skutečně přítomné
    const present = CONTINENTS.filter((c) => pts.some((p) => p.continent === c))

    return {
      enough: true as const,
      points,
      xticks,
      yticks,
      baseY: SPAD.top + innerH,
      innerW,
      innerH,
      useXLog,
      useYLog,
      correlation: r,
      legend: present.map((c) => ({ name: c, color: CONTINENT_COLORS[c] })),
    }
  })

  return { chart, xInd, yInd, xLog, yLog, xLogFeasible, yLogFeasible, SCATTER, SPAD }
}
