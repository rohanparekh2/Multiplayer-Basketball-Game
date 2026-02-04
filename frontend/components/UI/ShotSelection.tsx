'use client'

import { GameStateResponse, ShotType } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Button } from './Button'
import { Card } from './Card'
import { Target, Zap, Crosshair, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'

interface ShotSelectionProps {
  gameState: GameStateResponse
}

const shotConfig = {
  [ShotType.LAYUP]: { icon: Target, label: 'Layup', description: 'Close range' },
  [ShotType.MIDRANGE]: { icon: Zap, label: 'Midrange', description: 'Medium range' },
  [ShotType.THREE_POINTER]: { icon: Crosshair, label: 'Three-Pointer', description: 'Long range' },
  [ShotType.HALF_COURT]: { icon: Rocket, label: 'Half Court', description: 'Maximum range' },
}

export function ShotSelection({ gameState }: ShotSelectionProps) {
  const { selectShot, actionLoading } = useGameState()

  const isLoading = actionLoading === 'shot'
  const isAnyLoading = !!actionLoading
  const isReady = !!gameState?.room_id

  const handleShotSelect = async (shotType: ShotType) => {
    console.log('🎯 handleShotSelect called with:', shotType)
    console.log('🎯 Current game state:', gameState)
    console.log('🎯 actionLoading:', actionLoading)
    console.log('🎯 isReady:', isReady, 'room_id:', gameState?.room_id)
    
    // Verify game state has room_id
    if (!isReady) {
      console.error('❌ Game state missing room_id!', gameState)
      alert('Game not fully initialized. Please wait for the game to load completely.')
      return
    }
    
    if (isAnyLoading) {
      console.warn('⚠️ Already loading, ignoring click')
      return
    }
    
    try {
      console.log('🎯 Calling selectShot with room_id:', gameState.room_id)
      const result = await selectShot(shotType, gameState.room_id)
      console.log('🎯 selectShot returned:', result)
    } catch (error: any) {
      console.error('❌ Error selecting shot:', error)
      alert(`Error: ${error?.message || error}`)
    }
  }

  return (
    <Card variant="strong" className="w-full max-w-lg mx-auto sm:min-w-[500px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display text-white text-shadow-lg">
            Choose Your Shot
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <p className="text-white/80 text-base font-medium">
              {gameState.current_offensive_player}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(shotConfig).map(([shotType, config], index) => {
            const Icon = config.icon
            return (
              <motion.div
                key={shotType}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Icon className="w-6 h-6" />}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔘 Button onClick fired for:', shotType, 'isReady:', isReady)
                    if (isReady) {
                      handleShotSelect(shotType as ShotType).catch(console.error)
                    } else {
                      console.warn('⚠️ Button clicked but game not ready')
                    }
                  }}
                  disabled={isAnyLoading || !isReady}
                  isLoading={isLoading}
                  className="w-full flex-col h-auto py-5 gap-2 min-h-[100px] cursor-pointer"
                  aria-label={`Select ${config.label} shot`}
                  data-testid={`shot-button-${shotType}`}
                  title={!isReady ? 'Game is still loading...' : `Select ${config.label} shot`}
                >
                  <span className="font-bold text-lg">{config.label}</span>
                  <span className="text-xs opacity-70 font-normal">{config.description}</span>
                </Button>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </Card>
  )
}

