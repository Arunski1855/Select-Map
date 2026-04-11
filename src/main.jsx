import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Initialize Sentry — no-ops gracefully when DSN is absent (dev / CI)
if (typeof __SENTRY_DSN__ !== 'undefined' && __SENTRY_DSN__) {
  Sentry.init({
    dsn: __SENTRY_DSN__,
    environment: import.meta.env.MODE,
    // Capture 100% of errors, 10% of performance traces
    tracesSampleRate: 0.1,
    // Don't send PII
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
      }
      return event
    },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
