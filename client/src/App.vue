<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { socket } from '@/services/socket'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
const notifs = useNotificationsStore()

onMounted(async () => {
  if (auth.isAuthenticated) {
    try {
      await auth.fetchProfile()
      socket.connect()
      notifs.startPolling()
    } catch {
      // token expired — router guard will redirect
    }
  }
})

onUnmounted(() => notifs.stopPolling())
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
