// Centrální „store" aplikace (singleton) – sdílený reaktivní stav + akce.
// Všechny komponenty/composables čtou a mění stav přes useWorldStats().

import {
  INDICATORS,
  getIndicator,
  indicatorsForRegion,
  isValidIndicatorId,
  type Indicator,
  type Region,
} from './useIndicators'
import {
  loadIndicatorData,
  keyOf,
  valueAt,
  valueAtOrNearest,
  type IndicatorData,
} from './useStatsData'
import { useGeo } from './useGeo'
import { isEuropean } from './useContinents'

// ── Počáteční stav z URL (?stat=...&year=...&country=...&compare=...&scale=...) ───────
const ISO3_RE = /^[A-Za-z]{3}$/

function parseInitialQuery() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const stat = p.get('stat')
  const year = p.get('year')
  const country = p.get('country')
  const compare = p.get('compare')
  const scale = p.get('scale')
  const region: Region = p.get('region') === 'europe' ? 'europe' : 'world'
  return {
    region,
    stat: isValidIndicatorId(stat, region) ? stat! : undefined,
    year: year && /^\d{4}$/.test(year) ? Number(year) : undefined,
    country: country && ISO3_RE.test(country) ? country.toUpperCase() : undefined,
    compare: compare
      ? compare
          .split(',')
          .filter((x) => ISO3_RE.test(x))
          .map((x) => x.toUpperCase())
          .slice(0, 5)
      : undefined,
    scale: (scale === 'log' || scale === 'linear' ? scale : undefined) as
      | 'log'
      | 'linear'
      | undefined,
  }
}
const initial = parseInitialQuery()

// ── Reaktivní stav (modul-level singleton) ─────────────────────
const region = ref<Region>(initial.region ?? 'world')
const selectedIndicatorId = ref<string>(initial.stat ?? INDICATORS[0].id)
const selectedYear = ref<number>(initial.year ?? 2024)
const selectedIso3 = ref<string | null>(null)
const hoverIso = ref<string | null>(null)

const data = ref<IndicatorData | null>(null)
const loadedKey = ref<string | null>(null)
const loading = ref(true)
const errorMsg = ref<string | null>(null)

// „na obyvatele" přepínač + populace (dělitel) pro absolutní metriky
const perCapita = ref<boolean>(false)
const populationData = ref<IndicatorData | null>(null)

// reference pro porovnání: konkrétní země nebo medián regionu
const referenceMode = ref<'country' | 'median'>('country')

// stav grafu / porovnání
const compareIsos = ref<string[]>(initial.compare ?? [])
const yScaleMode = ref<'linear' | 'log'>(initial.scale ?? 'linear')
const showChart = ref(false)

// scatter (korelační) graf dvou statistik
const showScatter = ref(false)
const scatterX = ref<string>('gdp_pc')
const scatterY = ref<string>('life')

// požadavek na přiblížení mapy na zemi (nonce, na který reaguje mapa)
const focusNonce = ref(0)

// ── Téma (světlé/tmavé) – přetrvává v localStorage ─────────────
function initialDark(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('data-theme') === 'dark'
}
const darkMode = ref<boolean>(initialDark())

function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', darkMode.value ? 'dark' : 'light')
  try {
    localStorage.setItem('wsm-theme', darkMode.value ? 'dark' : 'light')
  } catch {}
}
function toggleTheme() {
  darkMode.value = !darkMode.value
  applyTheme()
}

// ── Přehrávání času (animace roků) ─────────────────────────────
const playing = ref(false)
let playTimer: ReturnType<typeof setInterval> | null = null

