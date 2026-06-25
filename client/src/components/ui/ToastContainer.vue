<script setup lang="ts">
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const colors = {
  success: 'border-green-500/40 bg-green-500/10 text-green-400',
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
  info: 'border-primary/40 bg-primary/10 text-primary',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm"
          :class="colors[toast.type]"
        >
          <component :is="icons[toast.type]" :size="16" class="shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold leading-tight">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-[11px] opacity-75 mt-0.5 leading-tight">{{ toast.message }}</p>
          </div>
          <button
            class="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            @click="remove(toast.id)"
          >
            <X :size="13" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
