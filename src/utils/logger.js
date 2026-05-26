/**
 * Production-safe logging utility
 * Only logs in development mode to prevent exposing debug info in production
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args)
  },

  warn: (...args) => {
    if (isDev) console.warn(...args)
  },

  error: (...args) => {
    // Always log errors, but strip stack traces in production
    if (isDev) {
      console.error(...args)
    } else {
      // In production, log a sanitized version
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return `Error: ${arg.message}`
        }
        return arg
      })
      console.error(...sanitized)
    }
  },

  debug: (...args) => {
    if (isDev) console.debug(...args)
  },

  info: (...args) => {
    if (isDev) console.info(...args)
  },

  // Group logging for complex operations
  group: (label, fn) => {
    if (isDev) {
      console.group(label)
      fn()
      console.groupEnd()
    }
  },

  // Time tracking for performance debugging
  time: (label) => {
    if (isDev) console.time(label)
  },

  timeEnd: (label) => {
    if (isDev) console.timeEnd(label)
  }
}

// Default export for convenience
export default logger
