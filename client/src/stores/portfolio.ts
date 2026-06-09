import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface Position { id: string; asset: string; balance: string }
export interface Trade {
  id: string; symbol: string; type: 'BUY' | 'SELL'
  price: string; amount: string; total: string; createdAt: string
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const positions = ref<Position[]>([])
  const trades = ref<Trade[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const [pos, tr] = await Promise.all([api.get('/portfolio'), api.get('/portfolio/trades')])
    positions.value = pos.data
    trades.value = tr.data
    loading.value = false
  }

  async function executeTrade(symbol: string, type: 'BUY' | 'SELL', amount: number) {
    await api.post('/portfolio/trade', { symbol, type, amount })
    await fetch()
  }

  async function deposit(asset: string, amount: number) {
    await api.post('/portfolio/deposit', { asset, amount })
    await fetch()
  }

  return { positions, trades, loading, fetch, executeTrade, deposit }
})
