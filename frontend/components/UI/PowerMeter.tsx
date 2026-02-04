'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameStateResponse } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Card } from './Card'
import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface PowerMeterProps {
  gameState: GameStateResponse
}

export function PowerMeter({ gameState }: PowerMeterProps) {
  const { selectPower, actionLoading } = useGameState()
  const [power, setPower] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isSelecting, setIsSelecting] = useState(false)
  const isReady = !!gameState?.room_id

  // Reset power when entering waiting_for_power state
  useEffect(() => {
    if (gameState.state === 'waiting_for_power' && !isSelecting) {
      setPower(0)
      setDirection(1)
    } else if (gameState.state !== 'waiting_for_power') {
      setPower(0)
      setDirection(1)
      setIsSelecting(false)
    }
  }, [gameState.state, isSelecting])

  // Animate power meter
  useEffect(() => {
    if (gameState.state !== 'waiting_for_power' || isSelecting || actionLoading === 'power' || !isReady) {
      return
    }

    const interval = setInterval(() => {
      setPower((prev) => {
        const newPower = prev + direction * 2
        if (newPower >= 100 || newPower <= 0) {
          setDirection((d) => -d)
          return Math.max(0, Math.min(100, newPower))
        }
        return newPower
      })
    }, 50)

    return () => clearInterval(interval)
  }, [gameState.state, direction, isSelecting, actionLoading, isReady])

  const handleSpacePress = useCallback(
    async (e: KeyboardEvent) => {
      if (
        e.code === 'Space' && 
        gameState.state === 'waiting_for_power' && 
        !isSelecting && 
        actionLoading !== 'power' &&
        isReady
      ) {
        e.preventDefault()
        e.stopPropagation()
        console.log('⌨️ Spacebar pressed, selecting power:', power)
        setIsSelecting(true)
        
        // Verify room_id
        if (!gameState.room_id) {
          console.error('❌ Game state missing room_id!', gameState)
          alert('Game not fully initialized. Please wait for the game to load completely.')
          setIsSelecting(false)
          return
        }
        
        try {
          // Convert 0-100 power to 10-90 range (matching backend)
          const adjustedPower = Math.floor((power / 100) * 80) + 10
          console.log('⚡ Calling selectPower with:', { room_id: gameState.room_id, power: adjustedPower })
          await selectPower(adjustedPower, gameState.room_id)
          console.log('✅ Power selected successfully')
        } catch (error: any) {
          console.error('❌ Error selecting power:', error)
          alert(`Error: ${error?.message || error}`)
          setIsSelecting(false)
        }
      }
    },
    [gameState.state, gameState.room_id, power, isSelecting, actionLoading, selectPower, isReady]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleSpacePress)
    return () => window.removeEventListener('keydown', handleSpacePress)
  }, [handleSpacePress])

  const isLoading = actionLoading === 'power'

  return (
    <Card variant="strong" className="w-full max-w-lg mx-auto sm:min-w-[500px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-display text-white text-shadow-lg flex items-center justify-center gap-3">
            <Zap className="w-7 h-7 text-primary-400" />
            Select Power
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <p className="text-white/80 text-base font-medium">
              {gameState.current_offensive_player}
            </p>
          </div>
          <p className="text-white/60 text-sm">
            {isReady ? (
              <>
                Press{' '}
                <kbd className="px-3 py-1.5 bg-white/15 rounded-lg text-sm font-mono border border-white/20" aria-label="Spacebar">
                  SPACEBAR
                </kbd>
                {' '}to select
              </>
            ) : (
              <span className="text-yellow-400">Game is still loading...</span>
            )}
          </p>
        </div>

        <div className="space-y-6">
          <div className="relative h-16 bg-gray-800/50 rounded-xl border-2 border-white/20 overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300 relative"
              style={{ width: `${power}%` }}
              animate={{
                boxShadow: [
                  '0 0 10px rgba(255, 107, 53, 0.5)',
                  '0 0 20px rgba(255, 107, 53, 0.8)',
                  '0 0 10px rgba(255, 107, 53, 0.5)',
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-0 h-full w-1 bg-yellow-400 shadow-lg"
              style={{ left: `${power}%` }}
              animate={{
                boxShadow: [
                  '0 0 5px rgba(255, 255, 0, 0.5)',
                  '0 0 15px rgba(255, 255, 0, 0.8)',
                  '0 0 5px rgba(255, 255, 0, 0.5)',
                ],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </div>
          
          <div className="text-center">
            <motion.p
              key={power}
              initial={{ scale: 1.3, color: '#22c55e' }}
              animate={{ scale: 1, color: '#ff6b35' }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-bold text-primary-400 text-shadow-lg"
            >
              {power}%
            </motion.p>
            {isLoading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-white/60 mt-2"
              >
                Processing...
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </Card>
  )
}

