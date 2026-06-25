import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import Web3 from 'web3'
import api from '@/services/api'
import { socket } from '@/services/socket'

export const SUPPORTED_CHAINS: Record<number, string> = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia',
}

export type TxStatus = 'pending' | 'confirmed' | 'failed'

export interface WalletTx {
  hash: string
  status: TxStatus
  to: string
  value: string   // ETH as decimal string
  timestamp: number
}

export const useWalletStore = defineStore('wallet', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const isMetaMaskInstalled = ref(false)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const address = ref<string | null>(null)
  const chainId = ref<number | null>(null)
  const balanceWei = ref<bigint>(0n)
  const error = ref<string | null>(null)
  const transactions = ref<WalletTx[]>([])
  const linkedAddress = ref<string | null>(null)
  const isLinking = ref(false)

  // Internal — not reactive
  let _web3: Web3 | null = null
  let _initialized = false

  // ─── Computed ─────────────────────────────────────────────────────────────
  const shortAddress = computed(() => {
    if (!address.value) return null
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
  })

  const balanceEth = computed(() => {
    if (balanceWei.value === 0n) return '0.000000'
    try {
      return parseFloat(Web3.utils.fromWei(balanceWei.value, 'ether')).toFixed(6)
    } catch {
      return '0.000000'
    }
  })

  const networkName = computed(() => {
    if (chainId.value === null) return null
    return SUPPORTED_CHAINS[chainId.value] ?? `Unknown Network #${chainId.value}`
  })

  const isOnSupportedNetwork = computed(
    () => chainId.value !== null && chainId.value in SUPPORTED_CHAINS,
  )

  // True when the connected wallet matches the address linked in the DB
  const isWalletLinked = computed(
    () =>
      !!linkedAddress.value &&
      linkedAddress.value.toLowerCase() === address.value?.toLowerCase(),
  )

  // ─── Private helpers ──────────────────────────────────────────────────────
  async function _refreshBalance() {
    if (!_web3 || !address.value) return
    try {
      balanceWei.value = await _web3.eth.getBalance(address.value)
    } catch { /* silently ignore — UI will show stale balance */ }
  }

  function _resetState() {
    isConnected.value = false
    address.value = null
    chainId.value = null
    balanceWei.value = 0n
    _web3 = null
  }

  function _updateTxStatus(hash: string, status: TxStatus) {
    const idx = transactions.value.findIndex((t) => t.hash === hash)
    if (idx !== -1) transactions.value[idx] = { ...transactions.value[idx], status }
  }

  async function _pollTxReceipt(txHash: string) {
    if (!_web3) return
    let attempts = 0
    const MAX = 72 // 72 × 5 s = 6 min timeout

    const check = async () => {
      if (!_web3 || attempts >= MAX) {
        _updateTxStatus(txHash, 'failed')
        return
      }
      attempts++
      try {
        const receipt = await _web3.eth.getTransactionReceipt(txHash)
        if (receipt) {
          // web3 v4 returns status as bigint (1n = success)
          _updateTxStatus(txHash, BigInt(receipt.status ?? 0) === 1n ? 'confirmed' : 'failed')
          await _refreshBalance()
          return
        }
      } catch { /* receipt not ready yet */ }
      setTimeout(check, 5000)
    }

    setTimeout(check, 4000) // initial delay before first check
  }

  async function _fetchLinkedWallet() {
    try {
      const { data } = await api.get<{ address: string | null }>('/blockchain/wallet')
      linkedAddress.value = data.address
    } catch { /* not critical */ }
  }

  // ─── MetaMask event handlers (stable refs for removeListener) ─────────────
  function _onAccountsChanged(accounts: unknown) {
    const accs = accounts as string[]
    if (accs.length === 0) {
      _resetState()
    } else {
      address.value = accs[0]
      _refreshBalance()
    }
  }

  function _onChainChanged(chainIdHex: unknown) {
    chainId.value = parseInt(chainIdHex as string, 16)
    _refreshBalance()
  }

  function _onDisconnect() {
    _resetState()
  }

  // ─── Lifecycle (called by useMetaMask composable) ─────────────────────────
  function init() {
    if (_initialized) return
    _initialized = true

    isMetaMaskInstalled.value =
      typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask)

    if (!window.ethereum) return

    window.ethereum.on('accountsChanged', _onAccountsChanged)
    window.ethereum.on('chainChanged', _onChainChanged)
    window.ethereum.on('disconnect', _onDisconnect)

    // Restore session without re-prompting (eth_accounts vs eth_requestAccounts)
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        const accs = accounts as string[]
        if (accs.length === 0) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _web3 = new Web3(window.ethereum as any)
        address.value = accs[0]
        isConnected.value = true
        window.ethereum!.request({ method: 'eth_chainId' }).then((hex) => {
          chainId.value = parseInt(hex as string, 16)
        })
        _refreshBalance()
        _fetchLinkedWallet()
      })
      .catch(() => {})
  }

  function cleanup() {
    if (!_initialized || !window.ethereum) return
    window.ethereum.removeListener('accountsChanged', _onAccountsChanged)
    window.ethereum.removeListener('chainChanged', _onChainChanged)
    window.ethereum.removeListener('disconnect', _onDisconnect)
    _initialized = false
  }

  // ─── Public actions ───────────────────────────────────────────────────────
  async function connect() {
    if (!window.ethereum?.isMetaMask) {
      error.value = 'MetaMask not found — install it from metamask.io'
      throw new Error(error.value)
    }

    isConnecting.value = true
    error.value = null

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _web3 = new Web3(window.ethereum as any)

      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[]
      address.value = accounts[0]

      const hex = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string
      chainId.value = parseInt(hex, 16)

      await _refreshBalance()
      isConnected.value = true
      error.value = null

      await _fetchLinkedWallet()
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      error.value = e.code === 4001 ? 'Connection rejected by user' : (e.message ?? 'Failed to connect')
      throw err
    } finally {
      isConnecting.value = false
    }
  }

  function disconnect() {
    _resetState()
  }

  async function switchNetwork(targetChainId: number) {
    if (!window.ethereum) return
    const hexId = '0x' + targetChainId.toString(16)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexId }],
      })
    } catch (err: unknown) {
      const e = err as { code?: number }
      // 4902 = chain not added in MetaMask yet — only happens for Sepolia
      if (e.code === 4902 && targetChainId === 11155111) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia.publicnode.com'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        })
      } else {
        throw err
      }
    }
  }

  async function sendEth(to: string, amountEth: string): Promise<WalletTx> {
    if (!_web3 || !address.value) throw new Error('Wallet not connected')
    if (!isOnSupportedNetwork.value) throw new Error('Switch to Sepolia or Mainnet first')

    const valueWei = Web3.utils.toWei(amountEth, 'ether')
    const valueHex = '0x' + BigInt(valueWei).toString(16)

    const txHash = (await window.ethereum!.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address.value,
        to,
        value: valueHex,
        gas: '0x5208', // 21 000 — standard ETH transfer
      }],
    })) as string

    const tx: WalletTx = {
      hash: txHash,
      status: 'pending',
      to,
      value: amountEth,
      timestamp: Date.now(),
    }
    transactions.value.unshift(tx)

    // Ask backend to monitor via Socket.io — other sessions will receive tx:status too
    socket.emit('tx:watch', {
      hash: txHash,
      network: chainId.value === 1 ? 'mainnet' : 'sepolia',
    })

    // Local polling as fallback (backend may not have RPC configured)
    _pollTxReceipt(txHash)

    return tx
  }

  async function signMessage(message: string): Promise<string> {
    if (!address.value || !window.ethereum) throw new Error('Wallet not connected')
    return window.ethereum.request({
      method: 'personal_sign',
      params: [message, address.value],
    }) as Promise<string>
  }

  async function linkWallet() {
    if (!address.value) throw new Error('No wallet connected')
    isLinking.value = true
    try {
      const message = `Link wallet ${address.value} to MAX·BTC account`
      const signature = await signMessage(message)
      await api.post('/blockchain/link', { address: address.value, signature })
      linkedAddress.value = address.value
    } finally {
      isLinking.value = false
    }
  }

  async function unlinkWallet() {
    await api.delete('/blockchain/link')
    linkedAddress.value = null
  }

  async function refreshBalance() {
    await _refreshBalance()
  }

  // ─── Socket.io — backend-pushed tx confirmations ─────────────────────────
  socket.on('tx:status', ({ hash, status }: { hash: string; status: TxStatus }) => {
    _updateTxStatus(hash, status)
    if (status !== 'pending') _refreshBalance()
  })

  return {
    // State
    isMetaMaskInstalled,
    isConnected,
    isConnecting,
    address,
    shortAddress,
    chainId,
    networkName,
    isOnSupportedNetwork,
    balanceEth,
    error,
    transactions,
    linkedAddress,
    isWalletLinked,
    isLinking,
    // Actions
    init,
    cleanup,
    connect,
    disconnect,
    switchNetwork,
    sendEth,
    signMessage,
    linkWallet,
    unlinkWallet,
    refreshBalance,
  }
})
