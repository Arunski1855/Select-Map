/**
 * Debounce utility to prevent rapid duplicate operations
 * Useful for Firebase writes triggered by user input
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before executing
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout

  const debounced = function executedFunction(...args) {
    const context = this

    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }

  debounced.cancel = () => {
    clearTimeout(timeout)
    timeout = null
  }

  return debounced
}

/**
 * Creates a throttled version of a function
 * Executes at most once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Minimum milliseconds between executions
 * @returns {Function} Throttled function
 */
export function throttle(func, wait = 300) {
  let lastTime = 0
  let timeout

  return function throttled(...args) {
    const context = this
    const now = Date.now()

    if (now - lastTime >= wait) {
      func.apply(context, args)
      lastTime = now
    } else {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        func.apply(context, args)
        lastTime = Date.now()
      }, wait - (now - lastTime))
    }
  }
}

/**
 * React hook for debounced values
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {any} Debounced value
 */
export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook for debounced callbacks
 * @param {Function} callback - Callback to debounce
 * @param {number} delay - Debounce delay in ms
 * @param {Array} deps - Dependencies array
 * @returns {Function} Debounced callback
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    debounce((...args) => callbackRef.current(...args), delay),
    [delay, ...deps]
  )
}

export default debounce
