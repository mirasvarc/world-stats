<script setup lang="ts">
// Vyhledávání země v horní liště – výběr přiblíží mapu a označí zemi referenční.
import { useWorldStats } from '~/composables/useWorldStats'
import { useGeo } from '~/composables/useGeo'
import { normalizeText } from '~/composables/useFormat'

const { focusCountry } = useWorldStats()
const { nameMap, countryIds } = useGeo()

const query = ref('')
const open = ref(false)
const activeIdx = ref(0)
const rootEl = ref<HTMLElement | null>(null)

const allCountries = computed(() =>
  Array.from(countryIds.value)
    .map((iso3) => ({ iso3, name: nameMap.value[iso3] ?? iso3 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
)

const results = computed(() => {
  const q = normalizeText(query.value.trim())
  if (!q) return []
  return allCountries.value
    .filter((c) => normalizeText(c.name).includes(q))
    .slice(0, 8)
})

function pick(iso3: string) {
  focusCountry(iso3)
  query.value = ''
  open.value = false
}

function onInput() {
  open.value = true
  activeIdx.value = 0
}

function onKeydown(e: KeyboardEvent) {
  if (!results.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIdx.value = (activeIdx.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIdx.value = (activeIdx.value - 1 + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    const r = results.value[activeIdx.value]
    if (r) pick(r.iso3)
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function onDocClick(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootEl" class="csearch">
    <svg class="csearch-ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        d="M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
      />
    </svg>
    <input
      v-model="query"
      type="text"
      placeholder="Najít zemi…"
      spellcheck="false"
      aria-label="Najít zemi"
      @input="onInput"
      @focus="open = true"
      @keydown="onKeydown"
    />
    <ul v-if="open && results.length" class="csearch-list">
      <li
        v-for="(r, i) in results"
        :key="r.iso3"
        :class="{ active: i === activeIdx }"
        @mouseenter="activeIdx = i"
        @mousedown.prevent="pick(r.iso3)"
      >
        {{ r.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.csearch { position: relative; display: inline-flex; align-items: center; }
.csearch-ico {
  position: absolute;
  left: 0.5rem;
  color: #94a3b8;
  pointer-events: none;
}
.csearch input {
  padding: 0.35rem 0.5rem 0.35rem 1.8rem;
  border-radius: 6px;
  border: none;
  font-size: 0.85rem;
  width: 9.5rem;
  outline: none;
}
.csearch input:focus { box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.4); }
.csearch-list {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-panel);
  z-index: 1500;
  max-height: 260px;
  overflow-y: auto;
}
.csearch-list li {
  padding: 0.35rem 0.5rem;
  border-radius: 5px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.csearch-list li.active { background: var(--accent-soft); color: var(--accent-soft-text); }
</style>
