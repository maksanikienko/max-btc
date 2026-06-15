<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Star, BarChart2, ArrowLeftRight } from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import WatchlistPanel from '@/components/watchlist/WatchlistPanel.vue'
import TickerBar from '@/components/market/TickerBar.vue'
import TradingChart from '@/components/chart/TradingChart.vue'
import TradePanel from '@/components/trade/TradePanel.vue'
import ScrollArea from '@/components/ui/ScrollArea.vue'
import Separator from '@/components/ui/Separator.vue'
import { useMarketStore } from '@/stores/market'
import { useWatchlistStore } from '@/stores/watchlist'
import { usePortfolioStore } from '@/stores/portfolio'

const market = useMarketStore()
const watchlist = useWatchlistStore()
const portfolio = usePortfolioStore()

type MobileTab = 'watchlist' | 'chart' | 'trade'
const mobileTab = ref<MobileTab>('chart')

const mobileTabs = [
  { id: 'watchlist' as MobileTab, label: 'Watchlist', icon: Star },
  { id: 'chart' as MobileTab, label: 'Chart', icon: BarChart2 },
  { id: 'trade' as MobileTab, label: 'Trade', icon: ArrowLeftRight },
]

onMounted(async () => {
  market.init()
  await Promise.all([watchlist.fetch(), portfolio.fetch()])
})

onUnmounted(() => market.destroy())
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-background">
    <AppHeader />

    <!-- TickerBar: always visible on all mobile tabs -->
    <TickerBar />

    <!-- Content area -->
    <div class="flex flex-1 overflow-hidden min-h-0">

      <!-- Watchlist panel -->
      <!-- Desktop: fixed w-52 sidebar | Mobile: full-width when tab active -->
      <div
        class="shrink-0 flex-col border-r border-border/60 bg-card/20 overflow-hidden"
        :class="mobileTab === 'watchlist'
          ? 'flex w-full'
          : 'hidden md:flex md:w-52'"
      >
        <WatchlistPanel />
      </div>

      <!-- Chart column: always visible on desktop, only when chart tab on mobile -->
      <div
        class="flex-col overflow-hidden min-w-0"
        :class="mobileTab === 'chart'
          ? 'flex flex-1'
          : 'hidden md:flex md:flex-1'"
      >
        <div class="flex flex-1 overflow-hidden">
          <!-- Chart -->
          <div class="flex-1 min-w-0 min-h-0">
            <TradingChart :symbol="market.selectedSymbol" class="h-full" />
          </div>

          <!-- Right panel: only on desktop -->
          <aside class="hidden md:flex w-64 shrink-0 border-l border-border/60 flex-col bg-card/10 overflow-hidden">
            <ScrollArea class="flex-1">
              <TradePanel />
              <Separator class="opacity-40" />
              <!-- Positions -->
              <div class="px-4 py-3">
                <p class="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Open Positions</p>
                <div class="space-y-2">
                  <div
                    v-for="pos in portfolio.positions.filter(p => parseFloat(p.balance) > 0)"
                    :key="pos.id"
                    class="flex items-center justify-between rounded-lg bg-secondary/40 border border-border/30 px-3 py-2"
                  >
                    <span class="text-xs font-semibold text-foreground/80">{{ pos.asset }}</span>
                    <span class="text-xs tabular font-medium">
                      {{ pos.asset === 'USDT' ? '$' + parseFloat(pos.balance).toFixed(2) : parseFloat(pos.balance).toFixed(6) }}
                    </span>
                  </div>
                  <p v-if="!portfolio.positions.some(p => parseFloat(p.balance) > 0)" class="text-[11px] text-muted-foreground/50 text-center py-2">
                    No positions yet
                  </p>
                </div>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>

      <!-- Trade column: only on mobile when trade tab active -->
      <div
        class="flex-col overflow-hidden md:hidden"
        :class="mobileTab === 'trade' ? 'flex flex-1' : 'hidden'"
      >
        <ScrollArea class="flex-1">
          <TradePanel />
          <Separator class="opacity-40" />
          <div class="px-4 py-3">
            <p class="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Open Positions</p>
            <div class="space-y-2">
              <div
                v-for="pos in portfolio.positions.filter(p => parseFloat(p.balance) > 0)"
                :key="pos.id"
                class="flex items-center justify-between rounded-lg bg-secondary/40 border border-border/30 px-3 py-2"
              >
                <span class="text-xs font-semibold text-foreground/80">{{ pos.asset }}</span>
                <span class="text-xs tabular font-medium">
                  {{ pos.asset === 'USDT' ? '$' + parseFloat(pos.balance).toFixed(2) : parseFloat(pos.balance).toFixed(6) }}
                </span>
              </div>
              <p v-if="!portfolio.positions.some(p => parseFloat(p.balance) > 0)" class="text-[11px] text-muted-foreground/50 text-center py-2">
                No positions yet
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

    </div>

    <!-- Mobile bottom tab bar -->
    <nav class="flex md:hidden border-t border-border/60 bg-card/40 backdrop-blur-sm shrink-0 pb-[env(safe-area-inset-bottom)]">
      <button
        v-for="tab in mobileTabs"
        :key="tab.id"
        class="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-all"
        :class="mobileTab === tab.id ? 'text-primary' : 'text-muted-foreground'"
        @click="mobileTab = tab.id"
      >
        <component :is="tab.icon" :size="18" :stroke-width="mobileTab === tab.id ? 2.5 : 1.5" />
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>
