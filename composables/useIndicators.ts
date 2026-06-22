// Konfigurace dostupných statistik (indikátorů).
//
// Přidání další statistiky = přidat položku do INDICATORS. U World Bank stačí
// vyplnit `code` (kód indikátoru, viz https://data.worldbank.org/indicator),
// u statického datasetu `file` (cesta do /public). `higherIsBetter` určuje,
// zda vyšší hodnota znamená „lepší" (zelená) – u inflace, nezaměstnanosti apod. je false.

export interface Indicator {
  id: string
  label: string
  unit: string
  group: string
  /** true = vyšší hodnota je „lepší" (zelená); false = nižší je lepší (např. inflace) */
  higherIsBetter: boolean
  source: 'worldbank' | 'static'
  /** kód World Bank indikátoru (pro source === 'worldbank') */
  code?: string
  /** cesta k JSON datasetu v /public (pro source === 'static') */
  file?: string
  /** počet desetinných míst při zobrazení */
  decimals?: number
}

export interface IndicatorGroup {
  name: string
  items: Indicator[]
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
  { id: 'tax_rev', group: 'Ekonomika', label: 'Daňové příjmy', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'GC.TAX.TOTL.GD.ZS', decimals: 1 },
  { id: 'gov_debt', group: 'Ekonomika', label: 'Státní dluh', unit: '% HDP', higherIsBetter: false, source: 'worldbank', code: 'GC.DOD.TOTL.GD.ZS', decimals: 1 },
  { id: 'fdi', group: 'Ekonomika', label: 'Přímé zahraniční investice', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'BX.KLT.DINV.WD.GD.ZS', decimals: 1 },
  { id: 'rnd', group: 'Ekonomika', label: 'Výdaje na výzkum a vývoj', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'GB.XPD.RSDV.GD.ZS', decimals: 2 },
  { id: 'military', group: 'Ekonomika', label: 'Vojenské výdaje', unit: '% HDP', higherIsBetter: true, source: 'worldbank', code: 'MS.MIL.XPND.GD.ZS', decimals: 1 },
  { id: 'tourism', group: 'Ekonomika', label: 'Turistické příjezdy', unit: 'příjezdů/rok', higherIsBetter: true, source: 'worldbank', code: 'ST.INT.ARVL', decimals: 0 },
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

const INDICATOR_BY_ID = new Map(INDICATORS.map((i) => [i.id, i]))

export function getIndicator(id: string): Indicator | undefined {
  return INDICATOR_BY_ID.get(id)
}

export function isValidIndicatorId(id: string | null | undefined): boolean {
  return !!id && INDICATOR_BY_ID.has(id)
}

/** Statistiky seskupené podle kategorie (pro <optgroup> v selectu). */
export function groupedIndicators(): IndicatorGroup[] {
  const groups: IndicatorGroup[] = []
  for (const ind of INDICATORS) {
    let g = groups.find((x) => x.name === ind.group)
    if (!g) {
      g = { name: ind.group, items: [] }
      groups.push(g)
    }
    g.items.push(ind)
  }
  return groups
}
