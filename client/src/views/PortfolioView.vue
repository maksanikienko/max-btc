<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, Plus, RefreshCw,
} from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatPrice } from '@/lib/utils'

const portfolio = usePortfolioStore()
const depositAsset = ref('USDT')
const depositAmount = ref('')
const depositing = ref(false)
const showDeposit = ref(false)

onMounted(() => portfolio.fetch())

const totalUSDT = computed(() => {
  const usdt = portfolio.positions.find((p) => p.asset === 'USDT')
  return usdt ? parseFloat(usdt.balance) : 0
})

async function deposit() {
  if (!depositAmount.value) return
  depositing.value = true
  try {
    await portfolio.deposit(depositAsset.value, parseFloat(depositAmount.value))
    depositAmount.value = ''
    showDeposit.value = false
  } finally { depositing.value = false }
}
</script>

<template>
  <div class="flex h-dvh flex-col bg-background">
    <AppHeader />

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        <!-- Page header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-base md:text-lg font-bold">Portfolio</h1>
            <p class="text-xs text-muted-foreground mt-0.5">Virtual trading account</p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" :loading="portfolio.loading" @click="portfolio.fetch()">
              <RefreshCw :size="13" />
              <span class="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" @click="showDeposit = !showDeposit">
              <Plus :size="13" />
              Deposit
            </Button>
          </div>
        </div>

        <!-- Stats cards -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card class="p-3 md:p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20">
                <DollarSign :size="14" class="text-primary" />
              </div>
              <span class="text-[11px] md:text-xs text-muted-foreground">USDT</span>
            </div>
            <p class="text-lg md:text-xl font-bold tabular">${{ totalUSDT.toFixed(2) }}</p>
          </Card>
          <Card class="p-3 md:p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary border border-border/60">
                <Wallet :size="14" class="text-muted-foreground" />
              </div>
              <span class="text-[11px] md:text-xs text-muted-foreground">Assets</span>
            </div>
            <p class="text-lg md:text-xl font-bold">{{ portfolio.positions.filter(p => parseFloat(p.balance) > 0).length }}</p>
          </Card>
          <Card class="p-3 md:p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-up/10 border border-up/20">
                <TrendingUp :size="14" class="text-up" />
              </div>
              <span class="text-[11px] md:text-xs text-muted-foreground">Buys</span>
            </div>
            <p class="text-lg md:text-xl font-bold">{{ portfolio.trades.filter(t => t.type === 'BUY').length }}</p>
          </Card>
          <Card class="p-3 md:p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-down/10 border border-down/20">
                <TrendingDown :size="14" class="text-down" />
              </div>
              <span class="text-[11px] md:text-xs text-muted-foreground">Sells</span>
            </div>
            <p class="text-lg md:text-xl font-bold">{{ portfolio.trades.filter(t => t.type === 'SELL').length }}</p>
          </Card>
        </div>

        <!-- Deposit form -->
        <Card v-if="showDeposit" class="p-4 md:p-5">
          <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <DollarSign :size="15" class="text-primary" /> Add Funds
          </h3>
          <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div class="space-y-1.5">
              <Label>Asset</Label>
              <Input v-model="depositAsset" class="w-full sm:w-28" placeholder="USDT" />
            </div>
            <div class="flex-1 space-y-1.5">
              <Label>Amount</Label>
              <Input v-model="depositAmount" type="number" placeholder="1000.00" />
            </div>
            <div class="flex gap-2">
              <Button variant="outline" class="flex-1 sm:flex-none" @click="showDeposit = false">Cancel</Button>
              <Button class="flex-1 sm:flex-none" :loading="depositing" @click="deposit">
                <Plus :size="14" /> Deposit
              </Button>
            </div>
          </div>
        </Card>

        <!-- Holdings -->
        <div>
          <h2 class="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Holdings</h2>
          <Card class="overflow-hidden">
            <div class="divide-y divide-border/50">
              <div
                v-for="pos in portfolio.positions.filter(p => parseFloat(p.balance) > 0)"
                :key="pos.id"
                class="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary border border-border/60 text-xs font-bold">
                    {{ pos.asset.slice(0, 2) }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold">{{ pos.asset }}</p>
                    <p class="text-xs text-muted-foreground">Spot</p>
                  </div>
                </div>
                <p class="text-sm font-semibold tabular">
                  {{ pos.asset === 'USDT'
                    ? '$' + parseFloat(pos.balance).toFixed(2)
                    : parseFloat(pos.balance).toFixed(6) + ' ' + pos.asset }}
                </p>
              </div>
              <div v-if="!portfolio.positions.some(p => parseFloat(p.balance) > 0)"
                class="flex flex-col items-center gap-2 py-10 text-muted-foreground/50">
                <Wallet :size="24" />
                <p class="text-sm">No holdings yet. Deposit to get started.</p>
              </div>
            </div>
          </Card>
        </div>

        <!-- Trade history -->
        <div>
          <h2 class="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Trade History</h2>

          <!-- Desktop table -->
          <Card class="overflow-hidden hidden md:block">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-border/60 bg-secondary/30">
                  <th class="px-5 py-3 text-left font-medium text-muted-foreground">Symbol</th>
                  <th class="px-5 py-3 text-left font-medium text-muted-foreground">Side</th>
                  <th class="px-5 py-3 text-right font-medium text-muted-foreground">Price</th>
                  <th class="px-5 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th class="px-5 py-3 text-right font-medium text-muted-foreground">Total</th>
                  <th class="px-5 py-3 text-right font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/40">
                <tr v-for="trade in portfolio.trades" :key="trade.id" class="hover:bg-accent/20 transition-colors">
                  <td class="px-5 py-3 font-semibold">{{ trade.symbol }}</td>
                  <td class="px-5 py-3">
                    <Badge :variant="trade.type === 'BUY' ? 'up' : 'down'" class="flex items-center gap-1 w-fit">
                      <component :is="trade.type === 'BUY' ? ArrowUpRight : ArrowDownRight" :size="10" />
                      {{ trade.type }}
                    </Badge>
                  </td>
                  <td class="px-5 py-3 text-right tabular">${{ formatPrice(trade.price) }}</td>
                  <td class="px-5 py-3 text-right tabular">{{ parseFloat(trade.amount).toFixed(6) }}</td>
                  <td class="px-5 py-3 text-right tabular font-semibold">${{ formatPrice(trade.total) }}</td>
                  <td class="px-5 py-3 text-right text-muted-foreground">
                    {{ new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                  </td>
                </tr>
                <tr v-if="!portfolio.trades.length">
                  <td colspan="6" class="px-5 py-10 text-center text-muted-foreground/60 text-sm">No trades yet.</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <!-- Mobile cards -->
          <div class="md:hidden space-y-2">
            <Card
              v-for="trade in portfolio.trades"
              :key="trade.id"
              class="px-4 py-3"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold">{{ trade.symbol }}</span>
                  <Badge :variant="trade.type === 'BUY' ? 'up' : 'down'" class="flex items-center gap-1">
                    <component :is="trade.type === 'BUY' ? ArrowUpRight : ArrowDownRight" :size="10" />
                    {{ trade.type }}
                  </Badge>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p class="text-muted-foreground mb-0.5">Price</p>
                  <p class="font-medium tabular">${{ formatPrice(trade.price) }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground mb-0.5">Amount</p>
                  <p class="font-medium tabular">{{ parseFloat(trade.amount).toFixed(4) }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground mb-0.5">Total</p>
                  <p class="font-semibold tabular">${{ formatPrice(trade.total) }}</p>
                </div>
              </div>
            </Card>
            <div v-if="!portfolio.trades.length" class="flex flex-col items-center gap-2 py-10 text-muted-foreground/50">
              <TrendingUp :size="24" />
              <p class="text-sm">No trades yet.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
