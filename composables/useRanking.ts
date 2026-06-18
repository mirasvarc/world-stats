// Žebříček zemí podle aktuální statistiky a roku (#1 = nejlepší).

import { useWorldStats } from './useWorldStats'
import { useGeo } from './useGeo'

export interface RankRow {
  iso3: string
  name: string
  value: number
  rank: number
}

export function useRanking() {
  const s = useWorldStats()
  const { nameFor, isRealCountry } = useGeo()

  const ranking = computed<RankRow[]>(() => {
    const d = s.data.value
    if (!d) return []
    const higher = s.currentIndicator.value.higherIsBetter
    const year = s.selectedYear.value

    const rows: { iso3: string; name: string; value: number }[] = []
    for (const iso3 of Object.keys(d.byCountry)) {
      if (!isRealCountry(iso3)) continue // jen reálné země z mapy
      const v = d.byCountry[iso3][year]
      if (v == null) continue
      rows.push({ iso3, name: nameFor(iso3), value: v })
    }
    rows.sort((a, b) => (higher ? b.value - a.value : a.value - b.value))
    return rows.map((r, i) => ({ ...r, rank: i + 1 }))
  })

  const selectedRank = computed(() => {
    if (!s.selectedIso3.value) return null
    const r = ranking.value.find((x) => x.iso3 === s.selectedIso3.value)
    return r ? { rank: r.rank, total: ranking.value.length } : null
  })

  return { ranking, selectedRank }
}
