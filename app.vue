<template>
  <div>
    <ClientOnly>
      <WorldMap />
      <template #fallback>
        <div class="loading">Načítám mapu…</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style>
* { box-sizing: border-box; }
html, body, #__nuxt { margin: 0; height: 100%; }
.loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  color: #334155;
  background: #eaf2f8;
}
</style>
