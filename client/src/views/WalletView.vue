<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Wallet, Copy, ExternalLink, RefreshCw, Link, Link2Off, Send,
  Loader2, CheckCircle2, XCircle, Clock, ArrowUpRight,
  Shield, Zap,
} from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useWalletStore } from '@/stores/wallet'
import { useToast } from '@/composables/useToast'
import SendEthModal from '@/components/wallet/SendEthModal.vue'

const wallet = useWalletStore()
const toast = useToast()
const sendOpen = ref(false)

const txStatusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    class: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  },
  confirmed: {
    icon: CheckCircle2,
    label: 'Confirmed',
    class: 'text-green-400 bg-green-500/10 border-green-500/25',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    class: 'text-destructive bg-destructive/10 border-destructive/25',
  },
}

const networks = [
  { chainId: 1,        label: 'Mainnet', activeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/40' },
  { chainId: 11155111, label: 'Sepolia', activeClass: 'bg-green-500/15 text-green-400 border-green-500/40' },
]

const explorerBase = computed(() =>
  wallet.chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io',
)

function formatTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

async function copyAddress() {
  if (!wallet.address) return
  await navigator.clipboard.writeText(wallet.address)
  toast.success('Copied!', wallet.address)
}

async function handleConnect() {
  try {
    await wallet.connect()
    toast.success('Wallet connected', wallet.shortAddress ?? '')
  } catch (err: unknown) {
    const e = err as { code?: number }
    if (e.code !== 4001) toast.error('Connection failed', wallet.error ?? undefined)
  }
}

async function handleSwitchNetwork(targetChainId: number) {
  try {
    await wallet.switchNetwork(targetChainId)
  } catch {
    toast.error('Network switch failed')
  }
}

async function handleLinkWallet() {
  try {
    await wallet.linkWallet()
    toast.success('Wallet linked', 'Sign confirmed — wallet is now tied to your account')
  } catch (err: unknown) {
    const e = err as { message?: string }
    toast.error('Linking failed', e.message)
  }
}

async function handleUnlinkWallet() {
  try {
    await wallet.unlinkWallet()
    toast.info('Wallet unlinked')
  } catch {
    toast.error('Unlink failed')
  }
}
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-background">
    <AppHeader />

    <div class="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div class="max-w-3xl mx-auto space-y-6">

        <!-- Page title -->
        <div>
          <h1 class="text-lg font-bold tracking-tight">Blockchain Wallet</h1>
          <p class="text-xs text-muted-foreground mt-1">
            Connect MetaMask to send ETH, verify ownership, and track on-chain activity.
          </p>
        </div>

        <!-- ── Not installed ── -->
        <div
          v-if="!wallet.isMetaMaskInstalled"
          class="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-4"
        >
          <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 mx-auto">
            <Wallet :size="28" class="text-primary" />
          </div>
          <div>
            <h2 class="text-sm font-semibold">MetaMask not found</h2>
            <p class="text-xs text-muted-foreground mt-1">Install the MetaMask browser extension to continue.</p>
          </div>
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Install MetaMask
            <ExternalLink :size="12" />
          </a>
        </div>

        <!-- ── Not connected ── -->
        <div
          v-else-if="!wallet.isConnected"
          class="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-4"
        >
          <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 mx-auto">
            <Wallet :size="28" class="text-primary" />
          </div>
          <div>
            <h2 class="text-sm font-semibold">Connect your wallet</h2>
            <p class="text-xs text-muted-foreground mt-1">MetaMask detected. Click below to connect.</p>
          </div>
          <button
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            :disabled="wallet.isConnecting"
            @click="handleConnect"
          >
            <Loader2 v-if="wallet.isConnecting" :size="14" class="animate-spin" />
            <Wallet v-else :size="14" />
            {{ wallet.isConnecting ? 'Connecting…' : 'Connect MetaMask' }}
          </button>
        </div>

        <!-- ── Connected ── -->
        <template v-else>

          <!-- Wallet card -->
          <div class="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <!-- Gradient banner -->
            <div class="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <div class="px-5 py-5 space-y-4">
              <!-- Address row -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                    Wallet Address
                  </p>
                  <p class="font-mono text-xs text-foreground/80 break-all">{{ wallet.address }}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    class="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
                    title="Copy"
                    @click="copyAddress"
                  >
                    <Copy :size="13" />
                  </button>
                  <a
                    :href="`${explorerBase}/address/${wallet.address}`"
                    target="_blank"
                    rel="noopener"
                    class="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
                    title="Etherscan"
                  >
                    <ExternalLink :size="13" />
                  </a>
                </div>
              </div>

              <!-- Balance + Network row -->
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-secondary/40 border border-border/30 px-3 py-3">
                  <p class="text-[10px] text-muted-foreground mb-1">ETH Balance</p>
                  <div class="flex items-end gap-1.5">
                    <span class="text-xl font-bold tabular-nums">{{ wallet.balanceEth }}</span>
                    <span class="text-xs text-muted-foreground mb-0.5">ETH</span>
                  </div>
                  <button
                    class="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    @click="wallet.refreshBalance()"
                  >
                    <RefreshCw :size="10" /> Refresh
                  </button>
                </div>

                <div class="rounded-xl bg-secondary/40 border border-border/30 px-3 py-3">
                  <p class="text-[10px] text-muted-foreground mb-2">Network</p>
                  <div class="flex flex-col gap-1.5">
                    <button
                      v-for="net in networks"
                      :key="net.chainId"
                      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all"
                      :class="wallet.chainId === net.chainId
                        ? net.activeClass
                        : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'"
                      @click="handleSwitchNetwork(net.chainId)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      {{ net.label }}
                      <span
                        v-if="wallet.chainId === net.chainId"
                        class="ml-auto text-[9px] opacity-60"
                      >active</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="border-t border-border/40 px-5 py-3 flex items-center gap-2 flex-wrap">
              <button
                class="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                @click="sendOpen = true"
              >
                <Send :size="12" /> Send ETH
              </button>

              <button
                v-if="!wallet.isWalletLinked"
                class="flex items-center gap-1.5 rounded-lg border border-border/40 px-3.5 py-2 text-xs font-medium text-foreground/80 hover:bg-accent/60 transition-all"
                :disabled="wallet.isLinking"
                @click="handleLinkWallet"
              >
                <Loader2 v-if="wallet.isLinking" :size="12" class="animate-spin" />
                <Link v-else :size="12" />
                {{ wallet.isLinking ? 'Sign in MetaMask…' : 'Link to Account' }}
              </button>

              <button
                v-else
                class="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all"
                @click="handleUnlinkWallet"
              >
                <Link2Off :size="12" /> Unlink Wallet
              </button>
            </div>
          </div>

          <!-- Linked status banner -->
          <div
            v-if="wallet.isWalletLinked"
            class="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/8 px-4 py-3"
          >
            <Shield :size="15" class="text-green-400 shrink-0" />
            <div>
              <p class="text-xs font-medium text-green-400">Wallet linked to account</p>
              <p class="text-[11px] text-green-400/60 mt-0.5">
                Ownership verified via signature — your wallet is tied to your MAX·BTC account.
              </p>
            </div>
          </div>

          <!-- Feature callout if not linked -->
          <div
            v-else-if="wallet.isConnected"
            class="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/20 px-4 py-3"
          >
            <Zap :size="15" class="text-muted-foreground shrink-0" />
            <p class="text-[11px] text-muted-foreground">
              Link your wallet to your account via EIP-191 signature — no gas required.
              This proves you own the key without any on-chain transaction.
            </p>
          </div>

          <!-- Transaction history -->
          <div class="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
              <p class="text-xs font-semibold">Transaction History</p>
              <span class="text-[10px] text-muted-foreground">This session only</span>
            </div>

            <div v-if="!wallet.transactions.length" class="flex flex-col items-center gap-2 py-12">
              <ArrowUpRight :size="22" class="text-muted-foreground/30" />
              <p class="text-xs text-muted-foreground/50">No transactions yet</p>
            </div>

            <div v-else class="divide-y divide-border/30">
              <div
                v-for="tx in wallet.transactions"
                :key="tx.hash"
                class="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/20 transition-colors"
              >
                <!-- Status icon -->
                <div
                  class="flex items-center justify-center w-7 h-7 rounded-lg border shrink-0"
                  :class="txStatusConfig[tx.status].class"
                >
                  <component :is="txStatusConfig[tx.status].icon" :size="13" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-medium">{{ tx.value }} ETH</span>
                    <span
                      class="px-1.5 py-0.5 rounded-full text-[9px] font-medium border"
                      :class="txStatusConfig[tx.status].class"
                    >
                      {{ txStatusConfig[tx.status].label }}
                    </span>
                  </div>
                  <p class="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                    → {{ tx.to }}
                  </p>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] text-muted-foreground">{{ formatTime(tx.timestamp) }}</span>
                  <a
                    :href="`${explorerBase}/tx/${tx.hash}`"
                    target="_blank"
                    rel="noopener"
                    class="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink :size="12" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </template>
      </div>
    </div>
  </div>

  <SendEthModal v-if="sendOpen" @close="sendOpen = false" />
</template>
