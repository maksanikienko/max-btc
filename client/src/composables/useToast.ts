import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

// Module-level singleton so all components share the same toast list
const toasts = ref<Toast[]>([])
let _nextId = 0

export function useToast() {
  function add(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = ++_nextId
    toasts.value.push({ id, type, title, message })
    setTimeout(() => remove(id), duration)
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return {
    toasts,
    success: (title: string, message?: string) => add('success', title, message),
    error: (title: string, message?: string) => add('error', title, message),
    info: (title: string, message?: string) => add('info', title, message),
    warning: (title: string, message?: string) => add('warning', title, message),
    remove,
  }
}
