'use client'

import { useRef } from 'react'
import { Mesh } from 'three'
import { Line } from '@react-three/drei'

export function Court() {
  const courtRef = useRef<Mesh>(null)

  return (
    <group>
      {/* Court floor with better material */}
      <mesh ref={courtRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial 
          color="#FF6B35" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Court lines - center line */}
      <Line
        points={[[0, 0.01, -10], [0, 0.01, 10]]}
        color="white"
        lineWidth={3}
      />

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0, 6, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      {/* Free throw line and key */}
      <mesh position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Key area */}
      <mesh position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      {/* Three-point line arcs */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -9.5]}>
        <ringGeometry args={[6.25, 6.75, 64, 1, 0, Math.PI]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Basket with improved design */}
      <group position={[0, 3, -9.5]}>
        {/* Backboard with frame */}
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[6, 3.5, 0.2]} />
          <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.2} />
        </mesh>
        {/* Backboard glass */}
        <mesh>
          <boxGeometry args={[5.5, 3, 0.05]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.75, 0]}>
          <torusGeometry args={[0.75, 0.06, 16, 32]} />
          <meshStandardMaterial color="#ff6b00" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Net */}
        <mesh position={[0, -2.25, 0]}>
          <cylinderGeometry args={[0.75, 0.8, 0.5, 16]} />
          <meshStandardMaterial color="#ffffff" wireframe opacity={0.6} transparent />
        </mesh>
        {/* Support pole */}
        <mesh position={[0, -4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </group>

      {/* Court boundary lines */}
      <Line
        points={[[-15, 0.01, -10], [15, 0.01, -10], [15, 0.01, 10], [-15, 0.01, 10], [-15, 0.01, -10]]}
        color="white"
        lineWidth={4}
      />
    </group>
  )
}

