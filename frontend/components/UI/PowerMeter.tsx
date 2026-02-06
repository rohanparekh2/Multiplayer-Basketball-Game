'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameStateResponse } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { colors, spacing } from '@/utils/designTokens'

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
        setIsSelecting(true)
        
        if (!gameState.room_id) {
          alert('Game not fully initialized. Please wait for the game to load completely.')
          setIsSelecting(false)
          return
        }
        
        try {
          const adjustedPower = Math.floor((power / 100) * 80) + 10
          await selectPower(adjustedPower, gameState.room_id)
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
    <div className="flex items-center gap-4 flex-1 max-w-2xl">
      {/* Icon and label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Zap className="w-5 h-5 text-primary-400" />
        <span className="text-white text-sm font-semibold">Power</span>
      </div>

      {/* Horizontal power bar */}
      <div className="flex-1 relative h-12 bg-gray-800/50 rounded-lg border-2 border-white/20 overflow-hidden shadow-inner">
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

      {/* Power value and instruction */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.span
          key={power}
          initial={{ scale: 1.2, color: '#22c55e' }}
          animate={{ scale: 1, color: '#ff6b35' }}
          transition={{ duration: 0.2 }}
          className="text-2xl font-bold text-primary-400 tabular-nums min-w-[50px] text-right"
        >
          {power}%
        </motion.span>
        {isReady && !isLoading && (
          <kbd className="px-2 py-1 bg-white/15 rounded text-xs font-mono border border-white/20 text-white/80">
            SPACE
          </kbd>
        )}
        {isLoading && (
          <span className="text-xs text-white/60">Processing...</span>
        )}
      </div>
    </div>
  )
}
