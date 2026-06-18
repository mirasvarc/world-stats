<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useShareLink } from '~/composables/useShareLink'

const { selectedIndicatorId, selectedIso3, clearSelection } = useWorldStats()
const { copied, copyLink } = useShareLink()
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="dot" /> Mapa světových statistik</div>
    <div class="controls">
      <label>
        Statistika:
        <IndicatorSelect v-model="selectedIndicatorId" />
      </label>
      <button v-if="selectedIso3" class="clear" @click="clearSelection()">
        Zrušit výběr ✕
      </button>
      <button class="share" @click="copyLink">
        {{ copied ? '✓ Zkopírováno' : '🔗 Sdílet odkaz' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 1.1rem;
  background: #0f172a;
  color: #fff;
  z-index: 1000;
}
.brand {
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #ef4444);
  display: inline-block;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.controls label {
  font-size: 0.9rem;
}
.controls :deep(select) {
  margin-left: 0.4rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  max-width: 60vw;
}
.clear,
.share {
  border: none;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  color: #fff;
}
.clear { background: #ef4444; }
.clear:hover { background: #dc2626; }
.share { background: #2563eb; }
.share:hover { background: #1d4ed8; }
</style>
