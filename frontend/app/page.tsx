'use client'

import { GameCanvas } from '@/components/GameCanvas/GameCanvas'
import { GameUI } from '@/components/UI/GameUI'
import { DebugProvider } from '@/contexts/DebugContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Home() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:8',message:'Home render entry',data:{hasWoodBackground:true,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion

  return (
    <ErrorBoundary>
      <DebugProvider>
        <main 
          className="h-screen w-screen grid grid-cols-[320px_1fr_320px]"
          role="main"
          style={{
            backgroundImage: "url(/wood.png)",
            backgroundRepeat: "repeat",
            backgroundSize: "500px auto",
          }}
        >
          {/* Left column - Game UI */}
          <div className="flex items-center justify-center p-6">
            <ErrorBoundary>
              <GameUI mode="left" />
            </ErrorBoundary>
          </div>

          {/* Center column - Court */}
          <div className="relative flex items-center justify-center">
            <ErrorBoundary fallback={
              <div className="flex items-center justify-center bg-black/90 z-50">
                <div className="text-white text-center">
                  <h2 className="text-2xl mb-4">Canvas Error</h2>
                  <p className="text-white/70">The 3D canvas encountered an error. The UI should still work.</p>
                </div>
              </div>
            }>
              <GameCanvas />
            </ErrorBoundary>
          </div>

          {/* Right column - Scoreboard */}
          <div className="flex items-start justify-center p-6">
            <GameUI mode="right" />
          </div>
        </main>
      </DebugProvider>
    </ErrorBoundary>
  )
}
