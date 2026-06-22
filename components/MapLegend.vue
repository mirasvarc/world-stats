<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useRanking } from '~/composables/useRanking'
import { useLabels } from '~/composables/useLabels'
import { formatValue } from '~/composables/useFormat'

const { currentIndicator, displayIndicator, perCapitaActive, referenceMode, referenceValue } = useWorldStats()
const { ranking } = useRanking()
const { t } = useI18n()
const { unit } = useLabels()
const indUnit = computed(() => unit(currentIndicator.value, perCapitaActive.value))

// je aktivní reference (země nebo medián)? → divergentní škála vůči ní
const hasReference = computed(() => referenceValue.value != null)

// číselná škála pro choropleth (bez reference): nejlepší / medián / nejhorší
const valueScale = computed(() => {
  const rows = ranking.value
  if (rows.length < 2) return null
  const best = rows[0].value // #1 = nejlepší
  const worst = rows[rows.length - 1].value
  const median = rows[Math.floor(rows.length / 2)].value
  const f = (v: number) => formatValue(v, displayIndicator.value)
  return { best: f(best), median: f(median), worst: f(worst) }
})
</script>

<template>
  <div class="legend">
    <template v-if="hasReference">
      <!-- divergentní škála: intenzita barvy = velikost rozdílu vůči referenci -->
      <div class="legend-grad-label">
        <span class="g">{{ t('legend.better') }} ({{ currentIndicator.higherIsBetter ? t('legend.higher') : t('legend.lower') }})</span>
        <span class="r">{{ t('legend.worse') }} ({{ currentIndicator.higherIsBetter ? t('legend.lower') : t('legend.higher') }})</span>
      </div>
      <div class="legend-grad" />
      <div class="legend-grad-sub">
        <span>{{ t('legend.bigDiff') }}</span>
        <span>{{ referenceMode === 'median' ? t('legend.median') : t('legend.selected') }}</span>
        <span>{{ t('legend.bigDiff') }}</span>
      </div>
    </template>
    <template v-else>
      <!-- absolutní škála hodnot: zelená = nejlepší, červená = nejhorší -->
      <div class="legend-grad-label">
        <span class="g">{{ t('legend.best') }} ({{ currentIndicator.higherIsBetter ? t('legend.highest') : t('legend.lowest') }})</span>
        <span class="r">{{ t('legend.worst') }} ({{ currentIndicator.higherIsBetter ? t('legend.lowest') : t('legend.highest') }})</span>
      </div>
      <div class="legend-grad value" />
      <div v-if="valueScale" class="legend-grad-sub">
        <span>{{ valueScale.best }}</span>
        <span>{{ valueScale.median }}</span>
        <span>{{ valueScale.worst }}</span>
      </div>
      <div class="legend-hint">{{ t('legend.valuesHint', { unit: indUnit }) }}</div>
    </template>

    <div class="legend-row"><span class="sw blue" /> {{ t('legend.selectedCountry') }}</div>
    <div class="legend-row"><span class="sw gray" /> {{ t('legend.noData') }}</div>
  </div>
</template>

<style scoped>
.legend {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border);
  display: grid;
  gap: 0.35rem;
}
.legend-grad {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    #15803d,
    #22c55e,
    #bbf7d0,
    #cbd5e1,
    #fecaca,
    #ef4444,
    #b91c1c
  );
}
.legend-grad.value {
  background: linear-gradient(to right, #22c55e, #eab308, #ef4444);
}
.legend-hint { font-size: 0.72rem; color: var(--text-3); }
.legend-grad-label,
.legend-grad-sub {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-3);
}
.legend-grad-label .g { color: var(--good); font-weight: 600; }
.legend-grad-label .r { color: var(--bad); font-weight: 600; }
.legend-grad-sub span:nth-child(2) { color: var(--accent); }
.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--text-2);
}
.sw { width: 16px; height: 16px; border-radius: 4px; display: inline-block; flex: 0 0 auto; }
.sw.blue { background: #2563eb; }
.sw.neutral { background: #94a3b8; }
.sw.gray { background: #d4d4d8; }
</style>
