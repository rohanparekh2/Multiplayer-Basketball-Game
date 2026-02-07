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
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gameStore.ts:33',message:'setGameState called',data:{prevState,newState:state?.state,room_id:state?.room_id},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      
      if (state && state.state !== prevState) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gameStore.ts:40',message:'State change detected',data:{from:prevState,to:state.state},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        }
        // #endregion
        
        return {
          gameState: state,
          lastStateChange: Date.now(),
        }
      }
      
      // Allow updates even if state hasn't changed (e.g., score updates during animating)
      // Only update if the state object reference changed or if there are meaningful differences
      if (state && (state !== store.gameState || 
          state.player_one?.score !== store.gameState?.player_one?.score ||
          state.player_two?.score !== store.gameState?.player_two?.score ||
          state.shot_result !== store.gameState?.shot_result)) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gameStore.ts:55',message:'State update (data change)',data:{state:state?.state,playerOneScore:state?.player_one?.score,playerTwoScore:state?.player_two?.score,shotResult:state?.shot_result},timestamp:Date.now(),runId:'run1',hypothesisId:'GLITCH'})}).catch(()=>{});
        }
        // #endregion
        
        return { gameState: state }
      }
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gameStore.ts:65',message:'State update (no change)',data:{state:state?.state},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      
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

