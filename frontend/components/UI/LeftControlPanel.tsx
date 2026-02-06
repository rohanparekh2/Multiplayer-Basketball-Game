'use client'

import { ReactNode } from 'react'

export function LeftControlPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-2xl p-6 w-full max-w-[320px] max-h-[85vh] overflow-y-auto">
      <div className="mb-3">
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-sm text-gray-700">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}
