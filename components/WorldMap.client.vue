<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import {
  INDICATORS,
  loadIndicatorData,
  formatValue,
  valueAt,
  type Indicator,
  type IndicatorData,
} from '~/composables/useStats'

// Veřejný GeoJSON světa – feature.id je ISO-3166 alpha-3 kód, properties.name je název.
const GEOJSON_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

// počáteční stav z URL (?stat=...&year=...&country=...) – komponenta je client-only
function readQuery() {
  if (typeof window === 'undefined') return {} as Record<string, never>
  const p = new URLSearchParams(window.location.search)
  const stat = p.get('stat')
  const year = p.get('year')
  const country = p.get('country')
  return {
    stat: stat && INDICATORS.some((i) => i.id === stat) ? stat : undefined,
    year: year && /^\d{4}$/.test(year) ? Number(year) : undefined,
    country: country && /^[A-Za-z]{3}$/.test(country) ? country.toUpperCase() : undefined,
  }
}
const initial = readQuery()
const initialYear = initial.year // aplikuje se až po načtení dat (validace rozsahu)
const initialCountry = initial.country // aplikuje se až po načtení GeoJSON

const mapEl = ref<HTMLElement | null>(null)
const selectedIndicatorId = ref<string>(initial.stat ?? INDICATORS[0].id)
const selectedIso3 = ref<string | null>(null)
const hoverIso = ref<string | null>(null)
const search = ref<string>('')
const copied = ref(false)
const showChart = ref(false)
const compareIsos = ref<string[]>([]) // další země k porovnání v grafu
const yScaleMode = ref<'linear' | 'log'>('linear')
const selectedYear = ref<number>(2022)
const dataRef = ref<IndicatorData | null>(null)
const loadedIndicatorId = ref<string | null>(null)
const loading = ref(true)
const errorMsg = ref<string | null>(null)

// název a množina platných zemí (z GeoJSON) – filtruje agregáty World Bank (Svět, EU, …)
const nameMap = ref<Record<string, string>>({})
const countryIds = ref<Set<string>>(new Set())

let L: any = null
let map: any = null
let geoLayer: any = null
let geojson: any = null

const currentIndicator = computed<Indicator>(
  () => INDICATORS.find((i) => i.id === selectedIndicatorId.value)!
)

// statistiky seskupené do <optgroup>
const grouped = computed(() => {
  const groups: { name: string; items: Indicator[] }[] = []
  for (const ind of INDICATORS) {
    let g = groups.find((x) => x.name === ind.group)
    if (!g) {
      g = { name: ind.group, items: [] }
      groups.push(g)
    }
    g.items.push(ind)
  }
  return groups
})

// data v panelu se ukazují jen když načtená data odpovídají vybrané statistice
// (chrání před zastaralými hodnotami během načítání i při rychlém přepínání)
const ready = computed(
  () => dataRef.value != null && loadedIndicatorId.value === selectedIndicatorId.value
)

const isStatic = computed(() => dataRef.value?.isStatic ?? false)
const minYear = computed(() => dataRef.value?.minYear ?? 1995)
const maxYear = computed(() => dataRef.value?.maxYear ?? 2024)

function nameFor(iso3: string): string {
  return nameMap.value[iso3] ?? iso3
}

// Žebříček zemí podle aktuální statistiky a roku (#1 = nejlepší)
const ranking = computed(() => {
  const d = dataRef.value
  if (!d) return [] as { iso3: string; name: string; value: number; rank: number }[]
  const higher = currentIndicator.value.higherIsBetter
  const rows: { iso3: string; name: string; value: number }[] = []
  for (const iso3 of Object.keys(d.byCountry)) {
    if (!countryIds.value.has(iso3)) continue // jen reálné země z mapy
    const v = d.byCountry[iso3][selectedYear.value]
    if (v == null) continue
    rows.push({ iso3, name: nameFor(iso3), value: v })
  }
  rows.sort((a, b) => (higher ? b.value - a.value : a.value - b.value))
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
})

// normalizace pro vyhledávání – bez diakritiky a velikosti písmen
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// žebříček po aplikaci vyhledávání (pořadová čísla zůstávají globální)
const filteredRanking = computed(() => {
  const q = norm(search.value.trim())
  if (!q) return ranking.value
  return ranking.value.filter((r) => norm(r.name).includes(q))
})

