<script setup lang="ts"></script>

<template>
  <div class="disclaimer">
    Za správnost a úplnost dat neručíme.
    <span class="sep">·</span>
    Zdroje:
    <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank Open Data</a>,
    <a href="https://github.com/johan/world.geo.json" target="_blank" rel="noopener noreferrer">world.geo.json</a>.
    Průměrná mzda je orientační odhad.
  </div>
</template>

<style scoped>
.disclaimer {
  position: absolute;
  bottom: 0.5rem;
  left: 0.7rem;
  max-width: 320px;
  font-size: 0.68rem;
  line-height: 1.3;
  color: #64748b;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85), 0 0 2px rgba(255, 255, 255, 0.85);
  pointer-events: none;
  z-index: 900;
}
.disclaimer a { color: #2563eb; text-decoration: none; pointer-events: auto; }
.disclaimer a:hover { text-decoration: underline; }
.disclaimer .sep { color: #94a3b8; margin: 0 0.2rem; }
</style>
