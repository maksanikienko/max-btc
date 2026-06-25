<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Send, ExternalLink, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-vue-next'
import { useWalletStore } from '@/stores/wallet'
import { useToast } from '@/composables/useToast'

const emit = defineEmits<{ close: [] }>()

const wallet = useWalletStore()
const toast = useToast()

const toAddress = ref('')
const amount = ref('')
const isSending = ref(false)
const lastTxHash = ref<string | null>(null)
const step = ref<'form' | 'sent'>('form')

// Minimal ETH address validation
const isValidAddress = computed(() =>
  /^0x[0-9a-fA-F]{40}$/.test(toAddress.value),
)

const isValidAmount = computed(() => {
  const n = parseFloat(amount.value)
  return !isNaN(n) && n > 0
})

const canSubmit = computed(
  () => isValidAddress.value && isValidAmount.value && !isSending.value,
)

const lastTx = computed(() =>
  lastTxHash.value
    ? wallet.transactions.find((t) => t.hash === lastTxHash.value)
    : null,
)

const explorerUrl = computed(() => {
  if (!lastTxHash.value) return '#'
  const base =
    wallet.chainId === 1
      ? 'https://etherscan.io'
      : 'https://sepolia.etherscan.io'
  return `${base}/tx/${lastTxHash.value}`
})

async function submit() {
  if (!canSubmit.value) return
  isSending.value = true

  try {
    const tx = await wallet.sendEth(toAddress.value, amount.value)
    lastTxHash.value = tx.hash
    step.value = 'sent'
    toast.success('Transaction sent', `Hash: ${tx.hash.slice(0, 18)}…`)
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    if (e.code !== 4001) {
      toast.error('Transaction failed', e.message)
    }
  } finally {
    isSending.value = false
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
          <div class="flex items-center gap-2">
            <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 border border-primary/25">
              <Send :size="14" class="text-primary" />
            </div>
            <h2 class="text-sm font-semibold">Send ETH</h2>
          </div>
          <button
            class="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
            @click="close"
          >
            <X :size="15" />
          </button>
        </div>

        <!-- Unsupported network warning -->
        <div
          v-if="!wallet.isOnSupportedNetwork"
          class="mx-5 mt-4 flex items-center gap-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5"
        >
          <AlertTriangle :size="14" class="text-yellow-400 shrink-0" />
          <div>
            <p class="text-xs font-medium text-yellow-400">Wrong Network</p>
            <p class="text-[11px] text-yellow-400/70 mt-0.5">Switch to Sepolia or Mainnet to send.</p>
          </div>
        </div>

        <!-- ── Form ── -->
        <div v-if="step === 'form'" class="px-5 py-4 space-y-4">
          <!-- From -->
          <div>
            <label class="block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              From
            </label>
            <div class="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/40 px-3 py-2">
              <span class="font-mono text-xs text-foreground/60 flex-1 truncate">{{ wallet.address }}</span>
              <span class="text-[11px] text-muted-foreground shrink-0">{{ wallet.balanceEth }} ETH</span>
            </div>
          </div>

          <!-- To -->
          <div>
            <label class="block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Recipient Address
            </label>
            <input
              v-model="toAddress"
              type="text"
              placeholder="0x..."
              spellcheck="false"
              class="w-full rounded-lg border bg-secondary/40 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-1 focus:ring-primary/50"
              :class="toAddress && !isValidAddress
                ? 'border-destructive/50 focus:ring-destructive/40'
                : 'border-border/40'"
            />
            <p v-if="toAddress && !isValidAddress" class="mt-1 text-[10px] text-destructive">
              Invalid Ethereum address
            </p>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Amount (ETH)
            </label>
            <div class="relative">
              <input
                v-model="amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.01"
                class="w-full rounded-lg border border-border/40 bg-secondary/40 px-3 py-2 pr-12 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-1 focus:ring-primary/50"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">ETH</span>
            </div>
          </div>

          <!-- Gas note -->
          <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <AlertTriangle :size="10" class="shrink-0" />
            Gas fee (~21,000 gas) will be added by MetaMask
          </div>

          <!-- Submit -->
          <button
            class="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all"
            :class="canSubmit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary/60 text-muted-foreground cursor-not-allowed'"
            :disabled="!canSubmit"
            @click="submit"
          >
            <Loader2 v-if="isSending" :size="14" class="animate-spin" />
            <Send v-else :size="14" />
            {{ isSending ? 'Confirm in MetaMask…' : 'Send Transaction' }}
          </button>
        </div>

        <!-- ── Transaction Sent ── -->
        <div v-else class="px-5 py-6 text-center space-y-4">
          <div class="flex items-center justify-center w-14 h-14 rounded-full mx-auto"
            :class="lastTx?.status === 'confirmed'
              ? 'bg-green-500/15 border border-green-500/30'
              : lastTx?.status === 'failed'
                ? 'bg-destructive/15 border border-destructive/30'
                : 'bg-primary/15 border border-primary/30'"
          >
            <CheckCircle2 v-if="lastTx?.status === 'confirmed'" :size="28" class="text-green-400" />
            <XCircle v-else-if="lastTx?.status === 'failed'" :size="28" class="text-destructive" />
            <Loader2 v-else :size="28" class="text-primary animate-spin" />
          </div>

          <div>
            <p class="text-sm font-semibold">
              {{ lastTx?.status === 'confirmed' ? 'Confirmed!' : lastTx?.status === 'failed' ? 'Failed' : 'Pending…' }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1">
              {{ lastTx?.value }} ETH → {{ lastTx?.to.slice(0, 10) }}…
            </p>
          </div>

          <!-- Tx hash -->
          <div class="rounded-lg border border-border/40 bg-secondary/40 px-3 py-2.5 text-left">
            <p class="text-[10px] text-muted-foreground mb-1">Transaction Hash</p>
            <p class="font-mono text-[10px] text-foreground/70 break-all">{{ lastTxHash }}</p>
          </div>

          <a
            :href="explorerUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View on Etherscan
            <ExternalLink :size="11" />
          </a>

          <button
            class="w-full rounded-lg border border-border/40 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
            @click="close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