const selectedRank = computed(() => {
  if (!selectedIso3.value) return null
  const r = ranking.value.find((x) => x.iso3 === selectedIso3.value)
  return r ? { rank: r.rank, total: ranking.value.length } : null
})

// barevná tečka v žebříčku = stejná logika jako obarvení mapy
function rowColor(iso3: string): string {
  return styleFor(iso3).fillColor
}

// výběr země z žebříčku – vybere a přiblíží na mapě
function focusCountry(iso3: string) {
  selectedIso3.value = iso3
  restyle()
  if (!geoLayer || !map) return
  geoLayer.eachLayer((l: any) => {
    if (l.feature.id === iso3) {
      try {
        map.fitBounds(l.getBounds(), { maxZoom: 4, padding: [30, 30] })
      } catch {}
    }
  })
}

const selectedCountry = computed(() => {
  if (!selectedIso3.value) return null
  return {
    iso3: selectedIso3.value,
    name: nameFor(selectedIso3.value),
    value: valueAt(dataRef.value, selectedIso3.value, selectedYear.value),
  }
})

const hoverInfo = computed(() => {
  if (!hoverIso.value) return null
  return {
    name: nameFor(hoverIso.value),
    value: valueAt(dataRef.value, hoverIso.value, selectedYear.value),
  }
})

// ── Graf vývoje vybrané statistiky pro vybranou zemi ───────────
const CHART_W = 680
const CHART_H = 360
const PAD = { top: 24, right: 26, bottom: 42, left: 70 }

function compactNum(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e12) return (v / 1e12).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' bil'
  if (a >= 1e9) return (v / 1e9).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' mld'
  if (a >= 1e6) return (v / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' mil'
  if (a >= 1e3) return (v / 1e3).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' tis'
  return v.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })
}

const PALETTE = ['#2563eb', '#ef4444', '#16a34a', '#a855f7', '#0891b2', '#f59e0b']
const MAX_COMPARE = 5

// země zobrazené v grafu: vybraná (vždy první) + porovnávané, bez duplicit
const chartIsos = computed(() =>
  Array.from(new Set([selectedIso3.value, ...compareIsos.value].filter(Boolean) as string[]))
)

// lze použít log osu? (jen pro kladné hodnoty)
const logFeasible = computed(() => {
  const d = dataRef.value
  if (!d) return false
  let min = Infinity
  for (const iso of chartIsos.value) {
    const by = d.byCountry[iso] || {}
    for (const k in by) min = Math.min(min, by[k])
  }
  return min !== Infinity && min > 0
})

