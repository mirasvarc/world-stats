<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useChartModel } from '~/composables/useChartModel'
import { formatValue, formatPercent } from '~/composables/useFormat'
import { exportChartSvg, exportChartPng } from '~/composables/useExport'

const {
  region,
  showChart,
  closeChart,
  selectedCountry,
  selectedIndicatorId,
  currentIndicator,
  selectedYear,
  ready,
  yScaleMode,
  compareIsos,
} = useWorldStats()

const {
  chart,
  logFeasible,
  comparableCountries,
  showMedian,
  addCompare,
  removeCompare,
  MAX_COMPARE,
} = useChartModel()

const chartWrap = ref<HTMLElement | null>(null)

function exportName() {
  const c = selectedCountry.value?.iso3 ?? 'graf'
  return `${selectedIndicatorId.value}-${c}`
}
function svgEl(): SVGSVGElement | null {
  return chartWrap.value?.querySelector('svg') ?? null
}
function onExportSvg() {
  const el = svgEl()
  if (el) exportChartSvg(el, exportName())
}
function onExportPng() {
  const el = svgEl()
  if (el) exportChartPng(el, exportName())
}

function onAddCountry(e: Event) {
  const el = e.target as HTMLSelectElement
  if (el.value) addCompare(el.value)
  el.value = ''
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeChart()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="showChart && selectedCountry" class="modal-overlay" @click="closeChart()">
      <div class="modal" @click.stop>
        <div class="modal-head">
          <div class="modal-headmain">
            <div class="modal-title">{{ selectedCountry.name }}</div>
            <div class="modal-stat">
              <IndicatorSelect v-model="selectedIndicatorId" class="modal-stat-select" />
              <span class="ind-unit">[{{ currentIndicator.unit }}]</span>
            </div>
          </div>
          <button class="modal-close" title="Zavřít (Esc)" @click="closeChart()">✕</button>
        </div>

        <div v-if="!ready" class="modal-empty">Načítám data…</div>

        <template v-else>
          <!-- toolbar: měřítko osy + medián + přidání země + export -->
          <div class="modal-toolbar">
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

            <button class="median-toggle" :class="{ on: showMedian }" @click="showMedian = !showMedian">
              <span class="median-dash" /> {{ region === 'europe' ? 'medián Evropy' : 'medián světa' }}
            </button>

            <div class="add-country">
              <select
                :disabled="compareIsos.length >= MAX_COMPARE || comparableCountries.length === 0"
                @change="onAddCountry"
              >
                <option value="">
                  {{ compareIsos.length >= MAX_COMPARE ? `Max. ${MAX_COMPARE} zemí` : '+ Přidat zemi k porovnání' }}
                </option>
                <option v-for="c in comparableCountries" :key="c.iso3" :value="c.iso3">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <div class="export-grp">
              <button title="Stáhnout jako PNG" @click="onExportPng">⬇ PNG</button>
              <button title="Stáhnout jako SVG" @click="onExportSvg">SVG</button>
            </div>
          </div>

          <!-- legenda zemí -->
          <div v-if="chart && chart.enough" class="chart-legend">
            <span
              v-for="(ser, si) in chart.series"
              :key="ser.iso"
              class="leg-chip"
              :class="{ 'leg-median': ser.isMedian }"
            >
              <span class="leg-dot" :class="{ 'leg-dot-dash': ser.dashed }" :style="{ background: ser.color }" />
              {{ ser.name }}
              <button
                v-if="si !== 0 && !ser.isMedian"
                class="leg-x"
                title="Odebrat"
                @click="removeCompare(ser.iso)"
              >✕</button>
            </span>
          </div>

          <div v-if="!chart || !chart.enough" class="modal-empty">
            Pro tuto zemi a statistiku není dost dat na graf (potřeba aspoň 2 roky).
          </div>

          <template v-else>
            <div v-if="chart.single && chart.change != null" class="modal-change">
              {{ chart.x0 }} → {{ chart.x1 }}:
              <b :class="chart.change >= 0 ? 'up' : 'down'">
                {{ chart.change >= 0 ? '▲' : '▼' }} {{ formatPercent(chart.change) }}
              </b>
              <span class="modal-change-vals">
                ({{ formatValue(chart.first, currentIndicator) }} →
                {{ formatValue(chart.last, currentIndicator) }} {{ currentIndicator.unit }})
              </span>
            </div>

            <div ref="chartWrap">
              <TimeSeriesChart :chart="chart" />
            </div>

            <div class="modal-foot">
              <span class="dot-amber" /> zvolený rok ({{ selectedYear }}) na referenční zemi ·
              {{ chart.useLog ? 'logaritmická' : 'lineární' }} osa · Data: World Bank
            </div>
          </template>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  background: var(--surface);
  color: var(--text);
  border-radius: 14px;
  box-shadow: var(--shadow-modal);
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
.modal-title { font-size: 1.4rem; font-weight: 700; color: var(--text); }
.modal-stat { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.35rem; }
.modal-stat :deep(.modal-stat-select),
.modal-stat :deep(select) {
  padding: 0.32rem 0.5rem;
  border-radius: 7px;
  border: 1px solid var(--border-2);
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  max-width: 320px;
}
.modal-stat :deep(select:focus) {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.ind-unit { color: var(--text-muted); font-weight: 400; font-size: 0.85rem; }
.modal-close {
  border: none;
  background: var(--surface-3);
  color: var(--text-2);
  width: 34px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  flex: 0 0 auto;
}
.modal-close:hover { background: var(--border); }
.modal-empty { color: var(--text-3); padding: 2rem 0.5rem; text-align: center; }
.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin: 0.4rem 0 0.7rem;
}
.scale-toggle { display: inline-flex; align-items: center; gap: 0.35rem; }
.tl-label { font-size: 0.82rem; color: var(--text-3); margin-right: 0.15rem; }
.scale-toggle button {
  border: 1px solid var(--border-2);
  background: var(--surface);
  color: var(--text-2);
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
}
.scale-toggle button:first-of-type { border-radius: 7px 0 0 7px; }
.scale-toggle button:last-of-type { border-radius: 0 7px 7px 0; border-left: none; }
.scale-toggle button.on { background: var(--accent); color: #fff; border-color: var(--accent); }
.scale-toggle button:disabled { opacity: 0.4; cursor: not-allowed; }
.median-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid var(--border-2);
  background: var(--surface);
  color: var(--text-3);
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
  border-radius: 7px;
  cursor: pointer;
}
.median-toggle.on { color: var(--text); border-color: #64748b; }
.median-toggle .median-dash {
  width: 16px;
  height: 0;
  border-top: 2px dashed #64748b;
  display: inline-block;
}
.add-country { margin-left: auto; }
.add-country select {
  padding: 0.35rem 0.5rem;
  border-radius: 7px;
  border: 1px solid var(--border-2);
  font-size: 0.82rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  max-width: 260px;
}
.add-country select:disabled { opacity: 0.5; cursor: not-allowed; }
.export-grp { display: inline-flex; gap: 0.3rem; }
.export-grp button {
  border: 1px solid var(--border-2);
  background: var(--surface);
  color: var(--text-2);
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 7px;
  cursor: pointer;
}
.export-grp button:hover { background: var(--surface-3); }
.chart-legend { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
.leg-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--surface-3);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.82rem;
  color: var(--text-2);
}
.leg-median { font-style: italic; }
.leg-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.leg-dot.leg-dot-dash {
  width: 16px;
  height: 0;
  border-radius: 0;
  background: none !important;
  border-top: 2px dashed #64748b;
}
.leg-x {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
  margin-left: 0.1rem;
  line-height: 1;
}
.leg-x:hover { color: var(--bad); }
.modal-change { font-size: 0.92rem; color: var(--text-2); margin: 0.3rem 0 0.6rem; }
.modal-change .up { color: var(--good); }
.modal-change .down { color: var(--bad); }
.modal-change-vals { color: var(--text-muted); }
.modal-foot {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  color: var(--text-muted);
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
</style>
