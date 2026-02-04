'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Court } from '../Court/Court'
import { Basketball } from '../Basketball/Basketball'
import { CameraControls } from './CameraControls'
import { useGameState } from '@/hooks/useGameState'
import { BallAnimation } from '../Basketball/BallAnimation'
import { gameApi } from '@/services/api'

export function GameCanvas() {
  const { gameState, refreshGameState } = useGameState()
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationMade, setAnimationMade] = useState(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gameStateRef = useRef(gameState)
  
  // Keep ref in sync
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const handleAnimationComplete = useCallback(async () => {
    console.log('🎬 Animation complete callback called')
    
    // Prevent multiple calls
    if (animationTimeoutRef.current === null && !showAnimation) {
      console.warn('⚠️ Animation already completed, ignoring duplicate call')
      return
    }
    
    // Clear timeout if it exists
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }
    
    // Stop animation immediately
    setShowAnimation(false)
    
    const roomId = gameState?.room_id
    if (!roomId) {
      console.error('❌ No room_id available for finishAnimation')
      // Try to get room_id from ref as fallback
      const refRoomId = gameStateRef.current?.room_id
      if (refRoomId) {
        console.log('🔄 Using room_id from ref:', refRoomId)
        await handleAnimationCompleteWithRoomId(refRoomId)
      }
      return
    }
    
    await handleAnimationCompleteWithRoomId(roomId)
  }, [gameState?.room_id, showAnimation, refreshGameState])

  const handleAnimationCompleteWithRoomId = useCallback(async (roomId: string) => {
    // Validate current state before proceeding
    const currentState = gameStateRef.current?.state
    if (currentState !== 'animating') {
      console.warn('⚠️ State is not animating, skipping finishAnimation:', currentState)
      return
    }

    try {
      console.log('🎬 Notifying backend that animation is complete...', { roomId })
      
      // Call finishAnimation API
      const response = await gameApi.finishAnimation(roomId)
      console.log('✅ Animation finished response:', response)
      
      // Validate response
      if (response?.game_state) {
        const newState = response.game_state.state
        console.log('✅ State transition:', { from: 'animating', to: newState })
        
        // Force immediate state refresh
        const refreshSuccess = await refreshGameState(roomId)
        if (!refreshSuccess) {
          console.warn('⚠️ State refresh failed, but API call succeeded')
        }
      } else {
        console.warn('⚠️ Response missing game_state, refreshing...')
        await refreshGameState(roomId)
      }
      
      // Double-check after 500ms
      setTimeout(async () => {
        const checkState = gameStateRef.current?.state
        if (checkState === 'animating') {
          console.warn('⚠️ Still animating after finishAnimation, forcing refresh again')
          await refreshGameState(roomId, 2) // Retry with 2 attempts
        }
      }, 500)
    } catch (error: any) {
      console.error('❌ Failed to notify animation complete:', error)
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      
      // Fallback: try to refresh state anyway
      console.log('🔄 Attempting to refresh game state as fallback...')
      try {
        const refreshSuccess = await refreshGameState(roomId, 2)
        if (!refreshSuccess) {
          console.error('❌ State refresh also failed after animation completion error')
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh state:', refreshError)
      }
    }
  }, [refreshGameState])

  useEffect(() => {
    console.log('🎬 GameCanvas state check:', {
      state: gameState?.state,
      shot_result: gameState?.shot_result,
      room_id: gameState?.room_id,
      power: gameState?.power,
      player_one_score: gameState?.player_one?.score,
      player_two_score: gameState?.player_two?.score,
      showAnimation,
    })
    
    // Check for animating state - the state should be 'animating' after power is selected
    if (gameState?.state === 'animating') {
      console.log('✅ State is animating!')
      
      // shot_result should be set by backend when power is selected
      // If shot_result is null, use false as default (missed shot)
      const shotResult = gameState.shot_result !== null && gameState.shot_result !== undefined 
        ? gameState.shot_result 
        : false
      
      console.log('✅ Starting animation with shot_result:', shotResult)
      console.log('✅ Scores:', {
        player_one: gameState.player_one?.score,
        player_two: gameState.player_two?.score,
      })
      
      // Always start animation when state is animating
      console.log('🎬 Animation trigger check:', {
        showAnimation,
        state: gameState.state,
        shotResult,
        room_id: gameState.room_id,
      })
      
      if (!showAnimation) {
        console.log('🎬 Setting showAnimation to true - animation should start now')
        setShowAnimation(true)
      }
      setAnimationMade(shotResult)
      
      // Also ensure animation component will render by logging
      console.log('🎬 Animation props:', {
        startPosition: [0, 2, 0],
        endPosition: shotResult ? [0, 3, -9.5] : [2, 1, -9],
        made: shotResult,
      })
      
      // Fallback: Auto-advance after 5.5 seconds if animation doesn't complete
      // This ensures we never get stuck even if onComplete never fires
      // Increased to 5.5 seconds to allow the full animation to play (3s animation + 1.5s delay + buffer)
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animationTimeoutRef.current = setTimeout(async () => {
        const currentState = gameStateRef.current?.state
        const currentRoomId = gameStateRef.current?.room_id
        console.warn('⚠️ Animation timeout - forcing completion after 5.5 seconds')
        console.warn('⚠️ Current state:', currentState, 'showAnimation:', showAnimation, 'roomId:', currentRoomId)
        
        if (currentState === 'animating' && currentRoomId) {
          console.log('🎬 Timeout: Calling handleAnimationComplete')
          try {
            await handleAnimationComplete()
          } catch (err) {
            console.error('❌ Error in timeout handler, trying direct API call:', err)
            // Last resort: call finishAnimation directly
            try {
              const response = await gameApi.finishAnimation(currentRoomId)
              console.log('✅ Direct finishAnimation call succeeded:', response)
              await refreshGameState(currentRoomId)
            } catch (apiErr) {
              console.error('❌ Direct finishAnimation also failed:', apiErr)
            }
          }
        }
      }, 5500) // 5.5 seconds - enough for 3s animation + 1.5s delay + buffer
    } else {
      if (showAnimation && gameState?.state !== 'animating') {
        console.log('🛑 Stopping animation, state changed to:', gameState?.state)
        setShowAnimation(false)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [gameState?.state, gameState?.shot_result, gameState?.room_id, gameState?.power, gameState?.player_one?.score, gameState?.player_two?.score, handleAnimationComplete, showAnimation])

  return (
    <Canvas
      camera={{ position: [0, 15, 20], fov: 50 }}
      gl={{ antialias: true }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.4} />
      <pointLight position={[0, 12, 0]} intensity={0.3} />
      <fog attach="fog" args={['#1a1a1a', 30, 50]} />
      
      <Court />
      
      {/* Always render BallAnimation when state is animating - don't rely on showAnimation state */}
      {gameState?.state === 'animating' ? (
        <BallAnimation
          key={`animation-${gameState?.shot_result}-${gameState?.power}`}
          startPosition={[0, 2, 0]}
          endPosition={animationMade ? [0, 3, -9.5] : [2, 1, -9]}
          made={animationMade}
          onComplete={() => {
            console.log('🎬 BallAnimation onComplete called from GameCanvas')
            handleAnimationComplete().catch((err) => {
              console.error('❌ Error in handleAnimationComplete:', err)
            })
          }}
        />
      ) : (
        <Basketball position={[0, 2, 0]} visible={gameState?.state === 'waiting_for_power' || gameState?.state === 'waiting_for_shot'} />
      )}
      
      <CameraControls />
    </Canvas>
  )
}

