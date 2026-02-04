import { create } from 'zustand'
import { GameStateResponse } from '@/types/game'
import { WebSocketClient } from '@/services/websocket'

interface GameStore {
  gameState: GameStateResponse | null
  wsClient: WebSocketClient | null
  loading: boolean
  error: string | null
  actionLoading: string | null
  isPolling: boolean
  wsConnected: boolean
  lastStateChange: number
  setGameState: (state: GameStateResponse | null) => void
  setWsClient: (client: WebSocketClient | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActionLoading: (loading: string | null) => void
  setIsPolling: (polling: boolean) => void
  setWsConnected: (connected: boolean) => void
  setLastStateChange: (time: number) => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  wsClient: null,
  loading: false,
  error: null,
  actionLoading: null,
  isPolling: false,
  wsConnected: false,
  lastStateChange: Date.now(),
  setGameState: (state) => {
    set((store) => {
      const prevState = store.gameState?.state
      if (state && state.state !== prevState) {
        return {
          gameState: state,
          lastStateChange: Date.now(),
        }
      }
      return { gameState: state }
    })
  },
  setWsClient: (client) => set({ wsClient: client }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActionLoading: (loading) => set({ actionLoading: loading }),
  setIsPolling: (polling) => set({ isPolling: polling }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setLastStateChange: (time) => set({ lastStateChange: time }),
}))

