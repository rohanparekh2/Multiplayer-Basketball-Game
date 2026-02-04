'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X, AlertCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onClose])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success-400" />,
    error: <XCircle className="w-5 h-5 text-error-400" />,
    warning: <AlertCircle className="w-5 h-5 text-primary-400" />,
    info: <AlertCircle className="w-5 h-5 text-blue-400" />,
  }

  const bgColors = {
    success: 'bg-success-500/20 border-success-500/50',
    error: 'bg-error-500/20 border-error-500/50',
    warning: 'bg-primary-500/20 border-primary-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`glass-strong ${bgColors[toast.type]} border rounded-xl p-4 flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-white text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-white/60 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return { toasts, showToast, removeToast }
}

