'use client'

import { motion } from 'framer-motion'
import { BALL_ROTATION_SPEED } from '@/utils/animationConstants'

interface SVGBasketballProps {
  x: number
  y: number
  size?: number
  rotating?: boolean
  rotationSpeed?: number
}

/**
 * SVG basketball component
 * Clean design with subtle rotation animation
 */
export function SVGBasketball({
  x,
  y,
  size = 40,
  rotating = false,
  rotationSpeed = BALL_ROTATION_SPEED
}: SVGBasketballProps) {
  const ballColor = '#FF6B00'
  const lineColor = '#000000'

  return (
    <motion.g
      transform={`translate(${x}, ${y})`}
      animate={rotating ? { rotate: [0, rotationSpeed] } : {}}
      transition={
        rotating
          ? {
              rotate: {
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }
            }
          : {}
      }
    >
      {/* Main ball circle */}
      <circle
        cx="0"
        cy="0"
        r={size}
        fill={ballColor}
        stroke={lineColor}
        strokeWidth="2"
      />

      {/* Basketball lines pattern */}
      {/* Horizontal line */}
      <line
        x1={-size}
        y1="0"
        x2={size}
        y2="0"
        stroke={lineColor}
        strokeWidth="2"
      />

      {/* Vertical line */}
      <line
        x1="0"
        y1={-size}
        x2="0"
        y2={size}
        stroke={lineColor}
        strokeWidth="2"
      />

      {/* Curved lines (simplified) */}
      <path
        d={`M ${-size} 0 A ${size} ${size * 0.6} 0 0 1 ${size} 0`}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
      />
      <path
        d={`M ${-size} 0 A ${size} ${size * 0.6} 0 0 0 ${size} 0`}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
      />
    </motion.g>
  )
}

