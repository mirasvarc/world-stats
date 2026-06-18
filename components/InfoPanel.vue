<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useRanking } from '~/composables/useRanking'
import { formatValue } from '~/composables/useFormat'

const {
  currentIndicator,
  selectedCountry,
  hoverInfo,
  selectedYear,
  ready,
  openChart,
} = useWorldStats()
const { selectedRank } = useRanking()
</script>

<template>
  <div class="panel">
    <div class="ind-head">
      {{ currentIndicator.label }}
      <span class="ind-unit">[{{ currentIndicator.unit }}]</span>
    </div>

    <div v-if="!selectedCountry" class="hint">
      Klikni na zemi. Stane se referenční a ostatní se obarví podle toho, zda jsou
      <b class="g">lepší</b> nebo <b class="r">horší</b> v roce <b>{{ selectedYear }}</b>.
    </div>
    <div v-else>
      <div class="panel-title">Referenční země · {{ selectedYear }}</div>
      <div class="country-name-row">
        <span class="country-name">{{ selectedCountry.name }}</span>
        <button class="chart-btn" :disabled="!ready" title="Zobrazit vývoj v čase" @click="openChart()">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
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

    <MapLegend />
    <RankingPanel />

    <div v-if="currentIndicator.source === 'static'" class="note">
      ⚠️ Průměrná mzda jsou orientační odhady (čistá měsíční mzda, USD), ne přesná data.
    </div>
  </div>
</template>

<style scoped>
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
.muted { color: #94a3b8; font-weight: 400; }
.rank-badge {
  margin-top: 0.4rem;
  display: inline-block;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.85rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}
.hover {
  margin-top: 0.8rem;
  padding-top: 0.6rem;
  border-top: 1px solid #e2e8f0;
  color: #334155;
}
.note {
  margin-top: 0.8rem;
  font-size: 0.75rem;
  color: #92400e;
  background: #fef3c7;
  padding: 0.5rem;
  border-radius: 6px;
  line-height: 1.35;
}
</style>
