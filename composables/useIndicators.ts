// Konfigurace dostupných statistik (indikátorů).
//
// Přidání další statistiky = přidat položku do INDICATORS. U World Bank stačí
// vyplnit `code` (kód indikátoru, viz https://data.worldbank.org/indicator),
// u statického datasetu `file` (cesta do /public). `higherIsBetter` určuje,
// zda vyšší hodnota znamená „lepší" (zelená) – u inflace, nezaměstnanosti apod. je false.

export type Region = 'world' | 'europe'

export interface Indicator {
  id: string
  label: string
  unit: string
  group: string
  /** true = vyšší hodnota je „lepší" (zelená); false = nižší je lepší (např. inflace) */
  higherIsBetter: boolean
  source: 'worldbank' | 'static' | 'eurostat'
  /** kód World Bank indikátoru (pro source === 'worldbank') */
  code?: string
  /** cesta k JSON datasetu v /public (pro source === 'static') */
  file?: string
  /** Eurostat dataset (pro source === 'eurostat') */
  dataset?: string
  /** připnuté filtry dimenzí Eurostatu (vše kromě geo/time musí být 1 hodnota) */
  filters?: Record<string, string>
  /** počet desetinných míst při zobrazení */
  decimals?: number
  /**
   * Pokud je vyplněno, lze metriku zobrazit „na obyvatele" (hodnota / populace).
   * Vhodné pro absolutní metriky (HDP celkové, turistické příjezdy), kde by jinak
   * dominovaly velké země. Určuje jednotku a formát výsledné per-capita hodnoty.
   */
  perCapita?: { unit: string; decimals?: number }
}

export interface IndicatorGroup {
  name: string
  items: Indicator[]
}

