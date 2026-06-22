<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useRanking } from '~/composables/useRanking'
import { useCountryMeta } from '~/composables/useCountryMeta'
import { useLabels } from '~/composables/useLabels'
import { formatValue } from '~/composables/useFormat'

const {
  region,
  currentIndicator,
  displayIndicator,
  perCapitaActive,
  setPerCapita,
  selectedCountry,
  hoverInfo,
  selectedYear,
  ready,
  openChart,
  selectedNoData,
  clearSelection,
  referenceMode,
  setReferenceMedian,
  regionMedianValue,
} = useWorldStats()
const { selectedRank } = useRanking()
const { meta } = useCountryMeta()
const { t } = useI18n()
const { label, unit } = useLabels()

const indLabel = computed(() => label(currentIndicator.value, { perCapita: perCapitaActive.value }))
const indUnit = computed(() => unit(currentIndicator.value, perCapitaActive.value))

// sbalení panelu (hlavně na mobilu, kde je panel jako spodní list)
const collapsed = ref(false)
</script>

<template>
  <div class="panel" :class="{ collapsed }">
    <div class="ind-head">
      <span class="ind-head-text">
        {{ indLabel }}
        <span class="ind-unit">[{{ indUnit }}]</span>
      </span>
      <button
        class="panel-toggle"
        :aria-expanded="!collapsed"
        :title="collapsed ? '▴' : '▾'"
        @click="collapsed = !collapsed"
      >{{ collapsed ? '▴' : '▾' }}</button>
    </div>

    <div class="panel-body">
    <label v-if="currentIndicator.perCapita" class="pc-toggle">
      <input
        type="checkbox"
        :checked="perCapitaActive"
        @change="setPerCapita(($event.target as HTMLInputElement).checked)"
      />
      {{ t('panel.perCapita') }}
    </label>
    <!-- Reference = medián regionu -->
    <div v-if="referenceMode === 'median'">
      <div class="panel-title">{{ t('panel.referenceMedian') }} · {{ selectedYear }}</div>
      <div class="country-name-row">
        <span class="country-name">{{ region === 'europe' ? t('panel.medianEurope') : t('panel.medianWorld') }}</span>
        <button class="close-btn" :title="t('panel.cancelMedian')" @click="setReferenceMedian(false)">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12 M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div class="country-val">
        <template v-if="!ready"><span class="muted">{{ t('panel.loading') }}</span></template>
        <template v-else-if="regionMedianValue != null">
          {{ formatValue(regionMedianValue, displayIndicator) }}
          <span class="unit">{{ indUnit }}</span>
        </template>
        <template v-else>{{ t('panel.noData') }}</template>
      </div>
      <div class="hint sm">{{ t('panel.medianHint') }}</div>
    </div>

    <!-- Reference = vybraná země -->
    <div v-else-if="selectedCountry">
      <div class="panel-title">{{ t('panel.referenceCountry') }} · {{ selectedYear }}</div>
      <div class="country-name-row">
        <span class="country-name">{{ selectedCountry.name }}</span>
        <div class="country-actions">
          <button class="chart-btn" :disabled="!ready" :title="t('panel.chartTitle')" @click="openChart()">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"
                d="M3 3v18h18 M7 14l4-4 3 3 5-6"
              />
            </svg>
          </button>
          <button class="close-btn" :title="t('panel.cancelSelect')" @click="clearSelection()">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"
                d="M6 6l12 12 M18 6L6 18"
              />
            </svg>
          </button>
        </div>
      </div>
      <div class="country-val">
        <template v-if="!ready"><span class="muted">{{ t('panel.loading') }}</span></template>
        <template v-else-if="selectedCountry.value != null">
          {{ formatValue(selectedCountry.value, displayIndicator) }}
          <span class="unit">{{ indUnit }}</span>
          <span v-if="!selectedCountry.exact && selectedCountry.valueYear" class="year-note">
            {{ t('panel.dataFromYear', { year: selectedCountry.valueYear }) }}
          </span>
        </template>
        <template v-else>{{ t('panel.noData') }}</template>
      </div>
      <div v-if="ready && selectedRank" class="rank-badge">
        {{ t('panel.rank', { rank: selectedRank.rank, total: selectedRank.total }) }}
      </div>

      <div v-if="meta" class="country-meta">
        <img
          v-if="meta.flagUrl"
          :src="meta.flagUrl"
          :alt="selectedCountry.name"
          class="meta-flag"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <dl class="meta-list">
          <template v-if="meta.capital"><dt>{{ t('panel.capital') }}</dt><dd>{{ meta.capital }}</dd></template>
          <template v-if="meta.region"><dt>{{ t('panel.region') }}</dt><dd>{{ meta.region }}</dd></template>
          <template v-if="meta.incomeLevel"><dt>{{ t('panel.income') }}</dt><dd>{{ meta.incomeLevel }}</dd></template>
        </dl>
      </div>

      <div v-if="selectedNoData" class="nodata-warn">
        <template v-if="selectedNoData.hasAnyYear">
          {{ t('panel.noDataYear', { country: selectedNoData.name, stat: indLabel, year: selectedYear }) }}
        </template>
        <template v-else>
          {{ t('panel.noDataNone', { country: selectedNoData.name, stat: indLabel }) }}
        </template>
      </div>
    </div>

    <!-- Bez reference -->
    <div v-else class="hint">
      {{ t('panel.hintIntro') }}
      <button class="median-btn" @click="setReferenceMedian(true)">{{ t('panel.compareMedian') }}</button>
    </div>

    <div v-if="ready && hoverInfo" class="hover">
      <b>{{ hoverInfo.name }}</b>:
      <template v-if="hoverInfo.value != null">
        {{ formatValue(hoverInfo.value, displayIndicator) }} {{ indUnit }}
        <span v-if="!hoverInfo.exact && hoverInfo.valueYear" class="year-note">({{ hoverInfo.valueYear }})</span>
      </template>
      <template v-else>{{ t('panel.noData') }}</template>
    </div>

    <MapLegend />
    <RankingPanel />

    <div v-if="currentIndicator.source === 'static'" class="note">
      {{ t('panel.staticNote') }}
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
.hint.sm { font-size: 0.8rem; margin-top: 0.4rem; }
.pc-toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  color: var(--text-2);
  margin-bottom: 0.7rem;
  cursor: pointer;
}
.pc-toggle input { cursor: pointer; }
.median-btn {
  display: block;
  margin-top: 0.6rem;
  border: 1px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent-soft-text);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
}
.median-btn:hover { background: var(--accent); color: #fff; }
.year-note { font-size: 0.72rem; color: var(--text-muted); font-weight: 400; }
.country-meta {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.6rem;
  align-items: flex-start;
}
.meta-flag {
  width: 40px;
  height: auto;
  border-radius: 3px;
  border: 1px solid var(--border);
  flex: 0 0 auto;
}
.meta-list { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.1rem 0.5rem; font-size: 0.78rem; }
.meta-list dt { color: var(--text-3); }
.meta-list dd { margin: 0; color: var(--text-2); }
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
.country-actions { display: flex; gap: 0.4rem; flex: 0 0 auto; }
.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-3);
  cursor: pointer;
}
.close-btn:hover { background: var(--bad); border-color: var(--bad); color: #fff; }
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
.nodata-warn {
  margin-top: 0.7rem;
  font-size: 0.8rem;
  color: var(--warn-text);
  background: var(--warn-bg);
  border: 1px solid var(--warn-text);
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  line-height: 1.4;
}
.nodata-btn {
  display: block;
  margin-top: 0.5rem;
  width: 100%;
  border: 1px solid var(--warn-text);
  background: transparent;
  color: var(--warn-text);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}
.nodata-btn:hover { background: var(--warn-text); color: var(--warn-bg); }

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
