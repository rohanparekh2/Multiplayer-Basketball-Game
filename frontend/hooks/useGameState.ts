import { useEffect, useCallback, useRef } from 'react'
import { gameApi } from '@/services/api'
import { WebSocketClient } from '@/services/websocket'
import { GameStateResponse } from '@/types/game'
import { useGameStore } from '@/store/gameStore'

// Debug log callback - will be set by components
let debugLogCallback: ((log: { type: 'websocket' | 'state' | 'poll'; message: string; data?: any }) => void) | null = null

export function setDebugLogCallback(callback: typeof debugLogCallback) {
  debugLogCallback = callback
}

// Shared polling interval ref (one per app instance) - using a module-level variable
let pollingIntervalRef: NodeJS.Timeout | null = null

export function useGameState() {
  // Use Zustand store for shared state
  const gameState = useGameStore((state) => state.gameState)
  const wsClient = useGameStore((state) => state.wsClient)
  const loading = useGameStore((state) => state.loading)
  const error = useGameStore((state) => state.error)
  const actionLoading = useGameStore((state) => state.actionLoading)
  const isPolling = useGameStore((state) => state.isPolling)
  const wsConnected = useGameStore((state) => state.wsConnected)
  const lastStateChange = useGameStore((state) => state.lastStateChange)
  const setGameState = useGameStore((state) => state.setGameState)
  const setWsClient = useGameStore((state) => state.setWsClient)
  const setLoading = useGameStore((state) => state.setLoading)
  const setError = useGameStore((state) => state.setError)
  const setActionLoading = useGameStore((state) => state.setActionLoading)
  const setIsPolling = useGameStore((state) => state.setIsPolling)
  const setWsConnected = useGameStore((state) => state.setWsConnected)
  const setLastStateChange = useGameStore((state) => state.setLastStateChange)
  
  const gameStateRef = useRef<GameStateResponse | null>(null)

  // Keep ref in sync with state and track state changes
  useEffect(() => {
    const prevState = gameStateRef.current?.state
    gameStateRef.current = gameState
    if (gameState && gameState.state !== prevState) {
      setLastStateChange(Date.now())
      debugLogCallback?.({
        type: 'state',
        message: `State changed: ${prevState || 'null'} → ${gameState.state}`,
        data: { from: prevState, to: gameState.state, gameState },
      })
    }
  }, [gameState, setLastStateChange])

  const refreshGameState = useCallback(async (roomId?: string, retries = 3): Promise<boolean> => {
    const room_id = roomId || gameStateRef.current?.room_id
    if (!room_id) {
      console.warn('⚠️ refreshGameState: No room_id available')
      return false
    }
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const state = await gameApi.getGameState(room_id)
        if (state) {
          setGameState(state)
          gameStateRef.current = state
          setError(null)
          return true
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to refresh game state'
        if (attempt === retries - 1) {
          console.error(`❌ refreshGameState failed after ${retries} attempts:`, errorMsg)
          setError(errorMsg)
          return false
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
      }
    }
    return false
  }, [])

  const createGame = useCallback(async (playerOneName?: string, playerTwoName?: string) => {
    const startTime = Date.now()
    const minLoadingTime = 2000 // 2 seconds minimum
    
    try {
      setLoading(true)
      setError(null)
      console.log('🎮 Creating game...', { playerOneName, playerTwoName })
      console.log('🎮 API base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      
      const state = await gameApi.createGame(playerOneName, playerTwoName)
      console.log('✅ Game created, full response:', JSON.stringify(state, null, 2))
      
      // Verify state has room_id
      if (!state) {
        throw new Error('Game creation returned null/undefined')
      }
      
      if (!state.room_id) {
        console.error('❌ State missing room_id:', state)
        throw new Error('Game created but missing room_id in response')
      }
      
      // Set state immediately and verify it's set
      setGameState(state)
      gameStateRef.current = state
      console.log('✅ Game state set with room_id:', state.room_id)
      console.log('✅ Verifying gameStateRef after set:', {
        hasRef: !!gameStateRef.current,
        room_id: gameStateRef.current?.room_id,
        state: gameStateRef.current?.state,
      })

      // Connect WebSocket (don't block on this)
      try {
        const client = new WebSocketClient(state.room_id)
        await client.connect()
        setWsConnected(true)
        client.onMessage((data) => {
          console.log('📨 WebSocket message received:', data)
          debugLogCallback?.({
            type: 'websocket',
            message: 'WebSocket message received',
            data,
          })
          // Validate data before setting state
          if (data && data.room_id) {
            setGameState(data)
            gameStateRef.current = data
            setError(null)
            setLastStateChange(Date.now())
          } else {
            console.warn('⚠️ Invalid WebSocket message, ignoring:', data)
            debugLogCallback?.({
              type: 'error',
              message: 'Invalid WebSocket message received',
              data,
            })
          }
        })
        setWsClient(client)
        console.log('✅ WebSocket connected')
      } catch (wsError: any) {
        console.warn('⚠️ WebSocket connection failed, continuing without real-time updates:', wsError)
        setWsConnected(false)
        // Don't fail the game creation if WebSocket fails
      }
      
      // Ensure minimum loading time
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsed)
      if (remainingTime > 0) {
        console.log(`⏳ Waiting ${remainingTime}ms to complete minimum loading time...`)
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create game'
      console.error('❌ Game creation error:', err)
      setError(errorMsg)
      
      // Still wait minimum time even on error
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsed)
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }
    } finally {
      setLoading(false)
      console.log('✅ Loading complete, game ready')
    }
  }, [])

  // Expose actions that update game state
  const selectShot = useCallback(async (shotType: string, roomId?: string) => {
    // Use provided roomId or try to get from ref
    let room_id = roomId || gameStateRef.current?.room_id
    
    // Wait a bit if game state is still loading and no roomId provided
    if (!room_id) {
      let attempts = 0
      while (!gameStateRef.current?.room_id && attempts < 10) {
        console.warn(`⚠️ Game state not ready, waiting... (attempt ${attempts + 1})`)
        await new Promise(resolve => setTimeout(resolve, 200))
        attempts++
        room_id = gameStateRef.current?.room_id
      }
    }
    
    if (!room_id) {
      console.error('❌ No room_id available for shot selection')
      console.error('❌ Current gameStateRef:', gameStateRef.current)
      console.error('❌ Attempted to get room_id but game not initialized')
      throw new Error('Game not initialized yet. Please wait for the game to load completely.')
    }
    console.log('🎯 selectShot called:', { room_id, shotType, currentState: gameStateRef.current?.state })
    try {
      setActionLoading('shot')
      setError(null)
      console.log('📡 Calling API: selectShot', { room_id, shotType })
      const response = await gameApi.selectShot(room_id, shotType as any)
      console.log('✅ Shot selection API response:', response)
      // Update state directly from API response (WebSocket will also send update, but this ensures immediate update)
      if (response?.game_state) {
        console.log('✅ Updating game state from response:', {
          state: response.game_state.state,
          offensive: response.game_state.current_offensive_player,
        })
        setGameState(response.game_state)
        gameStateRef.current = response.game_state
        return true
      } else {
        // Fallback to refresh if response structure is different
        console.warn('⚠️ Response missing game_state, refreshing...')
        await refreshGameState(room_id)
        return true
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to select shot'
      console.error('❌ Shot selection error:', {
        error: err,
        message: errorMsg,
        response: err.response?.data,
        stack: err.stack,
      })
      setError(errorMsg)
      alert(`Error: ${errorMsg}`)
      return false
    } finally {
      setActionLoading(null)
    }
  }, [refreshGameState])

  const selectDefense = useCallback(async (defenseType: string, roomId?: string) => {
    // Use provided roomId or try to get from ref
    let room_id = roomId || gameStateRef.current?.room_id
    
    // Wait a bit if game state is still loading and no roomId provided
    if (!room_id) {
      let attempts = 0
      while (!gameStateRef.current?.room_id && attempts < 10) {
        console.warn(`⚠️ Game state not ready, waiting... (attempt ${attempts + 1})`)
        await new Promise(resolve => setTimeout(resolve, 200))
        attempts++
        room_id = gameStateRef.current?.room_id
      }
    }
    
    if (!room_id) {
      console.error('❌ No room_id available for defense selection')
      console.error('❌ Current gameStateRef:', gameStateRef.current)
      console.error('❌ Attempted to get room_id but game not initialized')
      throw new Error('Game not initialized yet. Please wait for the game to load completely.')
    }
    console.log('🛡️ selectDefense called:', { room_id, defenseType, currentState: gameStateRef.current?.state })
    try {
      setActionLoading('defense')
      setError(null)
      console.log('📡 Calling API: selectDefense', { room_id, defenseType })
      const response = await gameApi.selectDefense(room_id, defenseType as any)
      console.log('✅ Defense selection API response:', response)
      if (response?.game_state) {
        console.log('✅ Updating game state from response:', {
          state: response.game_state.state,
          defensive: response.game_state.current_defensive_player,
        })
        setGameState(response.game_state)
        gameStateRef.current = response.game_state
        return true
      } else {
        console.warn('⚠️ Response missing game_state, refreshing...')
        await refreshGameState(room_id)
        return true
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to select defense'
      console.error('❌ Defense selection error:', {
        error: err,
        message: errorMsg,
        response: err.response?.data,
        stack: err.stack,
      })
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setActionLoading(null)
    }
  }, [refreshGameState])

  const selectPower = useCallback(async (power: number, roomId?: string) => {
    // Use provided roomId or try to get from ref
    let room_id = roomId || gameStateRef.current?.room_id
    
    // Wait a bit if game state is still loading and no roomId provided
    if (!room_id) {
      let attempts = 0
      while (!gameStateRef.current?.room_id && attempts < 10) {
        console.warn(`⚠️ Game state not ready, waiting... (attempt ${attempts + 1})`)
        await new Promise(resolve => setTimeout(resolve, 200))
        attempts++
        room_id = gameStateRef.current?.room_id
      }
    }
    
    if (!room_id) {
      console.error('❌ No room_id available for power selection')
      console.error('❌ Current gameStateRef:', gameStateRef.current)
      console.error('❌ Attempted to get room_id but game not initialized')
      throw new Error('Game not initialized yet. Please wait for the game to load completely.')
    }
    console.log('⚡ selectPower called:', { room_id, power, currentState: gameStateRef.current?.state })
    try {
      setActionLoading('power')
      setError(null)
      console.log('📡 Calling API: selectPower', { room_id, power })
      const response = await gameApi.selectPower(room_id, power)
      console.log('✅ Power selection API response:', response)
      if (response?.game_state) {
        console.log('✅ Updating game state from response:', {
          state: response.game_state.state,
          shot_result: response.game_state.shot_result,
          player_one_score: response.game_state.player_one?.score,
          player_two_score: response.game_state.player_two?.score,
          power: response.game_state.power,
        })
        setGameState(response.game_state)
        gameStateRef.current = response.game_state
        
        // If state is animating, the animation should trigger automatically via useEffect
        if (response.game_state.state === 'animating') {
          console.log('🎬 State set to animating, animation should start now')
        }
        
        return true
      } else {
        console.warn('⚠️ Response missing game_state, refreshing...')
        await refreshGameState(room_id)
        return true
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to select power'
      console.error('❌ Power selection error:', {
        error: err,
        message: errorMsg,
        response: err.response?.data,
        stack: err.stack,
      })
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setActionLoading(null)
    }
  }, [refreshGameState])

  const nextTurn = useCallback(async () => {
    const room_id = gameStateRef.current?.room_id
    if (!room_id) {
      console.error('❌ No room_id available for next turn')
      return
    }
    console.log('➡️ nextTurn called:', { room_id })
    try {
      setActionLoading('nextTurn')
      setError(null)
      console.log('📡 Calling API: nextTurn', { room_id })
      const response = await gameApi.nextTurn(room_id)
      console.log('✅ Next turn API response:', response)
      if (response?.game_state) {
        console.log('✅ Updating game state from response:', response.game_state)
        setGameState(response.game_state)
        gameStateRef.current = response.game_state
      } else {
        console.warn('⚠️ Response missing game_state, refreshing...')
        await refreshGameState(room_id)
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to move to next turn'
      console.error('❌ Next turn error:', {
        error: err,
        message: errorMsg,
        response: err.response?.data,
      })
      setError(errorMsg)
    } finally {
      setActionLoading(null)
    }
  }, [refreshGameState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsClient) {
        wsClient.disconnect()
        setWsConnected(false)
      }
      if (pollingIntervalRef) {
        clearInterval(pollingIntervalRef)
        pollingIntervalRef = null
        setIsPolling(false)
      }
    }
  }, [wsClient])

  // Start/stop polling based on game state
  useEffect(() => {
    // Clear existing polling
    if (pollingIntervalRef) {
      clearInterval(pollingIntervalRef)
      pollingIntervalRef = null
      setIsPolling(false)
    }

    // Start polling if state is animating
    if (gameState?.state === 'animating' && gameState?.room_id) {
      const roomId = gameState.room_id
      let pollCount = 0
      const maxPolls = 20 // 10 seconds max (20 * 500ms) - enough time for animation (3.5s) + buffer
      const animationStartTime = Date.now()
      const minAnimationTime = 4000 // Minimum 4 seconds for animation to play
      
      setIsPolling(true)
      pollingIntervalRef = setInterval(async () => {
        pollCount++
        const elapsed = Date.now() - animationStartTime
        
        // Don't force finishAnimation until minimum animation time has passed
        if (pollCount > maxPolls && elapsed >= minAnimationTime) {
          console.warn('⚠️ Polling timeout reached after minimum animation time, forcing finishAnimation')
          debugLogCallback?.({
            type: 'error',
            message: 'Polling timeout - forcing finishAnimation',
            data: { pollCount, maxPolls, roomId, elapsed },
          })
          
          // Force finishAnimation when polling times out
          try {
            const response = await gameApi.finishAnimation(roomId)
            console.log('✅ Forced finishAnimation response:', response)
            debugLogCallback?.({
              type: 'api',
              message: 'Forced finishAnimation after polling timeout',
              data: response,
            })
            // Refresh state after forced finish
            await refreshGameState(roomId, 2)
          } catch (err: any) {
            console.error('❌ Failed to force finishAnimation:', err)
            debugLogCallback?.({
              type: 'error',
              message: `Failed to force finishAnimation: ${err.message}`,
              data: err,
            })
          }
          
          if (pollingIntervalRef) {
            clearInterval(pollingIntervalRef)
            pollingIntervalRef = null
            setIsPolling(false)
          }
          return
        }
        
        // If minimum animation time hasn't passed, just wait
        if (elapsed < minAnimationTime) {
          console.log(`⏳ Waiting for minimum animation time: ${elapsed}ms / ${minAnimationTime}ms`)
          return
        }

        // Check if state has changed (no longer animating)
        const currentState = gameStateRef.current?.state
        if (currentState !== 'animating') {
          console.log('✅ State changed during polling, stopping:', currentState)
          if (pollingIntervalRef) {
            clearInterval(pollingIntervalRef)
            pollingIntervalRef = null
            setIsPolling(false)
          }
          return
        }

        // Poll the backend
        console.log(`🔄 Polling game state (attempt ${pollCount}/${maxPolls})`)
        debugLogCallback?.({
          type: 'poll',
          message: `Polling game state (attempt ${pollCount}/${maxPolls})`,
          data: { pollCount, maxPolls, roomId },
        })
        const success = await refreshGameState(roomId, 1)
        if (success) {
          const newState = gameStateRef.current?.state
          if (newState !== 'animating') {
            console.log('✅ Polling detected state change:', newState)
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
              setIsPolling(false)
            }
          }
        }
      }, 500) // Poll every 500ms
    }

    return () => {
      if (pollingIntervalRef) {
        clearInterval(pollingIntervalRef)
        pollingIntervalRef = null
        setIsPolling(false)
      }
    }
  }, [gameState?.state, gameState?.room_id, refreshGameState])

  return {
    gameState,
    loading,
    error,
    actionLoading,
    isPolling,
    wsConnected,
    lastStateChange,
    createGame,
    refreshGameState,
    selectShot,
    selectDefense,
    selectPower,
    nextTurn,
  }
}

