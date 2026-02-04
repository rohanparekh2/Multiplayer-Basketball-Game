'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import { Sparkles, SpotLight } from '@react-three/drei'
import { Basketball } from './Basketball'

interface BallAnimationProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  made: boolean
  onComplete: () => void
}

export function BallAnimation({ startPosition, endPosition, made, onComplete }: BallAnimationProps) {
  const ballGroupRef = useRef<Group>(null)
  const progressRef = useRef(0)
  const startRef = useRef(new Vector3(...startPosition))
  const endRef = useRef(new Vector3(...endPosition))
  const completedRef = useRef(false)
  const { camera } = useThree()

  // Reset animation when props change - ensure it always starts
  useEffect(() => {
    console.log('🎬 BallAnimation component MOUNTED/RESET:', { startPosition, endPosition, made })
    
    // Force reset everything
    progressRef.current = 0
    completedRef.current = false
    startRef.current = new Vector3(...startPosition)
    endRef.current = new Vector3(...endPosition)
    
    // Use a small delay to ensure ref is set
    const timer = setTimeout(() => {
      if (ballGroupRef.current) {
        ballGroupRef.current.position.set(...startPosition)
        console.log('✅ BallAnimation: Ball group ref set, position:', ballGroupRef.current.position)
        console.log('✅ BallAnimation: Ball group is in scene:', ballGroupRef.current.parent !== null)
        console.log('✅ BallAnimation: Animation will start now')
      } else {
        console.warn('⚠️ BallAnimation: ballGroupRef.current is null after timeout!')
      }
    }, 10)
    
    return () => {
      clearTimeout(timer)
    }
  }, [startPosition, endPosition, made])
  
  // Verify component is rendering
  useEffect(() => {
    console.log('🎬 BallAnimation component rendered in DOM')
    return () => {
      console.log('🎬 BallAnimation component unmounting')
    }
  }, [])

  useFrame((state, delta) => {
    if (completedRef.current || !ballGroupRef.current) {
      return
    }

    // Ensure animation always progresses - use consistent speed
    const animationSpeed = 0.8 // Slower speed for more visible animation (~3 seconds total)
    const newProgress = progressRef.current + delta * animationSpeed
    progressRef.current = newProgress
    
    if (newProgress >= 1) {
      if (!completedRef.current) {
        completedRef.current = true
        console.log('🎬 BallAnimation: Animation completed, showing particles:', made)
        // Add a delay before calling onComplete so user can see the result
        // This ensures the animation is visible for at least 1.5 seconds after completion
        console.log('🎬 BallAnimation: Animation finished, waiting before calling onComplete...')
        setTimeout(() => {
          console.log('🎬 BallAnimation: Calling onComplete callback after delay')
          try {
            onComplete()
          } catch (err) {
            console.error('❌ Error in onComplete callback:', err)
          }
        }, made ? 1500 : 1200) // Show result for 1.5s if made, 1.2s if missed
      }
      return
    }

    // Parabolic trajectory
    const t = newProgress
    const start = startRef.current
    const end = endRef.current
    
    // Calculate midpoint for arc
    const midX = (start.x + end.x) / 2
    const midY = Math.max(start.y, end.y) + (made ? 10 : 7) // Higher arc if made
    const midZ = (start.z + end.z) / 2

    // Quadratic bezier curve
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * midX + t * t * end.x
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * midY + t * t * end.y
    const z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * midZ + t * t * end.z

    // Direct position update - this is the key change
    ballGroupRef.current.position.set(x, y, z)
    
    // Camera follow for better visibility
    if (newProgress > 0.2 && newProgress < 0.95) {
      const targetPos = new Vector3(x * 0.4, y + 6, z + 10)
      camera.position.lerp(targetPos, 0.15)
      camera.lookAt(x, y, z)
    } else if (newProgress >= 0.95) {
      // Reset camera
      camera.position.lerp(new Vector3(0, 15, 20), 0.1)
      camera.lookAt(0, 0, 0)
    }
  })

  // Log progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (progressRef.current > 0 && progressRef.current < 1 && !completedRef.current && ballGroupRef.current) {
        const pos = ballGroupRef.current.position
        console.log('🎬 BallAnimation progress:', Math.round(progressRef.current * 100) + '%', 'position:', {
          x: pos.x.toFixed(2),
          y: pos.y.toFixed(2),
          z: pos.z.toFixed(2),
        })
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Track position for spotlight
  const [spotlightPosition, setSpotlightPosition] = useState<Vector3>(new Vector3(...startPosition))

  // Update spotlight position in useFrame
  useFrame(() => {
    if (ballGroupRef.current) {
      const pos = ballGroupRef.current.position
      setSpotlightPosition(new Vector3(pos.x, pos.y + 3, pos.z + 2))
    }
  })

  // Ensure ball is always visible - render immediately
  const ballPosition = ballGroupRef.current?.position || new Vector3(...startPosition)

  return (
    <group>
      {/* Main animated ball group - this is the actual moving ball */}
      {/* Position is set directly in useFrame, but we set initial position here */}
      <group ref={ballGroupRef} position={startPosition}>
        <Basketball position={[0, 0, 0]} visible={true} size={1.2} />
      </group>
      
      {/* Spotlight following the ball for better visibility */}
      <SpotLight
        position={[spotlightPosition.x, spotlightPosition.y, spotlightPosition.z]}
        angle={0.4}
        penumbra={0.5}
        intensity={3}
        color="#ffffff"
        castShadow
        target-position={[ballPosition.x, ballPosition.y, ballPosition.z]}
      />
      
      {/* Particles at end position when made */}
      {completedRef.current && made && (
        <Sparkles
          position={[endPosition[0], endPosition[1], endPosition[2]]}
          count={50}
          scale={2}
          size={2}
          speed={0.4}
          color="#22c55e"
        />
      )}
    </group>
  )
}
