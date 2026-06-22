// Načtení a sdílení GeoJSON obrysů světa (singleton).
//
// Veřejný GeoJSON: feature.id = ISO-3166 alpha-3 kód, properties.name = název země.
// Slouží k vykreslení mapy a k filtrování reálných zemí (vs. agregáty World Bank).
//
// Self-hostováno v /public (původně raw.githubusercontent.com) – servíruje se ze
// stejného originu / Cloudflare edge s gzipem a dlouhým cache-control, takže cold
// load je výrazně rychlejší a spolehlivější než stahování z GitHubu.

const GEOJSON_URL = '/countries.geo.json'

// modul-level singleton – sdílený napříč komponentami
const geojson = shallowRef<any>(null)
const nameMap = ref<Record<string, string>>({})
const countryIds = ref<Set<string>>(new Set())
let loadPromise: Promise<void> | null = null

async function loadGeo(): Promise<void> {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    const data = await fetch(GEOJSON_URL).then((r) => r.json())
    geojson.value = data
    nameMap.value = Object.fromEntries(
      data.features.map((f: any) => [f.id, f.properties?.name ?? f.id])
    )
    countryIds.value = new Set<string>(data.features.map((f: any) => f.id))
  })()
  return loadPromise
}

function nameFor(iso3: string): string {
  return nameMap.value[iso3] ?? iso3
}

/** Je iso3 reálná země na mapě? (filtruje agregáty jako Svět/EU) */
function isRealCountry(iso3: string): boolean {
  return countryIds.value.has(iso3)
}

export function useGeo() {
  return { geojson, nameMap, countryIds, loadGeo, nameFor, isRealCountry }
}
