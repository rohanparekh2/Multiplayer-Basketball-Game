'use client'

import { Component, ReactNode } from 'react'
import { Card } from './UI/Card'
import { Button } from './UI/Button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <Card variant="strong" className="text-center max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-error-400 mx-auto mb-4" />
            <h2 className="text-2xl font-display text-error-400 mb-4">Something went wrong</h2>
            <p className="text-white/80 mb-2">{this.state.error?.message || 'An unexpected error occurred'}</p>
            {this.state.error && (
              <details className="text-left mt-4 mb-4">
                <summary className="text-white/60 cursor-pointer text-sm">Error Details</summary>
                <pre className="mt-2 text-xs text-white/50 overflow-auto max-h-40 p-2 bg-black/20 rounded">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button variant="primary" onClick={this.handleReset} className="mt-4">
              Reload Page
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

