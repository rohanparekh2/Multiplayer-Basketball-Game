import { GameStateResponse } from '@/types/game'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private roomId: string
  private onMessageCallback: ((data: GameStateResponse) => void) | null = null
  private isReconnecting: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private shouldReconnect: boolean = true

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
        // Don't log errors during reconnection attempts - they're expected
        if (!this.isReconnecting) {
          console.error('WebSocket error:', error)
        }
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          reject(error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason)
        
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
        
        // Reset if normal closure or manual disconnect
        if (event.code === 1000 || !this.shouldReconnect) {
          this.isReconnecting = false
          this.reconnectAttempts = 0
          return
        }
        
        // Check if we've exceeded max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn(`⚠️ WebSocket: Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection. Game will use polling for updates.`)
          this.isReconnecting = false
          this.reconnectAttempts = 0
          // Notify callback that connection is permanently lost (if callback supports it)
          // This allows the game to fall back to polling more aggressively
          return
        }
        
        // Attempt reconnection if callback exists
        if (this.onMessageCallback) {
          this.isReconnecting = true
          this.reconnectAttempts++
          const delay = Math.min(1000 + (this.reconnectAttempts * 1000), 5000) // 1s, 2s, 3s, 4s, 5s max
          console.log(`Attempting to reconnect... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}, delay: ${delay}ms)`)
          
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null
            this.connect()
              .then(() => {
                console.log('✅ WebSocket reconnected successfully')
                this.isReconnecting = false
                this.reconnectAttempts = 0
              })
              .catch((error) => {
                // Silently handle reconnection errors - don't spam console
                // The onclose handler will be called again if connection fails
                // and will retry up to max attempts
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                  // Only log if we haven't hit max attempts yet
                  console.warn(`⚠️ WebSocket reconnection attempt ${this.reconnectAttempts} failed, will retry...`)
                }
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
    this.shouldReconnect = false
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
    this.isReconnecting = false
    this.reconnectAttempts = 0
  }
  
  getReconnectStatus(): { isReconnecting: boolean; attempts: number; maxAttempts: number } {
    return {
      isReconnecting: this.isReconnecting,
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    }
  }
}

