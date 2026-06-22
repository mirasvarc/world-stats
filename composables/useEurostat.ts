// Načítání dat z Eurostatu (REST „dissemination" API, formát JSON-stat 2.0).
//
//   https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<dataset>?format=JSON&...
//
// Eurostat používá v dimenzi `geo` 2místné kódy (většinou ISO-3166 alpha-2,
// ale s výjimkami: EL = Řecko, UK = Spojené království). Mapa aplikace pracuje
// s ISO-3 alpha-3, proto kódy překládáme. Agregáty (EU27_2020, EA20, …) nemají
// záznam v mapě a tiše se přeskočí.

import type { Indicator } from './useIndicators'
import type { IndicatorData } from './useStatsData'

const EUROSTAT_BASE =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'

// Eurostat geo (ISO-2 + výjimky) → ISO-3 alpha-3
const EU2_TO_ISO3: Record<string, string> = {
  AT: 'AUT', BE: 'BEL', BG: 'BGR', HR: 'HRV', CY: 'CYP', CZ: 'CZE', DK: 'DNK',
  EE: 'EST', FI: 'FIN', FR: 'FRA', DE: 'DEU', EL: 'GRC', HU: 'HUN', IE: 'IRL',
  IT: 'ITA', LV: 'LVA', LT: 'LTU', LU: 'LUX', MT: 'MLT', NL: 'NLD', PL: 'POL',
  PT: 'PRT', RO: 'ROU', SK: 'SVK', SI: 'SVN', ES: 'ESP', SE: 'SWE',
  IS: 'ISL', NO: 'NOR', CH: 'CHE', LI: 'LIE',
  UK: 'GBR', TR: 'TUR', BA: 'BIH', ME: 'MNE', MK: 'MKD', RS: 'SRB', AL: 'ALB',
  XK: 'XKX', MD: 'MDA', UA: 'UKR', BY: 'BLR', RU: 'RUS',
  AD: 'AND', MC: 'MCO', SM: 'SMR', VA: 'VAT',
}

const START_YEAR = 1995

/** Sestaví URL pro Eurostat dataset s připnutými filtry dimenzí. */
function buildUrl(ind: Indicator): string {
  const p = new URLSearchParams()
  p.set('format', 'JSON')
  p.set('lang', 'EN')
  p.set('sinceTimePeriod', String(START_YEAR))
  for (const [dim, val] of Object.entries(ind.filters ?? {})) p.set(dim, val)
  return `${EUROSTAT_BASE}${ind.dataset}?${p.toString()}`
}

/**
 * Parsuje JSON-stat. Hodnoty jsou uloženy řídce v `value` pod klíčem = lineární
 * index (row-major) přes všechny dimenze. Díky připnutým filtrům mají všechny
 * dimenze kromě `geo` a `time` velikost 1 (index 0), takže do indexu přispívají
 * jen geo a time.
 */
export async function loadEurostat(ind: Indicator): Promise<IndicatorData> {
  const json = await fetch(buildUrl(ind)).then((r) => r.json())
  const ids: string[] = json.id ?? []
  const sizes: number[] = json.size ?? []
  const values: Record<string, number> = json.value ?? {}

  const gi = ids.indexOf('geo')
  const ti = ids.indexOf('time')
  if (gi < 0 || ti < 0) throw new Error('Eurostat: chybí dimenze geo/time')

  // krok (stride) dimenze = součin velikostí všech dimenzí za ní (row-major)
  const stride = (i: number) => sizes.slice(i + 1).reduce((a, b) => a * b, 1)
  const geoStride = stride(gi)
  const timeStride = stride(ti)

  const geoIndex: Record<string, number> = json.dimension.geo.category.index
  const timeIndex: Record<string, number> = json.dimension.time.category.index

  // Čas může být i področní (např. minimální mzda: „2024-S1", „2024-S2").
  // Bereme jen rok; chronologickým pořadím zajistíme, že poslední období roku vyhraje.
  const timeEntries = Object.entries(timeIndex).sort((a, b) => a[1] - b[1])

  const byCountry: Record<string, Record<number, number>> = {}
  const yearsSet = new Set<number>()

  for (const [code, gpos] of Object.entries(geoIndex)) {
    const iso3 = EU2_TO_ISO3[code]
    if (!iso3) continue // přeskočí agregáty (EU27_2020, EA20, …)
    for (const [yr, tpos] of timeEntries) {
      const ym = /^(\d{4})/.exec(yr)
      if (!ym) continue
      const year = Number(ym[1])
      const flat = gpos * geoStride + tpos * timeStride
      const v = values[flat]
      if (v == null) continue
      ;(byCountry[iso3] ??= {})[year] = Number(v) // pozdější pololetí přepíše dřívější
      yearsSet.add(year)
    }
  }

  const years = [...yearsSet].sort((a, b) => a - b)
  return {
    byCountry,
    years,
    minYear: years[0] ?? START_YEAR,
    maxYear: years[years.length - 1] ?? START_YEAR,
    defaultYear: years[years.length - 1] ?? START_YEAR,
    isStatic: false,
  }
}
