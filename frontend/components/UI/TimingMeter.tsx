'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShotType, ContestLevel } from '@/types/game'

export type TimingGrade = 'PERFECT' | 'GOOD' | 'MISS'

export interface TimingResult {
  grade: TimingGrade
  error: number  // 0..1, where 0 = perfect center, 1 = maximum error
  lockedT: number  // The needle position t in [0,1) when locked
}

export interface TimingMeterProps {
  shotType: ShotType
  contestLevel: ContestLevel
  onLockIn: (result: TimingResult) => void
  disabled?: boolean
}

// Needle speed multipliers based on shot type (higher = faster)
const SHOT_SPEED: Record<ShotType, number> = {
  [ShotType.LAYUP]: 0.8,        // Slower - easier to time
  [ShotType.MIDRANGE]: 1.0,      // Base speed
  [ShotType.THREE_POINTER]: 1.3, // Faster - harder to time
  [ShotType.HALF_COURT]: 1.6,    // Very fast - hardest to time
  [ShotType.DEFAULT]: 1.0,
}

// Perfect window width based on contest level (as fraction of [0,1])
const PERFECT_WINDOW: Record<ContestLevel, number> = {
  [ContestLevel.OPEN]: 0.25,   // 25% of meter - easier
  [ContestLevel.LIGHT]: 0.18,  // 18% of meter - medium
  [ContestLevel.HEAVY]: 0.12,  // 12% of meter - harder
}

// Good window extends beyond perfect window
const GOOD_WINDOW_EXTENSION = 0.15 // 15% on each side

