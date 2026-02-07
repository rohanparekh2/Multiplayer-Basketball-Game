'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { gameApi } from '@/services/api'
import { SVGCourt } from '../Court/SVGCourt'
import { SVGBasketball } from '../Basketball/SVGBasketball'
import { SVGBallAnimation } from '../Basketball/SVGBallAnimation'
import { ZoneHeatOverlay } from '../Court/ZoneHeatOverlay'
import { ANCHORS } from '../Court/courtConstants'

export function GameCanvas() {
  const { gameState, refreshGameState } = useGameState()
  const [animationMade, setAnimationMade] = useState(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gameStateRef = useRef(gameState)
  // Store shot result locally when we receive it from POST response
  const shotResultRef = useRef<boolean | null>(null)
  
  // Keep ref in sync
  useEffect(() => {
    gameStateRef.current = gameState
    // Capture shot_result when state becomes 'animating' - prioritize from gameState
    if (gameState?.state === 'animating' && gameState.shot_result !== null && gameState.shot_result !== undefined) {
      shotResultRef.current = gameState.shot_result
      console.log('✅ Captured shot_result from gameState:', gameState.shot_result)
    }
  }, [gameState])

  const handleAnimationComplete = useCallback(async () => {
    console.log('🎬 GameCanvas animation complete callback called')
    
    // Clear timeout if it exists
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }
    
    // Check if timing meter is being used (if power was set via timing meter, it will have timing data)
    // For now, we'll call finishAnimation - if timing meter already called it, the backend will handle it gracefully
    // TODO: Add a flag to prevent duplicate calls if needed
    
    const roomId = gameState?.room_id
    if (!roomId) {
      console.error('❌ No room_id available for finishAnimation')
      const refRoomId = gameStateRef.current?.room_id
      if (refRoomId) {
        console.log('🔄 Using room_id from ref:', refRoomId)
        await handleAnimationCompleteWithRoomId(refRoomId)
      }
      return
    }
    
    await handleAnimationCompleteWithRoomId(roomId)
  }, [gameState?.room_id, refreshGameState])

  const handleAnimationCompleteWithRoomId = useCallback(async (roomId: string) => {
    const currentState = gameStateRef.current?.state
    if (currentState !== 'animating') {
      console.warn('⚠️ State is not animating, skipping finishAnimation:', currentState)
      return
    }

    try {
      console.log('🎬 Notifying backend that animation is complete...', { roomId })
      
      const response = await gameApi.finishAnimation(roomId)
      console.log('✅ Animation finished response:', response)
      
      if (response?.game_state) {
        const newState = response.game_state.state
        console.log('✅ State transition:', { from: 'animating', to: newState })
        
        const refreshSuccess = await refreshGameState(roomId)
        if (!refreshSuccess) {
          console.warn('⚠️ State refresh failed, but API call succeeded')
        }
      } else {
        console.warn('⚠️ Response missing game_state, refreshing...')
        await refreshGameState(roomId)
      }
      
      setTimeout(async () => {
        const checkState = gameStateRef.current?.state
        if (checkState === 'animating') {
          console.warn('⚠️ Still animating after finishAnimation, forcing refresh again')
          await refreshGameState(roomId, 2)
        }
      }, 500)
    } catch (error: any) {
      console.error('❌ Failed to notify animation complete:', error)
      
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

  const animationStateRef = useRef<string | null>(null)
  
  useEffect(() => {
    console.log('🎬 GameCanvas state check:', {
      state: gameState?.state,
      shot_result: gameState?.shot_result,
      room_id: gameState?.room_id,
    })
    
    // Only start animation if state changed to 'animating' (not if already animating)
    if (gameState?.state === 'animating' && animationStateRef.current !== 'animating') {
      // Prioritize shot_result from gameState, fallback to ref, then false
      // Backend sets shot_result before changing to ANIMATING, so it should be available
      const shotResult = gameState.shot_result !== null && gameState.shot_result !== undefined 
        ? gameState.shot_result 
        : (shotResultRef.current !== null ? shotResultRef.current : false)
      
      console.log('✅ Starting animation with shot_result:', shotResult, {
        fromGameState: gameState.shot_result,
        fromRef: shotResultRef.current
      })
      setAnimationMade(shotResult)
      animationStateRef.current = 'animating'
      
      // Fallback timeout (only if animation doesn't complete naturally)
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animationTimeoutRef.current = setTimeout(async () => {
        const currentState = gameStateRef.current?.state
        const currentRoomId = gameStateRef.current?.room_id
        console.warn('⚠️ Animation timeout - forcing completion after 5 seconds')
        
        // Only force completion if still in animating state
        if (currentState === 'animating' && currentRoomId) {
          try {
            await handleAnimationComplete()
          } catch (err) {
            console.error('❌ Error in timeout handler:', err)
            try {
              await gameApi.finishAnimation(currentRoomId)
              await refreshGameState(currentRoomId)
            } catch (apiErr) {
              console.error('❌ Direct finishAnimation also failed:', apiErr)
            }
          }
        }
      }, 5000) // Increased to 5 seconds to avoid conflicts with natural completion
    } else if (gameState?.state !== 'animating') {
      // Reset animation state when leaving animating state
      animationStateRef.current = null
      // Clear shot result ref when leaving animating state
      shotResultRef.current = null
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
    }
  }, [gameState?.state, gameState?.shot_result, gameState?.room_id, handleAnimationComplete, refreshGameState])

  // Calculate ball position for static display using ANCHORS
  const getBallPosition = () => {
    if (!gameState) return ANCHORS.startBall
    return ANCHORS.startBall
  }

  const ballPos = getBallPosition()
  const debug = process.env.NODE_ENV === 'development' && false // Set to true to enable debug overlay

  // #region agent log
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mainEl = document.querySelector('main[role="main"]');
      const svgEl = document.querySelector('svg');
      const containerEl = document.querySelector('.game-canvas-container');
      
      const mainRect = mainEl?.getBoundingClientRect();
      const svgRect = svgEl?.getBoundingClientRect();
      const containerRect = containerEl?.getBoundingClientRect();
      
      const mainStyle = mainEl ? window.getComputedStyle(mainEl as Element) : null;
      const containerStyle = containerEl ? window.getComputedStyle(containerEl as Element) : null;
      
      fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameCanvas.tsx:147',message:'Rendered dimensions check',data:{mainRect:{w:mainRect?.width,h:mainRect?.height,x:mainRect?.x,y:mainRect?.y},svgRect:{w:svgRect?.width,h:svgRect?.height,x:svgRect?.x,y:svgRect?.y},containerRect:{w:containerRect?.width,h:containerRect?.height,x:containerRect?.x,y:containerRect?.y},mainBg:mainStyle?.backgroundImage || 'none',containerBg:containerStyle?.backgroundColor || 'transparent',viewport:{w:window.innerWidth,h:window.innerHeight}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
  }, []);
  // #endregion

  // #region agent log
  if (typeof window !== 'undefined') {
    const containerEl = typeof document !== 'undefined' ? document.querySelector('.game-canvas-container') : null;
    const computedStyle = containerEl ? window.getComputedStyle(containerEl as Element) : null;
    fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameCanvas.tsx:149',message:'GameCanvas render',data:{hasBgTransparent:true,containerCount:3,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,bgColor:computedStyle?.backgroundColor || 'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* #region agent log */}
      {typeof window !== 'undefined' && (() => {
        fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameCanvas.tsx:177',message:'GameCanvas render',data:{viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,hasGameState:!!gameState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        return null;
      })()}
      {/* #endregion */}
      {/* Court image */}
      <div 
        className="relative w-full h-full"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <SVGCourt debug={debug} />
        
        {/* Zone Heat Overlay */}
        <ZoneHeatOverlay defenseState={gameState?.defense_state} />
        
        {/* Render ball or animation based on state */}
        {/* Note: When using TimingMeter, ShotResolutionAnimation is shown in TimingMeterWrapper instead */}
        {gameState?.state === 'animating' ? (
          // Only show GameCanvas animation if we're not using timing meter
          // Timing meter shows its own animation in the UI panel
          <SVGBallAnimation
            key={`animation-${gameState?.shot_history?.length || 0}-${gameState?.shot_type || 'none'}-${gameState?.power || 0}-${animationMade}`}
            made={animationMade}
            onComplete={() => {
              console.log('🎬 SVGBallAnimation onComplete called')
              handleAnimationComplete().catch((err) => {
                console.error('❌ Error in handleAnimationComplete:', err)
              })
            }}
            debug={debug}
          />
        ) : (
          (gameState?.state === 'waiting_for_power' || gameState?.state === 'waiting_for_shot') && (
            <SVGBasketball
              x={ballPos.x}
              y={ballPos.y}
              size={40}
              rotating={false}
            />
          )
        )}
      </div>
    </div>
  )
}
