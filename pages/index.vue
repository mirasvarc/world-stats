<script setup lang="ts">
const { t } = useI18n()
useHead(() => ({ title: t('brand') }))
</script>

<template>
  <div>
    <ClientOnly>
      <WorldMap />
      <template #fallback>
        <div class="loading">{{ t('loadingMap') }}</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style>
.loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  color: var(--text-2);
  background: var(--map-bg);
}
</style>