export function TimingMeter({ 
  shotType, 
  contestLevel, 
  onLockIn, 
  disabled = false 
}: TimingMeterProps) {
  const [needlePosition, setNeedlePosition] = useState(0) // t in [0, 1)
  const [isLocked, setIsLocked] = useState(false)
  const [flashState, setFlashState] = useState<TimingGrade | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(performance.now())
  const directionRef = useRef<number>(1) // 1 = moving right, -1 = moving left

  // Calculate window positions
  const perfectWindowWidth = PERFECT_WINDOW[contestLevel]
  const perfectWindowCenter = 0.5 // Center of meter
  const perfectWindowStart = perfectWindowCenter - perfectWindowWidth / 2
  const perfectWindowEnd = perfectWindowCenter + perfectWindowWidth / 2
  
  const goodWindowStart = Math.max(0, perfectWindowStart - GOOD_WINDOW_EXTENSION)
  const goodWindowEnd = Math.min(1, perfectWindowEnd + GOOD_WINDOW_EXTENSION)

  const speed = SHOT_SPEED[shotType] || 1.0

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    if (isLocked || disabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000 // Convert to seconds
      lastTimeRef.current = currentTime

      setNeedlePosition((prev) => {
        // Calculate new position based on speed and direction
        const increment = speed * deltaTime * 2 // *2 for reasonable speed
        let newPos = prev + directionRef.current * increment

        // Bounce at boundaries (clamp to [0, 1))
        if (newPos >= 1) {
          newPos = 0.999 // Keep it just under 1
          directionRef.current = -1
        } else if (newPos <= 0) {
          newPos = 0.001 // Keep it just above 0
          directionRef.current = 1
        }

        return Math.max(0, Math.min(0.999, newPos)) // Ensure it's in [0, 1)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isLocked, disabled, speed])

  // Reset meter when shotType or contestLevel changes
  useEffect(() => {
    setNeedlePosition(0)
    setIsLocked(false)
    setFlashState(null)
    directionRef.current = 1
    lastTimeRef.current = performance.now()
  }, [shotType, contestLevel])

  // Handle SPACE press
  const handleSpacePress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !isLocked && !disabled) {
      e.preventDefault()
      e.stopPropagation()

      // Freeze the needle
      setIsLocked(true)
      const lockedT = needlePosition

      // Evaluate grade and calculate error
      let grade: TimingGrade
      let error: number

      if (lockedT >= perfectWindowStart && lockedT <= perfectWindowEnd) {
        grade = 'PERFECT'
        // Error: distance from center, normalized to [0, 1]
        // 0 = perfect center, 1 = at edge of perfect window
        const distanceFromCenter = Math.abs(lockedT - perfectWindowCenter)
        const maxDistance = perfectWindowWidth / 2
        error = distanceFromCenter / maxDistance // 0 to 1
      } else if (lockedT >= goodWindowStart && lockedT <= goodWindowEnd) {
        grade = 'GOOD'
        // Error: distance from perfect window, normalized to [0, 1]
        // 0 = at edge of perfect window, 1 = at edge of good window
        const distanceFromPerfect = Math.min(
          Math.abs(lockedT - perfectWindowStart),
          Math.abs(lockedT - perfectWindowEnd)
        )
        error = Math.min(1, distanceFromPerfect / GOOD_WINDOW_EXTENSION)
      } else {
        grade = 'MISS'
        // Error: distance from good window, normalized to [0, 1]
        // 0 = at edge of good window, 1 = maximum distance
        const distanceFromGood = Math.min(
          Math.abs(lockedT - goodWindowStart),
          Math.abs(lockedT - goodWindowEnd)
        )
        // Normalize to [0, 1] where 1 = at meter edge (0 or 1)
        const maxPossibleDistance = Math.max(goodWindowStart, 1 - goodWindowEnd)
        error = Math.min(1, distanceFromGood / maxPossibleDistance)
      }

      // Set flash state
      setFlashState(grade)

      // Create result object
      const result: TimingResult = {
        grade,
        error,
        lockedT,
      }

      // Call callback after a brief delay to show flash
      setTimeout(() => {
        onLockIn(result)
        // Reset flash after animation
        setTimeout(() => setFlashState(null), 500)
      }, 300)
    }
  }, [isLocked, disabled, needlePosition, perfectWindowStart, perfectWindowEnd, goodWindowStart, goodWindowEnd, perfectWindowCenter, perfectWindowWidth, onLockIn])

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleSpacePress)
    return () => {
      window.removeEventListener('keydown', handleSpacePress)
    }
  }, [handleSpacePress])

  // Determine flash color
  const getFlashColor = () => {
    switch (flashState) {
      case 'PERFECT':
        return 'bg-green-500'
      case 'GOOD':
        return 'bg-yellow-500'
      case 'MISS':
        return 'bg-red-500'
      default:
        return ''
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Instructions */}
      <div className="text-xs text-gray-600 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">SPACE</kbd> to lock in timing
      </div>

      {/* Meter container - 40px height as specified */}
      <div className="relative w-full h-[40px] bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700 shadow-inner">
        {/* Perfect window (green) */}
        <div
          className="absolute top-0 bottom-0 bg-green-500/40 border-y-2 border-green-400"
          style={{
            left: `${perfectWindowStart * 100}%`,
            width: `${perfectWindowWidth * 100}%`,
          }}
        />

        {/* Good window extensions (yellow) */}
        <div
          className="absolute top-0 bottom-0 bg-yellow-500/20"
          style={{
            left: `${goodWindowStart * 100}%`,
            width: `${(perfectWindowStart - goodWindowStart) * 100}%`,
          }}
        />
        <div
          className="absolute top-0 bottom-0 bg-yellow-500/20"
          style={{
            left: `${perfectWindowEnd * 100}%`,
            width: `${(goodWindowEnd - perfectWindowEnd) * 100}%`,
          }}
        />

        {/* Needle */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
          style={{
            left: `${needlePosition * 100}%`,
            transform: 'translateX(-50%)',
          }}
          animate={isLocked ? {} : {}}
        >
          {/* Needle tip */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
        </motion.div>

        {/* Flash overlay */}
        <AnimatePresence>
          {flashState && (
            <motion.div
              className={`absolute inset-0 ${getFlashColor()} opacity-0`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase">
              {flashState || 'LOCKED'}
            </span>
          </div>
        )}
      </div>

      {/* Result indicator */}
      {isLocked && flashState && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span
            className={`text-sm font-bold ${
              flashState === 'PERFECT'
                ? 'text-green-500'
                : flashState === 'GOOD'
                ? 'text-yellow-500'
                : 'text-red-500'
            }`}
          >
            {flashState}
          </span>
        </motion.div>
      )}
    </div>
  )
}

