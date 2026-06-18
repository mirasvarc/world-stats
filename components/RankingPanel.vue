<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useRanking } from '~/composables/useRanking'
import { useColorScale } from '~/composables/useColorScale'
import { formatValue, normalizeText } from '~/composables/useFormat'

const { selectedIso3, currentIndicator, selectedYear, ready, focusCountry } = useWorldStats()
const { ranking } = useRanking()
const { colorFor } = useColorScale()

const search = ref('')
const filtered = computed(() => {
  const q = normalizeText(search.value.trim())
  if (!q) return ranking.value
  return ranking.value.filter((r) => normalizeText(r.name).includes(q))
})
</script>

<template>
  <div class="rank-wrap">
    <div class="rank-head">
      Žebříček · {{ selectedYear }}
      <span class="rank-sub">({{ ranking.length }} zemí, #1 = nejlepší)</span>
    </div>

    <div v-if="ready" class="rank-search">
      <input v-model="search" type="text" placeholder="Hledat zemi…" spellcheck="false" />
      <button v-if="search" class="rank-search-clear" @click="search = ''">✕</button>
    </div>

    <div v-if="!ready" class="muted rank-loading">Načítám žebříček…</div>
    <div v-else-if="filtered.length === 0" class="muted rank-loading">Nic nenalezeno.</div>
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
        <span class="rank-val">{{ formatValue(row.value, currentIndicator) }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.rank-wrap {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid #e2e8f0;
}
.rank-head { font-size: 0.8rem; font-weight: 700; color: #0f172a; margin-bottom: 0.4rem; }
.rank-sub { font-weight: 400; color: #94a3b8; font-size: 0.72rem; }
.muted { color: #94a3b8; font-weight: 400; }
.rank-loading { font-size: 0.82rem; padding: 0.3rem 0; }
.rank-search { position: relative; margin-bottom: 0.45rem; }
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
.rank-list { list-style: none; margin: 0; padding: 0; max-height: 240px; overflow-y: auto; }
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
.rank-list li.active { background: #dbeafe; color: #1e3a8a; font-weight: 600; }
.rank-num { min-width: 1.9rem; text-align: right; color: #94a3b8; font-variant-numeric: tabular-nums; }
.rank-list li.active .rank-num { color: #1d4ed8; }
.rank-dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; border: 1px solid rgba(0, 0, 0, 0.1); }
.rank-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-val { color: #64748b; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rank-list li.active .rank-val { color: #1e3a8a; }
</style>
