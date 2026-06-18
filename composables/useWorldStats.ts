// Centrální „store" aplikace (singleton) – sdílený reaktivní stav + akce.
// Všechny komponenty/composables čtou a mění stav přes useWorldStats().

import {
  INDICATORS,
  getIndicator,
  isValidIndicatorId,
  type Indicator,
} from './useIndicators'
import { loadIndicatorData, valueAt, type IndicatorData } from './useStatsData'
import { useGeo } from './useGeo'

// ── Počáteční stav z URL (?stat=...&year=...&country=...) ───────
function parseInitialQuery() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const stat = p.get('stat')
  const year = p.get('year')
  const country = p.get('country')
  return {
    stat: isValidIndicatorId(stat) ? stat! : undefined,
    year: year && /^\d{4}$/.test(year) ? Number(year) : undefined,
    country: country && /^[A-Za-z]{3}$/.test(country) ? country.toUpperCase() : undefined,
  }
}
const initial = parseInitialQuery()

// ── Reaktivní stav (modul-level singleton) ─────────────────────
const selectedIndicatorId = ref<string>(initial.stat ?? INDICATORS[0].id)
const selectedYear = ref<number>(initial.year ?? 2024)
const selectedIso3 = ref<string | null>(null)
const hoverIso = ref<string | null>(null)

const data = ref<IndicatorData | null>(null)
const loadedIndicatorId = ref<string | null>(null)
const loading = ref(true)
const errorMsg = ref<string | null>(null)

// stav grafu / porovnání
const compareIsos = ref<string[]>([])
const yScaleMode = ref<'linear' | 'log'>('linear')
const showChart = ref(false)

// požadavek na přiblížení mapy na zemi (nonce, na který reaguje mapa)
const focusNonce = ref(0)

// ── Odvozený stav ──────────────────────────────────────────────
const currentIndicator = computed<Indicator>(
  () => getIndicator(selectedIndicatorId.value) ?? INDICATORS[0]
)
/** data v UI jen když odpovídají vybrané statistice (ochrana proti zastaralým hodnotám) */
const ready = computed(
  () => data.value != null && loadedIndicatorId.value === selectedIndicatorId.value
)
const isStatic = computed(() => data.value?.isStatic ?? false)
const minYear = computed(() => data.value?.minYear ?? 1995)
const maxYear = computed(() => data.value?.maxYear ?? 2024)

const selectedCountry = computed(() => {
  const iso = selectedIso3.value
  if (!iso) return null
  const { nameFor } = useGeo()
  return {
    iso3: iso,
    name: nameFor(iso),
    value: valueAt(data.value, iso, selectedYear.value),
  }
})

const hoverInfo = computed(() => {
  const iso = hoverIso.value
  if (!iso) return null
  const { nameFor } = useGeo()
  return { name: nameFor(iso), value: valueAt(data.value, iso, selectedYear.value) }
})

// ── Akce ───────────────────────────────────────────────────────
let loadToken = 0

/** Načte data pro indikátor (token-guard proti závodění při rychlém přepínání). */
async function load(indicatorId = selectedIndicatorId.value, desiredYear?: number) {
  const ind = getIndicator(indicatorId)
  if (!ind) return
  const token = ++loadToken
  loading.value = true
  errorMsg.value = null
  try {
    const d = await loadIndicatorData(ind)
    if (token !== loadToken) return // mezitím se přepnula jiná statistika
    data.value = d
    loadedIndicatorId.value = ind.id
    const y = desiredYear
    selectedYear.value =
      y != null && y >= d.minYear && y <= d.maxYear ? y : d.defaultYear
  } catch (e: any) {
    if (token !== loadToken) return
    errorMsg.value = 'Nepodařilo se načíst data: ' + (e?.message ?? e)
  } finally {
    if (token === loadToken) loading.value = false
  }
}

function selectCountry(iso3: string | null) {
  selectedIso3.value = iso3
  // referenční země nesmí být zároveň v seznamu porovnávaných
  if (iso3) compareIsos.value = compareIsos.value.filter((x) => x !== iso3)
}

function clearSelection() {
  selectCountry(null)
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

export function useWorldStats() {
  return {
    // počáteční hodnoty z URL (pro inicializaci mapy)
    initialCountry: initial.country,
    initialYear: initial.year,
    // stav
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
    focusNonce,
    // odvozené
    currentIndicator,
    ready,
    isStatic,
    minYear,
    maxYear,
    selectedCountry,
    hoverInfo,
    // akce
    load,
    selectCountry,
    clearSelection,
    focusCountry,
    addCompare,
    removeCompare,
    openChart,
    closeChart,
  }
}
