<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import {
  Users, Plus, LogOut, Send, Trash2, Hash, Globe, Lock, ChevronLeft,
} from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Card from '@/components/ui/Card.vue'
import ScrollArea from '@/components/ui/ScrollArea.vue'
import { useRoomsStore } from '@/stores/rooms'
import { useAuthStore } from '@/stores/auth'

const rooms = useRoomsStore()
const auth = useAuthStore()

const newRoomName = ref('')
const creating = ref(false)
const messageText = ref('')
const chatEl = ref<HTMLElement>()

onMounted(async () => {
  rooms.initSocket()
  await rooms.fetchRooms()
})

onUnmounted(() => rooms.destroySocket())

async function createRoom() {
  if (!newRoomName.value.trim()) return
  creating.value = true
  try {
    const room = await rooms.createRoom(newRoomName.value.trim())
    newRoomName.value = ''
    await rooms.joinRoom(room)
    scrollToBottom()
  } finally {
    creating.value = false
  }
}

async function sendMessage() {
  if (!messageText.value.trim()) return
  rooms.sendMessage(messageText.value)
  messageText.value = ''
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex h-dvh flex-col bg-background">
    <AppHeader />

    <div class="flex flex-1 overflow-hidden min-h-0">

      <!-- Room list panel -->
      <!-- Desktop: always visible | Mobile: hidden when room is active -->
      <aside
        class="flex-col border-r border-border/60 bg-card/10 overflow-hidden"
        :class="rooms.activeRoom
          ? 'hidden md:flex md:w-64'
          : 'flex w-full md:w-64'"
      >
        <div class="flex items-center gap-2 px-4 py-3 border-b border-border/60 shrink-0">
          <Users :size="13" class="text-primary" />
          <span class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Rooms</span>
        </div>

        <!-- Create room -->
        <div class="px-3 py-3 border-b border-border/60 space-y-2 shrink-0">
          <Input
            v-model="newRoomName"
            placeholder="Room name…"
            class="h-8 text-xs"
            @keydown.enter="createRoom"
          />
          <Button size="sm" class="w-full h-8 text-xs" :loading="creating" @click="createRoom">
            <Plus :size="12" /> Create Room
          </Button>
        </div>

        <!-- Room list -->
        <ScrollArea class="flex-1">
          <div class="py-1">
            <button
              v-for="room in rooms.rooms"
              :key="room.id"
              class="group w-full flex items-center gap-2.5 px-3 py-3 text-left transition-all hover:bg-accent/50 border-l-2"
              :class="rooms.activeRoom?.id === room.id ? 'bg-primary/8 border-primary' : 'border-transparent'"
              @click="rooms.joinRoom(room)"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                :class="rooms.activeRoom?.id === room.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'"
              >
                <component :is="room.isPublic ? Globe : Lock" :size="14" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">{{ room.name }}</p>
                <p class="text-[11px] text-muted-foreground">{{ room._count?.members ?? 0 }} members</p>
              </div>
              <button
                v-if="room.hostId === auth.user?.id"
                class="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                @click.stop="rooms.deleteRoom(room.id)"
              >
                <Trash2 :size="12" />
              </button>
            </button>

            <div v-if="!rooms.rooms.length" class="flex flex-col items-center gap-2 py-12 px-4">
              <Hash :size="24" class="text-muted-foreground/30" />
              <p class="text-xs text-muted-foreground/50 text-center">No rooms yet. Create one above.</p>
            </div>
          </div>
        </ScrollArea>
      </aside>

      <!-- Chat area -->
      <!-- Desktop: always visible | Mobile: visible only when room active -->
      <div
        class="flex-col overflow-hidden"
        :class="rooms.activeRoom
          ? 'flex flex-1'
          : 'hidden md:flex md:flex-1'"
      >
        <template v-if="rooms.activeRoom">
          <!-- Chat header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/10 shrink-0">
            <div class="flex items-center gap-2.5">
              <!-- Back button on mobile -->
              <button
                class="flex md:hidden items-center justify-center w-8 h-8 rounded-lg hover:bg-accent/60 text-muted-foreground transition-all"
                @click="rooms.leaveRoom()"
              >
                <ChevronLeft :size="18" />
              </button>
              <div class="flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 border border-primary/25">
                <Hash :size="13" class="text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold">{{ rooms.activeRoom.name }}</p>
                <p class="text-[10px] text-muted-foreground">{{ rooms.activeRoom.isPublic ? 'Public room' : 'Private room' }}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="hidden md:flex text-muted-foreground hover:text-destructive text-xs gap-1.5"
              @click="rooms.leaveRoom()"
            >
              <LogOut :size="13" /> Leave
            </Button>
          </div>

          <!-- Messages -->
          <div ref="chatEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <div
              v-for="(msg, i) in rooms.messages"
              :key="i"
              class="flex"
              :class="msg.isSystem ? 'justify-center' : msg.isOwn ? 'justify-end' : 'justify-start'"
            >
              <p v-if="msg.isSystem" class="text-[10px] text-muted-foreground/50 italic px-3 py-1 bg-secondary/30 rounded-full">
                {{ msg.message }}
              </p>
              <template v-else>
                <div class="max-w-[75%] space-y-0.5">
                  <p v-if="!msg.isOwn" class="text-[10px] text-muted-foreground pl-1 mb-1">{{ msg.from.slice(0, 8) }}…</p>
                  <div
                    class="px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                    :class="msg.isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'"
                  >
                    {{ msg.message }}
                  </div>
                  <p class="text-[10px] text-muted-foreground/40" :class="msg.isOwn ? 'text-right pr-1' : 'pl-1'">
                    {{ formatTime(msg.timestamp) }}
                  </p>
                </div>
              </template>
            </div>

            <div v-if="!rooms.messages.length" class="flex flex-col items-center gap-3 py-16">
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary border border-border/60">
                <Send :size="18" class="text-muted-foreground/40" />
              </div>
              <p class="text-sm text-muted-foreground/50">No messages yet. Say something!</p>
            </div>
          </div>

          <!-- Message input -->
          <div class="px-4 py-3 border-t border-border/60 bg-card/10 shrink-0">
            <div class="flex items-center gap-2">
              <Input
                v-model="messageText"
                :placeholder="`Message #${rooms.activeRoom.name}…`"
                class="flex-1 h-10 text-sm"
                @keydown.enter="sendMessage"
              />
              <Button size="sm" class="h-10 px-3 shrink-0" @click="sendMessage">
                <Send :size="14" />
              </Button>
            </div>
          </div>
        </template>

        <!-- Empty state (desktop only) -->
        <div class="hidden md:flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border/60">
            <Users :size="28" class="text-muted-foreground/40" />
          </div>
          <div>
            <p class="text-sm font-semibold text-foreground/80">Select a room to start chatting</p>
            <p class="text-xs text-muted-foreground/50 mt-1">Or create a new room from the left panel</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
