import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { socket } from '@/services/socket'

export interface Room {
  id: string
  name: string
  hostId: string
  isPublic: boolean
  createdAt: string
  _count?: { members: number }
}

export interface ChatMessage {
  from: string
  message: string
  timestamp: string
  isSystem?: boolean
  isOwn?: boolean
}

export const useRoomsStore = defineStore('rooms', () => {
  const rooms = ref<Room[]>([])
  const activeRoom = ref<Room | null>(null)
  const messages = ref<ChatMessage[]>([])

  async function fetchRooms() {
    const { data } = await api.get('/rooms')
    rooms.value = data
  }

  async function createRoom(name: string, isPublic = true) {
    const { data } = await api.post('/rooms', { name, isPublic })
    rooms.value.unshift(data)
    return data as Room
  }

  async function joinRoom(room: Room) {
    await api.post(`/rooms/${room.id}/join`)
    socket.emit('joinRoom', room.id)
    activeRoom.value = room
    messages.value = []
  }

  async function leaveRoom() {
    if (!activeRoom.value) return
    socket.emit('leaveRoom', activeRoom.value.id)
    await api.post(`/rooms/${activeRoom.value.id}/leave`)
    activeRoom.value = null
    messages.value = []
  }

  function sendMessage(text: string) {
    if (!activeRoom.value || !text.trim()) return
    socket.emit('room:message', { roomId: activeRoom.value.id, message: text.trim() })
  }

  async function deleteRoom(id: string) {
    await api.delete(`/rooms/${id}`)
    rooms.value = rooms.value.filter((r) => r.id !== id)
    if (activeRoom.value?.id === id) {
      activeRoom.value = null
      messages.value = []
    }
  }

  function initSocket() {
    socket.on('room:message', (msg: { from: string; message: string; timestamp: string }) => {
      messages.value.push({ ...msg, isOwn: msg.from === socket.id })
    })
    socket.on('room:userJoined', () => {
      messages.value.push({ from: '', message: 'A user joined the room', timestamp: new Date().toISOString(), isSystem: true })
    })
    socket.on('room:userLeft', () => {
      messages.value.push({ from: '', message: 'A user left the room', timestamp: new Date().toISOString(), isSystem: true })
    })
  }

  function destroySocket() {
    socket.off('room:message')
    socket.off('room:userJoined')
    socket.off('room:userLeft')
    if (activeRoom.value) socket.emit('leaveRoom', activeRoom.value.id)
    activeRoom.value = null
    messages.value = []
  }

  return {
    rooms, activeRoom, messages,
    fetchRooms, createRoom, joinRoom, leaveRoom, sendMessage, deleteRoom,
    initSocket, destroySocket,
  }
})
