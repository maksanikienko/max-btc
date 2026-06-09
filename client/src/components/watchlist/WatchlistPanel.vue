<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, X, Star, Search, Sparkles } from 'lucide-vue-next'
import { useWatchlistStore } from '@/stores/watchlist'
import { useMarketStore } from '@/stores/market'
import { formatPrice, formatPercent } from '@/lib/utils'
import Input from '@/components/ui/Input.vue'
import ScrollArea from '@/components/ui/ScrollArea.vue'

const watchlist = useWatchlistStore()
const market = useMarketStore()

const query = ref('')
const adding = ref(false)
const seeding = ref(false)

const POPULAR = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
]

async function addSymbol() {
  const sym = query.value.trim().toUpperCase()
  if (!sym || sym.length < 3) return
  adding.value = true
  try {
    await watchlist.add(sym)
    query.value = ''
  } catch { /* duplicate or invalid */ }
  finally { adding.value = false }
}

async function addPopular() {
  seeding.value = true
  const existing = new Set(watchlist.items.map((i) => i.symbol))
  for (const sym of POPULAR) {
    if (!existing.has(sym)) {
      try { await watchlist.add(sym) } catch { /* skip */ }
    }
  }
  seeding.value = false
}

const enriched = computed(() =>
  watchlist.items.map((item) => ({
    ...item,
    ticker: market.tickers[item.symbol],
  })),
)
</script>

<template>
  <!-- Full height, full width — parent controls sizing -->
  <div class="flex h-full w-full flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 shrink-0">
      <Star :size="12" class="text-primary shrink-0" />
      <span class="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Watchlist</span>
    </div>

    <!-- Search / add -->
    <div class="px-2 py-2 border-b border-border/60 shrink-0">
      <div class="relative flex items-center gap-1">
        <div class="relative flex-1">
          <Search :size="12" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            v-model="query"
            placeholder="Add symbol…"
            class="h-8 pl-7 text-xs pr-7 border-border/60"
            @keydown.enter="addSymbol"
          />
        </div>
        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
          :class="{ 'opacity-50 pointer-events-none': adding }"
          @click="addSymbol"
        >
          <Plus :size="13" />
        </button>
      </div>
    </div>

    <!-- List -->
    <ScrollArea class="flex-1">
      <div class="py-1">
        <button
          v-for="item in enriched"
          :key="item.id"
          class="group relative flex w-full items-center px-3 py-2.5 text-left transition-all hover:bg-accent/50"
          :class="market.selectedSymbol === item.symbol
            ? 'bg-primary/8 border-l-2 border-primary'
            : 'border-l-2 border-transparent'"
          @click="market.select(item.symbol)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold truncate" :class="market.selectedSymbol === item.symbol ? 'text-foreground' : 'text-foreground/80'">
              {{ item.symbol.replace('USDT', '') }}
              <span class="text-muted-foreground font-normal">/USDT</span>
            </p>
            <p class="text-[11px] text-muted-foreground tabular mt-0.5">
              {{ item.ticker ? '$' + formatPrice(item.ticker.price) : '—' }}
            </p>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              v-if="item.ticker"
              class="text-[10px] font-semibold tabular"
              :class="item.ticker.changePercent >= 0 ? 'text-up' : 'text-down'"
            >
              {{ formatPercent(item.ticker.changePercent) }}
            </span>
            <button
              class="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
              @click.stop="watchlist.remove(item.symbol)"
            >
              <X :size="11" />
            </button>
          </div>
        </button>

        <!-- Empty state -->
        <div v-if="!enriched.length" class="flex flex-col items-center gap-2 px-3 py-8">
          <Star :size="20" class="text-muted-foreground/30" />
          <p class="text-[11px] text-muted-foreground/60 text-center">Add symbols to track them here</p>
          <button
            class="flex items-center gap-1 mt-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
            :class="{ 'opacity-50 pointer-events-none': seeding }"
            @click="addPopular"
          >
            <Sparkles :size="10" />
            {{ seeding ? 'Adding…' : 'Add popular coins' }}
          </button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