// nabídka zemí k porovnání (mají data, nejsou už v grafu)
const comparableCountries = computed(() => {
  const d = dataRef.value
  if (!d) return [] as { iso3: string; name: string }[]
  return Object.keys(d.byCountry)
    .filter((iso) => countryIds.value.has(iso) && !chartIsos.value.includes(iso))
    .map((iso) => ({ iso3: iso, name: nameFor(iso) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
})

const chart = computed(() => {
  const d = dataRef.value
  if (!ready.value || !d || !selectedIso3.value) return null

  const seriesRaw = chartIsos.value
    .map((iso, idx) => {
      const byYear = d.byCountry[iso] || {}
      const pts = Object.keys(byYear)
        .map(Number)
        .sort((a, b) => a - b)
        .map((y) => ({ year: y, value: byYear[y] }))
      return { iso, name: nameFor(iso), color: PALETTE[idx % PALETTE.length], pts }
    })
    .filter((s) => s.pts.length > 0)

  const allPts = seriesRaw.flatMap((s) => s.pts)
  if (allPts.length < 2 || seriesRaw.length === 0) return { enough: false } as const

  const years = allPts.map((p) => p.year)
  const x0 = Math.min(...years)
  const x1 = Math.max(...years)
  const vals = allPts.map((p) => p.value)
  let minY = Math.min(...vals)
  let maxY = Math.max(...vals)

  const useLog = yScaleMode.value === 'log' && logFeasible.value
  const tv = (v: number) => (useLog ? Math.log10(v) : v)
  let lo = tv(minY)
  let hi = tv(maxY)
  if (lo === hi) {
    const pad = Math.abs(lo) || 1
    lo -= pad
    hi += pad
  }

  const innerW = CHART_W - PAD.left - PAD.right
  const innerH = CHART_H - PAD.top - PAD.bottom
  const baseY = PAD.top + innerH
  const sx = (yr: number) => PAD.left + ((yr - x0) / (x1 - x0 || 1)) * innerW
  const sy = (v: number) => PAD.top + (1 - (tv(v) - lo) / (hi - lo)) * innerH

  const series = seriesRaw.map((s) => {
    const coords = s.pts.map((p) => ({ ...p, x: sx(p.year), y: sy(p.value) }))
    const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
    return { ...s, coords, line }
  })

  const single = series.length === 1
  const area = single
    ? `${PAD.left},${baseY} ${series[0].line} ${PAD.left + innerW},${baseY}`
    : null

  const N = 4
  const yticks = Array.from({ length: N + 1 }, (_, i) => {
    const t = lo + ((hi - lo) * i) / N
    const v = useLog ? Math.pow(10, t) : t
    return { y: PAD.top + (1 - i / N) * innerH, label: compactNum(v) }
  })

  const span = x1 - x0
  const step = Math.max(1, Math.round(span / 7))
  const xticks: { yr: number; x: number }[] = []
  for (let yr = x0; yr <= x1; yr += step) xticks.push({ yr, x: sx(yr) })
  if (xticks[xticks.length - 1]?.yr !== x1) xticks.push({ yr: x1, x: sx(x1) })

  const main = series[0]
  const selPoint = main.coords.find((c) => c.year === selectedYear.value) ?? null
  const first = main.pts[0].value
  const last = main.pts[main.pts.length - 1].value
  const change = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : null

  return {
    enough: true as const,
    series,
    single,
    area,
    yticks,
    xticks,
    baseY,
    selPoint,
    x0,
    x1,
    first,
    last,
    change,
    useLog,
  }
})

function openChart() {
  if (selectedIso3.value) showChart.value = true
}
function closeChart() {
  showChart.value = false
}
function addCompare(e: Event) {
  const iso = (e.target as HTMLSelectElement).value
  if (iso && !compareIsos.value.includes(iso) && compareIsos.value.length < MAX_COMPARE) {
    compareIsos.value = [...compareIsos.value, iso]
  }
  ;(e.target as HTMLSelectElement).value = ''
}
function removeCompare(iso: string) {
  compareIsos.value = compareIsos.value.filter((x) => x !== iso)
}

// Barva země podle porovnání s vybranou zemí ve zvoleném roce
function styleFor(iso3: string) {
  const ind = currentIndicator.value
  const value = valueAt(dataRef.value, iso3, selectedYear.value)

  if (value == null) {
    return { fillColor: '#d4d4d8', fillOpacity: 0.6, color: '#fff', weight: 1 }
  }
  if (!selectedIso3.value) {
    return { fillColor: '#94a3b8', fillOpacity: 0.55, color: '#fff', weight: 1 }
  }
  if (iso3 === selectedIso3.value) {
    return { fillColor: '#2563eb', fillOpacity: 0.95, color: '#1e3a8a', weight: 2 }
  }

  const threshold = valueAt(dataRef.value, selectedIso3.value, selectedYear.value)
  if (threshold == null) {
    return { fillColor: '#d4d4d8', fillOpacity: 0.6, color: '#fff', weight: 1 }
  }

  const diff = value - threshold
  const better = ind.higherIsBetter ? diff > 0 : diff < 0
  const rel = Math.min(Math.abs(diff) / (Math.abs(threshold) || 1), 1)
  const opacity = 0.35 + 0.55 * rel

  return {
    fillColor: better ? '#22c55e' : '#ef4444',
    fillOpacity: opacity,
    color: '#fff',
    weight: 1,
  }
}

function restyle() {
  if (!geoLayer) return
  geoLayer.eachLayer((layer: any) => layer.setStyle(styleFor(layer.feature.id)))
}

function onEachFeature(feature: any, layer: any) {
  layer.on({
    click: () => {
      selectedIso3.value = feature.id
      restyle()
    },
    mouseover: (e: any) => {
      hoverIso.value = feature.id
      e.target.setStyle({ weight: 2.5, color: '#0f172a' })
      e.target.bringToFront()
    },
    mouseout: (e: any) => {
      hoverIso.value = null
      e.target.setStyle(styleFor(feature.id))
    },
  })
}

let loadToken = 0
async function changeIndicator() {
  const ind = currentIndicator.value
  const token = ++loadToken
  loading.value = true
  errorMsg.value = null
  try {
    const d = await loadIndicatorData(ind)
    if (token !== loadToken) return // mezitím se přepnula jiná statistika – ignoruj
    dataRef.value = d
    loadedIndicatorId.value = ind.id
    selectedYear.value = d.bestYear
    restyle()
  } catch (e: any) {
    if (token !== loadToken) return
    errorMsg.value = 'Nepodařilo se načíst data: ' + (e?.message ?? e)
  } finally {
    if (token === loadToken) loading.value = false
  }
}

function clearSelection() {
  selectedIso3.value = null
  restyle()
}

// promítne aktuální stav (statistika/rok/země) do URL bez reloadu stránky
function syncUrl() {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams()
  p.set('stat', selectedIndicatorId.value)
  if (!isStatic.value) p.set('year', String(selectedYear.value))
  if (selectedIso3.value) p.set('country', selectedIso3.value)
  window.history.replaceState({}, '', `${window.location.pathname}?${p.toString()}`)
}

let copiedTimer: ReturnType<typeof setTimeout> | null = null
async function copyLink() {
  syncUrl()
  try {
    await navigator.clipboard.writeText(window.location.href)
  } catch {
    return
  }
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1600)
}

onMounted(async () => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeChart()
  })

  L = (await import('leaflet')).default

  map = L.map(mapEl.value!, {
    center: [25, 10],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    worldCopyJump: true,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap, &copy; CARTO | Data: World Bank',
    subdomains: 'abcd',
  }).addTo(map)

  try {
    geojson = await fetch(GEOJSON_URL).then((r) => r.json())
    nameMap.value = Object.fromEntries(
      geojson.features.map((f: any) => [f.id, f.properties?.name ?? f.id])
    )
    countryIds.value = new Set(geojson.features.map((f: any) => f.id))

    const d = await loadIndicatorData(currentIndicator.value)
    dataRef.value = d
    loadedIndicatorId.value = currentIndicator.value.id
    // rok z URL, pokud je v rozsahu a má data; jinak nejlepší pokrytí
    selectedYear.value =
      initialYear && initialYear >= d.minYear && initialYear <= d.maxYear
        ? initialYear
        : d.bestYear

    // země z URL
    if (initialCountry && countryIds.value.has(initialCountry)) {
      selectedIso3.value = initialCountry
    }

    geoLayer = L.geoJSON(geojson, {
      style: (f: any) => styleFor(f.id),
      onEachFeature,
    }).addTo(map)

    // přiblížení na předvybranou zemi z URL
    if (selectedIso3.value) {
      geoLayer.eachLayer((l: any) => {
        if (l.feature.id === selectedIso3.value) {
          try {
            map.fitBounds(l.getBounds(), { maxZoom: 4, padding: [30, 30] })
          } catch {}
        }
      })
    }

    loading.value = false
    syncUrl()
  } catch (e: any) {
    errorMsg.value = 'Nepodařilo se načíst mapu/data: ' + (e?.message ?? e)
    loading.value = false
  }
})

