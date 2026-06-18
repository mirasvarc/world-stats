// Konfigurace statistik + načítání dat (s historií po letech).
//
// Většina dat pochází ze World Bank API (otevřené, bez klíče):
//   https://api.worldbank.org/v2/country/all/indicator/<KÓD>?format=json&date=1995:2024
// Klíčem pro spojení s mapou je ISO-3166 alpha-3 kód země (countryiso3code).
//
// Průměrná mzda nemá čistý World Bank indikátor, proto se načítá z přibližného
// statického datasetu v public/avg-wage.json (čistá měsíční mzda v USD, orientačně).

export interface Indicator {
  id: string
  label: string
  unit: string
  group: string
  // true = vyšší hodnota je "lepší" (zelená), false = nižší je lepší (např. inflace)
  higherIsBetter: boolean
  source: 'worldbank' | 'static'
  code?: string
  file?: string
  decimals?: number
}

export const INDICATORS: Indicator[] = [
  // ── Ekonomika ───────────────────────────────────────────────
  { id: 'gdp', group: 'Ekonomika', label: 'HDP (celkové)', unit: 'USD', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.MKTP.CD', decimals: 0 },
  { id: 'gdp_pc', group: 'Ekonomika', label: 'HDP na obyvatele', unit: 'USD', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.PCAP.CD', decimals: 0 },
  { id: 'gdp_pc_ppp', group: 'Ekonomika', label: 'HDP na obyvatele (PPP)', unit: 'mezinár. $', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.PCAP.PP.CD', decimals: 0 },
  { id: 'gdp_growth', group: 'Ekonomika', label: 'Růst HDP', unit: '%', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.MKTP.KD.ZG', decimals: 1 },
  { id: 'inflation', group: 'Ekonomika', label: 'Inflace (CPI, roční)', unit: '%', higherIsBetter: false, source: 'worldbank', code: 'FP.CPI.TOTL.ZG', decimals: 1 },
  { id: 'unemployment', group: 'Ekonomika', label: 'Nezaměstnanost', unit: '%', higherIsBetter: false, source: 'worldbank', code: 'SL.UEM.TOTL.ZS', decimals: 1 },
  { id: 'exports', group: 'Ekonomika', label: 'Export zboží a služeb', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'NE.EXP.GNFS.ZS', decimals: 1 },
  { id: 'gini', group: 'Ekonomika', label: 'Příjmová nerovnost (Gini)', unit: 'index', higherIsBetter: false, source: 'worldbank', code: 'SI.POV.GINI', decimals: 1 },
  { id: 'avg_wage', group: 'Ekonomika', label: 'Průměrná mzda (přibližně)', unit: 'USD / měsíc', higherIsBetter: true, source: 'static', file: '/avg-wage.json', decimals: 0 },

  // ── Obyvatelstvo ────────────────────────────────────────────
  { id: 'population', group: 'Obyvatelstvo', label: 'Počet obyvatel', unit: 'obyvatel', higherIsBetter: true, source: 'worldbank', code: 'SP.POP.TOTL', decimals: 0 },
  { id: 'pop_growth', group: 'Obyvatelstvo', label: 'Růst populace', unit: '%', higherIsBetter: true, source: 'worldbank', code: 'SP.POP.GROW', decimals: 2 },
  { id: 'density', group: 'Obyvatelstvo', label: 'Hustota zalidnění', unit: 'obyv./km²', higherIsBetter: true, source: 'worldbank', code: 'EN.POP.DNST', decimals: 1 },
  { id: 'urban', group: 'Obyvatelstvo', label: 'Podíl městského obyvatelstva', unit: '%', higherIsBetter: true, source: 'worldbank', code: 'SP.URB.TOTL.IN.ZS', decimals: 1 },
  { id: 'fertility', group: 'Obyvatelstvo', label: 'Plodnost (dětí na ženu)', unit: 'dětí/ženu', higherIsBetter: true, source: 'worldbank', code: 'SP.DYN.TFRT.IN', decimals: 2 },

  // ── Zdraví & život ──────────────────────────────────────────
  { id: 'life', group: 'Zdraví & život', label: 'Očekávaná délka života', unit: 'let', higherIsBetter: true, source: 'worldbank', code: 'SP.DYN.LE00.IN', decimals: 1 },
  { id: 'infant_mort', group: 'Zdraví & život', label: 'Kojenecká úmrtnost', unit: 'na 1000', higherIsBetter: false, source: 'worldbank', code: 'SP.DYN.IMRT.IN', decimals: 1 },
  { id: 'health_exp', group: 'Zdraví & život', label: 'Výdaje na zdravotnictví', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'SH.XPD.CHEX.GD.ZS', decimals: 1 },
  { id: 'hosp_beds', group: 'Zdraví & život', label: 'Nemocniční lůžka', unit: 'na 1000', higherIsBetter: true, source: 'worldbank', code: 'SH.MED.BEDS.ZS', decimals: 1 },
  { id: 'suicide', group: 'Zdraví & život', label: 'Sebevraždy', unit: 'na 100 tis.', higherIsBetter: false, source: 'worldbank', code: 'SH.STA.SUIC.P5', decimals: 1 },

  // ── Vzdělání, technologie & ekologie ────────────────────────
  { id: 'edu_exp', group: 'Vzdělání & technologie & ekologie', label: 'Výdaje na vzdělání', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'SE.XPD.TOTL.GD.ZS', decimals: 1 },
  { id: 'internet', group: 'Vzdělání & technologie & ekologie', label: 'Uživatelé internetu', unit: '%', higherIsBetter: true, source: 'worldbank', code: 'IT.NET.USER.ZS', decimals: 1 },
  { id: 'mobile', group: 'Vzdělání & technologie & ekologie', label: 'Mobilní předplatné', unit: 'na 100 lidí', higherIsBetter: true, source: 'worldbank', code: 'IT.CEL.SETS.P2', decimals: 1 },
  { id: 'electricity', group: 'Vzdělání & technologie & ekologie', label: 'Přístup k elektřině', unit: '%', higherIsBetter: true, source: 'worldbank', code: 'EG.ELC.ACCS.ZS', decimals: 1 },
  { id: 'co2', group: 'Vzdělání & technologie & ekologie', label: 'Emise CO₂ na obyvatele', unit: 't/rok', higherIsBetter: false, source: 'worldbank', code: 'EN.GHG.CO2.PC.CE.AR5', decimals: 2 },
]

export interface IndicatorData {
  // iso3 -> (rok -> hodnota)
  byCountry: Record<string, Record<number, number>>
  years: number[] // seřazené roky, které mají alespoň nějaká data
  minYear: number
  maxYear: number
  bestYear: number // rok s nejlepším pokrytím (vhodný jako výchozí)
  isStatic: boolean
}

const STATIC_YEAR = 2024 // reprezentativní rok pro statické datasety bez historie

const cache = new Map<string, IndicatorData>()

export async function loadIndicatorData(ind: Indicator): Promise<IndicatorData> {
  if (cache.has(ind.id)) return cache.get(ind.id)!

  const byCountry: Record<string, Record<number, number>> = {}
  const coverage: Record<number, number> = {}

  if (ind.source === 'static') {
    const raw = await fetch(ind.file!).then((r) => r.json())
    for (const [iso3, value] of Object.entries(raw as Record<string, unknown>)) {
      if (iso3.startsWith('_') || typeof value !== 'number') continue
      byCountry[iso3.toUpperCase()] = { [STATIC_YEAR]: value }
      coverage[STATIC_YEAR] = (coverage[STATIC_YEAR] ?? 0) + 1
    }
    const result: IndicatorData = {
      byCountry,
      years: [STATIC_YEAR],
      minYear: STATIC_YEAR,
      maxYear: STATIC_YEAR,
      bestYear: STATIC_YEAR,
      isStatic: true,
    }
    cache.set(ind.id, result)
    return result
  }

  // World Bank – stáhneme rozsah let a uložíme všechny hodnoty po letech
  const url =
    `https://api.worldbank.org/v2/country/all/indicator/${ind.code}` +
    `?format=json&per_page=20000&date=1995:2024`
  const json = await fetch(url).then((r) => r.json())
  const rows: any[] = Array.isArray(json) && json.length > 1 ? json[1] : []

  for (const row of rows) {
    const iso3: string = row.countryiso3code
    if (!iso3 || iso3.length !== 3 || row.value == null) continue
    const year = Number(row.date)
    ;(byCountry[iso3] ??= {})[year] = Number(row.value)
    coverage[year] = (coverage[year] ?? 0) + 1
  }

  const years = Object.keys(coverage).map(Number).sort((a, b) => a - b)
  // výchozí rok = nejnovější dostupný rok s daty
  const defaultYear = years[years.length - 1] ?? STATIC_YEAR

  const result: IndicatorData = {
    byCountry,
    years,
    minYear: years[0] ?? STATIC_YEAR,
    maxYear: years[years.length - 1] ?? STATIC_YEAR,
    bestYear: defaultYear,
    isStatic: false,
  }
  cache.set(ind.id, result)
  return result
}

// Hodnota pro zemi v daném roce (přesně daný rok, jinak null)
export function valueAt(
  d: IndicatorData | null,
  iso3: string,
  year: number
): number | null {
  const v = d?.byCountry[iso3]?.[year]
  return v == null ? null : v
}

// Formátování hodnoty pro zobrazení
export function formatValue(value: number, ind: Indicator): string {
  const decimals = ind.decimals ?? 0
  const big = ind.id === 'gdp' || ind.id === 'population'
  if (big && Math.abs(value) >= 1e9) {
    return (value / 1e9).toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' mld'
  }
  if (big && Math.abs(value) >= 1e6) {
    return (value / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' mil'
  }
  return value.toLocaleString('cs-CZ', { maximumFractionDigits: decimals })
}
