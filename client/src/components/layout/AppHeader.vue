<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  TrendingUp, Bell, LogOut, LayoutDashboard, Briefcase, Bell as AlertBell,
  Users, CheckCheck, AlertCircle, Menu, X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import ScrollArea from '@/components/ui/ScrollArea.vue'
import Separator from '@/components/ui/Separator.vue'

const auth = useAuthStore()
const notifs = useNotificationsStore()
const router = useRouter()

const bellOpen = ref(false)
const menuOpen = ref(false)

const nav = [
  { to: '/', label: 'Terminal', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/alerts', label: 'Alerts', icon: AlertBell },
  { to: '/rooms', label: 'Rooms', icon: Users },
]

function toggleBell(e: Event) {
  e.stopPropagation()
  menuOpen.value = false
  bellOpen.value = !bellOpen.value
  if (bellOpen.value) notifs.fetch()
}

function toggleMenu(e: Event) {
  e.stopPropagation()
  bellOpen.value = false
  menuOpen.value = !menuOpen.value
}

function handleOutside(e: Event) {
  const t = e.target as Element
  if (!t.closest('[data-header-popup]')) {
    bellOpen.value = false
    menuOpen.value = false
  }
}

function navigate(to: string) {
  menuOpen.value = false
  router.push(to)
}

async function logout() {
  menuOpen.value = false
  await auth.logout()
  router.push('/auth')
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(() => document.addEventListener('click', handleOutside))
onUnmounted(() => document.removeEventListener('click', handleOutside))
</script>

<template>
  <header class="h-13 flex items-center justify-between border-b border-border/60 bg-card/40 backdrop-blur-sm pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] mt-[env(safe-area-inset-top)] shrink-0 z-40 relative">

    <!-- Left: logo + desktop nav -->
    <div class="flex items-center gap-4">
      <RouterLink to="/" class="flex items-center gap-2 text-primary font-bold tracking-widest text-sm hover:opacity-80 transition-opacity">
        <div class="flex items-center justify-center w-6 h-6 rounded bg-primary/15 border border-primary/25">
          <TrendingUp :size="14" />
        </div>
        <span class="hidden xs:inline">MAX·BTC</span>
      </RouterLink>

      <Separator orientation="vertical" class="hidden md:block h-5 opacity-50" />

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-0.5">
        <RouterLink
          v-for="link in nav"
          :key="link.to"
          :to="link.to"
          custom
          v-slot="{ navigate, isActive }"
        >
          <button
            class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            :class="isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'"
            @click="navigate"
          >
            <component :is="link.icon" :size="13" />
            {{ link.label }}
          </button>
        </RouterLink>
      </nav>
    </div>

    <!-- Right: bell + user + hamburger -->
    <div class="flex items-center gap-1.5">

      <!-- Bell -->
      <div class="relative" data-header-popup>
        <button
          class="relative flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
          @click="toggleBell"
        >
          <Bell :size="15" />
          <span
            v-if="notifs.unread > 0"
            class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-white leading-none"
          >
            {{ notifs.unread > 9 ? '9+' : notifs.unread }}
          </span>
        </button>

        <!-- Bell dropdown -->
        <div
          v-if="bellOpen"
          class="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border/60 bg-card shadow-xl z-50 overflow-hidden"
          data-header-popup
          @click.stop
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span class="text-xs font-semibold">Notifications</span>
            <button
              v-if="notifs.unread > 0"
              class="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
              @click="notifs.markAllRead()"
            >
              <CheckCheck :size="11" /> Mark all read
            </button>
          </div>
          <ScrollArea class="max-h-72">
            <div v-if="!notifs.items.length" class="flex flex-col items-center gap-2 py-10">
              <Bell :size="20" class="text-muted-foreground/30" />
              <p class="text-xs text-muted-foreground/50">No notifications yet</p>
            </div>
            <button
              v-for="n in notifs.items"
              :key="n.id"
              class="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 border-b border-border/30 last:border-0"
              :class="{ 'bg-primary/4': !n.isRead }"
              @click="notifs.markRead(n.id)"
            >
              <div class="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                :class="n.isRead ? 'bg-secondary text-muted-foreground' : 'bg-primary/15 text-primary'">
                <AlertCircle :size="13" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-semibold truncate" :class="n.isRead ? 'text-foreground/70' : 'text-foreground'">{{ n.title }}</p>
                  <span class="text-[10px] text-muted-foreground/60 shrink-0">{{ formatTime(n.createdAt) }}</span>
                </div>
                <p class="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{{ n.body }}</p>
              </div>
              <span v-if="!n.isRead" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
            </button>
          </ScrollArea>
        </div>
      </div>

      <!-- Desktop: user + logout -->
      <div class="hidden md:flex items-center gap-2">
        <Separator orientation="vertical" class="h-5 opacity-50" />
        <div class="flex items-center gap-2 pl-1">
          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold select-none">
            {{ auth.user?.username?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <span class="text-xs text-muted-foreground font-medium">{{ auth.user?.username }}</span>
        </div>
        <button
          class="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-accent/60 transition-all"
          @click="logout"
        >
          <LogOut :size="14" />
        </button>
      </div>

      <!-- Mobile: avatar + hamburger -->
      <div class="flex md:hidden items-center gap-1">
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold select-none">
          {{ auth.user?.username?.[0]?.toUpperCase() ?? '?' }}
        </div>
        <div data-header-popup>
          <button
            class="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
            @click="toggleMenu"
          >
            <component :is="menuOpen ? X : Menu" :size="18" />
          </button>

          <!-- Mobile menu dropdown -->
          <div
            v-if="menuOpen"
            class="absolute right-0 top-14 left-0 mx-3 rounded-xl border border-border/60 bg-card shadow-xl z-50 overflow-hidden"
            @click.stop
          >
            <div class="p-1.5 space-y-0.5">
              <button
                v-for="link in nav"
                :key="link.to"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent/60"
                @click="navigate(link.to)"
              >
                <component :is="link.icon" :size="16" class="text-muted-foreground" />
                {{ link.label }}
              </button>
            </div>
            <div class="border-t border-border/60 p-1.5">
              <button
                class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                @click="logout"
              >
                <LogOut :size="16" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </header>
</template>
