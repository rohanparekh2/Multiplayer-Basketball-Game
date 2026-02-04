'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface DebugLog {
  timestamp: number
  type: 'api' | 'websocket' | 'error' | 'state' | 'poll'
  message: string
  data?: any
}

interface DebugContextType {
  logs: DebugLog[]
  addLog: (log: Omit<DebugLog, 'timestamp'>) => void
  clearLogs: () => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

export function DebugProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<DebugLog[]>([])

  const addLog = useCallback((log: Omit<DebugLog, 'timestamp'>) => {
    setLogs((prev) => {
      const newLog: DebugLog = {
        ...log,
        timestamp: Date.now(),
      }
      // Keep only last 50 logs
      const updated = [...prev, newLog].slice(-50)
      return updated
    })
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return (
    <DebugContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebug must be used within DebugProvider')
  }
  return context
}

