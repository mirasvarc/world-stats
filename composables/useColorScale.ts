// Barevná logika mapy: obarvení země podle porovnání s referenční zemí
// ve zvoleném roce. Sdílená mezi mapou (Leaflet) a tečkami v žebříčku.

import { valueAt } from './useStatsData'
import { useWorldStats } from './useWorldStats'
import { useRanking } from './useRanking'

export interface LeafletStyle {
  fillColor: string
  fillOpacity: number
  color: string
  weight: number
}

// Plynulá škála zelená → žlutá → červená podle „dobrosti" g ∈ [0,1]
// (1 = nejlepší = zelená, 0 = nejhorší = červená).
const SCALE_STOPS = [
  [239, 68, 68], // #ef4444 červená (nejhorší)
  [234, 179, 8], // #eab308 žlutá (střed)
  [34, 197, 94], // #22c55e zelená (nejlepší)
]
function scaleColor(g: number): string {
  const t = Math.max(0, Math.min(1, g)) * 2
  const i = Math.min(1, Math.floor(t))
  const f = t - i
  const a = SCALE_STOPS[i]
  const b = SCALE_STOPS[i + 1]
  const r = Math.round(a[0] + (b[0] - a[0]) * f)
  const gg = Math.round(a[1] + (b[1] - a[1]) * f)
  const bl = Math.round(a[2] + (b[2] - a[2]) * f)
  return `rgb(${r}, ${gg}, ${bl})`
}

export const COLORS = {
  selected: '#2563eb',
  selectedStroke: '#1e3a8a',
  better: '#22c55e',
  worse: '#ef4444',
  noData: '#d4d4d8',
  neutral: '#94a3b8',
  stroke: '#fff',
}

export function useColorScale() {
  const s = useWorldStats()
  const { ranking } = useRanking()

  // Mapa iso3 → barva podle pořadí v aktuálním roce (#1 = zelená … poslední = červená).
  // Pořadí už respektuje `higherIsBetter`, takže „dobrost" plyne přímo z ranku.
  const valueColors = computed(() => {
    const rows = ranking.value
    const n = rows.length
    const m = new Map<string, string>()
    for (const r of rows) {
      const good = n <= 1 ? 1 : (n - r.rank) / (n - 1)
      m.set(r.iso3, scaleColor(good))
    }
    return m
  })

  function styleFor(iso3: string): LeafletStyle {
    const value = valueAt(s.data.value, iso3, s.selectedYear.value)

    if (value == null) {
      return { fillColor: COLORS.noData, fillOpacity: 0.6, color: COLORS.stroke, weight: 1 }
    }
    if (!s.selectedIso3.value) {
      // Bez vybrané země: obarvit podle absolutní hodnoty (choropleth).
      return {
        fillColor: valueColors.value.get(iso3) ?? COLORS.neutral,
        fillOpacity: 0.7,
        color: COLORS.stroke,
        weight: 1,
      }
    }
    if (iso3 === s.selectedIso3.value) {
      return { fillColor: COLORS.selected, fillOpacity: 0.95, color: COLORS.selectedStroke, weight: 2 }
    }

    const threshold = valueAt(s.data.value, s.selectedIso3.value, s.selectedYear.value)
    if (threshold == null) {
      return { fillColor: COLORS.noData, fillOpacity: 0.6, color: COLORS.stroke, weight: 1 }
    }

    const diff = value - threshold
    const better = s.currentIndicator.value.higherIsBetter ? diff > 0 : diff < 0
    const rel = Math.min(Math.abs(diff) / (Math.abs(threshold) || 1), 1)
    const fillOpacity = 0.35 + 0.55 * rel

    return {
      fillColor: better ? COLORS.better : COLORS.worse,
      fillOpacity,
      color: COLORS.stroke,
      weight: 1,
    }
  }

  /** jen výplňová barva (pro tečku v žebříčku) */
  function colorFor(iso3: string): string {
    return styleFor(iso3).fillColor
  }

  return { styleFor, colorFor }
}
