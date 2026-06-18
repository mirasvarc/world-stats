// Mapování zemí (ISO-3166 alpha-3) na kontinenty – pro filtr v žebříčku.
// Země bez záznamu spadnou do kategorie „Ostatní".
// Pozn.: státy ležící na rozhraní jsou zařazeny podle běžné konvence
// (Rusko → Evropa, Turecko/Kavkaz → Asie).

export const CONTINENTS = [
  'Evropa',
  'Asie',
  'Afrika',
  'Severní Amerika',
  'Jižní Amerika',
  'Oceánie',
] as const

export type Continent = (typeof CONTINENTS)[number] | 'Ostatní'

const BY_CONTINENT: Record<string, string[]> = {
  Evropa: [
    'ALB', 'AND', 'AUT', 'BLR', 'BEL', 'BIH', 'BGR', 'HRV', 'CYP', 'CZE',
    'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'ISL', 'IRL', 'ITA',
    'XKX', 'LVA', 'LIE', 'LTU', 'LUX', 'MLT', 'MDA', 'MCO', 'MNE', 'NLD',
    'MKD', 'NOR', 'POL', 'PRT', 'ROU', 'RUS', 'SMR', 'SRB', 'SVK', 'SVN',
    'ESP', 'SWE', 'CHE', 'UKR', 'GBR', 'VAT',
  ],
  Asie: [
    'AFG', 'ARM', 'AZE', 'BHR', 'BGD', 'BTN', 'BRN', 'KHM', 'CHN', 'GEO',
    'HKG', 'IND', 'IDN', 'IRN', 'IRQ', 'ISR', 'JPN', 'JOR', 'KAZ', 'KWT',
    'KGZ', 'LAO', 'LBN', 'MYS', 'MDV', 'MNG', 'MMR', 'NPL', 'PRK', 'OMN',
    'PAK', 'PSE', 'PHL', 'QAT', 'SAU', 'SGP', 'KOR', 'LKA', 'SYR', 'TWN',
    'TJK', 'THA', 'TLS', 'TUR', 'TKM', 'ARE', 'UZB', 'VNM', 'YEM',
  ],
  Afrika: [
    'DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD',
    'COM', 'COG', 'COD', 'DJI', 'EGY', 'GNQ', 'ERI', 'SWZ', 'ETH', 'GAB',
    'GMB', 'GHA', 'GIN', 'GNB', 'CIV', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG',
    'MWI', 'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA',
    'STP', 'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'TZA', 'TGO',
    'TUN', 'UGA', 'ZMB', 'ZWE', 'ESH',
  ],
  'Severní Amerika': [
    'ATG', 'BHS', 'BRB', 'BLZ', 'CAN', 'CRI', 'CUB', 'DMA', 'DOM', 'SLV',
    'GRL', 'GRD', 'GTM', 'HTI', 'HND', 'JAM', 'MEX', 'NIC', 'PAN', 'KNA',
    'LCA', 'VCT', 'TTO', 'USA',
  ],
  'Jižní Amerika': [
    'ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU', 'GUY', 'PRY', 'PER', 'SUR',
    'URY', 'VEN',
  ],
  Oceánie: [
    'AUS', 'FJI', 'KIR', 'MHL', 'FSM', 'NRU', 'NZL', 'PLW', 'PNG', 'WSM',
    'SLB', 'TON', 'TUV', 'VUT',
  ],
}

const ISO_TO_CONTINENT = new Map<string, Continent>()
for (const [cont, list] of Object.entries(BY_CONTINENT)) {
  for (const iso of list) ISO_TO_CONTINENT.set(iso, cont as Continent)
}

export function continentOf(iso3: string): Continent {
  return ISO_TO_CONTINENT.get(iso3) ?? 'Ostatní'
}
