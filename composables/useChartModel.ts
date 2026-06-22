// Model grafu vývoje v čase: sestaví geometrii sérií (čar) pro referenční
// a porovnávané země, s podporou lineární i logaritmické osy Y.

import { useWorldStats } from './useWorldStats'
import { useGeo } from './useGeo'
import { compactNumber } from './useFormat'
import { isEuropean } from './useContinents'

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
  dashed?: boolean
  isMedian?: boolean
}

export const MEDIAN_COLOR = '#64748b'

/** medián pole čísel (předpokládá neprázdné, neseřazené pole) */
function median(vals: number[]): number {
  const a = [...vals].sort((x, y) => x - y)
  const mid = a.length >> 1
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

export function useChartModel() {
  const s = useWorldStats()
  const { nameFor, isRealCountry } = useGeo()

  /** zobrazit linku světového mediánu? */
  const showMedian = ref(true)

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

    const countryPts = seriesRaw.flatMap((ser) => ser.pts)
    if (countryPts.length < 2 || seriesRaw.length === 0) return { enough: false } as const

    const years = countryPts.map((p) => p.year)
    const x0 = Math.min(...years)
    const x1 = Math.max(...years)

    const useLog = s.yScaleMode.value === 'log' && logFeasible.value

    // medián za rok (jen reálné země s daty) – v rozsahu let grafu
    // v režimu Evropa počítán jen z evropských zemí
    const europe = s.region.value === 'europe'
    let medianPts: { year: number; value: number }[] = []
    if (showMedian.value) {
      for (let yr = x0; yr <= x1; yr++) {
        const vals: number[] = []
        for (const iso in d.byCountry) {
          if (!isRealCountry(iso)) continue
          if (europe && !isEuropean(iso)) continue
          const v = d.byCountry[iso][yr]
          if (v != null) vals.push(v)
        }
        if (vals.length) medianPts.push({ year: yr, value: median(vals) })
      }
      // log osa nezobrazí nekladné hodnoty
      if (useLog) medianPts = medianPts.filter((p) => p.value > 0)
      if (medianPts.length < 2) medianPts = []
    }

    const allPts = [...countryPts, ...medianPts]
    const vals = allPts.map((p) => p.value)
    const minY = Math.min(...vals)
    const maxY = Math.max(...vals)

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

    const buildLine = (pts: { year: number; value: number }[]): ChartPoint[] =>
      pts.map((p) => ({ ...p, x: sx(p.year), y: sy(p.value) }))

    const countrySeries: ChartSeries[] = seriesRaw.map((ser) => {
      const coords = buildLine(ser.pts)
      const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
      return { iso: ser.iso, name: ser.name, color: ser.color, coords, line }
    })

    const medianSeries: ChartSeries | null = medianPts.length
      ? (() => {
          const coords = buildLine(medianPts)
          return {
            iso: '__median',
            name: europe ? 'medián Evropy' : 'medián světa',
            color: MEDIAN_COLOR,
            coords,
            line: coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' '),
            dashed: true,
            isMedian: true,
          }
        })()
      : null

    // medián vykreslíme jako poslední, ať barvy/pořadí zemí zůstanou
    const series: ChartSeries[] = medianSeries
      ? [...countrySeries, medianSeries]
      : countrySeries

    const single = countrySeries.length === 1
    const area = single
      ? `${PAD.left},${baseY} ${countrySeries[0].line} ${PAD.left + innerW},${baseY}`
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
    showMedian,
    addCompare,
    removeCompare,
    CHART,
    PAD,
    MAX_COMPARE,
  }
}
