// Načítání a cache dat indikátorů (historie po letech).
//
// World Bank API (otevřené, bez klíče):
//   https://api.worldbank.org/v2/country/all/indicator/<KÓD>?format=json&date=1995:2024
// Klíčem pro spojení s mapou je ISO-3166 alpha-3 kód země (countryiso3code).
// Statické datasety (např. mzdy) se načítají z /public a nemají časovou řadu.

import type { Indicator } from './useIndicators'
import { getIndicator } from './useIndicators'
import { loadEurostat } from './useEurostat'

export interface IndicatorData {
  /** iso3 -> (rok -> hodnota) */
  byCountry: Record<string, Record<number, number>>
  /** seřazené roky, které mají alespoň nějaká data */
  years: number[]
  minYear: number
  maxYear: number
  /** výchozí rok (nejnovější dostupný) */
  defaultYear: number
  isStatic: boolean
}

const START_YEAR = 1995
const END_YEAR = 2024
const STATIC_YEAR = END_YEAR // reprezentativní rok pro statické datasety bez historie

const cache = new Map<string, IndicatorData>()

async function loadStatic(ind: Indicator, signal?: AbortSignal): Promise<IndicatorData> {
  const raw = (await fetch(ind.file!, { signal }).then((r) => r.json())) as Record<string, unknown>
  const byCountry: Record<string, Record<number, number>> = {}
  for (const [iso3, value] of Object.entries(raw)) {
    if (iso3.startsWith('_') || typeof value !== 'number') continue
    byCountry[iso3.toUpperCase()] = { [STATIC_YEAR]: value }
  }
  return {
    byCountry,
    years: [STATIC_YEAR],
    minYear: STATIC_YEAR,
    maxYear: STATIC_YEAR,
    defaultYear: STATIC_YEAR,
    isStatic: true,
  }
}

async function loadWorldBank(ind: Indicator, signal?: AbortSignal): Promise<IndicatorData> {
  const url =
    `https://api.worldbank.org/v2/country/all/indicator/${ind.code}` +
    `?format=json&per_page=20000&date=${START_YEAR}:${END_YEAR}`
  const json = await fetch(url, { signal }).then((r) => r.json())
  const rows: any[] = Array.isArray(json) && json.length > 1 ? json[1] : []

  const byCountry: Record<string, Record<number, number>> = {}
  const yearsSet = new Set<number>()
  for (const row of rows) {
    const iso3: string = row.countryiso3code
    if (!iso3 || iso3.length !== 3 || row.value == null) continue // přeskočí agregáty i prázdné
    const year = Number(row.date)
    ;(byCountry[iso3] ??= {})[year] = Number(row.value)
    yearsSet.add(year)
  }

  const years = [...yearsSet].sort((a, b) => a - b)
  return {
    byCountry,
    years,
    minYear: years[0] ?? STATIC_YEAR,
    maxYear: years[years.length - 1] ?? STATIC_YEAR,
    defaultYear: years[years.length - 1] ?? STATIC_YEAR,
    isStatic: false,
  }
}

// ── Trvalá cache v localStorage (zrychlí opakované načtení i mezi relacemi) ──
const LS_PREFIX = 'wsm-data-v1-'
const LS_TTL = 7 * 24 * 60 * 60 * 1000 // 7 dní

function lsGet(id: string): IndicatorData | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_PREFIX + id)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { t: number; d: IndicatorData }
    if (!parsed?.t || Date.now() - parsed.t > LS_TTL) {
      localStorage.removeItem(LS_PREFIX + id)
      return null
    }
    return parsed.d
  } catch {
    return null
  }
}

function lsSet(id: string, d: IndicatorData): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(LS_PREFIX + id, JSON.stringify({ t: Date.now(), d }))
  } catch {
    // quota překročena – ticho, jede se bez trvalé cache
  }
}

/** Klíč pro cache – odlišuje stejné id z různých zdrojů (WB vs Eurostat). */
export function keyOf(ind: Indicator): string {
  return `${ind.source}:${ind.id}`
}

/**
 * Eurostat s tichým fallbackem na World Bank: když Eurostat selže nebo vrátí prázdno
 * a existuje World Bank indikátor se stejným id (náhrada), použije se ten.
 */
async function loadEurostatWithFallback(
  ind: Indicator,
  signal?: AbortSignal
): Promise<IndicatorData> {
  try {
    const r = await loadEurostat(ind, signal)
    if (Object.keys(r.byCountry).length > 0) return r
  } catch (e) {
    if (signal?.aborted) throw e // přerušení nechytáme jako selhání
  }
  const wb = getIndicator(ind.id, 'world')
  if (wb && wb.source === 'worldbank') return loadWorldBank(wb, signal)
  // žádná World Bank náhrada – vrať prázdný dataset
  return { byCountry: {}, years: [], minYear: START_YEAR, maxYear: END_YEAR, defaultYear: END_YEAR, isStatic: false }
}

/** Načte data indikátoru (paměťová → localStorage → síť). */
export async function loadIndicatorData(
  ind: Indicator,
  signal?: AbortSignal
): Promise<IndicatorData> {
  const key = keyOf(ind)
  const cached = cache.get(key)
  if (cached) return cached

  const stored = lsGet(key)
  if (stored) {
    cache.set(key, stored)
    return stored
  }

  const result =
    ind.source === 'static'
      ? await loadStatic(ind, signal)
      : ind.source === 'eurostat'
        ? await loadEurostatWithFallback(ind, signal)
        : await loadWorldBank(ind, signal)
  cache.set(key, result)
  lsSet(key, result)
  return result
}

/** Hodnota pro zemi v daném roce (přesně daný rok, jinak null). */
export function valueAt(
  data: IndicatorData | null,
  iso3: string,
  year: number
): number | null {
  const v = data?.byCountry[iso3]?.[year]
  return v == null ? null : v
}

export interface ValueHit {
  value: number
  /** rok, ze kterého hodnota skutečně pochází */
  year: number
  /** true = přesně požadovaný rok, false = doplněno z nejbližšího roku */
  exact: boolean
}

/**
 * Hodnota pro zemi: přesně daný rok, jinak nejbližší dostupný rok do `maxGap` let
 * (při shodě vzdálenosti vyhrává novější rok). Vrací i informaci, odkud hodnota je.
 */
export function valueAtOrNearest(
  data: IndicatorData | null,
  iso3: string,
  year: number,
  maxGap = 12
): ValueHit | null {
  const byYear = data?.byCountry[iso3]
  if (!byYear) return null
  const exactVal = byYear[year]
  if (exactVal != null) return { value: exactVal, year, exact: true }

  let best: ValueHit | null = null
  let bestGap = Infinity
  for (const k in byYear) {
    const v = byYear[k]
    if (v == null) continue
    const y = Number(k)
    const gap = Math.abs(y - year)
    if (gap < bestGap || (gap === bestGap && y > (best?.year ?? -Infinity))) {
      bestGap = gap
      best = { value: v, year: y, exact: false }
    }
  }
  return best && bestGap <= maxGap ? best : null
}
