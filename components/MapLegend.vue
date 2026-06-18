<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'

const { currentIndicator } = useWorldStats()
</script>

<template>
  <div class="legend">
    <div class="legend-row"><span class="sw blue" /> vybraná země</div>
    <div class="legend-row">
      <span class="sw green" /> lepší ({{ currentIndicator.higherIsBetter ? 'vyšší' : 'nižší' }})
    </div>
    <div class="legend-row">
      <span class="sw red" /> horší ({{ currentIndicator.higherIsBetter ? 'nižší' : 'vyšší' }})
    </div>
    <div class="legend-row"><span class="sw gray" /> bez dat</div>
  </div>
</template>

<style scoped>
.legend {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid #e2e8f0;
  display: grid;
  gap: 0.35rem;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #475569;
}
.sw { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }
.sw.blue { background: #2563eb; }
.sw.green { background: #22c55e; }
.sw.red { background: #ef4444; }
.sw.gray { background: #d4d4d8; }
</style>
