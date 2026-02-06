'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Trajectory, Point } from '@/utils/trajectory'
import { SVGBasketball } from './SVGBasketball'
import { SHOT_DURATION, BALL_ROTATION_SPEED, RESULT_DELAY, ARC_FADE_DURATION } from '@/utils/animationConstants'
import { ANCHORS, COURT } from '../Court/courtConstants'
import { toSvg } from '@/utils/svgSpace'

interface SVGBallAnimationProps {
  startPosition: [number, number, number] // [x, y, z] - z ignored in 2D
  endPosition: [number, number, number]
  made: boolean
  onComplete: () => void
  debug?: boolean
}

/**
 * SVG ball animation using Framer Motion
 * Uses Trajectory utility for clean separation of animation math
 * Includes trajectory arc visualization
 * CRITICAL: Uses same viewBox as court (1100x850)
 */
export function SVGBallAnimation({
  startPosition,
  endPosition,
  made,
  onComplete,
  debug = false
}: SVGBallAnimationProps) {
  const completedRef = useRef(false)
  const animationStartedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const [showArc, setShowArc] = useState(true)
  
  // Keep onComplete ref in sync
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Convert 3D positions to 2D (SVG coordinates) using ANCHORS
  // Use ANCHORS for consistent positioning
  const svgStart: Point = useMemo(() => {
    return toSvg({
      x: ANCHORS.startBall.x + startPosition[0] * 20, // Center horizontally with spread
      y: ANCHORS.startBall.y // Use ANCHORS.startBall.y
    })
  }, [startPosition])

  const svgEnd: Point = useMemo(() => {
    return toSvg({
      x: ANCHORS.rim.x + endPosition[0] * 20, // Basket x position (usually centered)
      y: ANCHORS.rim.y // Use ANCHORS.rim.y
    })
  }, [endPosition])

  // Create trajectory with 3D perspective apex
  const trajectory = useMemo(() => {
    return new Trajectory({
      start: svgStart,
      end: svgEnd,
      duration: SHOT_DURATION
    })
  }, [svgStart, svgEnd])

  // Generate arc path for visualization
  const arcPath = useMemo(() => {
    const keyPoints = trajectory.getKeyPoints()
    const start = keyPoints.start
    const apex = keyPoints.apex
    const end = keyPoints.end
    
    // Create a smooth quadratic bezier curve: M start Q apex end
    return `M ${start.x} ${start.y} Q ${apex.x} ${apex.y} ${end.x} ${end.y}`
  }, [trajectory])

  // Motion values for ball position
  const ballX = useMotionValue(svgStart.x)
  const ballY = useMotionValue(svgStart.y)

  // Reset animation state only once when component mounts (new shot)
  // The key prop on SVGBallAnimation ensures this component remounts for each new shot
  useEffect(() => {
    completedRef.current = false
    animationStartedRef.current = false
    setShowArc(true)
    ballX.set(svgStart.x)
    ballY.set(svgStart.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  useEffect(() => {
    // Prevent double animation
    if (completedRef.current || animationStartedRef.current) return
    
    animationStartedRef.current = true
    const startTime = Date.now()
    const duration = trajectory.getDuration()
    
    const animate = () => {
      // Double-check completion state
      if (completedRef.current) return
      
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)

      if (progress >= 1) {
        if (completedRef.current) return // Prevent double completion
        
        completedRef.current = true
        ballX.set(svgEnd.x)
        ballY.set(svgEnd.y)

        // Hide arc after animation
        setTimeout(() => {
          setShowArc(false)
        }, ARC_FADE_DURATION)

        // Call onComplete after result delay (use ref to avoid re-triggering)
        setTimeout(() => {
          if (onCompleteRef.current) {
            onCompleteRef.current()
          }
        }, RESULT_DELAY)

        return
      }

      const result = trajectory.getPositionAtProgress(progress)
      ballX.set(result.position.x)
      ballY.set(result.position.y)

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [trajectory, svgEnd, ballX, ballY])

  return (
    <svg
      viewBox={`0 0 ${COURT.W} ${COURT.H}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Trajectory arc (fades out after animation) */}
      {showArc && (
        <motion.path
          d={arcPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="3"
          strokeDasharray="5,5"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: showArc ? 0.3 : 0 }}
          transition={{ duration: ARC_FADE_DURATION / 1000 }}
        />
      )}

      {/* Animated basketball */}
      <motion.g
        style={{
          x: ballX,
          y: ballY,
        }}
      >
        <SVGBasketball
          x={0}
          y={0}
          size={40}
          rotationSpeed={BALL_ROTATION_SPEED}
          rotating={true}
        />
      </motion.g>

      {/* Debug overlay */}
      {debug && (
        <g>
          {/* Start position (green circle) */}
          <circle
            cx={svgStart.x}
            cy={svgStart.y}
            r="8"
            fill="green"
            opacity="0.7"
          />
          <text
            x={svgStart.x}
            y={svgStart.y - 15}
            fill="green"
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
          >
            START
          </text>

          {/* End position (red circle at rim) */}
          <circle
            cx={svgEnd.x}
            cy={svgEnd.y}
            r="8"
            fill="red"
            opacity="0.7"
          />
          <text
            x={svgEnd.x}
            y={svgEnd.y - 15}
            fill="red"
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
          >
            RIM
          </text>

          {/* Trajectory arc in debug color */}
          <path
            d={arcPath}
            fill="none"
            stroke="cyan"
            strokeWidth="2"
            strokeDasharray="3,3"
            opacity="0.8"
          />
        </g>
      )}
    </svg>
  )
}
