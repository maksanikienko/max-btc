<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wallet, Copy, ExternalLink, RefreshCw, Link, Link2Off,
  Send, Loader2, ChevronDown, Unplug,
} from 'lucide-vue-next'
import { useWalletStore } from '@/stores/wallet'
import { useToast } from '@/composables/useToast'
import SendEthModal from '@/components/wallet/SendEthModal.vue'

const wallet = useWalletStore()
const toast = useToast()
const router = useRouter()

const open = ref(false)
const sendOpen = ref(false)

function toggle(e: Event) {
  e.stopPropagation()
  open.value = !open.value
}

function handleOutside(e: Event) {
  const t = e.target as Element
  if (!t.closest('[data-wallet-popup]')) open.value = false
}

// Copy wallet address to clipboard
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

function handleDisconnect() {
  wallet.disconnect()
  open.value = false
  toast.info('Wallet disconnected')
}

const networks = [
  { chainId: 1,        label: 'Mainnet', activeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/40' },
  { chainId: 11155111, label: 'Sepolia', activeClass: 'bg-green-500/15 text-green-400 border-green-500/40' },
]

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
    toast.success('Wallet linked', 'Your wallet is now linked to your account')
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

async function handleRefreshBalance() {
  await wallet.refreshBalance()
  toast.info('Balance updated')
}

const networkBadgeClass = (chainId: number | null) => {
  if (chainId === 1) return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  if (chainId === 11155111) return 'bg-green-500/15 text-green-400 border-green-500/30'
  return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
}

import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('click', handleOutside))
onUnmounted(() => document.removeEventListener('click', handleOutside))
</script>

<template>
  <!-- Not installed -->
  <a
    v-if="!wallet.isMetaMaskInstalled"
    href="https://metamask.io"
    target="_blank"
    rel="noopener"
    class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
  >
    <Wallet :size="13" />
    <span class="hidden sm:inline">Get MetaMask</span>
    <ExternalLink :size="10" class="opacity-50" />
  </a>

  <!-- Not connected -->
  <button
    v-else-if="!wallet.isConnected"
    class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
    :class="wallet.isConnecting
      ? 'text-muted-foreground cursor-wait'
      : 'text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10'"
    :disabled="wallet.isConnecting"
    @click="handleConnect"
  >
    <Loader2 v-if="wallet.isConnecting" :size="13" class="animate-spin" />
    <Wallet v-else :size="13" />
    <span class="hidden sm:inline">{{ wallet.isConnecting ? 'Connecting…' : 'Connect Wallet' }}</span>
  </button>

  <!-- Connected — pill + dropdown -->
  <div v-else class="relative" data-wallet-popup>
    <button
      class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-accent/60 border border-border/40"
      @click="toggle"
    >
      <!-- Network dot -->
      <span
        class="w-1.5 h-1.5 rounded-full shrink-0"
        :class="wallet.isOnSupportedNetwork ? 'bg-green-400' : 'bg-yellow-400'"
      />
      <span class="hidden sm:inline font-mono text-foreground/80">{{ wallet.shortAddress }}</span>
      <span class="hidden lg:inline text-muted-foreground">{{ wallet.balanceEth }} ETH</span>
      <ChevronDown :size="12" class="text-muted-foreground transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 top-10 w-72 rounded-xl border border-border/60 bg-card shadow-xl z-50 overflow-hidden"
        data-wallet-popup
        @click.stop
      >
        <!-- Header: address + copy -->
        <div class="px-4 pt-3.5 pb-3 border-b border-border/40">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Connected Wallet
            </span>
            <span
              v-if="wallet.isWalletLinked"
              class="flex items-center gap-1 text-[10px] text-green-400"
            >
              <Link :size="10" /> Linked
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-foreground flex-1 truncate">
              {{ wallet.address }}
            </span>
            <button
              class="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy address"
              @click="copyAddress"
            >
              <Copy :size="13" />
            </button>
            <a
              :href="`https://${wallet.chainId === 1 ? '' : 'sepolia.'}etherscan.io/address/${wallet.address}`"
              target="_blank"
              rel="noopener"
              class="text-muted-foreground hover:text-foreground transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink :size="13" />
            </a>
          </div>
        </div>

        <!-- Balance + Network -->
        <div class="px-4 py-3 border-b border-border/40">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-[10px] text-muted-foreground mb-0.5">ETH Balance</p>
              <p class="text-lg font-bold tabular-nums text-foreground">{{ wallet.balanceEth }}</p>
            </div>
            <button
              class="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
              title="Refresh balance"
              @click="handleRefreshBalance"
            >
              <RefreshCw :size="13" />
            </button>
          </div>

          <!-- Network selector -->
          <div>
            <p class="text-[10px] text-muted-foreground mb-1.5">Network</p>
            <div class="flex items-center gap-1.5">
              <button
                v-for="net in networks"
                :key="net.chainId"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all"
                :class="wallet.chainId === net.chainId
                  ? net.activeClass
                  : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'"
                @click="handleSwitchNetwork(net.chainId)"
              >
                <span class="w-1 h-1 rounded-full bg-current" />
                {{ net.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-2 space-y-0.5">
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-accent/60 text-foreground/80 hover:text-foreground"
            @click="sendOpen = true; open = false"
          >
            <Send :size="13" class="text-primary" />
            Send ETH
          </button>

          <button
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-accent/60 text-foreground/80 hover:text-foreground"
            @click="router.push('/wallet'); open = false"
          >
            <Wallet :size="13" class="text-muted-foreground" />
            Open Wallet Dashboard
          </button>

          <button
            v-if="!wallet.isWalletLinked"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-accent/60 text-foreground/80 hover:text-foreground"
            :disabled="wallet.isLinking"
            @click="handleLinkWallet"
          >
            <Loader2 v-if="wallet.isLinking" :size="13" class="animate-spin text-muted-foreground" />
            <Link v-else :size="13" class="text-muted-foreground" />
            {{ wallet.isLinking ? 'Confirm in MetaMask…' : 'Link to Account' }}
          </button>

          <button
            v-else
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            @click="handleUnlinkWallet"
          >
            <Link2Off :size="13" />
            Unlink Wallet
          </button>
        </div>

        <!-- Disconnect -->
        <div class="border-t border-border/40 p-2">
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            @click="handleDisconnect"
          >
            <Unplug :size="13" />
            Disconnect
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Send ETH Modal -->
  <SendEthModal v-if="sendOpen" @close="sendOpen = false" />
</template>
