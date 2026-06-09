<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts'
import { useMarketStore } from '@/stores/market'

const props = defineProps<{ symbol: string }>()

const market = useMarketStore()
const container = ref<HTMLDivElement>()
const interval = ref('1h')
const intervals = ['1s', '1m', '5m', '15m', '1h', '4h', '1d']

// ms between background polls per timeframe
const POLL_MS: Record<string, number> = {
  '1s': 3000,
  '1m': 15000,
  '5m': 30000,
  '15m': 60000,
  '1h': 120000,
  '4h': 300000,
  '1d': 600000,
}

let chart: IChartApi | null = null
let candles: ISeriesApi<'Candlestick'> | null = null
let resizeObs: ResizeObserver | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let lastCandle: CandlestickData<Time> | null = null

async function fetchKlines(symbol: string, tf: string) {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=300`,
  )
  const raw: any[][] = await res.json()
  return raw.map<CandlestickData<Time>>((k) => ({
    time: (k[0] / 1000) as Time,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }))
}

function initChart() {
  if (!container.value) return

  chart = createChart(container.value, {
    layout: {
      background: { type: ColorType.Solid, color: '#0a0a0a' },
      textColor: '#71717a',
      fontSize: 11,
    },
    grid: {
      vertLines: { color: '#1a1a1a' },
      horzLines: { color: '#1a1a1a' },
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#1f1f1f', textColor: '#71717a' },
    timeScale: { borderColor: '#1f1f1f', timeVisible: true, secondsVisible: true },
    width: container.value.clientWidth,
    height: container.value.clientHeight,
  })

  candles = chart.addCandlestickSeries({
    upColor: '#16a34a',
    downColor: '#dc2626',
    borderUpColor: '#16a34a',
    borderDownColor: '#dc2626',
    wickUpColor: '#22c55e',
    wickDownColor: '#ef4444',
  })

  resizeObs = new ResizeObserver(() => {
    if (container.value && chart) {
      chart.applyOptions({
        width: container.value.clientWidth,
        height: container.value.clientHeight,
      })
    }
  })
  resizeObs.observe(container.value)
}

async function loadData() {
  if (!candles) return
  const data = await fetchKlines(props.symbol, interval.value)
  if (!data.length) return
  candles.setData(data)
  chart?.timeScale().fitContent()
  lastCandle = { ...data[data.length - 1] }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(loadData, POLL_MS[interval.value] ?? 60000)
}

// live update last candle close from WebSocket ticker
watch(
  () => market.lastUpdate,
  () => {
    const ticker = market.tickers[props.symbol]
    if (!ticker || !candles || !lastCandle) return

    const price = parseFloat(ticker.price)
    lastCandle = {
      time: lastCandle.time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high as number, price),
      low: Math.min(lastCandle.low as number, price),
      close: price,
    }
    candles.update(lastCandle)
  },
)

watch(() => props.symbol, async () => {
  lastCandle = null
  await loadData()
  startPolling()
})

watch(interval, async () => {
  lastCandle = null
  await loadData()
  startPolling()
})

onMounted(async () => {
  initChart()
  await loadData()
  startPolling()
})

onUnmounted(() => {
  resizeObs?.disconnect()
  chart?.remove()
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-0.5 border-b border-border px-2 py-1.5 shrink-0 overflow-x-auto scrollbar-none">
      <button
        v-for="tf in intervals"
        :key="tf"
        class="shrink-0 rounded px-2.5 py-1 text-xs font-medium transition-colors"
        :class="tf === interval ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="interval = tf"
      >
        {{ tf }}
      </button>
    </div>
    <div ref="container" class="flex-1 min-h-0" />
  </div>
</template>
