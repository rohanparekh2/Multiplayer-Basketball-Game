'use client'

import { GameStateResponse, ShotType } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Button } from './Button'
import { Target, Zap, Crosshair, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import { spacing, fontSize, fontWeight } from '@/utils/designTokens'

interface ShotSelectionProps {
  gameState: GameStateResponse
}

const shotConfig = {
  [ShotType.LAYUP]: { icon: Target, label: 'Layup', description: 'Close' },
  [ShotType.MIDRANGE]: { icon: Zap, label: 'Midrange', description: 'Medium' },
  [ShotType.THREE_POINTER]: { icon: Crosshair, label: 'Three', description: 'Long' },
  [ShotType.HALF_COURT]: { icon: Rocket, label: 'Half Court', description: 'Max' },
}

export function ShotSelection({ gameState }: ShotSelectionProps) {
  const { selectShot, actionLoading } = useGameState()

  const isLoading = actionLoading === 'shot'
  const isAnyLoading = !!actionLoading
  const isReady = !!gameState?.room_id

  const handleShotSelect = async (shotType: ShotType) => {
    if (!isReady) {
      alert('Game not fully initialized. Please wait for the game to load completely.')
      return
    }
    
    if (isAnyLoading) {
      return
    }
    
    try {
      await selectShot(shotType, gameState.room_id)
    } catch (error: any) {
      console.error('❌ Error selecting shot:', error)
      alert(`Error: ${error?.message || error}`)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-3">
      {Object.entries(shotConfig).map(([shotType, config], index) => {
        const Icon = config.icon
        return (
          <motion.div
            key={shotType}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isReady) {
                  handleShotSelect(shotType as ShotType).catch(console.error)
                }
              }}
              disabled={isAnyLoading || !isReady}
              className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 transition hover:scale-105 shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Select ${config.label} shot`}
              title={!isReady ? 'Game is still loading...' : `Select ${config.label} shot`}
            >
              <Icon className="w-5 h-5 stroke-[2.5] text-gray-900" />
              <span className="text-sm font-semibold leading-none text-gray-900">{config.label}</span>
              <span className="text-[11px] text-gray-700 leading-none">{config.description}</span>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
