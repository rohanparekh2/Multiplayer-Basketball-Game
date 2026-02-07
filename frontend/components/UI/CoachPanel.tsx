'use client'

import { useEffect, useState } from 'react'
import { GameStateResponse } from '@/types/game'
import { gameApi } from '@/services/api'
import { motion } from 'framer-motion'

interface CoachAdvice {
  recommended_shot: {
    archetype: string
    subtype: string
    zone: string
  }
  advice_text: string
  reasoning: string
  expected_points: number
  challenge?: string
}

interface CoachPanelProps {
  gameState: GameStateResponse
}

export function CoachPanel({ gameState }: CoachPanelProps) {
  const [advice, setAdvice] = useState<CoachAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameState?.room_id || gameState.state !== 'waiting_for_shot') {
      return
    }

    const fetchAdvice = async () => {
      setLoading(true)
      setError(null)
      try {
        const coachAdvice = await gameApi.getCoachAdvice(gameState.room_id)
        setAdvice(coachAdvice)
      } catch (err: any) {
        console.error('Error fetching coach advice:', err)
        setError('Failed to load coach advice')
      } finally {
        setLoading(false)
      }
    }

    fetchAdvice()
  }, [gameState?.room_id, gameState?.state])

  if (!gameState?.room_id || gameState.state !== 'waiting_for_shot') {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Coach</h3>
        <div className="text-xs text-gray-700">Analyzing game situation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Coach</h3>
        <div className="text-xs text-red-600">{error}</div>
      </div>
    )
  }

  if (!advice) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-2xl p-4 w-full"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Coach</h3>
      
      {/* Advice text */}
      <div className="text-xs text-gray-800 mb-2 leading-relaxed">
        {advice.advice_text}
      </div>

      {/* Expected points display */}
      <div className="flex items-center gap-2 mb-2 p-1.5 bg-white/10 rounded-lg">
        <span className="text-xs text-gray-700">Expected Points:</span>
        <span className="font-bold text-base text-gray-900">
          {advice.expected_points.toFixed(2)}
        </span>
      </div>

      {/* Reasoning */}
      <div className="text-xs text-gray-700 leading-relaxed">
        {advice.reasoning}
      </div>

      {/* Challenge */}
      {advice.challenge && (
        <div className="mt-2 p-2 bg-orange-500/20 rounded-lg border border-orange-400/30">
          <div className="text-[10px] font-semibold text-orange-900 mb-0.5">Challenge:</div>
          <div className="text-[10px] text-orange-800">{advice.challenge}</div>
        </div>
      )}
    </motion.div>
  )
}

