import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface Alert {
  id: string; symbol: string; price: string
  condition: 'ABOVE' | 'BELOW'; isActive: boolean; createdAt: string
}

export const useAlertsStore = defineStore('alerts', () => {
  const items = ref<Alert[]>([])

  async function fetch() {
    const { data } = await api.get('/alerts')
    items.value = data
  }

  async function create(symbol: string, price: number, condition: 'ABOVE' | 'BELOW') {
    const { data } = await api.post('/alerts', { symbol, price, condition })
    items.value.unshift(data)
  }

  async function remove(id: string) {
    await api.delete(`/alerts/${id}`)
    items.value = items.value.filter((a) => a.id !== id)
  }

  return { items, fetch, create, remove }
})
