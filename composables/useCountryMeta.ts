// Doplňková metadata země (vlajka, hlavní město, region, příjmová skupina).
//
// Zdroj: World Bank country endpoint (bez klíče, stejný původ jako ostatní data) –
//   https://api.worldbank.org/v2/country/<ISO3>?format=json
// dává iso2Code, capitalCity, region a incomeLevel. Vlajku skládáme z bezplatného
// flagcdn.com podle ISO-2 kódu. Vše se stahuje až pro vybranou zemi a kešuje.

import { useWorldStats } from './useWorldStats'

export interface CountryMeta {
  iso3: string
  iso2: string
  capital: string | null
  region: string | null
  incomeLevel: string | null
  flagUrl: string | null
}

const cache = new Map<string, CountryMeta | null>()

function cleanAggregate(v: string | undefined | null): string | null {
  if (!v || v === 'Aggregates' || v === 'NA') return null
  return v
}

async function fetchMeta(iso3: string): Promise<CountryMeta | null> {
  if (cache.has(iso3)) return cache.get(iso3)!
  try {
    const json = await fetch(`https://api.worldbank.org/v2/country/${iso3}?format=json`).then(
      (r) => r.json()
    )
    const d = Array.isArray(json) && json[1] && json[1][0]
    if (!d || !d.iso2Code) {
      cache.set(iso3, null)
      return null
    }
    const iso2 = String(d.iso2Code).trim()
    const meta: CountryMeta = {
      iso3,
      iso2,
      capital: cleanAggregate(d.capitalCity),
      region: cleanAggregate(d.region?.value),
      incomeLevel: cleanAggregate(d.incomeLevel?.value),
      flagUrl: iso2 ? `https://flagcdn.com/w80/${iso2.toLowerCase()}.png` : null,
    }
    cache.set(iso3, meta)
    return meta
  } catch {
    return null // tichý best-effort – metadata jsou jen „navíc"
  }
}

/** Reaktivní metadata pro aktuálně vybranou zemi (null, když není vybrána). */
export function useCountryMeta() {
  const s = useWorldStats()
  const meta = ref<CountryMeta | null>(null)

  watch(
    () => s.selectedIso3.value,
    async (iso) => {
      if (!iso) {
        meta.value = null
        return
      }
      meta.value = cache.get(iso) ?? null // okamžitě z keše, pak dotáhni
      const m = await fetchMeta(iso)
      if (s.selectedIso3.value === iso) meta.value = m
    },
    { immediate: true }
  )

  return { meta }
}