function stopPlay() {
  playing.value = false
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

function togglePlay() {
  if (isStatic.value) return
  if (playing.value) {
    stopPlay()
    return
  }
  // od začátku, pokud jsme na konci časové osy
  if (selectedYear.value >= maxYear.value) selectedYear.value = minYear.value
  playing.value = true
  playTimer = setInterval(() => {
    if (selectedYear.value >= maxYear.value) {
      stopPlay()
      return
    }
    selectedYear.value = selectedYear.value + 1
  }, 700)
}

// ── Odvozený stav ──────────────────────────────────────────────
const currentIndicator = computed<Indicator>(
  () =>
    getIndicator(selectedIndicatorId.value, region.value) ??
    indicatorsForRegion(region.value)[0]
)
/** data v UI jen když odpovídají vybrané statistice (ochrana proti zastaralým hodnotám) */
const ready = computed(
  () => data.value != null && loadedKey.value === keyOf(currentIndicator.value)
)
const isStatic = computed(() => data.value?.isStatic ?? false)
const minYear = computed(() => data.value?.minYear ?? 1995)
const maxYear = computed(() => data.value?.maxYear ?? 2024)

// per-capita je aktivní jen u metrik, které to podporují
const perCapitaActive = computed(() => perCapita.value && !!currentIndicator.value.perCapita)
// indikátor pro ZOBRAZENÍ (jednotka/desetinná místa/popisek) – v per-capita režimu upravený.
// Pozor: higherIsBetter zůstává stejné, takže je bezpečné ho použít i pro barevnou logiku.
const displayIndicator = computed<Indicator>(() => {
  const ind = currentIndicator.value
  const pc = ind.perCapita
  if (perCapitaActive.value && pc) {
    return { ...ind, unit: pc.unit, decimals: pc.decimals ?? ind.decimals, label: `${ind.label} (na obyv.)` }
  }
  return ind
})

export interface EffectiveValue {
  value: number
  /** rok, ze kterého hodnota skutečně pochází (kvůli fallbacku může být jiný než zvolený) */
  year: number
  /** true = přesně zvolený rok, false = doplněno z nejbližšího roku */
  exact: boolean
}

/**
 * Hodnota země použitá v UI: zahrnuje fallback na nejbližší rok (always-on) a
 * případné přepočítání „na obyvatele". `opts.fallback === false` vynutí přesný rok
 * (pro graf časové řady, kde fallback nedává smysl).
 */
function effectiveValue(
  iso3: string,
  year: number = selectedYear.value,
  opts: { fallback?: boolean } = {}
): EffectiveValue | null {
  const useFb = opts.fallback !== false
  const pick = (d: IndicatorData | null, y: number): EffectiveValue | null => {
    if (useFb) return valueAtOrNearest(d, iso3, y)
    const v = valueAt(d, iso3, y)
    return v == null ? null : { value: v, year: y, exact: true }
  }
  const raw = pick(data.value, year)
  if (!raw) return null
  if (perCapitaActive.value) {
    const pop = pick(populationData.value, raw.year)
    if (!pop || !pop.value) return null
    return { value: raw.value / pop.value, year: raw.year, exact: raw.exact }
  }
  return raw
}

const selectedCountry = computed(() => {
  const iso = selectedIso3.value
  if (!iso) return null
  const { nameFor } = useGeo()
  const eff = effectiveValue(iso)
  return {
    iso3: iso,
    name: nameFor(iso),
    value: eff?.value ?? null,
    valueYear: eff?.year ?? null,
    exact: eff?.exact ?? true,
  }
})

const hoverInfo = computed(() => {
  const iso = hoverIso.value
  if (!iso) return null
  const { nameFor } = useGeo()
  const eff = effectiveValue(iso)
  return { name: nameFor(iso), value: eff?.value ?? null, valueYear: eff?.year ?? null, exact: eff?.exact ?? true }
})

// Stav datové dostupnosti referenční země pro aktuální statistiku/rok.
// Když referenční země nemá hodnotu, nelze nic porovnat a celá mapa zešedne –
// tento computed dovolí UI na to upozornit (a nabídnout nejbližší rok s daty).
// Medián aktuální statistiky přes země regionu (s fallbackem i per-capita).
const regionMedianValue = computed<number | null>(() => {
  const d = data.value
  if (!d) return null
  const { isRealCountry } = useGeo()
  const europe = region.value === 'europe'
  const vals: number[] = []
  for (const iso of Object.keys(d.byCountry)) {
    if (!isRealCountry(iso)) continue
    if (europe && !isEuropean(iso)) continue
    const eff = effectiveValue(iso)
    if (eff) vals.push(eff.value)
  }
  if (!vals.length) return null
  vals.sort((a, b) => a - b)
  const m = Math.floor(vals.length / 2)
  return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2
})

/**
 * Referenční hodnota, vůči které se obarvuje mapa. Buď vybraná země, nebo medián
 * regionu. `null` = žádná reference → mapa se obarví podle absolutní hodnoty (choropleth).
 */
const referenceValue = computed<{ value: number; kind: 'country' | 'median' } | null>(() => {
  if (referenceMode.value === 'median') {
    const m = regionMedianValue.value
    return m == null ? null : { value: m, kind: 'median' }
  }
  const iso = selectedIso3.value
  if (!iso) return null
  const eff = effectiveValue(iso)
  return eff ? { value: eff.value, kind: 'country' } : null
})

const selectedNoData = computed(() => {
  const iso = selectedIso3.value
  if (!iso || !ready.value) return null
  // díky always-on fallbacku je hodnota null jen když opravdu žádná data nejsou
  if (effectiveValue(iso) != null) return null

  const byYear = data.value?.byCountry[iso]
  const hasAnyYear = !!byYear && Object.values(byYear).some((v) => v != null)
  return { name: useGeo().nameFor(iso), hasAnyYear }
})

// ── Akce ───────────────────────────────────────────────────────
let loadToken = 0
let loadController: AbortController | null = null

/** Načte data pro indikátor (token-guard + zrušení nedoběhlého předchozího requestu). */
async function load(indicatorId = selectedIndicatorId.value, desiredYear?: number) {
  const ind = getIndicator(indicatorId, region.value)
  if (!ind) return
  const token = ++loadToken
  loadController?.abort() // zruš předchozí nedoběhlý fetch
  const controller = new AbortController()
  loadController = controller
  loading.value = true
  errorMsg.value = null
  try {
    const d = await loadIndicatorData(ind, controller.signal)
    if (token !== loadToken) return // mezitím se přepnula jiná statistika
    data.value = d
    loadedKey.value = keyOf(ind)
    if (d.isStatic) stopPlay() // statická data nemají časovou osu
    const y = desiredYear
    selectedYear.value =
      y != null && y >= d.minYear && y <= d.maxYear ? y : d.defaultYear
  } catch (e: any) {
    if (token !== loadToken || controller.signal.aborted || e?.name === 'AbortError') return
    errorMsg.value = 'Nepodařilo se načíst data: ' + (e?.message ?? e)
  } finally {
    if (token === loadToken) loading.value = false
  }
}

/** Načte populaci (World Bank, pokrývá celý svět) jako dělitel pro per-capita. */
async function ensurePopulation() {
  if (populationData.value) return
  const ind = getIndicator('population', 'world')
  if (!ind) return
  try {
    populationData.value = await loadIndicatorData(ind)
  } catch {
    // tichý best-effort – bez populace zůstane per-capita prostě prázdné
  }
}

function setPerCapita(on: boolean) {
  perCapita.value = on
  if (on) ensurePopulation()
}

function selectCountry(iso3: string | null) {
  selectedIso3.value = iso3
  // výběr země => reference je země (ne medián)
  if (iso3) {
    referenceMode.value = 'country'
    // referenční země nesmí být zároveň v seznamu porovnávaných
    compareIsos.value = compareIsos.value.filter((x) => x !== iso3)
  }
}

/** Přepne porovnávání vůči mediánu regionu (a zruší výběr země). */
function setReferenceMedian(on: boolean) {
  referenceMode.value = on ? 'median' : 'country'
  if (on) selectedIso3.value = null
}

function clearSelection() {
  selectCountry(null)
}

/**
 * Přepne region (Svět/Evropa). Případně srovná neplatnou statistiku či výběr země
 * (např. mimoevropskou zemi v evropském režimu). Samotné načtení dat + překreslení
 * mapy obstará watcher v useLeafletMap.
 */
function setRegion(r: Region) {
  if (r === region.value) return
  region.value = r
  // statistika nemusí v novém regionu existovat (evropská statistika ve Světě)
  if (!isValidIndicatorId(selectedIndicatorId.value, r)) {
    selectedIndicatorId.value = indicatorsForRegion(r)[0].id
  }
  if (!isValidIndicatorId(scatterX.value, r)) scatterX.value = 'gdp_pc'
  if (!isValidIndicatorId(scatterY.value, r)) scatterY.value = 'life'
  // v Evropě nedrž vybranou mimoevropskou zemi
  if (r === 'europe' && selectedIso3.value && !isEuropean(selectedIso3.value)) {
    clearSelection()
  }
  stopPlay()
}

/** Vybere zemi a požádá mapu o přiblížení. */
function focusCountry(iso3: string) {
  selectCountry(iso3)
  focusNonce.value++
}

function addCompare(iso3: string, max: number) {
  if (iso3 && !compareIsos.value.includes(iso3) && compareIsos.value.length < max) {
    compareIsos.value = [...compareIsos.value, iso3]
  }
}

function removeCompare(iso3: string) {
  compareIsos.value = compareIsos.value.filter((x) => x !== iso3)
}

function openChart() {
  if (selectedIso3.value) showChart.value = true
}
function closeChart() {
  showChart.value = false
}

function openScatter() {
  ensurePopulation() // bubliny = populace
  showScatter.value = true
}
function closeScatter() {
  showScatter.value = false
}

export function useWorldStats() {
  return {
    // počáteční hodnoty z URL (pro inicializaci mapy)
    initialCountry: initial.country,
    initialYear: initial.year,
    // stav
    region,
    selectedIndicatorId,
    selectedYear,
    selectedIso3,
    hoverIso,
    data,
    loading,
    errorMsg,
    compareIsos,
    yScaleMode,
    showChart,
    showScatter,
    scatterX,
    scatterY,
    focusNonce,
    darkMode,
    playing,
    perCapita,
    populationData,
    referenceMode,
    // odvozené
    currentIndicator,
    displayIndicator,
    perCapitaActive,
    ready,
    isStatic,
    minYear,
    maxYear,
    selectedCountry,
    hoverInfo,
    selectedNoData,
    effectiveValue,
    referenceValue,
    regionMedianValue,
    // akce
    load,
    setRegion,
    setPerCapita,
    ensurePopulation,
    setReferenceMedian,
    selectCountry,
    clearSelection,
    focusCountry,
    addCompare,
    removeCompare,
    openChart,
    closeChart,
    openScatter,
    closeScatter,
    toggleTheme,
    togglePlay,
    stopPlay,
  }
}
