<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Bell, BellOff, Plus, Trash2, ChevronUp, ChevronDown, AlertCircle, CheckCircle2,
} from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import { useAlertsStore } from '@/stores/alerts'
import { formatPrice } from '@/lib/utils'

const alerts = useAlertsStore()
const symbol = ref('BTCUSDT')
const price = ref('')
const condition = ref<'ABOVE' | 'BELOW'>('ABOVE')
const creating = ref(false)

onMounted(() => alerts.fetch())

async function create() {
  if (!symbol.value || !price.value) return
  creating.value = true
  try {
    await alerts.create(symbol.value.toUpperCase(), parseFloat(price.value), condition.value)
    price.value = ''
  } finally { creating.value = false }
}

const active = (a: typeof alerts.items[0]) => a.isActive
</script>

<template>
  <div class="flex h-dvh flex-col bg-background">
    <AppHeader />

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        <!-- Header -->
        <div>
          <h1 class="text-base md:text-lg font-bold flex items-center gap-2">
            <Bell :size="18" class="text-primary" /> Price Alerts
          </h1>
          <p class="text-xs text-muted-foreground mt-0.5">Get notified when a price reaches your target</p>
        </div>

        <!-- Create form -->
        <Card class="p-4 md:p-5">
          <h3 class="text-sm font-semibold mb-4">New Alert</h3>
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
            <div class="space-y-1.5">
              <Label>Symbol</Label>
              <Input v-model="symbol" class="w-full sm:w-32 uppercase" placeholder="BTCUSDT" />
            </div>
            <div class="space-y-1.5">
              <Label>Condition</Label>
              <div class="flex h-9 overflow-hidden rounded-md border border-border/60 bg-input text-sm">
                <button
                  class="flex items-center gap-1.5 px-3 font-medium transition-all"
                  :class="condition === 'ABOVE' ? 'bg-up/15 text-up border-r border-up/20' : 'text-muted-foreground hover:bg-accent border-r border-border/40'"
                  @click="condition = 'ABOVE'"
                >
                  <ChevronUp :size="14" /> Above
                </button>
                <button
                  class="flex items-center gap-1.5 px-3 font-medium transition-all"
                  :class="condition === 'BELOW' ? 'bg-down/15 text-down' : 'text-muted-foreground hover:bg-accent'"
                  @click="condition = 'BELOW'"
                >
                  <ChevronDown :size="14" /> Below
                </button>
              </div>
            </div>
            <div class="flex-1 min-w-0 sm:min-w-36 space-y-1.5">
              <Label>Price (USDT)</Label>
              <Input v-model="price" type="number" placeholder="95,000" />
            </div>
            <Button :loading="creating" class="w-full sm:w-auto" @click="create">
              <Plus :size="14" /> Add Alert
            </Button>
          </div>
        </Card>

        <!-- Summary -->
        <div class="grid grid-cols-3 gap-3">
          <Card class="px-3 md:px-4 py-3 flex items-center gap-2 md:gap-3">
            <div class="flex items-center justify-center w-7 md:w-8 h-7 md:h-8 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
              <Bell :size="14" class="text-primary" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wide">Active</p>
              <p class="text-lg font-bold">{{ alerts.items.filter(active).length }}</p>
            </div>
          </Card>
          <Card class="px-3 md:px-4 py-3 flex items-center gap-2 md:gap-3">
            <div class="flex items-center justify-center w-7 md:w-8 h-7 md:h-8 rounded-lg bg-secondary border border-border/60 shrink-0">
              <CheckCircle2 :size="14" class="text-muted-foreground" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wide">Triggered</p>
              <p class="text-lg font-bold">{{ alerts.items.filter(a => !a.isActive).length }}</p>
            </div>
          </Card>
          <Card class="px-3 md:px-4 py-3 flex items-center gap-2 md:gap-3">
            <div class="flex items-center justify-center w-7 md:w-8 h-7 md:h-8 rounded-lg bg-secondary border border-border/60 shrink-0">
              <AlertCircle :size="14" class="text-muted-foreground" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
              <p class="text-lg font-bold">{{ alerts.items.length }}</p>
            </div>
          </Card>
        </div>

        <!-- Desktop table -->
        <Card class="overflow-hidden hidden md:block">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-border/60 bg-secondary/30">
                <th class="px-5 py-3 text-left font-medium text-muted-foreground">Symbol</th>
                <th class="px-5 py-3 text-left font-medium text-muted-foreground">Condition</th>
                <th class="px-5 py-3 text-right font-medium text-muted-foreground">Target Price</th>
                <th class="px-5 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th class="px-5 py-3 text-right font-medium text-muted-foreground">Created</th>
                <th class="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody class="divide-y divide-border/40">
              <tr
                v-for="alert in alerts.items"
                :key="alert.id"
                class="hover:bg-accent/20 transition-colors"
                :class="{ 'opacity-50': !alert.isActive }"
              >
                <td class="px-5 py-3.5 font-semibold">{{ alert.symbol }}</td>
                <td class="px-5 py-3.5">
                  <span class="flex items-center gap-1.5 font-medium" :class="alert.condition === 'ABOVE' ? 'text-up' : 'text-down'">
                    <component :is="alert.condition === 'ABOVE' ? ChevronUp : ChevronDown" :size="13" />
                    {{ alert.condition }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-right tabular font-semibold">${{ formatPrice(alert.price) }}</td>
                <td class="px-5 py-3.5 text-center">
                  <Badge :variant="alert.isActive ? 'default' : 'outline'" class="flex items-center gap-1 mx-auto w-fit">
                    <component :is="alert.isActive ? Bell : BellOff" :size="10" />
                    {{ alert.isActive ? 'Active' : 'Triggered' }}
                  </Badge>
                </td>
                <td class="px-5 py-3.5 text-right text-muted-foreground">
                  {{ new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                </td>
                <td class="px-5 py-3.5 text-right">
                  <button class="rounded p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all" @click="alerts.remove(alert.id)">
                    <Trash2 :size="13" />
                  </button>
                </td>
              </tr>
              <tr v-if="!alerts.items.length">
                <td colspan="6" class="px-5 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Bell :size="24" class="text-muted-foreground/30" />
                    <p class="text-sm text-muted-foreground/60">No alerts yet.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <!-- Mobile cards -->
        <div class="md:hidden space-y-2">
          <Card
            v-for="alert in alerts.items"
            :key="alert.id"
            class="px-4 py-3"
            :class="{ 'opacity-60': !alert.isActive }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">{{ alert.symbol }}</span>
                <span class="flex items-center gap-1 text-xs font-medium" :class="alert.condition === 'ABOVE' ? 'text-up' : 'text-down'">
                  <component :is="alert.condition === 'ABOVE' ? ChevronUp : ChevronDown" :size="13" />
                  {{ alert.condition }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="alert.isActive ? 'default' : 'outline'" class="flex items-center gap-1">
                  <component :is="alert.isActive ? Bell : BellOff" :size="10" />
                  {{ alert.isActive ? 'Active' : 'Done' }}
                </Badge>
                <button class="rounded p-1 text-muted-foreground/40 hover:text-destructive" @click="alerts.remove(alert.id)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span class="font-semibold text-foreground tabular text-sm">${{ formatPrice(alert.price) }}</span>
              <span>{{ new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</span>
            </div>
          </Card>
          <div v-if="!alerts.items.length" class="flex flex-col items-center gap-2 py-10 text-muted-foreground/50">
            <Bell :size="24" />
            <p class="text-sm">No alerts yet. Create one above.</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
