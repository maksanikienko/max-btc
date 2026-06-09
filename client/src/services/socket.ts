import { io } from 'socket.io-client'

export const socket = io('/trading', {
  autoConnect: false,
  transports: ['websocket'],
})
