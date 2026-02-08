'use client'

import { useEffect, useState, useMemo } from 'react'
import { GameStateResponse, ShotArchetype, ShotZone, ContestLevel } from '@/types/game'
import { gameApi } from '@/services/api'
import { motion } from 'framer-motion'
import { calculateMakePct, CalculateMakePctParams } from '@/utils/offense'
import { TimingGrade } from '@/components/UI/TimingMeter'
import { determineContestLevel } from '@/utils/defense'

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

  // Generate candidate shots and calculate EP on frontend
  // MUST be called before any conditional returns to maintain hook order
  const alternatives = useMemo(() => {
    if (!gameState.defense_state || !advice) return []

    const contestLevel = determineContestLevel(gameState.defense_state)
    const shotHistory = gameState.shot_history || []

    // Generate 6 candidate shots
    const candidates: Array<{
      archetype: ShotArchetype
      subtype: string
      zone: ShotZone
      points: number
      name: string
    }> = [
      { archetype: ShotArchetype.RIM, subtype: 'layup', zone: ShotZone.RESTRICTED, points: 2, name: 'Rim Layup' },
      { archetype: ShotArchetype.PAINT, subtype: 'hook', zone: ShotZone.PAINT, points: 2, name: 'Paint Hook' },
      { archetype: ShotArchetype.MIDRANGE, subtype: 'catch_shoot', zone: ShotZone.WING, points: 2, name: 'Wing Mid' },
      { archetype: ShotArchetype.MIDRANGE, subtype: 'pullup', zone: ShotZone.TOP, points: 2, name: 'Top Pull-up' },
      { archetype: ShotArchetype.THREE, subtype: 'corner_catch', zone: ShotZone.CORNER, points: 3, name: 'Corner 3' },
      { archetype: ShotArchetype.THREE, subtype: 'wing_catch', zone: ShotZone.WING, points: 3, name: 'Wing 3' },
    ]

    // Calculate EP for each candidate
    const candidatesWithEP = candidates.map(candidate => {
      const makePct = calculateMakePct({
        archetype: candidate.archetype,
        subtype: candidate.subtype,
        zone: candidate.zone,
        contestLevel: gameState.defense_state?.contest_distribution?.[candidate.zone] as ContestLevel || contestLevel,
        timingGrade: 'GOOD' as TimingGrade, // Default timing for comparison
        timingError: 0.3,
        shotHistory,
      })
      const expectedPoints = makePct * candidate.points

      return {
        ...candidate,
        makePct,
        expectedPoints,
      }
    })

    // Filter out the recommended shot if it matches a candidate
    const recommended = advice?.recommended_shot
    const filtered = candidatesWithEP.filter(candidate => {
      if (!recommended) return true
      // Check if this candidate matches the recommended shot
      return !(
        candidate.archetype === recommended.archetype &&
        candidate.subtype === recommended.subtype &&
        candidate.zone === recommended.zone
      )
    })

    // Sort by EP and return top 3
    return filtered
      .sort((a, b) => b.expectedPoints - a.expectedPoints)
      .slice(0, 3)
  }, [gameState.defense_state, gameState.shot_history, advice])

  // Generate why bullets
  // MUST be called before any conditional returns to maintain hook order
  const whyBullets = useMemo(() => {
    const bullets: string[] = []
    const defenseState = gameState.defense_state
    const shotHistory = gameState.shot_history || []

    // Defense info
    if (defenseState?.summary) {
      const perimeterPressure = defenseState.summary.perimeter_pressure ?? 0
      if (perimeterPressure > 0.67) {
        bullets.push('Defense is shading perimeter → corner 3 is heavily contested')
      }
    }

    // Hot/cold streak
    if (shotHistory.length >= 3) {
      const last3 = shotHistory.slice(-3)
      const madeLast3 = last3.filter(s => s.made).length
      if (madeLast3 >= 2) {
        bullets.push('You\'re hot (+2) → slight boost')
      } else if (shotHistory.length >= 5) {
        const last5 = shotHistory.slice(-5)
        const madeLast5 = last5.filter(s => s.made).length
        if (madeLast5 <= 1) {
          bullets.push('You\'re cold (-1) → penalty')
        }
      }
    }

    // Fatigue
    const fatigue = Math.min(shotHistory.length, 10)
    if (fatigue >= 7) {
      bullets.push(`Fatigue ${fatigue}/10 → avoid off-dribble`)
    }

    return bullets
  }, [gameState.defense_state, gameState.shot_history])

  // Now safe to do conditional returns after all hooks
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

  // Calculate confidence from recommendation gap
  const recommendedEP = advice.expected_points
  const nextBestEP = alternatives.length > 0 ? alternatives[0].expectedPoints : recommendedEP
  const confidence = recommendedEP > 0 
    ? Math.max(0, Math.min(1, (recommendedEP - nextBestEP) / recommendedEP))
    : 0.5

  const confidencePercent = Math.round(confidence * 100)
  const confidenceColor = confidence > 0.2 ? 'bg-green-500' : confidence > 0.1 ? 'bg-yellow-500' : 'bg-red-500'

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

      {/* Recommended shot with EP */}
      <div className="mb-2 p-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
        <div className="text-[10px] font-semibold text-green-900 mb-0.5">Recommended:</div>
        <div className="text-xs text-green-800">
          {advice.recommended_shot.zone} {advice.recommended_shot.archetype} ({advice.expected_points.toFixed(2)} EP)
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="mb-2 space-y-1">
          <div className="text-[10px] font-semibold text-gray-700 mb-1">Alternatives:</div>
          {alternatives.map((alt, idx) => (
            <div key={idx} className="text-[10px] text-gray-600">
              {alt.name} ({alt.makePct.toFixed(2)}) → {alt.expectedPoints.toFixed(2)} EP
            </div>
          ))}
        </div>
      )}

      {/* Coach Confidence */}
      <div className="mb-2 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-gray-700">Coach Confidence:</span>
          <span className="font-bold text-gray-900">{confidencePercent}%</span>
        </div>
        <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${confidenceColor} transition-all duration-300`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Why bullets */}
      {whyBullets.length > 0 && (
        <div className="mb-2 space-y-0.5">
          <div className="text-[10px] font-semibold text-gray-700 mb-0.5">Why:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {whyBullets.map((bullet, idx) => (
              <li key={idx} className="text-[10px] text-gray-600">{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasoning */}
      <div className="text-xs text-gray-700 leading-relaxed mb-2">
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

