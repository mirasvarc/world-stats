# 🌍 Mapa světových statistik

Interaktivní webová mapa světa postavená na **Nuxt 3**. Vyber statistiku, klikni na zemi
a ostatní země se obarví **zeleně** (lepší) nebo **červeně** (horší) podle porovnání
s vybranou zemí. Součástí je časová osa, žebříček zemí a graf vývoje v čase.

## ✨ Funkce

- **Interaktivní mapa** (Leaflet) – klikni na zemi a stane se referenční
- **24 statistik** ve 4 kategoriích (ekonomika, obyvatelstvo, zdraví & život, vzdělání/technologie/ekologie)
- **Obarvení lepší/horší** se správnou sémantikou i pro metriky, kde je nižší lepší
  (inflace, nezaměstnanost, kojenecká úmrtnost, Gini, CO₂)
- **Slider roku** (1995–2024) – mapa se přebarví podle dat zvoleného roku
- **Žebříček zemí** s vyhledáváním (bez ohledu na diakritiku), pořadím a proklikem
- **Graf vývoje v čase** (modální okno):
  - přepínač **lineární / logaritmické** osy Y
  - **porovnání více zemí** (až 5) v jednom grafu
  - výběr statistiky přímo v okně
  - zvýraznění aktuálně zvoleného roku, % změna za období
- **Trvalý (sdílitelný) odkaz** – stav (`?stat=…&year=…&country=…`) se ukládá do URL
- Robustní načítání: ochrana proti zastaralým datům při rychlém přepínání statistik

## 📊 Zdroje dat

- **[World Bank Open Data](https://data.worldbank.org/)** – otevřené REST API bez klíče,
  zdroj většiny statistik (HDP, populace, délka života, inflace, …). Data se stahují
  za běhu pro zvolený indikátor v rozsahu let 1995–2024.
- **[world.geo.json](https://github.com/johan/world.geo.json)** – obrysy zemí
  (feature `id` = ISO-3166 alpha-3, podle kterého se spojují data s mapou).
- **Mapové dlaždice** – CARTO / OpenStreetMap.
- **Průměrná mzda** – orientační statický odhad v `public/avg-wage.json`
  (čistá měsíční mzda v USD), protože World Bank tuto metriku přímo nemá.

> ⚠️ Za správnost a úplnost dat se neručí. Hodnoty jsou převzaty z veřejných zdrojů
> a slouží pro orientační srovnání.

## 🚀 Spuštění

```bash
# instalace závislostí
npm install

# vývojový server (http://localhost:3000)
npm run dev
```

> Pokud je port 3000 obsazený, spusť na jiném: `PORT=3100 npm run dev`

## ☁️ Deploy na Cloudflare Workers

Aplikace je nakonfigurovaná pro **Cloudflare Workers** (Nitro preset `cloudflare-module`
v `nuxt.config.ts`, konfigurace v `wrangler.toml`). Worker obstarává SSR, statická aktiva
(HTML/JS/CSS, `avg-wage.json`) servíruje Workers Assets přes binding `ASSETS`.

```bash
# jednorázové přihlášení k Cloudflare účtu
npx wrangler login

# build + deploy
npm run deploy            # = nuxt build && wrangler deploy

# lokální náhled v reálném Workers runtime (workerd) na http://localhost:8787
npm run preview           # = nuxt build && wrangler dev
```

Aplikace se nasadí na `https://world-stats-map.<tvuj-subdomena>.workers.dev`
(název změníš v `wrangler.toml` → `name`). Pro vlastní doménu přidej do `wrangler.toml`
sekci `[[routes]]` nebo nastav route v Cloudflare dashboardu.

> Veškerá data (World Bank API, GeoJSON) se stahují **na straně prohlížeče**, worker tedy
> nedělá žádné odchozí požadavky – jen vrací aplikaci.

### Build pro jiné prostředí

```bash
NITRO_PRESET=node-server npm run build   # klasický Node server
npm run generate                         # plně statická varianta (SPA) do .output/public
```

## 🗂️ Struktura projektu

Aplikace je rozdělená na malé prezentační komponenty a composables se sdíleným stavem
a logikou (snadno testovatelné a rozšiřitelné).

```
world-stats-map/
├── app.vue                       # kořen (ClientOnly wrapper)
├── nuxt.config.ts
├── components/
│   ├── WorldMap.client.vue       # orchestrátor layoutu + hostuje mapu
│   ├── AppHeader.vue             # horní lišta (výběr statistiky, sdílení)
│   ├── IndicatorSelect.vue       # znovupoužitelný <select> statistik
│   ├── YearSlider.vue            # posuvník roku
│   ├── InfoPanel.vue             # boční panel (ref. země, legenda, žebříček)
│   ├── MapLegend.vue
│   ├── RankingPanel.vue          # žebříček + vyhledávání
│   ├── CountryDisclaimer.vue
│   ├── ChartModal.vue            # okno s grafem (osy, porovnání zemí)
│   └── TimeSeriesChart.vue       # čisté SVG vykreslení grafu
├── composables/
│   ├── useIndicators.ts          # konfigurace statistik (INDICATORS) + seskupení
│   ├── useStatsData.ts           # načítání/cache dat z API, valueAt()
│   ├── useFormat.ts              # formátování čísel a normalizace textu
│   ├── useGeo.ts                 # načtení GeoJSON, názvy/množina zemí
│   ├── useWorldStats.ts          # centrální „store" (sdílený stav + akce)
│   ├── useColorScale.ts          # barevná logika lepší/horší
│   ├── useRanking.ts             # žebříček zemí
│   ├── useChartModel.ts          # geometrie grafu + porovnání
│   ├── useShareLink.ts           # synchronizace URL + kopírování odkazu
│   └── useLeafletMap.ts          # orchestrace Leaflet mapy
└── public/
    └── avg-wage.json             # orientační dataset průměrných mezd
```

## ➕ Přidání další statistiky

Stačí přidat položku do pole `INDICATORS` v `composables/useIndicators.ts`:

```ts
{
  id: 'unikatni_id',
  group: 'Ekonomika',            // kategorie v rozbalovacím menu
  label: 'Název statistiky',
  unit: 'jednotka',
  higherIsBetter: true,          // false = nižší hodnota je lepší (zelená)
  source: 'worldbank',
  code: 'NY.GDP.MKTP.CD',        // kód indikátoru World Bank
  decimals: 1,
}
```

Dostupné kódy indikátorů najdeš na <https://data.worldbank.org/indicator>.

## 🛠️ Technologie

- [Nuxt 3](https://nuxt.com/) / [Vue 3](https://vuejs.org/)
- [Leaflet](https://leafletjs.com/) (mapa)
- Vlastní SVG graf (bez externí grafové knihovny)

## 📄 Licence

Data patří jejich poskytovatelům (World Bank aj.). Kód projektu je k volnému použití.
