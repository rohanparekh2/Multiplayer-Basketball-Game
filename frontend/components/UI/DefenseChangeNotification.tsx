'use client'

import { useEffect, useRef } from 'react'
import { GameStateResponse } from '@/types/game'
import { ContestLevel, ShotZone } from '@/types/game'

interface DefenseChangeNotificationProps {
  gameState: GameStateResponse | null
  onDefenseChange: (message: string) => void
}

export function DefenseChangeNotification({ 
  gameState, 
  onDefenseChange 
}: DefenseChangeNotificationProps) {
  const prevDefenseStateRef = useRef<GameStateResponse['defense_state'] | null>(null)

  useEffect(() => {
    if (!gameState?.defense_state) {
      prevDefenseStateRef.current = gameState?.defense_state || null
      return
    }

    const currentDefense = gameState.defense_state
    const prevDefense = prevDefenseStateRef.current

    // Skip on initial load
    if (!prevDefense) {
      prevDefenseStateRef.current = currentDefense
      return
    }

    const currentContest = currentDefense.contest_distribution || {}
    const prevContest = prevDefense.contest_distribution || {}

    // Check for perimeter pressure changes
    const perimeterZones: ShotZone[] = [ShotZone.CORNER, ShotZone.WING, ShotZone.TOP]
    const currentPerimeterHeavy = perimeterZones.filter(
      zone => currentContest[zone] === ContestLevel.HEAVY
    ).length
    const prevPerimeterHeavy = perimeterZones.filter(
      zone => prevContest[zone] === ContestLevel.HEAVY
    ).length

    if (Math.abs(currentPerimeterHeavy - prevPerimeterHeavy) >= 2) {
      if (currentPerimeterHeavy > prevPerimeterHeavy) {
        onDefenseChange('Defense is pressing the perimeter (+Perimeter Pressure)')
      } else {
        onDefenseChange('Defense is backing off the perimeter')
      }
    }

    // Check for paint/rim protection changes
    const rimZones: ShotZone[] = [ShotZone.PAINT, ShotZone.RESTRICTED]
    const currentRimHeavy = rimZones.filter(
      zone => currentContest[zone] === ContestLevel.HEAVY
    ).length
    const prevRimHeavy = rimZones.filter(
      zone => prevContest[zone] === ContestLevel.HEAVY
    ).length

    if (currentRimHeavy > prevRimHeavy && prevRimHeavy === 0) {
      onDefenseChange('Help defense is loading up in the paint')
    }

    // Check for contest level changes in any zone
    let hasSignificantChange = false
    for (const zone of Object.values(ShotZone)) {
      const currentLevel = currentContest[zone]
      const prevLevel = prevContest[zone]
      
      if (currentLevel && prevLevel && currentLevel !== prevLevel) {
        // Check for meaningful upgrades (OPEN -> LIGHT/HEAVY, LIGHT -> HEAVY)
        if (
          (prevLevel === ContestLevel.OPEN && currentLevel !== ContestLevel.OPEN) ||
          (prevLevel === ContestLevel.LIGHT && currentLevel === ContestLevel.HEAVY)
        ) {
          hasSignificantChange = true
          break
        }
      }
    }

    if (hasSignificantChange) {
      // Check if it's a switch everything scenario
      const allZonesHeavy = Object.values(ShotZone).every(
        zone => currentContest[zone] === ContestLevel.HEAVY
      )
      if (allZonesHeavy) {
        onDefenseChange("They're switching everything now")
      }
    }

    // Update ref for next comparison
    prevDefenseStateRef.current = currentDefense
  }, [gameState?.defense_state, onDefenseChange])

  return null // This component doesn't render anything
}

