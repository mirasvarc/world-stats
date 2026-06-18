// Barevná logika mapy: obarvení země podle porovnání s referenční zemí
// ve zvoleném roce. Sdílená mezi mapou (Leaflet) a tečkami v žebříčku.

import { valueAt } from './useStatsData'
import { useWorldStats } from './useWorldStats'

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

  function styleFor(iso3: string): LeafletStyle {
    const value = valueAt(s.data.value, iso3, s.selectedYear.value)

    if (value == null) {
      return { fillColor: COLORS.noData, fillOpacity: 0.6, color: COLORS.stroke, weight: 1 }
    }
    if (!s.selectedIso3.value) {
      return { fillColor: COLORS.neutral, fillOpacity: 0.55, color: COLORS.stroke, weight: 1 }
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
