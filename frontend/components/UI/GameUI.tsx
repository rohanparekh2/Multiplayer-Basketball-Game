'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { ShotSelection } from './ShotSelection'
import { DefenseSelection } from './DefenseSelection'
import { PowerMeter } from './PowerMeter'
import { Scoreboard } from './Scoreboard'
import { LeftControlPanel } from './LeftControlPanel'
import { Button } from './Button'
import { Card } from './Card'
import { LoadingSpinner } from './LoadingSpinner'
import { LoadingScreen } from './LoadingScreen'
import { ToastContainer, useToast } from './Toast'
import { DebugPanel } from './DebugPanel'
import { useDebug } from '@/contexts/DebugContext'
import { setDebugLogCallback } from '@/services/api'
import { setDebugLogCallback as setStateDebugCallback } from '@/hooks/useGameState'
import { gameApi } from '@/services/api'
import { GameState as GameStateEnum } from '@/types/game'
import { Trophy, CheckCircle2, XCircle, RefreshCw, SkipForward } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function GameUI({ mode = 'overlay' }: { mode?: 'left' | 'right' | 'overlay' }) {
  const { gameState, createGame, loading, error, actionLoading, nextTurn, isPolling, wsConnected } = useGameState()
  const { toasts, showToast, removeToast } = useToast()
  const { logs, addLog } = useDebug()
  const gameCreationAttempted = useRef(false)
  const [animatingStartTime, setAnimatingStartTime] = useState<number | null>(null)
  const [showSkipButton, setShowSkipButton] = useState(false)

  // Connect API interceptors and state logging to debug context
  useEffect(() => {
    setDebugLogCallback((log) => {
      addLog(log)
    })
    setStateDebugCallback((log) => {
      addLog(log)
    })
  }, [addLog])

  // Track when animating state starts
  useEffect(() => {
    if (gameState?.state === GameStateEnum.ANIMATING) {
      if (animatingStartTime === null) {
        setAnimatingStartTime(Date.now())
        addLog({ type: 'state', message: 'State changed to animating' })
      }
      // Show skip button after 1 second
      const elapsed = Date.now() - (animatingStartTime || Date.now())
      setShowSkipButton(elapsed > 1000)
    } else {
      setAnimatingStartTime(null)
      setShowSkipButton(false)
    }
  }, [gameState?.state, animatingStartTime, addLog])

  // Handle skip animation
  const handleSkipAnimation = async () => {
    if (!gameState?.room_id) return
    
    addLog({ type: 'api', message: 'Skip animation button clicked' })
    try {
      const response = await gameApi.finishAnimation(gameState.room_id)
      addLog({ type: 'api', message: 'Skip animation API call successful', data: response })
      // State will be updated via WebSocket or polling
      showToast('Animation skipped', 'success')
    } catch (err: any) {
      addLog({ type: 'error', message: `Skip animation failed: ${err.message}`, data: err })
      showToast('Failed to skip animation', 'error')
    }
  }

  useEffect(() => {
    console.log('🎮 GameUI useEffect check:', { 
      hasGameState: !!gameState, 
      loading, 
      shouldCreate: !gameState && !loading,
      gameCreationAttempted: gameCreationAttempted.current
    })
    
    if (!gameState && !loading && !gameCreationAttempted.current) {
      gameCreationAttempted.current = true
      console.log('🎮 No game state, creating new game...')
      createGame()
        .then((result) => {
          console.log('✅ Game creation completed:', result)
          gameCreationAttempted.current = false // Reset on success
        })
        .catch((err) => {
          console.error('❌ Failed to create game:', err)
          console.error('❌ Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            stack: err.stack,
          })
          gameCreationAttempted.current = false // Reset on error so we can retry
        })
    }
  }, [gameState, loading, createGame])

  // Verify game state is properly initialized
  useEffect(() => {
    if (gameState) {
      console.log('✅ Game state initialized:', {
        room_id: gameState.room_id,
        state: gameState.state,
        player_one: gameState.player_one?.name,
        player_two: gameState.player_two?.name,
      })
      if (!gameState.room_id) {
        console.error('❌ Game state missing room_id!')
      }
    }
  }, [gameState])

  // Show error if game creation fails
  if (error && !gameState) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
        <Card variant="strong" className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-display text-error-400 mb-4">Failed to Load Game</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={() => {
              window.location.reload()
            }}
          >
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    if (error) {
      showToast(error, 'error')
    }
  }, [error, showToast])

  // Debug: Log state changes
  useEffect(() => {
    if (gameState) {
      console.log('Game state updated:', {
        state: gameState.state,
        offensive: gameState.current_offensive_player,
        defensive: gameState.current_defensive_player,
        shot_type: gameState.shot_type,
        defense_type: gameState.defense_type,
      })
    }
  }, [gameState])

  const handleNextTurn = async () => {
    await nextTurn()
  }

  // Debug logging
  useEffect(() => {
    console.log('🎮 GameUI render:', { 
      loading, 
      hasGameState: !!gameState, 
      gameStateValue: gameState,
      gameStateRoomId: gameState?.room_id,
      gameStateState: gameState?.state,
      error 
    })
  }, [loading, gameState, error])

  // More specific check: gameState must exist AND have either a room_id OR a valid state
  // If gameState has a state property, it means the game was initialized
  const isValidGameState = gameState && (gameState.room_id || gameState.state)

  if (loading || !isValidGameState) {
    console.log('🎮 Showing loading screen because:', { 
      loading, 
      isValidGameState, 
      hasGameState: !!gameState, 
      roomId: gameState?.room_id,
      state: gameState?.state,
      fullGameState: gameState
    })
    // Show error overlay if there's an error and we're not loading
    if (error && !loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 pointer-events-auto">
          <Card variant="strong" className="text-center max-w-md mx-auto">
            <h2 className="text-2xl font-display text-error-400 mb-4">Failed to Load Game</h2>
            <p className="text-white/80 mb-6">{error}</p>
            <p className="text-white/60 text-sm mb-6">Make sure the backend server is running on port 8000</p>
            <Button
              variant="primary"
              onClick={() => {
                window.location.reload()
              }}
            >
              Retry
            </Button>
          </Card>
        </div>
      )
    }
    return <LoadingScreen />
  }

  // Right mode: Only scoreboard
  if (mode === 'right') {
    if (!gameState) return null
    return <Scoreboard gameState={gameState} />
  }

  // Left mode: Only controls (no BottomControlBar, no scoreboard)
  if (mode === 'left') {
    if (!gameState) return null
    
    return (
      <>
        {gameState.state === GameStateEnum.WAITING_FOR_SHOT && gameState.room_id && (
          <LeftControlPanel
            title={String(gameState.current_offensive_player ?? 'Player')}
            subtitle="Choose your shot"
          >
            <ShotSelection gameState={gameState} />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.WAITING_FOR_DEFENSE && gameState.room_id && (
          <LeftControlPanel
            title={String(gameState.current_defensive_player ?? 'Player')}
            subtitle="Choose your defense"
          >
            <DefenseSelection gameState={gameState} />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.WAITING_FOR_POWER && gameState.room_id && (
          <LeftControlPanel
            title={String(gameState.current_offensive_player ?? 'Player')}
            subtitle="Select power"
          >
            <PowerMeter gameState={gameState} />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.ANIMATING && (
          <LeftControlPanel title="Shooting..." subtitle="Watch the ball!">
            <div />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.SHOT_RESULT && gameState.shot_result !== null && (
          <LeftControlPanel
            title={gameState.shot_result ? 'Made!' : 'Missed!'}
            subtitle={gameState.shot_result ? 'Great shot!' : 'Better luck next time'}
          >
            <button
              onClick={handleNextTurn}
              disabled={actionLoading === 'nextTurn'}
              className="w-full py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'nextTurn' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Next Turn</span>
                </>
              )}
            </button>
          </LeftControlPanel>
        )}
      </>
    )
  }

  // Overlay mode (default): Full UI with scoreboard and controls
  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Debug Panel */}
      <DebugPanel 
        gameState={gameState} 
        wsConnected={wsConnected} 
        logs={logs}
        isPolling={isPolling}
      />
      
      {/* Skip Animation Button */}
      {showSkipButton && gameState?.state === GameStateEnum.ANIMATING && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-4 left-4 z-40 pointer-events-auto"
        >
          <Button
            variant="error"
            size="sm"
            icon={<SkipForward className="w-4 h-4" />}
            onClick={handleSkipAnimation}
            className="text-xs"
          >
            Skip Animation
          </Button>
        </motion.div>
      )}
      
      <div className="absolute inset-0 pointer-events-none z-10 bg-transparent">
        <div className="absolute top-5 right-5 pointer-events-auto z-30 bg-transparent">
          <Scoreboard gameState={gameState} />
        </div>
      </div>

      {/* Controls: LEFT panel, no bottom bar */}
      <AnimatePresence mode="wait">
        {gameState.state === GameStateEnum.WAITING_FOR_SHOT && gameState.room_id && (
          <LeftControlPanel
            key="shot"
            title={String(gameState.current_offensive_player ?? 'Player')}
            subtitle="Choose your shot"
          >
            <ShotSelection gameState={gameState} />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.WAITING_FOR_DEFENSE && gameState.room_id && (
          <LeftControlPanel
            key="defense"
            title={String(gameState.current_defensive_player ?? 'Player')}
            subtitle="Choose your defense"
          >
            <DefenseSelection gameState={gameState} />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.WAITING_FOR_POWER && gameState.room_id && (
          <LeftControlPanel
            key="power"
            title={String(gameState.current_offensive_player ?? 'Player')}
            subtitle="Select power"
          >
            <PowerMeter gameState={gameState} />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.ANIMATING && (
          <LeftControlPanel key="animating" title="Shooting..." subtitle="Watch the ball!">
            <div />
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.SHOT_RESULT && gameState.shot_result !== null && (
          <LeftControlPanel
            key="result"
            title={gameState.shot_result ? 'Made!' : 'Missed!'}
            subtitle={gameState.shot_result ? 'Great shot!' : 'Better luck next time'}
          >
            <button
              onClick={handleNextTurn}
              disabled={actionLoading === 'nextTurn'}
              className="w-full py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'nextTurn' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Next Turn</span>
                </>
              )}
            </button>
          </LeftControlPanel>
        )}
        {gameState.state === GameStateEnum.GAME_OVER && gameState.winner && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto"
          >
            <Card variant="strong" className="text-center w-full max-w-md mx-auto sm:min-w-[450px]">
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: [0, 10, -10, 0], scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mb-6"
              >
                <Trophy className="w-24 h-24 text-primary-400 mx-auto glow-orange" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-display text-primary-400 mb-4 text-shadow-lg"
              >
                {gameState.winner.name} Wins!
              </motion.h2>
              <div className="space-y-2">
                <p className="text-xl text-white/70">Final Score</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="text-5xl font-bold text-white text-shadow-lg"
                >
                  {gameState.winner.score}
                </motion.p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

