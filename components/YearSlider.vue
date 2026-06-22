<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'

const { isStatic, minYear, maxYear, selectedYear, playing, togglePlay, stopPlay } =
  useWorldStats()
const { t } = useI18n()

// ruční tažení posuvníku zastaví přehrávání
function onManual() {
  if (playing.value) stopPlay()
}
</script>

<template>
  <div v-if="!isStatic" class="yearbar">
    <button
      class="play-btn"
      :title="playing ? t('year.pause') : t('year.play')"
      :aria-label="playing ? t('year.pause') : t('year.play')"
      @click="togglePlay"
    >
      <svg v-if="playing" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M7 4v16l13-8z" />
      </svg>
    </button>
    <span class="year-edge">{{ minYear }}</span>
    <input
      type="range"
      :min="minYear"
      :max="maxYear"
      step="1"
      v-model.number="selectedYear"
      @input="onManual"
    />
    <span class="year-edge">{{ maxYear }}</span>
    <span class="year-now">{{ selectedYear }}</span>
  </div>
  <div v-else class="yearbar static-note">{{ t('year.staticNote') }}</div>
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
.play-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #22c55e;
  color: #06280f;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.play-btn:hover { background: #16a34a; color: #fff; }
.play-btn:active { transform: scale(0.92); }
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

/* Mobil: posuvník nahoru pod lištu, ať nekoliduje se spodním panelem. */
@media (max-width: 640px) {
  .yearbar {
    bottom: auto;
    top: 0.6rem;
    width: 94vw;
    gap: 0.5rem;
    padding: 0.45rem 0.8rem;
  }
}
</style>
