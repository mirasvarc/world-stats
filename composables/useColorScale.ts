// Barevná logika mapy: obarvení země podle porovnání s referenční zemí
// ve zvoleném roce. Sdílená mezi mapou (Leaflet) a tečkami v žebříčku.

import { useWorldStats } from './useWorldStats'
import { useRanking } from './useRanking'
import { isEuropean } from './useContinents'
import { scaleColor } from './colorMath'

export interface LeafletStyle {
  fillColor: string
  fillOpacity: number
  color: string
  weight: number
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
    // V režimu Evropa jsou mimoevropské země ztlumené (mimo zájem).
    if (s.region.value === 'europe' && !isEuropean(iso3)) {
      return { fillColor: COLORS.noData, fillOpacity: 0.12, color: COLORS.stroke, weight: 0.5 }
    }

    const eff = s.effectiveValue(iso3)

    if (eff == null) {
      return { fillColor: COLORS.noData, fillOpacity: 0.6, color: COLORS.stroke, weight: 1 }
    }
    if (!s.referenceValue.value) {
      // Bez reference: obarvit podle absolutní hodnoty (choropleth).
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

    const threshold = s.referenceValue.value.value
    const diff = eff.value - threshold
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
