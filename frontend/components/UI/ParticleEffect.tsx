'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface ParticleEffectProps {
  show: boolean
  type: 'made' | 'missed'
  onComplete: () => void
}

export function ParticleEffect({ show, type, onComplete }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!show) {
      setParticles([])
      return
    }

    // Create particles
    const newParticles: Particle[] = []
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: 50, // Center
        y: 50,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
      })
    }
    setParticles(newParticles)

    // Animate particles
    const interval = setInterval(() => {
      setParticles((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
          vy: p.vy + 0.1, // Gravity
        })).filter((p) => p.life > 0)

        if (updated.length === 0) {
          clearInterval(interval)
          onComplete()
        }
        return updated
      })
    }, 16)

    return () => clearInterval(interval)
  }, [show, onComplete])

  if (!show || particles.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 rounded-full ${
            type === 'made' ? 'bg-yellow-400' : 'bg-gray-400'
          }`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.life,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}

