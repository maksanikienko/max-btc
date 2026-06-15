<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  const { accessToken, refreshToken } = route.query

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    await router.replace('/auth')
    return
  }

  try {
    await auth.loginWithTokens(accessToken, refreshToken)
    await router.replace('/')
  } catch {
    await router.replace('/auth')
  }
})
</script>

<template>
  <div class="flex h-screen w-full items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-3 text-muted-foreground">
      <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="text-sm">Signing you in…</p>
    </div>
  </div>
</template>
