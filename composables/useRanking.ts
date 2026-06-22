// Žebříček zemí podle aktuální statistiky a roku (#1 = nejlepší).

import { useWorldStats } from './useWorldStats'
import { useGeo } from './useGeo'
import { continentOf, isEuropean, type Continent } from './useContinents'

export interface RankRow {
  iso3: string
  name: string
  value: number
  /** rok, ze kterého hodnota pochází (kvůli fallbacku může být jiný než zvolený) */
  valueYear: number
  /** false = hodnota doplněna z jiného roku */
  exact: boolean
  rank: number
  continent: Continent
}

export function useRanking() {
  const s = useWorldStats()
  const { nameFor, isRealCountry } = useGeo()

  const ranking = computed<RankRow[]>(() => {
    const d = s.data.value
    if (!d) return []
    const higher = s.currentIndicator.value.higherIsBetter

    const europe = s.region.value === 'europe'
    const rows: { iso3: string; name: string; value: number; valueYear: number; exact: boolean }[] = []
    for (const iso3 of Object.keys(d.byCountry)) {
      if (!isRealCountry(iso3)) continue // jen reálné země z mapy
      if (europe && !isEuropean(iso3)) continue // v Evropě jen evropské země
      const eff = s.effectiveValue(iso3) // fallback na nejbližší rok + per-capita
      if (!eff) continue
      rows.push({ iso3, name: nameFor(iso3), value: eff.value, valueYear: eff.year, exact: eff.exact })
    }
    rows.sort((a, b) => (higher ? b.value - a.value : a.value - b.value))
    return rows.map((r, i) => ({ ...r, rank: i + 1, continent: continentOf(r.iso3) }))
  })

  const selectedRank = computed(() => {
    if (!s.selectedIso3.value) return null
    const r = ranking.value.find((x) => x.iso3 === s.selectedIso3.value)
    return r ? { rank: r.rank, total: ranking.value.length } : null
  })

  return { ranking, selectedRank }
}
