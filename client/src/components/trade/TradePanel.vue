<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-vue-next'
import { useMarketStore } from '@/stores/market'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Separator from '@/components/ui/Separator.vue'

const market = useMarketStore()
const portfolio = usePortfolioStore()

const side = ref<'BUY' | 'SELL'>('BUY')
const amount = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const price = computed(() =>
  market.current ? parseFloat(market.current.price) : 0,
)

const total = computed(() => {
  const n = parseFloat(amount.value)
  return price.value && n > 0 ? (price.value * n).toFixed(2) : '0.00'
})

function getAssets() {
  const sym = market.selectedSymbol
  const quote = sym.endsWith('USDT') ? 'USDT' : sym.slice(-3)
  const base = sym.slice(0, sym.length - quote.length)
  return { base, quote }
}

const quoteBalance = computed(() => {
  const q = getAssets().quote
  return parseFloat(portfolio.positions.find((p) => p.asset === q)?.balance ?? '0')
})

const baseBalance = computed(() => {
  const b = getAssets().base
  return parseFloat(portfolio.positions.find((p) => p.asset === b)?.balance ?? '0')
})

const maxAmount = computed(() =>
  side.value === 'BUY' ? (price.value ? quoteBalance.value / price.value : 0) : baseBalance.value,
)

function setPercent(pct: number) {
  if (!price.value) return
  amount.value = ((maxAmount.value * pct) / 100).toFixed(6)
}

async function submit() {
  const n = parseFloat(amount.value)
  if (!n || n <= 0) return
  loading.value = true
  error.value = ''
  success.value = false
  try {
    await portfolio.executeTrade(market.selectedSymbol, side.value, n)
    amount.value = ''
    success.value = true
    setTimeout(() => (success.value = false), 2000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Trade failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- Side Toggle -->
    <div class="grid grid-cols-2 rounded-lg border border-border/60 overflow-hidden text-sm p-0.5 gap-0.5 bg-background">
      <button
        class="flex items-center justify-center gap-1.5 rounded-md py-2 font-semibold transition-all text-sm"
        :class="side === 'BUY'
          ? 'bg-[hsl(142,71%,45%)] text-white shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'"
        @click="side = 'BUY'"
      >
        <ArrowUpRight :size="14" />
        Buy
      </button>
      <button
        class="flex items-center justify-center gap-1.5 rounded-md py-2 font-semibold transition-all text-sm"
        :class="side === 'SELL'
          ? 'bg-[hsl(0,84%,57%)] text-white shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'"
        @click="side = 'SELL'"
      >
        <ArrowDownRight :size="14" />
        Sell
      </button>
    </div>

    <!-- Available Balance -->
    <div class="flex items-center justify-between rounded-lg bg-secondary/50 border border-border/40 px-3 py-2">
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Wallet :size="12" />
        <span class="text-xs">Available</span>
      </div>
      <span class="text-xs font-semibold tabular text-foreground/90">
        <template v-if="side === 'BUY'">
          {{ quoteBalance.toFixed(2) }} {{ getAssets().quote }}
        </template>
        <template v-else>
          {{ baseBalance.toFixed(6) }} {{ getAssets().base }}
        </template>
      </span>
    </div>

    <!-- Price -->
    <div class="space-y-1.5">
      <Label>Order Type</Label>
      <div class="flex h-9 items-center rounded-md border border-border/60 bg-secondary/40 px-3 text-sm">
        <span class="text-muted-foreground">Market</span>
        <span class="ml-auto text-xs font-medium tabular text-foreground/70">
          ~${{ price ? formatPrice(price) : '—' }}
        </span>
      </div>
    </div>

    <!-- Amount -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <Label>Amount ({{ getAssets().base }})</Label>
        <button class="text-[10px] text-primary/70 hover:text-primary transition-colors" @click="setPercent(100)">
          Max
        </button>
      </div>
      <Input
        v-model="amount"
        type="number"
        :placeholder="`0.00 ${getAssets().base}`"
        class="tabular border-border/60"
      />
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="pct in [25, 50, 75, 100]"
          :key="pct"
          class="rounded-md border border-border/50 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/60 transition-all"
          @click="setPercent(pct)"
        >{{ pct }}%</button>
      </div>
    </div>

    <Separator class="opacity-50" />

    <!-- Total -->
    <div class="flex items-center justify-between rounded-lg bg-secondary/30 border border-border/30 px-3 py-2.5">
      <span class="text-xs text-muted-foreground">Total</span>
      <span class="text-sm font-bold tabular">${{ total }}</span>
    </div>

    <!-- Error / Success -->
    <p v-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">{{ error }}</p>
    <p v-if="success" class="rounded-md bg-[hsl(142,71%,45%)]/10 border border-[hsl(142,71%,45%)]/20 px-3 py-2 text-xs text-up">
      Order placed successfully
    </p>

    <!-- Submit -->
    <Button
      :variant="side === 'BUY' ? 'buy' : 'sell'"
      size="lg"
      class="w-full"
      :loading="loading"
      @click="submit"
    >
      <ArrowUpRight v-if="side === 'BUY'" :size="16" />
      <ArrowDownRight v-else :size="16" />
      {{ side === 'BUY' ? 'Buy' : 'Sell' }} {{ getAssets().base }}
    </Button>
  </div>
</template>
