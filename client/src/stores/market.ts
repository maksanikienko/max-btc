import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { socket } from '@/services/socket'

export interface Ticker {
  symbol: string
  price: string
  open: string
  high: string
  low: string
  volume: string
  quoteVolume: string
  changePercent: number
}

export const useMarketStore = defineStore('market', () => {
  const tickers = reactive<Record<string, Ticker>>({})
  const selectedSymbol = ref('BTCUSDT')
  const lastUpdate = ref<number>(0)
  const subscribed = new Set<string>()

  const current = computed(() => tickers[selectedSymbol.value])

  function select(symbol: string) {
    selectedSymbol.value = symbol
    subscribe(symbol)
  }

  function subscribe(symbol: string) {
    if (subscribed.has(symbol)) return
    socket.emit('subscribe:ticker', symbol)
    subscribed.add(symbol)
  }

  function unsubscribe(symbol: string) {
    socket.emit('unsubscribe:ticker', symbol)
    subscribed.delete(symbol)
  }

  function resubscribeAll() {
    for (const symbol of subscribed) {
      socket.emit('subscribe:ticker', symbol)
    }
  }

  function init() {
    socket.on('ticker', (t: Omit<Ticker, 'changePercent'>) => {
      const changePercent =
        ((parseFloat(t.price) - parseFloat(t.open)) / parseFloat(t.open)) * 100
      tickers[t.symbol] = { ...t, changePercent }
      lastUpdate.value = Date.now()
    })

    // re-subscribe after reconnect
    socket.on('connect', resubscribeAll)

    if (socket.connected) {
      subscribe(selectedSymbol.value)
    } else {
      // subscribe once connected
      socket.once('connect', () => subscribe(selectedSymbol.value))
    }
  }

  function destroy() {
    socket.off('ticker')
    socket.off('connect', resubscribeAll)
  }

  return { tickers, selectedSymbol, current, lastUpdate, select, subscribe, unsubscribe, init, destroy }
})
