import { onMounted, onUnmounted } from 'vue'
import { useWalletStore } from '@/stores/wallet'

/**
 * Thin lifecycle wrapper around the wallet store.
 *
 * Call this composable exactly once, from a component that persists for the
 * entire authenticated session (AppHeader). It registers MetaMask event
 * listeners on mount and cleans them up on unmount. All other components
 * should use `useWalletStore()` directly to read state.
 */
export function useMetaMask() {
  const wallet = useWalletStore()

  onMounted(() => wallet.init())
  onUnmounted(() => wallet.cleanup())

  return wallet
}
