'use client'

import { GameCanvas } from '@/components/GameCanvas/GameCanvas'
import { GameUI } from '@/components/UI/GameUI'
import { DebugProvider } from '@/contexts/DebugContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Home() {
  return (
    <ErrorBoundary>
      <DebugProvider>
        <main className="w-screen h-screen relative overflow-hidden" role="main">
          <ErrorBoundary fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
              <div className="text-white text-center">
                <h2 className="text-2xl mb-4">Canvas Error</h2>
                <p className="text-white/70">The 3D canvas encountered an error. The UI should still work.</p>
              </div>
            </div>
          }>
            <GameCanvas />
          </ErrorBoundary>
          <GameUI />
        </main>
      </DebugProvider>
    </ErrorBoundary>
  )
}

