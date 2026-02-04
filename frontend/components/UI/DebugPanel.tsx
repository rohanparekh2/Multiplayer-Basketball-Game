'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import { X, Bug, Wifi, WifiOff, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { GameStateResponse } from '@/types/game'

interface DebugLog {
  timestamp: number
  type: 'api' | 'websocket' | 'error' | 'state' | 'poll'
  message: string
  data?: any
}

interface DebugPanelProps {
  gameState: GameStateResponse | null
  wsConnected: boolean
  logs: DebugLog[]
  isPolling: boolean
}

export function DebugPanel({ gameState, wsConnected, logs, isPolling }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new logs arrive
  useEffect(() => {
    if (isVisible && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isVisible])

  // Keyboard shortcut: Ctrl+D or Cmd+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setIsVisible((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'api':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />
      case 'websocket':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'state':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'poll':
        return <Clock className="w-4 h-4 text-purple-400" />
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-primary-600/80 hover:bg-primary-600 rounded-full shadow-lg backdrop-blur-sm transition-all"
        title="Toggle Debug Panel (Ctrl+D)"
      >
        <Bug className="w-5 h-5 text-white" />
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-50 w-full max-w-md"
    >
      <Card variant="strong" className="max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-display text-white">Debug Panel</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
            {wsConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs text-white/70">WebSocket Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs text-white/70">WebSocket Disconnected</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
            {isPolling ? (
              <>
                <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs text-white/70">Polling Active</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-white/30" />
                <span className="text-xs text-white/30">Polling Inactive</span>
              </>
            )}
          </div>
        </div>

        {/* Game State Info */}
        {gameState && (
          <div className="mb-4 p-3 bg-white/5 rounded text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-white/50">State:</span>
              <span className="text-white font-mono">{gameState.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Room ID:</span>
              <span className="text-white font-mono truncate ml-2">{gameState.room_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Shot Result:</span>
              <span className="text-white font-mono">
                {gameState.shot_result === null
                  ? 'null'
                  : gameState.shot_result
                  ? 'Made'
                  : 'Missed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Power:</span>
              <span className="text-white font-mono">{gameState.power ?? 'null'}</span>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="text-xs text-white/50 mb-2">Recent Logs:</div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {logs.length === 0 ? (
              <div className="text-xs text-white/30 text-center py-4">No logs yet</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-white/5 rounded text-xs hover:bg-white/10 transition-colors"
                >
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/50">{formatTimestamp(log.timestamp)}</span>
                      <span className="text-white/70 font-mono text-[10px]">{log.type}</span>
                    </div>
                    <div className="text-white/90 break-words">{log.message}</div>
                    {log.data && (
                      <details className="mt-1">
                        <summary className="text-white/50 cursor-pointer text-[10px]">
                          View Data
                        </summary>
                        <pre className="mt-1 text-[10px] text-white/60 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-white/30 text-center">
          Press Ctrl+D (Cmd+D on Mac) to toggle
        </div>
      </Card>
    </motion.div>
  )
}

