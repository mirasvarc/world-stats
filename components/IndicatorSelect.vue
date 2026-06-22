<script setup lang="ts">
import { groupedIndicators } from '~/composables/useIndicators'
import { useWorldStats } from '~/composables/useWorldStats'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { region } = useWorldStats()
const groups = computed(() => groupedIndicators(region.value))
const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <select v-model="value">
    <optgroup v-for="g in groups" :key="g.name" :label="g.name">
      <option v-for="ind in g.items" :key="ind.id" :value="ind.id">
        {{ ind.label }}
      </option>
    </optgroup>
  </select>
</template>
