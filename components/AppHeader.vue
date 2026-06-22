<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useShareLink } from '~/composables/useShareLink'

const { region, setRegion, selectedIndicatorId, selectedIso3, clearSelection, darkMode, toggleTheme } =
  useWorldStats()
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
      <div class="region-switch" role="group" aria-label="Region">
        <button
          :class="{ active: region === 'world' }"
          :aria-pressed="region === 'world'"
          @click="setRegion('world')"
        >🌍 Svět</button>
        <button
          :class="{ active: region === 'europe' }"
          :aria-pressed="region === 'europe'"
          @click="setRegion('europe')"
        >🇪🇺 Evropa</button>
      </div>
      <label>
        Statistika:
        <IndicatorSelect v-model="selectedIndicatorId" />
      </label>
      <CountrySearch class="hide-mobile" />
      <button v-if="selectedIso3" class="clear" @click="clearSelection()">
        Zrušit výběr ✕
      </button>
      <button class="share" @click="copyLink">
        {{ copied ? '✓ Zkopírováno' : '🔗 Sdílet odkaz' }}
      </button>
      <button
        class="icon-btn"
        :title="darkMode ? 'Světlý režim' : 'Tmavý režim'"
        :aria-label="darkMode ? 'Světlý režim' : 'Tmavý režim'"
        @click="toggleTheme"
      >
        <svg v-if="darkMode" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </g>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
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
  background: var(--bar);
  color: var(--bar-text);
  z-index: 1000;
}
.brand {
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
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
  flex-wrap: wrap;
  justify-content: flex-end;
}
.controls label {
  font-size: 0.9rem;
}
.region-switch {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}
.region-switch button {
  border: none;
  background: transparent;
  color: #cbd5e1;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.region-switch button:hover { color: #fff; }
.region-switch button.active {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
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
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: rgba(255, 255, 255, 0.18); color: #fff; }

@media (max-width: 640px) {
  .topbar { flex-wrap: wrap; gap: 0.5rem; padding: 0.55rem 0.7rem; }
  .brand { font-size: 0.95rem; }
  .controls { gap: 0.5rem; }
  .controls label { font-size: 0.82rem; }
  .hide-mobile { display: none; }
}
</style>
