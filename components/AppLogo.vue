<script setup lang="ts">
// Logo aplikace – stylizovaný glóbus se zeleno-červeným nádechem (téma lepší/horší)
// a modrou značkou vybrané země. Bez pozadí, vhodné na tmavou lištu.

// unikátní id gradientu pro případ více instancí na stránce
const gid = `globe-grad-${nextLogoId()}`
</script>

<script lang="ts">
let logoCounter = 0
function nextLogoId() {
  return logoCounter++
}
</script>

<template>
  <svg viewBox="0 0 64 64" role="img" aria-label="Logo – glóbus">
    <defs>
      <linearGradient :id="gid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#22c55e" />
        <stop offset="0.5" stop-color="#0ea5a3" />
        <stop offset="1" stop-color="#ef4444" />
      </linearGradient>
    </defs>
    <g transform="translate(32 32)">
      <circle r="18" :fill="`url(#${gid})`" />
      <g fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.6">
        <circle r="18" />
        <ellipse rx="18" ry="6.5" />
        <ellipse rx="6.5" ry="18" />
        <ellipse rx="13" ry="18" />
      </g>
      <circle cx="-7" cy="-6" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="2" />
    </g>
  </svg>
</template>
