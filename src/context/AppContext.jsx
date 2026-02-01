import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  subscribeToPrograms,
  subscribeToEvents,
  onAuthChange,
  subscribeToAllowedUsers
} from '../firebase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Core navigation
  const [activeTab, setActiveTab] = useState('basketball')

  // Auth
  const [user, setUser] = useState(null)
  const [allowedUsers, setAllowedUsers] = useState([])

  // Programs
  const [programs, setPrograms] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Events
  const [events, setEvents] = useState([])
  const [isEventsLoading, setIsEventsLoading] = useState(true)

  // UI state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [selectedProgram, setSelectedProgram] = useState(null)

  // Derived
  const isUserAllowed = user && allowedUsers.includes(user.email?.toLowerCase())

  // Auth subscription
  useEffect(() => {
    const unsubscribe = onAuthChange(setUser)
    return () => unsubscribe()
  }, [])

  // Allowed users subscription
  useEffect(() => {
    const unsubscribe = subscribeToAllowedUsers(setAllowedUsers)
    return () => unsubscribe()
  }, [])

  // Programs subscription
  useEffect(() => {
    if (activeTab === 'events') return
    setIsLoading(true)
    const unsubscribe = subscribeToPrograms(activeTab, (data) => {
      setPrograms(data)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [activeTab])

  // Events subscription
  useEffect(() => {
    setIsEventsLoading(true)
    const unsubscribe = subscribeToEvents((data) => {
      setEvents(data)
      setIsEventsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Dark mode persistence
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), [])

  const value = {
    activeTab,
    setActiveTab,
    user,
    allowedUsers,
    isUserAllowed,
    programs,
    setPrograms,
    isLoading,
    events,
    setEvents,
    isEventsLoading,
    darkMode,
    toggleDarkMode,
    selectedProgram,
    setSelectedProgram
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
