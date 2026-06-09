import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])
  const unread = computed(() => items.value.filter((n) => !n.isRead).length)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function fetch() {
    const { data } = await api.get('/notifications')
    items.value = data
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`)
    const n = items.value.find((n) => n.id === id)
    if (n) n.isRead = true
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all')
    items.value.forEach((n) => (n.isRead = true))
  }

  function startPolling() {
    fetch()
    pollTimer = setInterval(fetch, 10_000)
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer)
  }

  return { items, unread, fetch, markRead, markAllRead, startPolling, stopPolling }
})