watch(selectedIndicatorId, changeIndicator)
watch(selectedYear, restyle)
// průběžná synchronizace trvalého odkazu
watch([selectedIndicatorId, selectedYear, selectedIso3], syncUrl)
// referenční země nesmí být zároveň v seznamu porovnávaných
watch(selectedIso3, (iso) => {
  if (iso) compareIsos.value = compareIsos.value.filter((x) => x !== iso)
})
</script>

<template>
  <div class="wrap">
    <header class="topbar">
      <div class="brand"><span class="dot" /> Mapa světových statistik</div>
      <div class="controls">
        <label>
          Statistika:
          <select v-model="selectedIndicatorId">
            <optgroup v-for="g in grouped" :key="g.name" :label="g.name">
              <option v-for="ind in g.items" :key="ind.id" :value="ind.id">
                {{ ind.label }}
              </option>
            </optgroup>
          </select>
        </label>
        <button v-if="selectedIso3" class="clear" @click="clearSelection">
          Zrušit výběr ✕
        </button>
        <button class="share" @click="copyLink">
          {{ copied ? '✓ Zkopírováno' : '🔗 Sdílet odkaz' }}
        </button>
      </div>
    </header>

    <div class="mapbox">
      <div ref="mapEl" class="map" />

      <div v-if="loading" class="overlay">Načítám data…</div>
      <div v-if="errorMsg" class="overlay error">{{ errorMsg }}</div>

      <!-- Slider roku -->
      <div v-if="!isStatic" class="yearbar">
        <span class="year-min">{{ minYear }}</span>
        <input
          type="range"
          :min="minYear"
          :max="maxYear"
          step="1"
          v-model.number="selectedYear"
        />
        <span class="year-max">{{ maxYear }}</span>
        <span class="year-now">{{ selectedYear }}</span>
      </div>
      <div v-else class="yearbar static-note">
        Orientační odhad (bez časové řady)
      </div>

      <!-- Info panel -->
      <div class="panel">
        <div class="ind-head">
          {{ currentIndicator.label }}
          <span class="ind-unit">[{{ currentIndicator.unit }}]</span>
        </div>

        <div v-if="!selectedCountry" class="hint">
          Klikni na zemi. Stane se referenční a ostatní se obarví podle toho, zda jsou
          <b class="g">lepší</b> nebo <b class="r">horší</b> v roce
          <b>{{ selectedYear }}</b>.
        </div>
        <div v-else>
          <div class="panel-title">Referenční země · {{ selectedYear }}</div>
          <div class="country-name-row">
            <span class="country-name">{{ selectedCountry.name }}</span>
            <button
              class="chart-btn"
              :disabled="!ready"
              title="Zobrazit vývoj v čase"
              @click="openChart"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 3v18h18 M7 14l4-4 3 3 5-6"
                />
              </svg>
            </button>
          </div>
          <div class="country-val">
            <template v-if="!ready"><span class="muted">Načítám…</span></template>
            <template v-else-if="selectedCountry.value != null">
              {{ formatValue(selectedCountry.value, currentIndicator) }}
              <span class="unit">{{ currentIndicator.unit }}</span>
            </template>
            <template v-else>žádná data pro {{ selectedYear }}</template>
          </div>
          <div v-if="ready && selectedRank" class="rank-badge">
            Pořadí: <b>#{{ selectedRank.rank }}</b> z {{ selectedRank.total }}
          </div>
        </div>

        <div v-if="ready && hoverInfo" class="hover">
          <b>{{ hoverInfo.name }}</b>:
          <template v-if="hoverInfo.value != null">
            {{ formatValue(hoverInfo.value, currentIndicator) }} {{ currentIndicator.unit }}
          </template>
          <template v-else>žádná data</template>
        </div>

        <div class="legend">
          <div class="legend-row"><span class="sw blue" /> vybraná země</div>
          <div class="legend-row">
            <span class="sw green" /> lepší ({{ currentIndicator.higherIsBetter ? 'vyšší' : 'nižší' }})
          </div>
          <div class="legend-row">
            <span class="sw red" /> horší ({{ currentIndicator.higherIsBetter ? 'nižší' : 'vyšší' }})
          </div>
          <div class="legend-row"><span class="sw gray" /> bez dat</div>
        </div>

        <!-- Žebříček zemí -->
        <div class="rank-wrap">
          <div class="rank-head">
            Žebříček · {{ selectedYear }}
            <span class="rank-sub">({{ ranking.length }} zemí, #1 = nejlepší)</span>
          </div>
          <div v-if="ready" class="rank-search">
            <input
              v-model="search"
              type="text"
              placeholder="Hledat zemi…"
              spellcheck="false"
            />
            <button v-if="search" class="rank-search-clear" @click="search = ''">✕</button>
          </div>

          <div v-if="!ready" class="muted rank-loading">Načítám žebříček…</div>
          <div v-else-if="filteredRanking.length === 0" class="muted rank-loading">
            Nic nenalezeno.
          </div>
          <ol v-else class="rank-list">
            <li
              v-for="row in filteredRanking"
              :key="row.iso3"
              :class="{ active: row.iso3 === selectedIso3 }"
              @click="focusCountry(row.iso3)"
            >
              <span class="rank-num">{{ row.rank }}.</span>
              <span class="rank-dot" :style="{ background: rowColor(row.iso3) }" />
              <span class="rank-name">{{ row.name }}</span>
              <span class="rank-val">{{ formatValue(row.value, currentIndicator) }}</span>
            </li>
          </ol>
        </div>

        <div v-if="currentIndicator.source === 'static'" class="note">
          ⚠️ Průměrná mzda jsou orientační odhady (čistá měsíční mzda, USD), ne přesná data.
        </div>
      </div>

      <!-- Disclaimer + zdroje dat -->
      <div class="disclaimer">
        Za správnost a úplnost dat neručíme.
        <span class="sep">·</span>
        Zdroje:
        <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank Open Data</a>,
        <a href="https://github.com/johan/world.geo.json" target="_blank" rel="noopener noreferrer">world.geo.json</a>.
        Průměrná mzda je orientační odhad.
      </div>
    </div>

    <!-- Modální okno s grafem vývoje v čase -->
    <Teleport to="body">
      <div v-if="showChart && selectedCountry" class="modal-overlay" @click="closeChart">
        <div class="modal" @click.stop>
          <div class="modal-head">
            <div class="modal-headmain">
              <div class="modal-title">{{ selectedCountry.name }}</div>
              <div class="modal-stat">
                <select v-model="selectedIndicatorId" class="modal-stat-select">
                  <optgroup v-for="g in grouped" :key="g.name" :label="g.name">
                    <option v-for="ind in g.items" :key="ind.id" :value="ind.id">
                      {{ ind.label }}
                    </option>
                  </optgroup>
                </select>
                <span class="ind-unit">[{{ currentIndicator.unit }}]</span>
              </div>
            </div>
            <button class="modal-close" title="Zavřít (Esc)" @click="closeChart">✕</button>
          </div>

          <div v-if="!ready" class="modal-empty">Načítám data…</div>

          <!-- toolbar: měřítko osy + přidání země -->
          <div v-if="ready" class="modal-toolbar">
            <div class="scale-toggle">
              <span class="tl-label">Osa Y:</span>
              <button :class="{ on: yScaleMode === 'linear' }" @click="yScaleMode = 'linear'">
                Lineární
              </button>
              <button
                :class="{ on: yScaleMode === 'log' }"
                :disabled="!logFeasible"
                :title="logFeasible ? '' : 'Log není dostupný pro nekladné hodnoty'"
                @click="yScaleMode = 'log'"
              >
                Log
              </button>
            </div>
            <div class="add-country">
              <select
                :disabled="compareIsos.length >= MAX_COMPARE || comparableCountries.length === 0"
                @change="addCompare"
              >
                <option value="">
                  {{ compareIsos.length >= MAX_COMPARE ? 'Max. 5 zemí' : '+ Přidat zemi k porovnání' }}
                </option>
                <option v-for="c in comparableCountries" :key="c.iso3" :value="c.iso3">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- legenda zemí -->
          <div v-if="chart && chart.enough" class="chart-legend">
            <span
              v-for="(s, si) in chart.series"
              :key="s.iso"
              class="leg-chip"
            >
              <span class="leg-dot" :style="{ background: s.color }" />
              {{ s.name }}
              <button v-if="si !== 0" class="leg-x" title="Odebrat" @click="removeCompare(s.iso)">✕</button>
            </span>
          </div>

          <div v-if="ready && (!chart || !chart.enough)" class="modal-empty">
            Pro tuto zemi a statistiku není dost dat na graf (potřeba aspoň 2 roky).
          </div>

          <template v-if="ready && chart && chart.enough">
            <div v-if="chart.single && chart.change != null" class="modal-change">
              {{ chart.x0 }} → {{ chart.x1 }}:
              <b :class="chart.change >= 0 ? 'up' : 'down'">
                {{ chart.change >= 0 ? '▲' : '▼' }}
                {{ Math.abs(chart.change).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) }} %
              </b>
              <span class="modal-change-vals">
                ({{ formatValue(chart.first, currentIndicator) }} →
                {{ formatValue(chart.last, currentIndicator) }} {{ currentIndicator.unit }})
              </span>
            </div>

            <svg class="chart-svg" :viewBox="`0 0 ${CHART_W} ${CHART_H}`" role="img">
              <!-- mřížka + osa Y -->
              <g>
                <line
                  v-for="(t, i) in chart.yticks"
                  :key="'g' + i"
                  :x1="PAD.left"
                  :x2="CHART_W - PAD.right"
                  :y1="t.y"
                  :y2="t.y"
                  stroke="#e2e8f0"
                  stroke-width="1"
                />
                <text
                  v-for="(t, i) in chart.yticks"
                  :key="'yl' + i"
                  :x="PAD.left - 8"
                  :y="t.y + 4"
                  text-anchor="end"
                  class="axis-label"
                >{{ t.label }}</text>
              </g>

              <!-- osa X -->
              <g>
                <text
                  v-for="t in chart.xticks"
                  :key="'xl' + t.yr"
                  :x="t.x"
                  :y="CHART_H - PAD.bottom + 20"
                  text-anchor="middle"
                  class="axis-label"
                >{{ t.yr }}</text>
              </g>

              <!-- plocha pod čarou (jen u jedné země) -->
              <polygon v-if="chart.single && chart.area" :points="chart.area" fill="rgba(37,99,235,0.12)" />

              <!-- série -->
              <g v-for="s in chart.series" :key="'s' + s.iso">
                <polyline
                  :points="s.line"
                  fill="none"
                  :stroke="s.color"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <circle
                  v-for="c in s.coords"
                  :key="s.iso + c.year"
                  :cx="c.x"
                  :cy="c.y"
                  r="2.5"
                  :fill="s.color"
                >
                  <title>{{ s.name }} · {{ c.year }}: {{ formatValue(c.value, currentIndicator) }} {{ currentIndicator.unit }}</title>
                </circle>
              </g>

              <!-- zvýraznění aktuálně zvoleného roku (na referenční zemi) -->
              <g v-if="chart.selPoint">
                <line
                  :x1="chart.selPoint.x"
                  :x2="chart.selPoint.x"
                  :y1="PAD.top"
                  :y2="chart.baseY"
                  stroke="#f59e0b"
                  stroke-width="1.5"
                  stroke-dasharray="4 3"
                />
                <circle :cx="chart.selPoint.x" :cy="chart.selPoint.y" r="5" fill="#f59e0b" stroke="#fff" stroke-width="2" />
              </g>
            </svg>

            <div class="modal-foot">
              <span class="dot-amber" /> zvolený rok ({{ selectedYear }}) na referenční zemi ·
              {{ chart.useLog ? 'logaritmická' : 'lineární' }} osa · Data: World Bank
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.wrap {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 1.1rem;
  background: #0f172a;
  color: #fff;
  z-index: 1000;
}
.brand {
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #ef4444);
  display: inline-block;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.controls label {
  font-size: 0.9rem;
}
select {
  margin-left: 0.4rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  max-width: 60vw;
}
.clear {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.clear:hover { background: #dc2626; }
.share {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}
.share:hover { background: #1d4ed8; }
.disclaimer {
  position: absolute;
  bottom: 0.5rem;
  left: 0.7rem;
  max-width: 320px;
  font-size: 0.68rem;
  line-height: 1.3;
  color: #64748b;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85), 0 0 2px rgba(255, 255, 255, 0.85);
  pointer-events: none;
  z-index: 900;
}
.disclaimer a {
  color: #2563eb;
  text-decoration: none;
  pointer-events: auto;
}
.disclaimer a:hover { text-decoration: underline; }
.disclaimer .sep { color: #94a3b8; margin: 0 0.2rem; }

/* ── Modální okno s grafem ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 3000;
}
.modal {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  width: min(760px, 96vw);
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.2rem 1.4rem 1.4rem;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.modal-headmain { min-width: 0; flex: 1; }
.modal-title { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
.modal-sub { color: #475569; font-size: 0.92rem; margin-top: 0.1rem; }
.modal-stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.35rem;
}
.modal-stat-select {
  padding: 0.32rem 0.5rem;
  border-radius: 7px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  background: #fff;
  cursor: pointer;
  max-width: 320px;
}
.modal-stat-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.modal-close {
  border: none;
  background: #f1f5f9;
  color: #475569;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  flex: 0 0 auto;
}
.modal-close:hover { background: #e2e8f0; }
.modal-empty { color: #64748b; padding: 2rem 0.5rem; text-align: center; }
.modal-change {
  font-size: 0.92rem;
  color: #334155;
  margin: 0.3rem 0 0.6rem;
}
.modal-change .up { color: #16a34a; }
.modal-change .down { color: #dc2626; }
.modal-change-vals { color: #94a3b8; }
.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin: 0.4rem 0 0.7rem;
}
.scale-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.tl-label { font-size: 0.82rem; color: #64748b; margin-right: 0.15rem; }
.scale-toggle button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
}
.scale-toggle button:first-of-type { border-radius: 7px 0 0 7px; }
.scale-toggle button:last-of-type { border-radius: 0 7px 7px 0; border-left: none; }
.scale-toggle button.on {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.scale-toggle button:disabled { opacity: 0.4; cursor: not-allowed; }
.add-country select {
  padding: 0.35rem 0.5rem;
  border-radius: 7px;
  border: 1px solid #cbd5e1;
  font-size: 0.82rem;
  background: #fff;
  cursor: pointer;
  max-width: 260px;
}
.add-country select:disabled { opacity: 0.5; cursor: not-allowed; }
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}
.leg-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.82rem;
  color: #334155;
}
.leg-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.leg-x {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
  margin-left: 0.1rem;
  line-height: 1;
}
.leg-x:hover { color: #dc2626; }
.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}
.axis-label { font-size: 11px; fill: #94a3b8; }
.modal-foot {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.dot-amber {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #f59e0b;
  display: inline-block;
}
.mapbox { position: relative; flex: 1; }
.map { position: absolute; inset: 0; background: #eaf2f8; }
.overlay {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  z-index: 1200;
}
.overlay.error { background: #b91c1c; }

.yearbar {
  position: absolute;
  bottom: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  z-index: 1100;
  width: min(560px, 80vw);
}
.yearbar input[type='range'] {
  flex: 1;
  accent-color: #22c55e;
  cursor: pointer;
}
.year-min,
.year-max {
  font-size: 0.8rem;
  color: #94a3b8;
}
.year-now {
  font-weight: 700;
  font-size: 1.05rem;
  min-width: 3.2rem;
  text-align: center;
  background: #2563eb;
  border-radius: 6px;
  padding: 0.1rem 0.4rem;
}
.yearbar.static-note {
  justify-content: center;
  font-size: 0.85rem;
  color: #fde68a;
  width: auto;
}

.panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 280px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  padding: 1rem;
  z-index: 1100;
  font-size: 0.9rem;
}
.ind-head {
  font-weight: 700;
  font-size: 1rem;
  color: #0f172a;
  margin-bottom: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid #e2e8f0;
}
.ind-unit { color: #94a3b8; font-weight: 400; font-size: 0.8rem; }
.hint { color: #334155; line-height: 1.4; }
.hint .g { color: #16a34a; }
.hint .r { color: #dc2626; }
.panel-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.country-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.country-name { font-size: 1.25rem; font-weight: 700; color: #0f172a; }
.chart-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #2563eb;
  cursor: pointer;
}
.chart-btn:hover { background: #eff6ff; border-color: #2563eb; }
.chart-btn:disabled { opacity: 0.4; cursor: default; }
.country-val { font-size: 1.1rem; color: #2563eb; font-weight: 600; margin-top: 0.2rem; }
.unit { font-size: 0.8rem; color: #64748b; font-weight: 400; }
.hover {
  margin-top: 0.8rem;
  padding-top: 0.6rem;
  border-top: 1px solid #e2e8f0;
  color: #334155;
}
.legend {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid #e2e8f0;
  display: grid;
  gap: 0.35rem;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #475569;
}
.sw { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }
.sw.blue { background: #2563eb; }
.sw.green { background: #22c55e; }
.sw.red { background: #ef4444; }
.sw.gray { background: #d4d4d8; }
.note {
  margin-top: 0.8rem;
  font-size: 0.75rem;
  color: #92400e;
  background: #fef3c7;
  padding: 0.5rem;
  border-radius: 6px;
  line-height: 1.35;
}
.rank-badge {
  margin-top: 0.4rem;
  display: inline-block;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.85rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}
.rank-wrap {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid #e2e8f0;
}
.rank-head {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.4rem;
}
.rank-sub { font-weight: 400; color: #94a3b8; font-size: 0.72rem; }
.muted { color: #94a3b8; font-weight: 400; }
.rank-loading { font-size: 0.82rem; padding: 0.3rem 0; }
.rank-search {
  position: relative;
  margin-bottom: 0.45rem;
}
.rank-search input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem 1.6rem 0.35rem 0.55rem;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.82rem;
  outline: none;
}
.rank-search input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.rank-search-clear {
  position: absolute;
  right: 0.3rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.2rem;
}
.rank-search-clear:hover { color: #475569; }
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
}
.rank-list li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.3rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #334155;
}
.rank-list li:hover { background: #f1f5f9; }
.rank-list li.active {
  background: #dbeafe;
  color: #1e3a8a;
  font-weight: 600;
}
.rank-num {
  min-width: 1.9rem;
  text-align: right;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.rank-list li.active .rank-num { color: #1d4ed8; }
.rank-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.rank-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-val {
  color: #64748b;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rank-list li.active .rank-val { color: #1e3a8a; }
</style>
