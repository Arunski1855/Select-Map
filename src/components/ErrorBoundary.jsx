import { Component } from 'react'
import * as Sentry from '@sentry/react'
import logger from '../utils/logger'

/**
 * Global error boundary to catch React rendering errors
 * Prevents white-screen crashes and provides recovery options
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Application error caught by ErrorBoundary:', error)
    logger.error('Component stack:', errorInfo?.componentStack)
    this.setState({ errorInfo })
    Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.iconContainer}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E500A4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 style={styles.title}>SOMETHING WENT WRONG</h1>

            <p style={styles.message}>
              The application encountered an unexpected error.
              {import.meta.env.DEV && this.state.error && (
                <span style={styles.errorDetail}>
                  <br />
                  <code>{this.state.error.message}</code>
                </span>
              )}
            </p>

            <div style={styles.buttonGroup}>
              <button onClick={this.handleReset} style={styles.secondaryButton}>
                TRY AGAIN
              </button>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                RELOAD APP
              </button>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details style={styles.details}>
                <summary style={styles.summary}>Stack Trace (Dev Only)</summary>
                <pre style={styles.stack}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'adidasFG, Arial, sans-serif',
    padding: '20px'
  },
  content: {
    maxWidth: '500px',
    textAlign: 'center'
  },
  iconContainer: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    marginBottom: '16px',
    fontStyle: 'italic'
  },
  message: {
    fontSize: '14px',
    color: '#999',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  errorDetail: {
    display: 'block',
    marginTop: '12px',
    color: '#E500A4',
    fontSize: '12px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  primaryButton: {
    background: '#E500A4',
    color: '#fff',
    border: 'none',
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontFamily: 'adidasFG, Arial, sans-serif'
  },
  secondaryButton: {
    background: 'transparent',
    color: '#fff',
    border: '2px solid #fff',
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontFamily: 'adidasFG, Arial, sans-serif'
  },
  details: {
    marginTop: '32px',
    textAlign: 'left'
  },
  summary: {
    cursor: 'pointer',
    color: '#666',
    fontSize: '12px',
    marginBottom: '8px'
  },
  stack: {
    background: '#111',
    padding: '12px',
    fontSize: '10px',
    overflow: 'auto',
    maxHeight: '200px',
    color: '#888'
  }
}

export default ErrorBoundary
