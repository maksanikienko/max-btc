import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { useMarketStore } from './market'

interface WatchlistItem { id: string; symbol: string }

export const useWatchlistStore = defineStore('watchlist', () => {
  const items = ref<WatchlistItem[]>([])

  async function fetch() {
    const { data } = await api.get('/watchlist')
    items.value = data
    const market = useMarketStore()
    items.value.forEach((i) => market.subscribe(i.symbol))
  }

  async function add(symbol: string) {
    const { data } = await api.post('/watchlist', { symbol })
    items.value.push(data)
    useMarketStore().subscribe(symbol)
  }

  async function remove(symbol: string) {
    await api.delete(`/watchlist/${symbol}`)
    items.value = items.value.filter((i) => i.symbol !== symbol)
  }

  return { items, fetch, add, remove }
})
