// Orchestrace Leaflet mapy: inicializace, propojení s centrálním stavem,
// překreslení barev při změně statistiky/roku/výběru a přiblížení na zemi.
// Voláno jednou v kořenové komponentě (registruje watchery a lifecycle).

import 'leaflet/dist/leaflet.css'
import type { Ref } from 'vue'
import { useWorldStats } from './useWorldStats'
import { useGeo } from './useGeo'
import { useColorScale } from './useColorScale'
import { loadIndicatorData } from './useStatsData'
import { getIndicator } from './useIndicators'
import { formatValue } from './useFormat'
import { isEuropean } from './useContinents'
import { useLabels } from './useLabels'

// Po prvním načtení v nečinnosti předehřejeme cache nejčastějších statistik,
// aby přepnutí na ně bylo okamžité (bez čekání na síť).
const PREFETCH_IDS = ['gdp_pc', 'population', 'life', 'inflation', 'unemployment']

function prefetchPopular(region: 'world' | 'europe', skipId: string) {
  const run = () => {
    for (const id of PREFETCH_IDS) {
      if (id === skipId) continue
      const ind = getIndicator(id, region)
      if (ind) loadIndicatorData(ind).catch(() => {}) // tichý best-effort
    }
  }
  const ric = (globalThis as any).requestIdleCallback
  if (typeof ric === 'function') ric(run, { timeout: 3000 })
  else setTimeout(run, 1500)
}

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; OpenStreetMap, &copy; CARTO | Data: World Bank, Eurostat'

// Výřez mapy pro režim Evropa (přibližně kontinentální Evropa).
const EUROPE_BOUNDS: [[number, number], [number, number]] = [
  [34, -12],
  [71, 42],
]

export function useLeafletMap(mapEl: Ref<HTMLElement | null>) {
  const s = useWorldStats()
  const geo = useGeo()
  const { styleFor } = useColorScale()
  const { t } = useI18n()
  const { unit } = useLabels()

  let L: any = null
  let map: any = null
  let geoLayer: any = null
  let tileLayer: any = null

  /** obsah tooltipu u kurzoru – aktuální hodnota země ve zvoleném roce */
  function tooltipHtml(iso3: string): string {
    const name = geo.nameFor(iso3)
    const eff = s.effectiveValue(iso3)
    const ind = s.displayIndicator.value
    if (!eff) return `${name}<br><span class="tip-nodata">${t('panel.noData')}</span>`
    const u = unit(s.currentIndicator.value, s.perCapitaActive.value)
    const yearNote =
      eff.exact || eff.year === s.selectedYear.value
        ? ''
        : ` <span class="tip-nodata">(${eff.year})</span>`
    return `${name}<br><span class="tip-val">${formatValue(eff.value, ind)} ${u}</span>${yearNote}`
  }

  function restyle() {
    geoLayer?.eachLayer((layer: any) => layer.setStyle(styleFor(layer.feature.id)))
  }

  /** Přizpůsobí výřez mapy regionu (Evropa = výřez, Svět = celosvětový pohled). */
  function fitRegion() {
    if (!map) return
    if (s.region.value === 'europe') {
      map.fitBounds(EUROPE_BOUNDS, { padding: [10, 10] })
    } else {
      map.setView([25, 10], 2)
    }
  }

  function focusOn(iso3: string | null) {
    if (!iso3 || !geoLayer || !map) return
    geoLayer.eachLayer((layer: any) => {
      if (layer.feature.id === iso3) {
        try {
          map.fitBounds(layer.getBounds(), { maxZoom: 4, padding: [30, 30] })
        } catch {}
      }
    })
  }

  function onEachFeature(feature: any, layer: any) {
    // tooltip u kurzoru (obsah se počítá při otevření – odráží aktuální rok/statistiku)
    layer.bindTooltip(() => tooltipHtml(feature.id), {
      sticky: true,
      direction: 'top',
      className: 'country-tip',
      opacity: 1,
    })
    layer.on({
      click: () => {
        // v Evropě nelze vybrat mimoevropskou (ztlumenou) zemi
        if (s.region.value === 'europe' && !isEuropean(feature.id)) return
        s.selectCountry(feature.id)
      },
      mouseover: (e: any) => {
        s.hoverIso.value = feature.id
        e.target.setStyle({ weight: 2.5, color: '#0f172a' })
        e.target.bringToFront()
      },
      mouseout: (e: any) => {
        s.hoverIso.value = null
        e.target.setStyle(styleFor(feature.id))
      },
    })
  }

  onMounted(async () => {
    L = (await import('leaflet')).default

    map = L.map(mapEl.value!, {
      center: [25, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 6,
      worldCopyJump: true,
      // svisle omezíme na rozsah Web Mercatoru (±85°), vodorovně necháme nekonečné
      maxBounds: [
        [-85, -Infinity],
        [85, Infinity],
      ],
      maxBoundsViscosity: 1.0,
    })
    tileLayer = L.tileLayer(s.darkMode.value ? TILE_DARK : TILE_LIGHT, {
      attribution: TILE_ATTR,
      subdomains: 'abcd',
    }).addTo(map)

    try {
      // GeoJSON (obrysy) a data indikátoru jsou nezávislé → načítáme paralelně.
      const dataLoad = s.load(s.selectedIndicatorId.value, s.initialYear)
      await geo.loadGeo()

      // Obrysy vykreslíme hned po GeoJSONu (ještě před daty) – uživatel vidí mapu
      // okamžitě (zatím šedou) a po dotažení dat se jen přebarví. styleFor zvládá
      // i stav bez dat (value == null → šedá), takže předčasné vykreslení je bezpečné.
      geoLayer = L.geoJSON(geo.geojson.value, {
        style: (f: any) => styleFor(f.id),
        onEachFeature,
      }).addTo(map)

      // země z URL (lze vybrat hned, k vykreslení výběru stačí obrysy)
      if (s.initialCountry && geo.isRealCountry(s.initialCountry)) {
        s.selectCountry(s.initialCountry)
      }
      if (s.region.value === 'europe' && !s.selectedIso3.value) fitRegion()
      else focusOn(s.selectedIso3.value)

      // dobarvení po dotažení dat
      await dataLoad
      restyle()

      // v nečinnosti předehřát cache nejčastějších statistik
      prefetchPopular(s.region.value, s.selectedIndicatorId.value)
    } catch (e: any) {
      s.errorMsg.value = 'Nepodařilo se načíst mapu/data: ' + (e?.message ?? e)
      s.loading.value = false
    }
  })

  onBeforeUnmount(() => {
    map?.remove()
    map = null
    geoLayer = null
  })

  // překreslení při změnách stavu
  watch(s.selectedIndicatorId, async () => {
    await s.load()
    restyle()
  })
  watch(s.selectedYear, restyle)
  watch(s.selectedIso3, restyle)
  // per-capita / reference (medián) / dotažení populace → překreslit obarvení
  watch([s.perCapita, s.referenceMode, s.populationData], restyle)
  // přepnutí regionu (Svět/Evropa) → načíst data, překreslit a přiblížit výřez
  watch(s.region, async () => {
    await s.load()
    restyle()
    fitRegion()
  })
  watch(s.focusNonce, () => focusOn(s.selectedIso3.value))
  // přepnutí tmavého režimu → výměna mapových dlaždic
  watch(s.darkMode, (dark) => tileLayer?.setUrl(dark ? TILE_DARK : TILE_LIGHT))
}
