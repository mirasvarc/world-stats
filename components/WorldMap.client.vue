<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useLeafletMap } from '~/composables/useLeafletMap'

const { loading, errorMsg } = useWorldStats()

const mapEl = ref<HTMLElement | null>(null)
useLeafletMap(mapEl)
</script>

<template>
  <div class="wrap">
    <AppHeader />

    <div class="mapbox">
      <div ref="mapEl" class="map" />

      <div v-if="loading" class="overlay">Načítám data…</div>
      <div v-if="errorMsg" class="overlay error">{{ errorMsg }}</div>

      <YearSlider />
      <InfoPanel />
      <CountryDisclaimer />
    </div>

    <ChartModal />
  </div>
</template>

<style scoped>
.wrap {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.mapbox { position: relative; flex: 1; }
.map { position: absolute; inset: 0; background: #eaf2f8; }
.overlay {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  z-index: 1200;
}
.overlay.error { background: #b91c1c; }
</style>
