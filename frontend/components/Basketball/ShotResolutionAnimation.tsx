'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ANCHORS, D } from '../Court/courtConstants'

interface ShotResolutionAnimationProps {
  made: boolean
  onComplete: () => void
  debug?: boolean
}

/**
 * Shot resolution animation with clearly different make vs miss animations
 * MAKE: Smooth arc + swish through net + green flash
 * MISS: Arc to rim + bounce/shake + red flash
 */
export function ShotResolutionAnimation({
  made,
  onComplete,
  debug = false
}: ShotResolutionAnimationProps) {
  const start = ANCHORS.startBall
  const rim = ANCHORS.rim

  if (made) {
    // MADE ANIMATION: Higher, smoother arc with perfect swish
    const madeApex = {
      x: (start.x + rim.x) / 2,
      y: Math.min(start.y, rim.y) - 300 // Higher arc for made shots
    }

    const madePath = {
      cx: [start.x, madeApex.x, rim.x, rim.x, rim.x],
      cy: [start.y, madeApex.y, rim.y, rim.y + 80, rim.y + 150],
      scale: [1, 1, 1, 1, 1], // Keep ball size constant
      rotate: [0, 30, 90, 150, 200], // Smoother rotation
    }

    return (
      <svg
        viewBox="0 0 1100 850"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ball animation */}
        <motion.circle
          r="28"
          fill="#ff6b00"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="3"
          initial={{ cx: start.x, cy: start.y, scale: 1, rotate: 0 }}
          animate={madePath}
          transition={{
            duration: 1.5,
            times: [0, 0.45, 0.7, 0.9, 1],
            ease: [0.3, 0, 0.1, 1], // Very smooth ease for made shots
          }}
          onAnimationComplete={onComplete}
        />

        {/* Swish effect - green particles/net movement */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {/* Net swish lines */}
          {[...Array(5)].map((_, i) => (
            <motion.line
              key={i}
              x1={rim.x - 15 + i * 7.5}
              y1={rim.y}
              x2={rim.x - 15 + i * 7.5}
              y2={rim.y + 40}
              stroke="rgba(34, 197, 94, 0.6)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0] }}
              transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
            />
          ))}
        </motion.g>

        {/* Green flash on rim */}
        <motion.circle
          cx={rim.x}
          cy={rim.y}
          r={35}
          fill="rgba(34, 197, 94, 0.3)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.3, 1.5], opacity: [0, 0.6, 0] }}
          transition={{ delay: 0.7, duration: 0.5 }}
        />

        {/* Success particles */}
        <motion.g>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const distance = 30
            return (
              <motion.circle
                key={i}
                r="3"
                fill="#22c55e"
                initial={{ cx: rim.x, cy: rim.y, opacity: 0 }}
                animate={{
                  cx: rim.x + Math.cos(angle) * distance,
                  cy: rim.y + Math.sin(angle) * distance,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  delay: 0.75,
                  duration: 0.6,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </motion.g>

        {/* Debug overlay */}
        {debug && (
          <g>
            <circle cx={start.x} cy={start.y} r="8" fill="green" opacity="0.7" />
            <circle cx={rim.x} cy={rim.y} r="8" fill="green" opacity="0.7" />
            <text x={rim.x} y={rim.y - 15} fill="green" fontSize="12" textAnchor="middle">
              MADE
            </text>
          </g>
        )}
      </svg>
    )
  } else {
    // MISS ANIMATION: Lower, flatter arc that hits rim at angle, then dramatic bounce
    const missDir = Math.random() < 0.5 ? -1 : 1
    const missApex = {
      x: (start.x + rim.x) / 2 + missDir * 40, // Offset apex for angled approach
      y: Math.min(start.y, rim.y) - 140 // Lower arc for missed shots
    }
    
    const rimHitX = rim.x + missDir * 25 // Hit rim on the side
    const bounceX = rim.x + missDir * 140
    const bounceY = rim.y + 110
    const finalX = bounceX + missDir * 80

    const missPath = {
      cx: [start.x, missApex.x, rimHitX, bounceX, finalX],
      cy: [start.y, missApex.y, rim.y, bounceY, bounceY + 120],
      scale: [1, 1, 1, 1, 1],
      rotate: [0, 120, 300, 480, 660], // More dramatic spin
    }

    return (
      <svg
        viewBox="0 0 1100 850"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ball animation with bounce */}
        <motion.circle
          r="28"
          fill="#ff6b00"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="3"
          initial={{ cx: start.x, cy: start.y, scale: 1, rotate: 0 }}
          animate={missPath}
          transition={{
            duration: 1.8,
            times: [0, 0.4, 0.55, 0.75, 1],
            ease: [0.6, 0, 0.4, 1], // More abrupt, bouncy ease for misses
          }}
          onAnimationComplete={onComplete}
        />

        {/* Rim shake effect */}
        <motion.g
          animate={{
            x: [0, -3, 3, -2, 2, -1, 1, 0],
            y: [0, -1, 1, -1, 1, 0],
          }}
          transition={{
            delay: 0.65,
            duration: 0.4,
            ease: 'easeInOut',
          }}
        >
          {/* Rim representation */}
          <circle
            cx={rim.x}
            cy={rim.y}
            r="25"
            fill="none"
            stroke="rgba(239, 68, 68, 0.4)"
            strokeWidth="3"
          />
        </motion.g>

        {/* Red flash on rim */}
        <motion.circle
          cx={rim.x}
          cy={rim.y}
          r={35}
          fill="rgba(239, 68, 68, 0.3)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.3, 1.5], opacity: [0, 0.6, 0] }}
          transition={{ delay: 0.65, duration: 0.5 }}
        />

        {/* Bounce impact effect */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.65, duration: 0.3 }}
        >
          {/* Impact rings */}
          {[1, 2, 3].map((ring) => (
            <motion.circle
              key={ring}
              cx={rim.x}
              cy={rim.y}
              r={20 + ring * 10}
              fill="none"
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ delay: 0.65 + ring * 0.1, duration: 0.4 }}
            />
          ))}
        </motion.g>

        {/* Miss particles */}
        <motion.g>
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2
            const distance = 25
            return (
              <motion.circle
                key={i}
                r="2"
                fill="#ef4444"
                initial={{ cx: rim.x, cy: rim.y, opacity: 0 }}
                animate={{
                  cx: rim.x + Math.cos(angle) * distance,
                  cy: rim.y + Math.sin(angle) * distance,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  delay: 0.7,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </motion.g>

        {/* Debug overlay */}
        {debug && (
          <g>
            <circle cx={start.x} cy={start.y} r="8" fill="red" opacity="0.7" />
            <circle cx={rim.x} cy={rim.y} r="8" fill="red" opacity="0.7" />
            <circle cx={bounceX} cy={bounceY} r="8" fill="orange" opacity="0.7" />
            <text x={rim.x} y={rim.y - 15} fill="red" fontSize="12" textAnchor="middle">
              MISS
            </text>
          </g>
        )}
      </svg>
    )
  }
}

