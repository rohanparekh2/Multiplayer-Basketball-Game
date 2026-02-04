'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export function CameraControls() {
  const { camera } = useThree()

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 15, 20)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return null
}

