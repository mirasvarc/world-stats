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

// sbalení panelu (hlavně na mobilu, kde je panel jako spodní list)
const collapsed = ref(false)
</script>

<template>
  <div class="panel" :class="{ collapsed }">
    <div class="ind-head">
      <span class="ind-head-text">
        {{ currentIndicator.label }}
        <span class="ind-unit">[{{ currentIndicator.unit }}]</span>
      </span>
      <button
        class="panel-toggle"
        :aria-expanded="!collapsed"
        :title="collapsed ? 'Rozbalit' : 'Sbalit'"
        @click="collapsed = !collapsed"
      >{{ collapsed ? '▴' : '▾' }}</button>
    </div>

    <div class="panel-body">
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
  background: var(--surface);
  color: var(--text-2);
  border-radius: 12px;
  box-shadow: var(--shadow-panel);
  padding: 1rem;
  z-index: 1100;
  font-size: 0.9rem;
}
.ind-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text);
  margin-bottom: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--border);
}
.panel-toggle {
  display: none;
  border: none;
  background: var(--surface-3);
  color: var(--text-2);
  width: 28px;
  height: 28px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.9rem;
  flex: 0 0 auto;
}
.ind-unit { color: var(--text-muted); font-weight: 400; font-size: 0.8rem; }
.hint { color: var(--text-2); line-height: 1.4; }
.hint .g { color: var(--good); }
.hint .r { color: var(--bad); }
.panel-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3);
}
.country-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.country-name { font-size: 1.25rem; font-weight: 700; color: var(--text); }
.chart-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--accent);
  cursor: pointer;
}
.chart-btn:hover { background: var(--accent-soft); border-color: var(--accent); }
.chart-btn:disabled { opacity: 0.4; cursor: default; }
.country-val { font-size: 1.1rem; color: var(--accent); font-weight: 600; margin-top: 0.2rem; }
.unit { font-size: 0.8rem; color: var(--text-3); font-weight: 400; }
.muted { color: var(--text-muted); font-weight: 400; }
.rank-badge {
  margin-top: 0.4rem;
  display: inline-block;
  background: var(--accent-soft);
  color: var(--accent-soft-text);
  font-size: 0.85rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}
.hover {
  margin-top: 0.8rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border);
  color: var(--text-2);
}
.note {
  margin-top: 0.8rem;
  font-size: 0.75rem;
  color: var(--warn-text);
  background: var(--warn-bg);
  padding: 0.5rem;
  border-radius: 6px;
  line-height: 1.35;
}

/* Mobil: panel jako spodní list přes celou šířku, sbalitelný. */
@media (max-width: 640px) {
  .panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: auto;
    max-height: 55vh;
    border-radius: 14px 14px 0 0;
    padding: 0.8rem 1rem;
  }
  .panel.collapsed { max-height: none; }
  .panel-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .panel.collapsed .ind-head { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
  .panel.collapsed .panel-body { display: none; }
}
</style>
