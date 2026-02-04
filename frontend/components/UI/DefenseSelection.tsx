'use client'

import { GameStateResponse, DefenseType } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Button } from './Button'
import { Card } from './Card'
import { Shield, Hand, Eye } from 'lucide-react'
import { motion } from 'framer-motion'

interface DefenseSelectionProps {
  gameState: GameStateResponse
}

const defenseConfig = {
  [DefenseType.BLOCK]: { icon: Shield, label: 'Block', description: 'High risk, high reward' },
  [DefenseType.STEAL]: { icon: Hand, label: 'Steal', description: 'Medium risk' },
  [DefenseType.CONTEST]: { icon: Eye, label: 'Contest', description: 'Safe option' },
}

export function DefenseSelection({ gameState }: DefenseSelectionProps) {
  const { selectDefense, actionLoading } = useGameState()

  const isLoading = actionLoading === 'defense'
  const isAnyLoading = !!actionLoading
  const isReady = !!gameState?.room_id

  const handleDefenseSelect = async (defenseType: DefenseType) => {
    console.log('🛡️ handleDefenseSelect called with:', defenseType)
    console.log('🛡️ Current game state:', gameState)
    console.log('🛡️ actionLoading:', actionLoading)
    console.log('🛡️ isReady:', isReady, 'room_id:', gameState?.room_id)
    
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
      console.log('🛡️ Calling selectDefense with room_id:', gameState.room_id)
      const result = await selectDefense(defenseType, gameState.room_id)
      console.log('🛡️ selectDefense returned:', result)
    } catch (error: any) {
      console.error('❌ Error selecting defense:', error)
      alert(`Error: ${error?.message || error}`)
    }
  }

  return (
    <Card variant="strong" className="w-full max-w-2xl mx-auto sm:min-w-[600px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display text-white text-shadow-lg">
            Choose Your Defense
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-error-400 rounded-full animate-pulse" />
            <p className="text-white/80 text-base font-medium">
              {gameState.current_defensive_player}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Object.entries(defenseConfig).map(([defenseType, config], index) => {
            const Icon = config.icon
            return (
              <motion.div
                key={defenseType}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="error"
                  size="lg"
                  icon={<Icon className="w-6 h-6" />}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔘 Defense button onClick fired for:', defenseType, 'isReady:', isReady)
                    if (isReady) {
                      handleDefenseSelect(defenseType as DefenseType).catch(console.error)
                    } else {
                      console.warn('⚠️ Button clicked but game not ready')
                    }
                  }}
                  disabled={isAnyLoading || !isReady}
                  isLoading={isLoading}
                  className="w-full flex-col h-auto py-5 gap-2 min-h-[100px] cursor-pointer"
                  aria-label={`Select ${config.label} defense`}
                  title={!isReady ? 'Game is still loading...' : `Select ${config.label} defense`}
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

