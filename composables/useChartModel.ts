// Model grafu vývoje v čase: sestaví geometrii sérií (čar) pro referenční
// a porovnávané země, s podporou lineární i logaritmické osy Y.

import { useWorldStats } from './useWorldStats'
import { useGeo } from './useGeo'
import { compactNumber } from './useFormat'

export const CHART = { width: 680, height: 360 }
export const PAD = { top: 24, right: 26, bottom: 42, left: 70 }
export const PALETTE = ['#2563eb', '#ef4444', '#16a34a', '#a855f7', '#0891b2', '#f59e0b']
export const MAX_COMPARE = 5

export interface ChartPoint {
  year: number
  value: number
  x: number
  y: number
}
export interface ChartSeries {
  iso: string
  name: string
  color: string
  coords: ChartPoint[]
  line: string
}

export function useChartModel() {
  const s = useWorldStats()
  const { nameFor, isRealCountry } = useGeo()

  /** země v grafu: referenční (první) + porovnávané, bez duplicit */
  const chartIsos = computed(() =>
    Array.from(
      new Set([s.selectedIso3.value, ...s.compareIsos.value].filter(Boolean) as string[])
    )
  )

  /** lze použít log osu? (jen pro kladné hodnoty) */
  const logFeasible = computed(() => {
    const d = s.data.value
    if (!d) return false
    let min = Infinity
    for (const iso of chartIsos.value) {
      const by = d.byCountry[iso] || {}
      for (const k in by) min = Math.min(min, by[k])
    }
    return min !== Infinity && min > 0
  })

  /** nabídka zemí k porovnání (mají data, nejsou už v grafu) */
  const comparableCountries = computed(() => {
    const d = s.data.value
    if (!d) return [] as { iso3: string; name: string }[]
    return Object.keys(d.byCountry)
      .filter((iso) => isRealCountry(iso) && !chartIsos.value.includes(iso))
      .map((iso) => ({ iso3: iso, name: nameFor(iso) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  })

  const chart = computed(() => {
    const d = s.data.value
    if (!s.ready.value || !d || !s.selectedIso3.value) return null

    const seriesRaw = chartIsos.value
      .map((iso, idx) => {
        const byYear = d.byCountry[iso] || {}
        const pts = Object.keys(byYear)
          .map(Number)
          .sort((a, b) => a - b)
          .map((y) => ({ year: y, value: byYear[y] }))
        return { iso, name: nameFor(iso), color: PALETTE[idx % PALETTE.length], pts }
      })
      .filter((ser) => ser.pts.length > 0)

    const allPts = seriesRaw.flatMap((ser) => ser.pts)
    if (allPts.length < 2 || seriesRaw.length === 0) return { enough: false } as const

    const years = allPts.map((p) => p.year)
    const x0 = Math.min(...years)
    const x1 = Math.max(...years)
    const vals = allPts.map((p) => p.value)
    const minY = Math.min(...vals)
    const maxY = Math.max(...vals)

    const useLog = s.yScaleMode.value === 'log' && logFeasible.value
    const tv = (v: number) => (useLog ? Math.log10(v) : v)
    let lo = tv(minY)
    let hi = tv(maxY)
    if (lo === hi) {
      const pad = Math.abs(lo) || 1
      lo -= pad
      hi += pad
    }

    const innerW = CHART.width - PAD.left - PAD.right
    const innerH = CHART.height - PAD.top - PAD.bottom
    const baseY = PAD.top + innerH
    const sx = (yr: number) => PAD.left + ((yr - x0) / (x1 - x0 || 1)) * innerW
    const sy = (v: number) => PAD.top + (1 - (tv(v) - lo) / (hi - lo)) * innerH

    const series: ChartSeries[] = seriesRaw.map((ser) => {
      const coords = ser.pts.map((p) => ({ ...p, x: sx(p.year), y: sy(p.value) }))
      const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
      return { iso: ser.iso, name: ser.name, color: ser.color, coords, line }
    })

    const single = series.length === 1
    const area = single
      ? `${PAD.left},${baseY} ${series[0].line} ${PAD.left + innerW},${baseY}`
      : null

    const N = 4
    const yticks = Array.from({ length: N + 1 }, (_, i) => {
      const t = lo + ((hi - lo) * i) / N
      const v = useLog ? Math.pow(10, t) : t
      return { y: PAD.top + (1 - i / N) * innerH, label: compactNumber(v) }
    })

    const step = Math.max(1, Math.round((x1 - x0) / 7))
    const xticks: { yr: number; x: number }[] = []
    for (let yr = x0; yr <= x1; yr += step) xticks.push({ yr, x: sx(yr) })
    if (xticks[xticks.length - 1]?.yr !== x1) xticks.push({ yr: x1, x: sx(x1) })

    const main = series[0]
    const selPoint = main.coords.find((c) => c.year === s.selectedYear.value) ?? null
    const first = main.coords[0].value
    const last = main.coords[main.coords.length - 1].value
    const change = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : null

    return {
      enough: true as const,
      series,
      single,
      area,
      yticks,
      xticks,
      baseY,
      selPoint,
      x0,
      x1,
      first,
      last,
      change,
      useLog,
    }
  })

  function addCompare(iso3: string) {
    s.addCompare(iso3, MAX_COMPARE)
  }
  function removeCompare(iso3: string) {
    s.removeCompare(iso3)
  }

  return {
    chart,
    logFeasible,
    comparableCountries,
    addCompare,
    removeCompare,
    CHART,
    PAD,
    MAX_COMPARE,
  }
}
