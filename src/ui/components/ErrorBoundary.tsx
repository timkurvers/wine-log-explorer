import React from 'react'

import Error from './Error'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { children } = this.props
    const { error } = this.state
    if (error) {
      return <Error error={error} />
    }
    return children
  }
}

export default ErrorBoundary
