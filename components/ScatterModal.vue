<script setup lang="ts">
import { useWorldStats } from '~/composables/useWorldStats'
import { useScatterModel, SCATTER } from '~/composables/useScatterModel'
import { useLabels } from '~/composables/useLabels'

const { showScatter, closeScatter, scatterX, scatterY, selectedYear, region } = useWorldStats()
const { chart, xInd, yInd, xLog, yLog, xLogFeasible, yLogFeasible } = useScatterModel()
const { t } = useI18n()
const { label, unit, continent } = useLabels()

const xLabel = computed(() => (xInd.value ? label(xInd.value) : ''))
const yLabel = computed(() => (yInd.value ? label(yInd.value) : ''))
const xUnit = computed(() => (xInd.value ? unit(xInd.value) : ''))
const yUnit = computed(() => (yInd.value ? unit(yInd.value) : ''))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeScatter()
}
watch(showScatter, (open) => {
  if (typeof document === 'undefined') return
  if (open) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
})

const corrText = computed(() => {
  const r = chart.value.enough ? chart.value.correlation : null
  if (r == null) return null
  const abs = Math.abs(r)
  const strength = abs > 0.7 ? t('scatter.strong') : abs > 0.4 ? t('scatter.medium') : abs > 0.2 ? t('scatter.weak') : t('scatter.negligible')
  const dir = r > 0 ? t('scatter.positive') : t('scatter.negative')
  return t('scatter.corr', { r: r.toFixed(2), strength, dir })
})
</script>

<template>
  <Teleport to="body">
    <div v-if="showScatter" class="modal-overlay" @click="closeScatter()">
      <div class="modal" @click.stop>
        <div class="modal-head">
          <div class="modal-headmain">
            <div class="modal-title">{{ t('scatter.title') }} · {{ selectedYear }}</div>
            <div class="modal-sub">
              {{ region === 'europe' ? t('scatter.subEurope') : t('scatter.subWorld') }}
            </div>
          </div>
          <button class="modal-close" :title="t('chart.close')" @click="closeScatter()">✕</button>
        </div>

        <div class="axis-pickers">
          <label class="axis-pick">
            <span class="axis-tag x">X</span>
            <IndicatorSelect v-model="scatterX" />
            <button
              class="log-btn"
              :class="{ on: xLog }"
              :disabled="!xLogFeasible"
              :title="t('scatter.logX')"
              @click="xLog = !xLog"
            >log</button>
          </label>
          <label class="axis-pick">
            <span class="axis-tag y">Y</span>
            <IndicatorSelect v-model="scatterY" />
            <button
              class="log-btn"
              :class="{ on: yLog }"
              :disabled="!yLogFeasible"
              :title="t('scatter.logY')"
              @click="yLog = !yLog"
            >log</button>
          </label>
        </div>

        <div v-if="!chart.enough" class="scatter-empty">
          {{ t('scatter.empty') }}
        </div>

        <template v-else>
          <div v-if="corrText" class="corr-badge">{{ corrText }}</div>

          <svg class="scatter-svg" :viewBox="`0 0 ${SCATTER.width} ${SCATTER.height}`">
            <!-- mřížka + osy -->
            <line
              v-for="(t, i) in chart.yticks"
              :key="'gy' + i"
              class="grid"
              :x1="72" :y1="t.y" :x2="SCATTER.width - 24" :y2="t.y"
            />
            <text
              v-for="(t, i) in chart.yticks"
              :key="'yt' + i"
              class="axis-num" :x="66" :y="t.y + 3" text-anchor="end"
            >{{ t.label }}</text>
            <text
              v-for="(t, i) in chart.xticks"
              :key="'xt' + i"
              class="axis-num" :x="t.x" :y="chart.baseY + 16" text-anchor="middle"
            >{{ t.label }}</text>

            <!-- popisky os -->
            <text class="axis-title" :x="72 + chart.innerW / 2" :y="SCATTER.height - 6" text-anchor="middle">
              {{ xLabel }} [{{ xUnit }}]{{ chart.useXLog ? ' (log)' : '' }}
            </text>
            <text
              class="axis-title"
              :x="-(20 + chart.innerH / 2)"
              :y="16"
              text-anchor="middle"
              transform="rotate(-90)"
            >{{ yLabel }} [{{ yUnit }}]{{ chart.useYLog ? ' (log)' : '' }}</text>

            <!-- bubliny -->
            <circle
              v-for="p in chart.points"
              :key="p.iso"
              :cx="p.cx" :cy="p.cy" :r="p.r"
              :fill="p.color"
              fill-opacity="0.55"
              :stroke="p.color"
              stroke-opacity="0.9"
            >
              <title>{{ p.name }} — {{ xLabel }}: {{ p.x.toLocaleString() }}, {{ yLabel }}: {{ p.y.toLocaleString() }}</title>
            </circle>
          </svg>

          <div class="scatter-legend">
            <span v-for="l in chart.legend" :key="l.name" class="leg-item">
              <span class="leg-dot" :style="{ background: l.color }" /> {{ continent(l.name) }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}
.modal {
  background: var(--surface);
  color: var(--text);
  border-radius: 14px;
  box-shadow: var(--shadow-panel);
  width: min(760px, 96vw);
  max-height: 94vh;
  overflow-y: auto;
  padding: 1.1rem 1.2rem 1.3rem;
}
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.modal-title { font-weight: 700; font-size: 1.05rem; }
.modal-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; }
.modal-close {
  border: none; background: var(--surface-3); color: var(--text-2);
  width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex: 0 0 auto;
}
.axis-pickers { display: flex; flex-wrap: wrap; gap: 0.7rem; margin: 0.9rem 0 0.4rem; }
.axis-pick { display: flex; align-items: center; gap: 0.4rem; }
.axis-tag {
  font-weight: 700; font-size: 0.8rem; width: 20px; height: 20px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 5px; color: #fff;
}
.axis-tag.x { background: #2563eb; }
.axis-tag.y { background: #a855f7; }
.axis-pick :deep(select) {
  padding: 0.3rem 0.4rem; border-radius: 6px; border: 1px solid var(--border-2);
  background: var(--surface); color: var(--text); font-size: 0.85rem; max-width: 44vw;
}
.log-btn {
  border: 1px solid var(--border-2); background: var(--surface); color: var(--text-3);
  font-size: 0.72rem; padding: 0.25rem 0.45rem; border-radius: 6px; cursor: pointer;
}
.log-btn.on { background: var(--accent); color: #fff; border-color: var(--accent); }
.log-btn:disabled { opacity: 0.4; cursor: default; }
.corr-badge {
  display: inline-block; margin: 0.3rem 0 0.2rem;
  background: var(--accent-soft); color: var(--accent-soft-text);
  font-size: 0.82rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 6px;
}
.scatter-empty { padding: 2rem 0; text-align: center; color: var(--text-muted); }
.scatter-svg { width: 100%; height: auto; display: block; margin-top: 0.3rem; }
.scatter-svg .grid { stroke: var(--border); stroke-width: 1; }
.scatter-svg .axis-num { font-size: 11px; fill: var(--text-3); }
.scatter-svg .axis-title { font-size: 12px; fill: var(--text-2); font-weight: 600; }
.scatter-svg circle { cursor: pointer; transition: fill-opacity 0.1s; }
.scatter-svg circle:hover { fill-opacity: 0.85; }
.scatter-legend { display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; margin-top: 0.6rem; font-size: 0.78rem; color: var(--text-2); }
.leg-item { display: inline-flex; align-items: center; gap: 0.35rem; }
.leg-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
</style>
