<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { CHART, PAD } from '~/composables/useChartModel'
import { formatValue } from '~/composables/useFormat'

// `chart` je výstup useChartModel().chart ve variantě { enough: true }
defineProps<{ chart: any }>()

const { currentIndicator } = useWorldStats()
</script>

<template>
  <svg class="chart-svg" :viewBox="`0 0 ${CHART.width} ${CHART.height}`" role="img">
    <!-- mřížka + osa Y -->
    <g>
      <line
        v-for="(t, i) in chart.yticks"
        :key="'g' + i"
        :x1="PAD.left"
        :x2="CHART.width - PAD.right"
        :y1="t.y"
        :y2="t.y"
        stroke="#e2e8f0"
        stroke-width="1"
      />
      <text
        v-for="(t, i) in chart.yticks"
        :key="'yl' + i"
        :x="PAD.left - 8"
        :y="t.y + 4"
        text-anchor="end"
        class="axis-label"
      >{{ t.label }}</text>
    </g>

    <!-- osa X -->
    <g>
      <text
        v-for="t in chart.xticks"
        :key="'xl' + t.yr"
        :x="t.x"
        :y="CHART.height - PAD.bottom + 20"
        text-anchor="middle"
        class="axis-label"
      >{{ t.yr }}</text>
    </g>

    <!-- plocha pod čarou (jen u jedné země) -->
    <polygon v-if="chart.single && chart.area" :points="chart.area" fill="rgba(37,99,235,0.12)" />

    <!-- série -->
    <g v-for="ser in chart.series" :key="'s' + ser.iso">
      <polyline
        :points="ser.line"
        fill="none"
        :stroke="ser.color"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle
        v-for="c in ser.coords"
        :key="ser.iso + c.year"
        :cx="c.x"
        :cy="c.y"
        r="2.5"
        :fill="ser.color"
      >
        <title>{{ ser.name }} · {{ c.year }}: {{ formatValue(c.value, currentIndicator) }} {{ currentIndicator.unit }}</title>
      </circle>
    </g>

    <!-- zvýraznění aktuálně zvoleného roku (na referenční zemi) -->
    <g v-if="chart.selPoint">
      <line
        :x1="chart.selPoint.x"
        :x2="chart.selPoint.x"
        :y1="PAD.top"
        :y2="chart.baseY"
        stroke="#f59e0b"
        stroke-width="1.5"
        stroke-dasharray="4 3"
      />
      <circle :cx="chart.selPoint.x" :cy="chart.selPoint.y" r="5" fill="#f59e0b" stroke="#fff" stroke-width="2" />
    </g>
  </svg>
</template>

<style scoped>
.chart-svg { width: 100%; height: auto; display: block; }
.axis-label { font-size: 11px; fill: #94a3b8; }
</style>