export const INDICATORS: Indicator[] = [
  // ── Ekonomika ───────────────────────────────────────────────
  { id: 'gdp', group: 'Ekonomika', label: 'HDP (celkové)', unit: 'USD', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.MKTP.CD', decimals: 0, perCapita: { unit: 'USD / obyv.', decimals: 0 } },
  { id: 'gdp_pc', group: 'Ekonomika', label: 'HDP na obyvatele', unit: 'USD', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.PCAP.CD', decimals: 0 },
  { id: 'gdp_pc_ppp', group: 'Ekonomika', label: 'HDP na obyvatele (PPP)', unit: 'mezinár. $', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.PCAP.PP.CD', decimals: 0 },
  { id: 'gdp_growth', group: 'Ekonomika', label: 'Růst HDP', unit: '%', higherIsBetter: true, source: 'worldbank', code: 'NY.GDP.MKTP.KD.ZG', decimals: 1 },
  { id: 'inflation', group: 'Ekonomika', label: 'Inflace (CPI, roční)', unit: '%', higherIsBetter: false, source: 'worldbank', code: 'FP.CPI.TOTL.ZG', decimals: 1 },
  { id: 'unemployment', group: 'Ekonomika', label: 'Nezaměstnanost', unit: '%', higherIsBetter: false, source: 'worldbank', code: 'SL.UEM.TOTL.ZS', decimals: 1 },
  { id: 'exports', group: 'Ekonomika', label: 'Export zboží a služeb', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'NE.EXP.GNFS.ZS', decimals: 1 },
  { id: 'gini', group: 'Ekonomika', label: 'Příjmová nerovnost (Gini)', unit: 'index', higherIsBetter: false, source: 'worldbank', code: 'SI.POV.GINI', decimals: 1 },
  { id: 'avg_wage', group: 'Ekonomika', label: 'Průměrná mzda (přibližně)', unit: 'USD / měsíc', higherIsBetter: true, source: 'static', file: '/avg-wage.json', decimals: 0 },
  { id: 'tax_rev', group: 'Ekonomika', label: 'Daňové příjmy', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'GC.TAX.TOTL.GD.ZS', decimals: 1 },
  { id: 'gov_debt', group: 'Ekonomika', label: 'Státní dluh', unit: '% HDP', higherIsBetter: false, source: 'worldbank', code: 'GC.DOD.TOTL.GD.ZS', decimals: 1 },
  { id: 'fdi', group: 'Ekonomika', label: 'Přímé zahraniční investice', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'BX.KLT.DINV.WD.GD.ZS', decimals: 1 },
  { id: 'rnd', group: 'Ekonomika', label: 'Výdaje na výzkum a vývoj', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'GB.XPD.RSDV.GD.ZS', decimals: 2 },
  { id: 'military', group: 'Ekonomika', label: 'Vojenské výdaje', unit: '% HDP', higherIsBetter: false, source: 'worldbank', code: 'MS.MIL.XPND.GD.ZS', decimals: 1 },
  { id: 'tourism', group: 'Ekonomika', label: 'Turistické příjezdy', unit: 'příjezdů/rok', higherIsBetter: true, source: 'worldbank', code: 'ST.INT.ARVL', decimals: 0, perCapita: { unit: 'příjezdů / obyv.', decimals: 2 } },
  { id: 'poverty', group: 'Ekonomika', label: 'Extrémní chudoba (pod $2,15/den)', unit: '%', higherIsBetter: false, source: 'worldbank', code: 'SI.POV.DDAY', decimals: 1 },

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
  { id: 'renewable', group: 'Vzdělání & technologie & ekologie', label: 'Obnovitelná energie', unit: '% spotřeby', higherIsBetter: true, source: 'worldbank', code: 'EG.FEC.RNEW.ZS', decimals: 1 },
  { id: 'forest', group: 'Vzdělání & technologie & ekologie', label: 'Lesní plocha', unit: '% území', higherIsBetter: true, source: 'worldbank', code: 'AG.LND.FRST.ZS', decimals: 1 },
]

// ── Eurostat (jen pro režim „Evropa") ───────────────────────────
//
// Indikátory se SHODNÝM `id` jako ve World Bank seznamu nahrazují v Evropě
// méně přesný World Bank zdroj (harmonizovaná / přímo měřená data EU).
// Indikátory s novým `id` jsou evropské statistiky navíc.
export const EUROSTAT_INDICATORS: Indicator[] = [
  // ── Náhrady přesnějšími daty EU (stejné id jako World Bank) ──
  { id: 'population', group: 'Obyvatelstvo', label: 'Počet obyvatel (Eurostat)', unit: 'obyvatel', higherIsBetter: true, source: 'eurostat', dataset: 'demo_pjan', filters: { unit: 'NR', age: 'TOTAL', sex: 'T' }, decimals: 0 },
  { id: 'life', group: 'Zdraví & život', label: 'Očekávaná délka života (Eurostat)', unit: 'let', higherIsBetter: true, source: 'eurostat', dataset: 'demo_mlexpec', filters: { unit: 'YR', sex: 'T', age: 'Y_LT1' }, decimals: 1 },
  { id: 'inflation', group: 'Ekonomika', label: 'Inflace (HICP, Eurostat)', unit: '%', higherIsBetter: false, source: 'eurostat', dataset: 'prc_hicp_aind', filters: { unit: 'RCH_A_AVG', coicop: 'CP00' }, decimals: 1 },
  { id: 'unemployment', group: 'Ekonomika', label: 'Nezaměstnanost (Eurostat)', unit: '%', higherIsBetter: false, source: 'eurostat', dataset: 'une_rt_a', filters: { age: 'Y15-74', unit: 'PC_ACT', sex: 'T' }, decimals: 1 },
  { id: 'gdp_growth', group: 'Ekonomika', label: 'Růst HDP (Eurostat)', unit: '%', higherIsBetter: true, source: 'eurostat', dataset: 'tec00115', filters: { unit: 'CLV_PCH_PRE', na_item: 'B1GQ' }, decimals: 1 },

  // ── Nové evropské statistiky ──
  { id: 'eu_poverty', group: 'Ekonomika', label: 'Ohrožení chudobou nebo soc. vyloučením', unit: '%', higherIsBetter: false, source: 'eurostat', dataset: 'ilc_peps01n', filters: { unit: 'PC', age: 'TOTAL', sex: 'T' }, decimals: 1 },
  { id: 'eu_min_wage', group: 'Ekonomika', label: 'Minimální mzda', unit: 'EUR / měsíc', higherIsBetter: true, source: 'eurostat', dataset: 'earn_mw_cur', filters: { currency: 'EUR' }, decimals: 0 },
]

const BASE_BY_ID = new Map(INDICATORS.map((i) => [i.id, i]))
const EU_BY_ID = new Map(EUROSTAT_INDICATORS.map((i) => [i.id, i]))

/** Vrátí indikátor podle id; v Evropě upřednostní přesnější Eurostat variantu. */
export function getIndicator(id: string, region: Region = 'world'): Indicator | undefined {
  if (region === 'europe') {
    const eu = EU_BY_ID.get(id)
    if (eu) return eu
  }
  return BASE_BY_ID.get(id)
}

export function isValidIndicatorId(
  id: string | null | undefined,
  region: Region = 'world'
): boolean {
  if (!id) return false
  if (region === 'europe') return EU_BY_ID.has(id) || BASE_BY_ID.has(id)
  return BASE_BY_ID.has(id)
}

/** Seznam indikátorů pro daný region (Evropa = náhrady + evropské statistiky navíc). */
export function indicatorsForRegion(region: Region): Indicator[] {
  if (region !== 'europe') return INDICATORS
  const out = INDICATORS.map((i) => EU_BY_ID.get(i.id) ?? i)
  for (const eu of EUROSTAT_INDICATORS) if (!BASE_BY_ID.has(eu.id)) out.push(eu)
  return out
}

/** Statistiky seskupené podle kategorie (pro <optgroup> v selectu). */
export function groupedIndicators(region: Region = 'world'): IndicatorGroup[] {
  const groups: IndicatorGroup[] = []
  for (const ind of indicatorsForRegion(region)) {
    let g = groups.find((x) => x.name === ind.group)
    if (!g) {
      g = { name: ind.group, items: [] }
      groups.push(g)
    }
    g.items.push(ind)
  }
  return groups
}
