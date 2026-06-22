<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useRanking } from '~/composables/useRanking'
import { useColorScale } from '~/composables/useColorScale'
import { useLabels } from '~/composables/useLabels'
import { formatValue, normalizeText } from '~/composables/useFormat'
import { CONTINENTS } from '~/composables/useContinents'
import { exportRankingCsv } from '~/composables/useExport'

const { region, selectedIso3, currentIndicator, displayIndicator, perCapitaActive, selectedYear, ready, focusCountry } = useWorldStats()
const { ranking } = useRanking()
const { colorFor } = useColorScale()
const { t } = useI18n()
const { label, unit, continent: contLabel } = useLabels()

const search = ref('')
const continent = ref<string>('') // '' = vše

const filtered = computed(() => {
  const q = normalizeText(search.value.trim())
  const cont = continent.value
  return ranking.value.filter((r) => {
    if (cont && r.continent !== cont) return false
    if (q && !normalizeText(r.name).includes(q)) return false
    return true
  })
})

function onExport() {
  exportRankingCsv(filtered.value, displayIndicator.value, {
    label: label(currentIndicator.value, { perCapita: perCapitaActive.value }),
    unit: unit(currentIndicator.value, perCapitaActive.value),
    year: selectedYear.value,
    cols: { rank: t('ranking.colRank'), country: t('ranking.colCountry'), continent: t('ranking.colContinent') },
    cont: contLabel,
  })
}
</script>

<template>
  <div class="rank-wrap">
    <div class="rank-head">
      <span>
        {{ t('ranking.header', { year: selectedYear }) }}
        <span class="rank-sub">{{ t('ranking.countries', { n: ranking.length }) }}</span>
      </span>
      <button
        v-if="ready && filtered.length"
        class="rank-csv"
        :title="t('ranking.csvTitle')"
        @click="onExport"
      >{{ t('ranking.csv') }}</button>
    </div>

    <div v-if="ready" class="rank-filters">
      <div class="rank-search">
        <input v-model="search" type="text" :placeholder="t('ranking.search')" spellcheck="false" />
        <button v-if="search" class="rank-search-clear" @click="search = ''">✕</button>
      </div>
      <select v-if="region !== 'europe'" v-model="continent" class="rank-cont" :aria-label="t('ranking.allContinents')">
        <option value="">{{ t('ranking.allContinents') }}</option>
        <option v-for="c in CONTINENTS" :key="c" :value="c">{{ contLabel(c) }}</option>
      </select>
    </div>

    <!-- skeleton při načítání -->
    <div v-if="!ready" class="rank-skeleton">
      <div v-for="i in 8" :key="i" class="sk-row">
        <span class="sk-bar sk-num" />
        <span class="sk-bar sk-name" />
        <span class="sk-bar sk-val" />
      </div>
    </div>

    <div v-else-if="filtered.length === 0" class="muted rank-loading">{{ t('ranking.nothing') }}</div>
    <ol v-else class="rank-list">
      <li
        v-for="row in filtered"
        :key="row.iso3"
        :class="{ active: row.iso3 === selectedIso3 }"
        @click="focusCountry(row.iso3)"
      >
        <span class="rank-num">{{ row.rank }}.</span>
        <span class="rank-dot" :style="{ background: colorFor(row.iso3) }" />
        <span class="rank-name">{{ row.name }}</span>
        <span class="rank-val">{{ formatValue(row.value, displayIndicator) }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.rank-wrap {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border);
}
.rank-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.4rem;
}
.rank-sub { font-weight: 400; color: var(--text-muted); font-size: 0.72rem; }
.rank-csv {
  border: 1px solid var(--border-2);
  background: var(--surface);
  color: var(--text-2);
  font-size: 0.72rem;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.rank-csv:hover { background: var(--surface-3); }
.muted { color: var(--text-muted); font-weight: 400; }
.rank-loading { font-size: 0.82rem; padding: 0.3rem 0; }
.rank-filters { display: grid; gap: 0.4rem; margin-bottom: 0.45rem; }
.rank-search { position: relative; }
.rank-search input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem 1.6rem 0.35rem 0.55rem;
  border: 1px solid var(--border-2);
  border-radius: 7px;
  font-size: 0.82rem;
  outline: none;
  background: var(--surface);
  color: var(--text);
}
.rank-search input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.rank-search-clear {
  position: absolute;
  right: 0.3rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.2rem;
}
.rank-search-clear:hover { color: var(--text-2); }
.rank-cont {
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border-2);
  border-radius: 7px;
  font-size: 0.82rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
.rank-list { list-style: none; margin: 0; padding: 0; max-height: 240px; overflow-y: auto; }
.rank-list li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.3rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--text-2);
}
.rank-list li:hover { background: var(--surface-3); }
.rank-list li.active { background: var(--accent-soft); color: var(--accent-soft-text); font-weight: 600; }
.rank-num { min-width: 1.9rem; text-align: right; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.rank-list li.active .rank-num { color: var(--accent-strong); }
.rank-dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; border: 1px solid rgba(0, 0, 0, 0.1); }
.rank-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-val { color: var(--text-3); font-variant-numeric: tabular-nums; white-space: nowrap; }
.rank-list li.active .rank-val { color: var(--accent-soft-text); }

/* skeleton */
.rank-skeleton { display: grid; gap: 0.45rem; padding: 0.3rem 0.3rem; }
.sk-row { display: flex; align-items: center; gap: 0.4rem; }
.sk-bar {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--surface-3) 25%, var(--border) 37%, var(--surface-3) 63%);
  background-size: 400% 100%;
  animation: sk 1.3s ease infinite;
}
.sk-num { width: 1.4rem; }
.sk-name { flex: 1; }
.sk-val { width: 2.5rem; }
@keyframes sk {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  .sk-bar { animation: none; }
}
</style>
