'use client'

import { useState } from 'react'
import { GameStateResponse, ShotType, ShotArchetype } from '@/types/game'
import { useGameState } from '@/hooks/useGameState'
import { Target, Zap, Crosshair, Rocket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShotMeter } from './ShotMeter'

interface ShotSelectionProps {
  gameState: GameStateResponse
}

// Quick picks mapping (legacy ShotType to new archetypes)
const QUICK_PICKS = [
  { shotType: ShotType.LAYUP, archetype: ShotArchetype.RIM, icon: Target, label: 'Rim', description: 'Close', points: 2 },
  { shotType: ShotType.MIDRANGE, archetype: ShotArchetype.MIDRANGE, icon: Zap, label: 'Midrange', description: 'Medium', points: 2 },
  { shotType: ShotType.THREE_POINTER, archetype: ShotArchetype.THREE, icon: Crosshair, label: 'Three', description: 'Long', points: 3 },
  { shotType: ShotType.HALF_COURT, archetype: ShotArchetype.DEEP, icon: Rocket, label: 'Deep', description: 'Max', points: 3 },
]

// Subtypes for each archetype (for future expansion)
const SUBTYPES: Record<ShotArchetype, string[]> = {
  [ShotArchetype.RIM]: ['layup', 'dunk', 'floater'],
  [ShotArchetype.PAINT]: ['hook', 'short_jumper'],
  [ShotArchetype.MIDRANGE]: ['pullup', 'catch_shoot', 'fade'],
  [ShotArchetype.THREE]: ['corner_catch', 'wing_catch', 'top_catch'],
  [ShotArchetype.DEEP]: ['logo', 'heave'],
}

export function ShotSelection({ gameState }: ShotSelectionProps) {
  const { selectShot, actionLoading } = useGameState()
  const [selectedArchetype, setSelectedArchetype] = useState<ShotArchetype | null>(null)

  const isLoading = actionLoading === 'shot'
  const isAnyLoading = !!actionLoading
  const isReady = !!gameState?.room_id

  // Estimate probability for quick picks (simplified - will be enhanced with real calculations)
  const getEstimatedProbability = (shotType: ShotType): number => {
    const estimates: Record<ShotType, number> = {
      [ShotType.LAYUP]: 0.62,
      [ShotType.MIDRANGE]: 0.42,
      [ShotType.THREE_POINTER]: 0.36,
      [ShotType.HALF_COURT]: 0.18,
      [ShotType.DEFAULT]: 0.35,
    }
    return estimates[shotType] || 0.35
  }

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
      setSelectedArchetype(null)  // Reset selection after shot
    } catch (error: any) {
      console.error('❌ Error selecting shot:', error)
      alert(`Error: ${error?.message || error}`)
    }
  }

  const handleArchetypeClick = (archetype: ShotArchetype, shotType: ShotType) => {
    // If subtypes exist for this archetype, show them; otherwise select directly
    if (SUBTYPES[archetype] && SUBTYPES[archetype].length > 1) {
      setSelectedArchetype(archetype)
    } else {
      // No subtypes or only one, select directly
      handleShotSelect(shotType)
    }
  }
  
  const handleSubtypeSelect = async (archetype: ShotArchetype, subtype: string, shotType: ShotType) => {
    // For now, still use legacy shot_type system
    // In future, we can send archetype + subtype to backend
    await handleShotSelect(shotType)
    setSelectedArchetype(null)
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      {/* Quick picks - always visible */}
      <div className="flex flex-col gap-1.5">
        {QUICK_PICKS.map((pick, index) => {
          const Icon = pick.icon
          const probability = getEstimatedProbability(pick.shotType)
          const expectedPoints = probability * pick.points
          
          return (
            <motion.div
              key={pick.shotType}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (isReady) {
                    handleArchetypeClick(pick.archetype, pick.shotType)
                  }
                }}
                disabled={isAnyLoading || !isReady}
                className="w-full py-2 px-3 rounded-lg bg-white/20 hover:bg-white/30 transition hover:scale-105 shadow-md flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Select ${pick.label} shot`}
                title={!isReady ? 'Game is still loading...' : `Select ${pick.label} shot`}
              >
                <Icon className="w-4 h-4 stroke-[2.5] text-gray-900" />
                <span className="text-xs font-semibold leading-none text-gray-900">{pick.label}</span>
                <span className="text-[10px] text-gray-700 leading-none">{pick.description}</span>
                <ShotMeter probability={probability} points={pick.points} showLabel={false} />
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Subtypes - shown when archetype selected (for future expansion) */}
      <AnimatePresence>
        {selectedArchetype && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 mt-2"
          >
            {SUBTYPES[selectedArchetype]?.map((subtype) => {
              const shotTypeMap: Record<ShotArchetype, ShotType> = {
                [ShotArchetype.RIM]: ShotType.LAYUP,
                [ShotArchetype.PAINT]: ShotType.MIDRANGE,
                [ShotArchetype.MIDRANGE]: ShotType.MIDRANGE,
                [ShotArchetype.THREE]: ShotType.THREE_POINTER,
                [ShotArchetype.DEEP]: ShotType.HALF_COURT,
              }
              const shotType = shotTypeMap[selectedArchetype] || ShotType.MIDRANGE
              
              return (
                <button
                  key={subtype}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isReady) {
                      handleSubtypeSelect(selectedArchetype, subtype, shotType)
                    }
                  }}
                  disabled={isAnyLoading || !isReady}
                  className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-gray-900 font-medium transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subtype.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
