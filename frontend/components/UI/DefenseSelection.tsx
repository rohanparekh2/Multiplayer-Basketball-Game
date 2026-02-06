'use client'

import { GameStateResponse, DefenseType } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Button } from './Button'
import { Shield, Hand, Eye } from 'lucide-react'
import { motion } from 'framer-motion'

interface DefenseSelectionProps {
  gameState: GameStateResponse
}

const defenseConfig = {
  [DefenseType.BLOCK]: { icon: Shield, label: 'Block', description: 'High risk' },
  [DefenseType.STEAL]: { icon: Hand, label: 'Steal', description: 'Medium' },
  [DefenseType.CONTEST]: { icon: Eye, label: 'Contest', description: 'Safe' },
}

export function DefenseSelection({ gameState }: DefenseSelectionProps) {
  const { selectDefense, actionLoading } = useGameState()

  const isLoading = actionLoading === 'defense'
  const isAnyLoading = !!actionLoading
  const isReady = !!gameState?.room_id

  const handleDefenseSelect = async (defenseType: DefenseType) => {
    if (!isReady) {
      alert('Game not fully initialized. Please wait for the game to load completely.')
      return
    }
    
    if (isAnyLoading) {
      return
    }
    
    try {
      await selectDefense(defenseType, gameState.room_id)
    } catch (error: any) {
      console.error('❌ Error selecting defense:', error)
      alert(`Error: ${error?.message || error}`)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-3">
      {Object.entries(defenseConfig).map(([defenseType, config], index) => {
        const Icon = config.icon
        return (
          <motion.div
            key={defenseType}
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
                  handleDefenseSelect(defenseType as DefenseType).catch(console.error)
                }
              }}
              disabled={isAnyLoading || !isReady}
              className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 transition hover:scale-105 shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Select ${config.label} defense`}
              title={!isReady ? 'Game is still loading...' : `Select ${config.label} defense`}
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
