<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useChartModel } from '~/composables/useChartModel'
import { formatValue, formatPercent } from '~/composables/useFormat'

const {
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

const { chart, logFeasible, comparableCountries, addCompare, removeCompare, MAX_COMPARE } =
  useChartModel()

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
          <!-- toolbar: měřítko osy + přidání země -->
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
          </div>

          <!-- legenda zemí -->
          <div v-if="chart && chart.enough" class="chart-legend">
            <span v-for="(ser, si) in chart.series" :key="ser.iso" class="leg-chip">
              <span class="leg-dot" :style="{ background: ser.color }" />
              {{ ser.name }}
              <button v-if="si !== 0" class="leg-x" title="Odebrat" @click="removeCompare(ser.iso)">✕</button>
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

            <TimeSeriesChart :chart="chart" />

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
.modal-stat { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.35rem; }
.modal-stat :deep(.modal-stat-select),
.modal-stat :deep(select) {
  padding: 0.32rem 0.5rem;
  border-radius: 7px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  background: #fff;
  cursor: pointer;
  max-width: 320px;
}
.modal-stat :deep(select:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.ind-unit { color: #94a3b8; font-weight: 400; font-size: 0.85rem; }
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
.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin: 0.4rem 0 0.7rem;
}
.scale-toggle { display: inline-flex; align-items: center; gap: 0.35rem; }
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
.scale-toggle button.on { background: #2563eb; color: #fff; border-color: #2563eb; }
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
.chart-legend { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
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
.modal-change { font-size: 0.92rem; color: #334155; margin: 0.3rem 0 0.6rem; }
.modal-change .up { color: #16a34a; }
.modal-change .down { color: #dc2626; }
.modal-change-vals { color: #94a3b8; }
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
</style>
