<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { CHART, PAD } from '~/composables/useChartModel'
import { formatValue } from '~/composables/useFormat'

// `chart` je výstup useChartModel().chart ve variantě { enough: true }
const props = defineProps<{ chart: any }>()

const { currentIndicator } = useWorldStats()

const svgRef = ref<SVGSVGElement | null>(null)
const hoverYear = ref<number | null>(null)

const innerW = CHART.width - PAD.left - PAD.right

function onMove(e: MouseEvent) {
  const svg = svgRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const vbX = ((e.clientX - rect.left) / rect.width) * CHART.width
  const { x0, x1 } = props.chart
  const t = (vbX - PAD.left) / (innerW || 1)
  const yr = Math.round(x0 + t * (x1 - x0))
  hoverYear.value = Math.max(x0, Math.min(x1, yr))
}
function onLeave() {
  hoverYear.value = null
}

// body všech sérií pro zvýrazněný rok + geometrie tooltipu
const cross = computed(() => {
  const yr = hoverYear.value
  if (yr == null || !props.chart?.enough) return null
  const pts = props.chart.series
    .map((ser: any) => {
      const c = ser.coords.find((p: any) => p.year === yr)
      return c ? { name: ser.name, color: ser.color, value: c.value, x: c.x, y: c.y } : null
    })
    .filter(Boolean) as { name: string; color: string; value: number; x: number; y: number }[]
  if (!pts.length) return null

  const x = pts[0].x
  const lines = pts.map(
    (p) => `${p.name}: ${formatValue(p.value, currentIndicator.value)} ${currentIndicator.value.unit}`
  )
  const maxLen = Math.max(yr.toString().length + 2, ...lines.map((l) => l.length))
  const boxW = Math.min(260, 22 + maxLen * 6.2)
  const boxH = 18 + lines.length * 15
  const flip = x + boxW + 14 > CHART.width - PAD.right
  const boxX = flip ? x - boxW - 10 : x + 10
  return { x, pts, lines, boxW, boxH, boxX, boxY: PAD.top + 2, year: yr }
})
</script>

<template>
  <svg
    ref="svgRef"
    class="chart-svg"
    :viewBox="`0 0 ${CHART.width} ${CHART.height}`"
    role="img"
    @mousemove="onMove"
    @mouseleave="onLeave"
  >
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
        :stroke-width="ser.isMedian ? 1.8 : 2.5"
        :stroke-dasharray="ser.dashed ? '6 4' : undefined"
        stroke-linejoin="round"
        stroke-linecap="round"
        :opacity="ser.isMedian ? 0.85 : 1"
      />
      <template v-if="!ser.isMedian">
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
      </template>
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

    <!-- crosshair u kurzoru (vynecháno z exportu) -->
    <g v-if="cross" data-export-ignore>
      <line :x1="cross.x" :x2="cross.x" :y1="PAD.top" :y2="chart.baseY" stroke="#94a3b8" stroke-width="1" />
      <circle
        v-for="(p, i) in cross.pts"
        :key="'cx' + i"
        :cx="p.x"
        :cy="p.y"
        r="3.5"
        :fill="p.color"
        stroke="#fff"
        stroke-width="1.5"
      />
      <g :transform="`translate(${cross.boxX} ${cross.boxY})`">
        <rect :width="cross.boxW" :height="cross.boxH" rx="7" fill="rgba(15,23,42,0.92)" />
        <text x="10" y="15" class="tip-year">{{ cross.year }}</text>
        <text
          v-for="(l, i) in cross.lines"
          :key="'tl' + i"
          x="10"
          :y="30 + i * 15"
          class="tip-line"
        >{{ l }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.chart-svg { width: 100%; height: auto; display: block; cursor: crosshair; }
.axis-label { font-size: 11px; fill: var(--text-muted); }
.tip-year { font-size: 11px; font-weight: 700; fill: #fff; }
.tip-line { font-size: 10.5px; fill: #e2e8f0; }
</style>
