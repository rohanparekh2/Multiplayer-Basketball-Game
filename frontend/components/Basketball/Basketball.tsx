'use client'

import { useRef, useEffect } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

interface BasketballProps {
  position?: [number, number, number]
  visible?: boolean
  size?: number
}

export function Basketball({ position = [0, 2, 0], visible = true, size = 1.2 }: BasketballProps) {
  const ballRef = useRef<Mesh>(null)

  useEffect(() => {
    if (ballRef.current && visible) {
      console.log('🏀 Basketball component rendered at position:', position, 'size:', size)
    }
  }, [position, visible, size])

  useFrame((state, delta) => {
    if (ballRef.current && visible) {
      // Rotate the ball
      ballRef.current.rotation.x += delta * 2
      ballRef.current.rotation.y += delta * 2
    }
  })

  if (!visible) return null

  return (
    <group position={position}>
      {/* Main ball - larger and brighter */}
      <mesh ref={ballRef} castShadow receiveShadow>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color="#ff6b00" 
          roughness={0.6}
          metalness={0.1}
          emissive="#ff6b00"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* White outline ring for visibility */}
      <mesh>
        <sphereGeometry args={[size + 0.05, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          side={2} // DoubleSide
        />
      </mesh>
      {/* Basketball lines - using torus geometry for curved lines */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[size, 0.02, 8, 32]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size, 0.02, 8, 32]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Additional lines for basketball pattern */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[size, 0.02, 8, 32]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </group>
  )
}

