<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useShareLink } from '~/composables/useShareLink'

const { selectedIndicatorId, selectedIso3, clearSelection } = useWorldStats()
const { copied, copyLink } = useShareLink()

// Odkaz na repozitář – uprav podle svého GitHub účtu.
const GITHUB_URL = 'https://github.com/mirasvarc/world-stats'
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <AppLogo class="logo" />
      Mapa světových statistik
    </div>
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
      <a
        class="github"
        :href="GITHUB_URL"
        target="_blank"
        rel="noopener noreferrer"
        title="Zdrojový kód na GitHubu"
        aria-label="GitHub"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.75.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.37.8 1.1.8 2.22v3.29c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
          />
        </svg>
      </a>
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
.logo {
  width: 26px;
  height: 26px;
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
.github {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  color: #cbd5e1;
  transition: background 0.15s, color 0.15s;
}
.github:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
</style>
