<script setup lang="ts">
import type { HTMLAttributes, InputHTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string | number
  type?: InputHTMLAttributes['type']
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), { type: 'text' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :class="cn(
      'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-sm transition-colors',
      'placeholder:text-muted-foreground/60',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'read-only:bg-secondary read-only:cursor-default',
      props.class,
    )"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
