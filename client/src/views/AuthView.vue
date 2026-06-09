<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { TrendingUp, Mail, Lock, User, ArrowRight, Zap } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Separator from '@/components/ui/Separator.vue'

const router = useRouter()
const auth = useAuthStore()

const tab = ref<'login' | 'register'>('login')
const email = ref('')
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (tab.value === 'login') {
      await auth.login(email.value, password.value)
    } else {
      await auth.register(email.value, username.value, password.value)
    }
    await router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Something went wrong'
  } finally {
    loading.value = false
  }
}

function switchTab(t: 'login' | 'register') {
  tab.value = t
  error.value = ''
}
</script>

<template>
  <div class="flex h-screen w-full items-center justify-center bg-background overflow-hidden">
    <!-- Background decoration -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div class="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-primary/3 blur-3xl" />
      <div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/3 blur-3xl" />
      <!-- Grid lines -->
      <div class="absolute inset-0 bg-[linear-gradient(hsl(0_0%_100%/0.02)_1px,transparent_1px),linear-gradient(to_right,hsl(0_0%_100%/0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </div>

    <div class="relative w-full max-w-sm px-4">
      <!-- Logo -->
      <div class="flex flex-col items-center gap-3 mb-8">
        <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 shadow-lg shadow-primary/10">
          <TrendingUp :size="22" class="text-primary" />
        </div>
        <div class="text-center">
          <h1 class="text-xl font-bold tracking-widest text-foreground">MAX·BTC</h1>
          <p class="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Zap :size="10" class="text-primary/60" />
            Crypto Trading Terminal
          </p>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
        <!-- Tabs -->
        <div class="flex border-b border-border/60">
          <button
            class="flex-1 py-3.5 text-sm font-medium transition-all relative"
            :class="tab === 'login' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'"
            @click="switchTab('login')"
          >
            Sign In
            <span v-if="tab === 'login'" class="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-12 bg-primary rounded-full" />
          </button>
          <div class="w-px bg-border/60" />
          <button
            class="flex-1 py-3.5 text-sm font-medium transition-all relative"
            :class="tab === 'register' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'"
            @click="switchTab('register')"
          >
            Create Account
            <span v-if="tab === 'register'" class="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-12 bg-primary rounded-full" />
          </button>
        </div>

        <!-- Form -->
        <form class="p-6 space-y-4" @submit.prevent="submit">
          <div class="space-y-1.5">
            <Label for="email">Email</Label>
            <div class="relative">
              <Mail :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="trader@example.com"
                class="pl-9"
                :disabled="loading"
              />
            </div>
          </div>

          <div v-if="tab === 'register'" class="space-y-1.5">
            <Label for="username">Username</Label>
            <div class="relative">
              <User :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="username"
                v-model="username"
                placeholder="satoshi"
                class="pl-9"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <div class="relative">
              <Lock :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="pl-9"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5 text-xs text-destructive flex items-start gap-2">
            <span class="mt-0.5">⚠</span>
            <span>{{ error }}</span>
          </div>

          <Button type="submit" class="w-full mt-2" size="lg" :loading="loading">
            {{ tab === 'login' ? 'Sign In' : 'Create Account' }}
            <ArrowRight v-if="!loading" :size="16" />
          </Button>
        </form>

        <Separator class="opacity-40" />
        <p class="px-6 py-3 text-center text-[11px] text-muted-foreground/60">
          {{ tab === 'login' ? 'No account?' : 'Already have an account?' }}
          <button class="text-primary/80 hover:text-primary transition-colors ml-1" @click="switchTab(tab === 'login' ? 'register' : 'login')">
            {{ tab === 'login' ? 'Sign up' : 'Sign in' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
