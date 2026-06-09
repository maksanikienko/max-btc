import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { socket } from '@/services/socket'

interface User { id: string; email: string; username: string }

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    _setTokens(data.accessToken, data.refreshToken)
    await fetchProfile()
    socket.connect()
  }

  async function register(email: string, username: string, password: string) {
    const { data } = await api.post('/auth/register', { email, username, password })
    _setTokens(data.accessToken, data.refreshToken)
    await fetchProfile()
    socket.connect()
  }

  async function fetchProfile() {
    const { data } = await api.get('/users/me')
    user.value = data
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    socket.disconnect()
    _clearTokens()
  }

  function _setTokens(access: string, refresh: string) {
    accessToken.value = access
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function _clearTokens() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { accessToken, user, isAuthenticated, login, register, logout, fetchProfile }
})
