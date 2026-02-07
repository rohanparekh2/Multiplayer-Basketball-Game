import { GameStateResponse } from '@/types/game'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private roomId: string
  private onMessageCallback: ((data: GameStateResponse) => void) | null = null
  private isReconnecting: boolean = false
  private reconnectAttempts: number = 0

  constructor(roomId: string) {
    this.roomId = roomId
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
      this.ws = new WebSocket(`${wsUrl}/ws/game/${this.roomId}`)

      let resolved = false
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          reject(new Error('WebSocket connection timeout'))
        }
      }, 10000)

      this.ws.onopen = () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          if (this.isReconnecting) {
            console.log('WebSocket reconnected')
          } else {
            console.log('WebSocket connected')
          }
          resolve()
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'game_state' && this.onMessageCallback) {
            this.onMessageCallback(data.data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          reject(error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason)
        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && this.onMessageCallback) {
          this.isReconnecting = true
          this.reconnectAttempts++
          console.log(`Attempting to reconnect... (attempt ${this.reconnectAttempts})`)
          const delay = Math.min(3000 * this.reconnectAttempts, 10000) // Exponential backoff, max 10s
          setTimeout(() => {
            this.connect()
              .then(() => {
                this.isReconnecting = false
                this.reconnectAttempts = 0
              })
              .catch((error) => {
                console.error('Reconnection failed:', error)
                // Will retry on next close event
              })
          }, delay)
        } else {
          this.isReconnecting = false
          this.reconnectAttempts = 0
        }
      }
    })
  }

  onMessage(callback: (data: GameStateResponse) => void) {
    this.onMessageCallback = callback
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

