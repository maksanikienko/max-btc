<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { TrendingUp, TrendingDown, Activity, Wifi } from 'lucide-vue-next'
import { useMarketStore } from '@/stores/market'
import { formatPrice, formatPercent, formatVolume } from '@/lib/utils'
import Badge from '@/components/ui/Badge.vue'
import Separator from '@/components/ui/Separator.vue'

const market = useMarketStore()
const t = computed(() => market.current)
const isUp = computed(() => (t.value?.changePercent ?? 0) >= 0)

const pulse = ref(false)
let pulseTimer: ReturnType<typeof setTimeout>
watch(() => market.lastUpdate, () => {
  pulse.value = true
  clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => { pulse.value = false }, 300)
})
</script>

<template>
  <div class="flex h-11 md:h-13 items-center gap-3 md:gap-5 border-b border-border/60 bg-card/20 px-3 md:px-4 shrink-0 overflow-x-auto scrollbar-none">

    <!-- Symbol + live dot -->
    <div class="flex items-center gap-2 md:gap-3 shrink-0">
      <div>
        <div class="flex items-baseline gap-1">
          <span class="text-sm font-bold tracking-wide">
            {{ market.selectedSymbol.replace('USDT', '') }}
          </span>
          <span class="text-xs text-muted-foreground">/USDT</span>
        </div>
        <div class="flex items-center gap-1.5 mt-0.5">
          <Activity :size="9" class="text-muted-foreground/50" />
          <span class="text-[9px] text-muted-foreground/50 tracking-wide">SPOT</span>
          <span class="flex items-center gap-0.5 text-[9px] transition-colors" :class="pulse ? 'text-up' : 'text-muted-foreground/30'">
            <span class="inline-block h-1.5 w-1.5 rounded-full transition-colors" :class="pulse ? 'bg-up' : 'bg-muted-foreground/30'" />
            LIVE
          </span>
        </div>
      </div>

      <Separator orientation="vertical" class="h-7 opacity-40 hidden xs:block" />

      <!-- Price + badge -->
      <div class="flex items-baseline gap-2">
        <span
          class="text-lg md:text-xl font-bold tabular tracking-tight transition-colors"
          :class="t ? (isUp ? 'text-up' : 'text-down') : 'text-foreground'"
        >
          {{ t ? '$' + formatPrice(t.price) : '—' }}
        </span>
        <Badge v-if="t" :variant="isUp ? 'up' : 'down'" class="flex items-center gap-1 text-[10px]">
          <component :is="isUp ? TrendingUp : TrendingDown" :size="10" />
          {{ formatPercent(t.changePercent) }}
        </Badge>
      </div>
    </div>

    <!-- OHLCV stats: hidden on small mobile, visible md+ -->
    <template v-if="t">
      <Separator orientation="vertical" class="h-6 opacity-40 hidden md:block" />
      <div class="hidden md:flex items-center gap-5 text-xs">
        <div class="flex flex-col">
          <span class="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">24h High</span>
          <span class="text-up font-medium tabular">${{ formatPrice(t.high) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">24h Low</span>
          <span class="text-down font-medium tabular">${{ formatPrice(t.low) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">24h Vol</span>
          <span class="text-foreground/80 font-medium tabular">{{ formatVolume(t.volume) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">Quote Vol</span>
          <span class="text-foreground/80 font-medium tabular">${{ formatVolume(t.quoteVolume) }}</span>
        </div>
      </div>

      <!-- Mobile: show only high/low compactly -->
      <div class="flex md:hidden items-center gap-3 text-xs ml-1">
        <div class="flex flex-col items-center">
          <span class="text-[9px] text-muted-foreground/60 uppercase">H</span>
          <span class="text-up font-medium tabular text-[11px]">${{ formatPrice(t.high) }}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[9px] text-muted-foreground/60 uppercase">L</span>
          <span class="text-down font-medium tabular text-[11px]">${{ formatPrice(t.low) }}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[9px] text-muted-foreground/60 uppercase">Vol</span>
          <span class="text-foreground/70 font-medium tabular text-[11px]">{{ formatVolume(t.volume) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
