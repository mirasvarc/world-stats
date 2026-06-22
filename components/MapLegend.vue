<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'

const { currentIndicator, selectedIso3 } = useWorldStats()
</script>

<template>
  <div class="legend">
    <template v-if="selectedIso3">
      <!-- divergentní škála: intenzita barvy = velikost rozdílu vůči vybrané zemi -->
      <div class="legend-grad-label">
        <span class="g">lepší ({{ currentIndicator.higherIsBetter ? 'vyšší' : 'nižší' }})</span>
        <span class="r">horší ({{ currentIndicator.higherIsBetter ? 'nižší' : 'vyšší' }})</span>
      </div>
      <div class="legend-grad" />
      <div class="legend-grad-sub">
        <span>velký rozdíl</span>
        <span>vybraná</span>
        <span>velký rozdíl</span>
      </div>
    </template>
    <template v-else>
      <!-- absolutní škála hodnot: zelená = nejlepší, červená = nejhorší -->
      <div class="legend-grad-label">
        <span class="g">nejlepší ({{ currentIndicator.higherIsBetter ? 'nejvyšší' : 'nejnižší' }})</span>
        <span class="r">nejhorší ({{ currentIndicator.higherIsBetter ? 'nejnižší' : 'nejvyšší' }})</span>
      </div>
      <div class="legend-grad value" />
      <div class="legend-hint">Klikni na zemi pro porovnání vůči ní.</div>
    </template>

    <div class="legend-row"><span class="sw blue" /> vybraná země</div>
    <div class="legend-row"><span class="sw gray" /> bez dat</div>
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
