<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'

const { isStatic, minYear, maxYear, selectedYear } = useWorldStats()
</script>

<template>
  <div v-if="!isStatic" class="yearbar">
    <span class="year-edge">{{ minYear }}</span>
    <input type="range" :min="minYear" :max="maxYear" step="1" v-model.number="selectedYear" />
    <span class="year-edge">{{ maxYear }}</span>
    <span class="year-now">{{ selectedYear }}</span>
  </div>
  <div v-else class="yearbar static-note">Orientační odhad (bez časové řady)</div>
</template>

<style scoped>
.yearbar {
  position: absolute;
  bottom: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  z-index: 1100;
  width: min(560px, 80vw);
}
.yearbar input[type='range'] {
  flex: 1;
  accent-color: #22c55e;
  cursor: pointer;
}
.year-edge {
  font-size: 0.8rem;
  color: #94a3b8;
}
.year-now {
  font-weight: 700;
  font-size: 1.05rem;
  min-width: 3.2rem;
  text-align: center;
  background: #2563eb;
  border-radius: 6px;
  padding: 0.1rem 0.4rem;
}
.yearbar.static-note {
  justify-content: center;
  font-size: 0.85rem;
  color: #fde68a;
  width: auto;
}
</style>
