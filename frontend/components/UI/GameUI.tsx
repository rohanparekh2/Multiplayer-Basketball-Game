'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { ShotSelection } from './ShotSelection'
import { DefenseSelection } from './DefenseSelection'
import { PowerMeter } from './PowerMeter'
import { Scoreboard } from './Scoreboard'
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

export function GameUI() {
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
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
      
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 pointer-events-auto z-30">
          <Scoreboard gameState={gameState} />
        </div>

        <div className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-auto w-full px-4 sm:px-0 max-w-7xl z-30">
          <AnimatePresence mode="wait">
            {gameState.state === GameStateEnum.WAITING_FOR_SHOT && gameState.room_id && (
              <motion.div
                key="shot"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
              >
                <ShotSelection gameState={gameState} />
              </motion.div>
            )}
            {gameState.state === GameStateEnum.WAITING_FOR_DEFENSE && gameState.room_id && (
              <motion.div
                key="defense"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
              >
                <DefenseSelection gameState={gameState} />
              </motion.div>
            )}
            {gameState.state === GameStateEnum.WAITING_FOR_POWER && gameState.room_id && (
              <motion.div
                key="power"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <PowerMeter gameState={gameState} />
              </motion.div>
            )}
            {gameState.state === GameStateEnum.ANIMATING && (
              <motion.div
                key="animating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none"
              >
                <Card variant="strong" className="text-center w-full max-w-sm mx-auto sm:min-w-[400px] bg-black/40 backdrop-blur-sm">
                  <div className="space-y-6">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl font-display text-white text-shadow-lg"
                    >
                      Shooting...
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/70 text-lg"
                    >
                      Watch the ball!
                    </motion.p>
                  </div>
                </Card>
              </motion.div>
            )}
            {gameState.state === GameStateEnum.SHOT_RESULT && gameState.shot_result !== null && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Card variant="strong" className="text-center w-full max-w-sm mx-auto sm:min-w-[400px]">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="mb-6"
                  >
                    {gameState.shot_result ? (
                      <CheckCircle2 className="w-20 h-20 text-success-400 mx-auto glow-green" />
                    ) : (
                      <XCircle className="w-20 h-20 text-error-400 mx-auto glow-red" />
                    )}
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-5xl font-display mb-4 text-shadow-lg ${
                      gameState.shot_result ? 'text-success-400' : 'text-error-400'
                    }`}
                  >
                    {gameState.shot_result ? 'Made!' : 'Missed!'}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant={gameState.shot_result ? 'success' : 'error'}
                      size="lg"
                      icon={<RefreshCw className="w-5 h-5" />}
                      onClick={handleNextTurn}
                      isLoading={actionLoading === 'nextTurn'}
                      className="mt-6 min-w-[180px]"
                    >
                      Next Turn
                    </Button>
                  </motion.div>
                </Card>
              </motion.div>
            )}
            {gameState.state === GameStateEnum.GAME_OVER && gameState.winner && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
        </div>
      </div>
    </>
  )
}

