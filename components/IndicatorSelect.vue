<script setup lang="ts">
import { groupedIndicators } from '~/composables/useIndicators'
import { useWorldStats } from '~/composables/useWorldStats'
import { useLabels } from '~/composables/useLabels'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { region } = useWorldStats()
const { label, group } = useLabels()
const groups = computed(() => groupedIndicators(region.value))
const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <select v-model="value">
    <optgroup v-for="g in groups" :key="g.name" :label="group(g.name)">
      <option v-for="ind in g.items" :key="ind.id" :value="ind.id">
        {{ label(ind) }}
      </option>
    </optgroup>
  </select>
</template>
