import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { toPng } from 'html-to-image'
import {
  subscribeToPrograms,
  addProgram,
  deleteProgram,
  editProgram,
  signIn,
  signUp,
  signInWithGoogle,
  logOut,
  onAuthChange,
  addProgramHistory,
  subscribeToProgramHistory,
  subscribeToAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
  addEvent,
  deleteEvent,
  editEvent,
  subscribeToEvents,
  addNote,
  deleteNote,
  subscribeToNotes,
  addScheduleEntry,
  deleteScheduleEntry,
  subscribeToSchedule,
  archiveProgram,
  restoreProgram,
  subscribeToArchivedPrograms,
  linkEventToPrograms
} from './firebase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import AddProgramForm from './components/AddProgramForm'
import AddEventForm from './components/AddEventForm'
import SplashScreen from './components/SplashScreen'
import DetailPanel from './components/DetailPanel'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Region definitions with colors
const REGIONS = {
  'Canada': { color: '#d4002a', states: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'] },
  'Mid Atlantic': { color: '#005eb8', states: ['NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV'] },
  'South': { color: '#ff6b00', states: ['FL', 'GA', 'SC', 'NC', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'TX', 'OK'] },
  'Midwest': { color: '#7d2d8e', states: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'] },
  'North': { color: '#1a9fc9', states: ['ME', 'NH', 'VT', 'MA', 'CT', 'RI'] },
  'West': { color: '#00a550', states: ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'CO', 'NM', 'ID', 'MT', 'WY', 'AK', 'HI'] }
}

// Create custom icon for each program logo (cached to prevent unnecessary re-renders)
const iconCache = new Map()
const createLogoIcon = (logoUrl, name, useContain = false) => {
  const cacheKey = `${logoUrl}|${name}|${useContain}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)
  const icon = L.divIcon({
    className: 'custom-logo-marker',
    html: `
      <div class="logo-marker${useContain ? ' logo-contain' : ''}" title="${name}">
        <img src="${logoUrl}" alt="${name}" onerror="this.style.display='none'" />
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34]
  })
  iconCache.set(cacheKey, icon)
  return icon
}

// Tab configuration
const TABS = [
  { id: 'basketball', name: 'Select Basketball', icon: '/logos/adidas-select-basketball.png' },
  { id: 'football', name: 'Select Football (Mahomes)', icon: '/logos/mahomes-logo.png' },
  { id: 'events', name: 'Select Events', icon: '/logos/adidas-logo.png' }
]

// Auth Modal Component
function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

// History Modal Component
function HistoryModal({ isOpen, onClose, program, sport }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (isOpen && program) {
      const unsubscribe = subscribeToProgramHistory(sport, program.id, setHistory)
      return () => unsubscribe()
    }
  }, [isOpen, program, sport])

  if (!isOpen || !program) return null

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>History: {program.name}</h2>

        {history.length === 0 ? (
          <p className="no-history">No history recorded yet.</p>
        ) : (
          <ul className="history-list">
            {history.map(entry => (
              <li key={entry.id} className="history-item">
                <span className={`history-action ${entry.action}`}>{entry.action}</span>
                <span className="history-user">{entry.userEmail}</span>
                <span className="history-time">{formatDate(entry.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// Dynamic tile layer that swaps without remounting the map
function DynamicTileLayer({ darkMode }) {
  const map = useMap()
  const url = darkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

  useEffect(() => {
    const tileLayer = L.tileLayer(url, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    })
    tileLayer.addTo(map)
    return () => { map.removeLayer(tileLayer) }
  }, [url, map])

  return null
}

// State abbreviation labels visible at default zoom
const STATE_CENTERS = {
  AL:[32.8,-86.8],AK:[64.2,-152.5],AZ:[34.3,-111.7],AR:[34.8,-92.2],CA:[37.2,-119.5],
  CO:[39.0,-105.5],CT:[41.6,-72.7],DE:[39.0,-75.5],FL:[28.6,-82.4],GA:[32.7,-83.5],
  HI:[20.5,-157.5],ID:[44.4,-114.6],IL:[40.0,-89.2],IN:[39.9,-86.3],IA:[42.0,-93.5],
  KS:[38.5,-98.3],KY:[37.8,-85.7],LA:[31.0,-92.0],ME:[45.4,-69.2],MD:[39.0,-76.8],
  MA:[42.3,-71.8],MI:[44.3,-85.6],MN:[46.3,-94.3],MS:[32.7,-89.7],MO:[38.4,-92.5],
  MT:[47.0,-109.6],NE:[41.5,-99.8],NV:[39.3,-116.6],NH:[43.7,-71.6],NJ:[40.1,-74.7],
  NM:[34.4,-106.1],NY:[42.9,-75.5],NC:[35.5,-79.8],ND:[47.4,-100.5],OH:[40.4,-82.7],
  OK:[35.6,-97.5],OR:[44.0,-120.5],PA:[40.9,-77.8],RI:[41.7,-71.5],SC:[33.9,-80.9],
  SD:[44.4,-100.2],TN:[35.9,-86.4],TX:[31.5,-99.3],UT:[39.3,-111.7],VT:[44.1,-72.6],
  VA:[37.5,-78.8],WA:[47.4,-120.5],WV:[38.6,-80.6],WI:[44.6,-89.8],WY:[43.0,-107.5],
  DC:[38.9,-77.0]
}

function StateLabels() {
  const map = useMap()
  useEffect(() => {
    const labels = Object.entries(STATE_CENTERS).map(([abbr, [lat, lng]]) =>
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'state-label-icon',
          html: `<span class="state-label">${abbr}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        }),
        interactive: false,
        keyboard: false
      })
    )
    const group = L.layerGroup(labels)
    group.addTo(map)
    return () => { map.removeLayer(group) }
  }, [map])
  return null
}

// Preserve map view (center + zoom) across re-renders / data refreshes
function MapViewPreserver() {
  const map = useMap()
  const savedView = useRef(null)
  const resizing = useRef(false)
  const restoring = useRef(false)

  useEffect(() => {
    let saveTimeout = null
    const onMoveEnd = () => {
      // Ignore view changes triggered by container resize (e.g. form open/close)
      if (resizing.current || restoring.current) return
      // Debounce saving to avoid capturing intermediate states during data updates
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        savedView.current = { center: map.getCenter(), zoom: map.getZoom() }
      }, 100)
    }
    const onResize = () => {
      resizing.current = true
      // After Leaflet finishes adjusting for the resize, restore our saved view
      setTimeout(() => {
        if (savedView.current) {
          restoring.current = true
          map.setView(savedView.current.center, savedView.current.zoom, { animate: false })
          setTimeout(() => { restoring.current = false }, 100)
        }
        resizing.current = false
      }, 50)
    }
    map.on('moveend', onMoveEnd)
    map.on('zoomend', onMoveEnd)
    map.on('resize', onResize)
    // Capture initial view
    savedView.current = { center: map.getCenter(), zoom: map.getZoom() }

    return () => {
      clearTimeout(saveTimeout)
      map.off('moveend', onMoveEnd)
      map.off('zoomend', onMoveEnd)
      map.off('resize', onResize)
    }
  }, [map])

  // On every render, if the map was reset, restore saved view
  useEffect(() => {
    if (savedView.current) {
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      const saved = savedView.current
      const dist = Math.abs(currentCenter.lat - saved.center.lat) + Math.abs(currentCenter.lng - saved.center.lng)
      if (dist > 0.5 || Math.abs(currentZoom - saved.zoom) > 0.5) {
        restoring.current = true
        map.setView(saved.center, saved.zoom, { animate: false })
        setTimeout(() => { restoring.current = false }, 100)
      }
    }
  })

  return null
}

// Map click handler to center on marker
function FlyToMarker({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.panTo(position, { duration: 0.3 })
    }
  }, [position, map])
  return null
}

// DetailPanel is now imported from ./components/DetailPanel

// Admin Panel Component for managing allowed users
function AdminPanel({ isOpen, onClose, allowedUsers }) {
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    setLoading(true)
    setError('')

    try {
      await addAllowedUser(newEmail.trim())
      setNewEmail('')
    } catch (err) {
      setError('Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (email) => {
    if (window.confirm(`Remove ${email} from allowed users?`)) {
      try {
        await removeAllowedUser(email)
      } catch (err) {
        alert('Failed to remove user')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Manage Authorized Users</h2>
        <p className="admin-description">
          Only users on this list can add, edit, or remove programs.
        </p>

        <form onSubmit={handleAddUser} className="add-user-form">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <div className="allowed-users-list">
          <h3>Authorized Users ({allowedUsers.length})</h3>
          {allowedUsers.length === 0 ? (
            <p className="no-users">No users added yet. Add your email first!</p>
          ) : (
            <ul>
              {allowedUsers.map(email => (
                <li key={email}>
                  <span>{email}</span>
                  <button onClick={() => handleRemoveUser(email)} className="remove-user-btn">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// Calendar View Component
function EventCalendar({ events, onSelectDate, selectedDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewDate.year, viewDate.month, 1).getDay()
  const monthName = new Date(viewDate.year, viewDate.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  // Build a map of date -> events
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(event => {
      if (!event.date) return
      const start = event.date
      const end = event.endDate || event.date
      // Mark each day in the range
      let d = new Date(start + 'T00:00:00')
      const endD = new Date(end + 'T00:00:00')
      while (d <= endD) {
        const key = d.toISOString().split('T')[0]
        if (!map[key]) map[key] = []
        map[key].push(event)
        d.setDate(d.getDate() + 1)
      }
    })
    return map
  }, [events])

  const prevMonth = () => {
    setViewDate(v => {
      const m = v.month - 1
      return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m }
    })
  }

  const nextMonth = () => {
    setViewDate(v => {
      const m = v.month + 1
      return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  const cells = []
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-cell cal-empty" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEvents = eventsByDate[dateStr] || []
    const isToday = dateStr === today
    const isSelected = dateStr === selectedDate
    cells.push(
      <div
        key={day}
        className={`cal-cell ${dayEvents.length ? 'cal-has-events' : ''} ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}`}
        onClick={() => dayEvents.length && onSelectDate(dateStr)}
      >
        <span className="cal-day-num">{day}</span>
        {dayEvents.length > 0 && (
          <div className="cal-dots">
            {dayEvents.slice(0, 3).map((ev, i) => (
              <span key={i} className={`cal-dot ${ev.proposed ? 'cal-dot-proposed' : ''}`} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="event-calendar">
      <div className="cal-nav">
        <button onClick={prevMonth}>&lsaquo;</button>
        <span className="cal-month-label">{monthName}</span>
        <button onClick={nextMonth}>&rsaquo;</button>
      </div>
      <div className="cal-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells}
      </div>
    </div>
  )
}

// Analytics Modal Component
function AnalyticsModal({ isOpen, onClose, programs, events, sport }) {
  if (!isOpen) return null

  // Region distribution
  const regionData = useMemo(() => {
    const counts = {}
    Object.keys(REGIONS).forEach(r => { counts[r] = 0 })
    programs.forEach(p => { if (p.region && counts[p.region] !== undefined) counts[p.region]++ })
    return counts
  }, [programs])

  const maxRegionCount = Math.max(...Object.values(regionData), 1)

  // Conference distribution (top 8)
  const conferenceData = useMemo(() => {
    const counts = {}
    programs.forEach(p => {
      if (p.conference) {
        counts[p.conference] = (counts[p.conference] || 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [programs])

  const maxConfCount = conferenceData.length ? Math.max(...conferenceData.map(c => c[1]), 1) : 1

  // State distribution (top 10)
  const stateData = useMemo(() => {
    const counts = {}
    programs.forEach(p => {
      if (p.state) {
        counts[p.state] = (counts[p.state] || 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [programs])

  const maxStateCount = stateData.length ? Math.max(...stateData.map(s => s[1]), 1) : 1

  // Events by month (next 6 months)
  const eventsByMonth = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      const count = events.filter(e => e.date && e.date.startsWith(key)).length
      months.push({ label, count })
    }
    return months
  }, [events])

  const maxEventMonth = Math.max(...eventsByMonth.map(m => m.count), 1)

  // Summary stats
  const totalPrograms = programs.length
  const totalEvents = events.length
  const upcomingEvents = events.filter(e => e.date >= new Date().toISOString().split('T')[0]).length
  const proposedEvents = events.filter(e => e.proposed).length
  const regionsUsed = Object.values(regionData).filter(c => c > 0).length
  const uniqueStates = new Set(programs.map(p => p.state).filter(Boolean)).size

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Analytics Dashboard</h2>

        <div className="analytics-summary">
          <div className="analytics-stat">
            <span className="analytics-stat-value">{totalPrograms}</span>
            <span className="analytics-stat-label">Programs</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value">{regionsUsed}</span>
            <span className="analytics-stat-label">Regions</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value">{uniqueStates}</span>
            <span className="analytics-stat-label">States</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value">{totalEvents}</span>
            <span className="analytics-stat-label">Events</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value">{upcomingEvents}</span>
            <span className="analytics-stat-label">Upcoming</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value">{proposedEvents}</span>
            <span className="analytics-stat-label">Proposed</span>
          </div>
        </div>

        <div className="analytics-charts">
          <div className="analytics-chart">
            <h3>Programs by Region</h3>
            <div className="bar-chart">
              {Object.entries(regionData).map(([region, count]) => (
                <div key={region} className="bar-row">
                  <span className="bar-label">{region}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(count / maxRegionCount) * 100}%`,
                        background: REGIONS[region]?.color || '#999'
                      }}
                    />
                  </div>
                  <span className="bar-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {conferenceData.length > 0 && (
            <div className="analytics-chart">
              <h3>Top Conferences</h3>
              <div className="bar-chart">
                {conferenceData.map(([conf, count]) => (
                  <div key={conf} className="bar-row">
                    <span className="bar-label">{conf}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(count / maxConfCount) * 100}%`, background: 'var(--accent-color)' }}
                      />
                    </div>
                    <span className="bar-value">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stateData.length > 0 && (
            <div className="analytics-chart">
              <h3>Top States</h3>
              <div className="bar-chart">
                {stateData.map(([state, count]) => (
                  <div key={state} className="bar-row">
                    <span className="bar-label">{state}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(count / maxStateCount) * 100}%`, background: '#f39c12' }}
                      />
                    </div>
                    <span className="bar-value">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="analytics-chart">
            <h3>Events by Month</h3>
            <div className="bar-chart bar-chart-vertical">
              {eventsByMonth.map((m, i) => (
                <div key={i} className="vbar-col">
                  <div className="vbar-track">
                    <div
                      className="vbar-fill"
                      style={{ height: `${(m.count / maxEventMonth) * 100}%`, background: '#2ecc71' }}
                    />
                  </div>
                  <span className="vbar-value">{m.count}</span>
                  <span className="vbar-label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Level color mapping
const LEVEL_COLORS = {
  'Gold': '#c9a84c',
  'Silver': '#8a8d8f',
  'Bronze': '#a0714f',
  'Regional': '#005eb8'
}

// Digest Modal Component
function DigestModal({ isOpen, onClose, programs, events, sport }) {
  const [digestRange, setDigestRange] = useState('week')

  if (!isOpen) return null

  const now = new Date()
  const rangeMs = digestRange === 'week' ? 7 * 86400000 : digestRange === 'month' ? 30 * 86400000 : 90 * 86400000
  const rangeStart = new Date(now.getTime() - rangeMs)
  const rangeEnd = new Date(now.getTime() + rangeMs)
  const rangeStartStr = rangeStart.toISOString().split('T')[0]
  const nowStr = now.toISOString().split('T')[0]
  const rangeEndStr = rangeEnd.toISOString().split('T')[0]

  const upcomingEvents = events.filter(e => e.date >= nowStr && e.date <= rangeEndStr)
    .sort((a, b) => a.date.localeCompare(b.date))
  const pastEvents = events.filter(e => e.date >= rangeStartStr && e.date < nowStr)
    .sort((a, b) => b.date.localeCompare(a.date))

  // Programs by level
  const byLevel = {}
  programs.forEach(p => {
    const lvl = p.level || 'Unclassified'
    if (!byLevel[lvl]) byLevel[lvl] = []
    byLevel[lvl].push(p)
  })

  // Programs by region
  const byRegion = {}
  programs.forEach(p => {
    const r = p.region || 'Unknown'
    if (!byRegion[r]) byRegion[r] = []
    byRegion[r].push(p)
  })

  const rangeLabel = digestRange === 'week' ? 'Weekly' : digestRange === 'month' ? 'Monthly' : 'Quarterly'

  const handleCopyDigest = () => {
    const lines = []
    lines.push(`ADIDAS SELECT ${rangeLabel.toUpperCase()} DIGEST`)
    lines.push(`Generated: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
    lines.push(`Sport: ${sport === 'football' ? 'Football' : 'Basketball'}`)
    lines.push('')
    lines.push(`PROGRAMS OVERVIEW (${programs.length} total)`)
    Object.entries(byLevel).forEach(([level, progs]) => {
      lines.push(`  ${level}: ${progs.length} programs`)
    })
    lines.push('')
    lines.push('REGIONAL BREAKDOWN')
    Object.entries(byRegion).forEach(([region, progs]) => {
      lines.push(`  ${region}: ${progs.length} programs`)
      progs.forEach(p => lines.push(`    - ${p.name} (${p.city}, ${p.state})`))
    })
    lines.push('')
    if (upcomingEvents.length > 0) {
      lines.push(`UPCOMING EVENTS (${upcomingEvents.length})`)
      upcomingEvents.forEach(e => {
        lines.push(`  - ${e.name} | ${e.date} | ${e.city}, ${e.state}${e.proposed ? ' [PROPOSED]' : ''}`)
      })
    }
    if (pastEvents.length > 0) {
      lines.push('')
      lines.push(`RECENT EVENTS (${pastEvents.length})`)
      pastEvents.forEach(e => {
        lines.push(`  - ${e.name} | ${e.date} | ${e.city}, ${e.state}`)
      })
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('Digest copied to clipboard!')
    }).catch(() => {
      // Fallback: select text
      const ta = document.createElement('textarea')
      ta.value = lines.join('\n')
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      alert('Digest copied to clipboard!')
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="digest-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Program Digest</h2>
        <p className="digest-subtitle">{sport === 'football' ? 'Select Football' : 'Select Basketball'} Summary</p>

        <div className="digest-range-picker">
          {['week', 'month', 'quarter'].map(r => (
            <button key={r} className={`digest-range-btn ${digestRange === r ? 'active' : ''}`} onClick={() => setDigestRange(r)}>
              {r === 'week' ? 'Weekly' : r === 'month' ? 'Monthly' : 'Quarterly'}
            </button>
          ))}
        </div>

        <div className="digest-body">
          <div className="digest-section">
            <h3>Programs Overview</h3>
            <div className="digest-stat-row">
              <span className="digest-stat-big">{programs.length}</span>
              <span className="digest-stat-label">Total Programs</span>
            </div>
            {Object.entries(byLevel).map(([level, progs]) => (
              <div key={level} className="digest-level-row">
                <span className="digest-level-badge" style={{ background: LEVEL_COLORS[level] || '#666' }}>{level}</span>
                <span className="digest-level-count">{progs.length}</span>
              </div>
            ))}
          </div>

          <div className="digest-section">
            <h3>Regional Breakdown</h3>
            {Object.entries(byRegion).map(([region, progs]) => (
              <div key={region} className="digest-region-group">
                <div className="digest-region-header">
                  <span className="digest-region-dot" style={{ background: REGIONS[region]?.color || '#999' }} />
                  <span className="digest-region-name">{region}</span>
                  <span className="digest-region-count">{progs.length}</span>
                </div>
                <div className="digest-region-programs">
                  {progs.map(p => (
                    <span key={p.id} className="digest-program-chip">{p.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {upcomingEvents.length > 0 && (
            <div className="digest-section">
              <h3>Upcoming Events ({upcomingEvents.length})</h3>
              {upcomingEvents.map(e => (
                <div key={e.id} className="digest-event-item">
                  <span className="digest-event-date">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="digest-event-info">
                    <span className="digest-event-name">{e.name}</span>
                    <span className="digest-event-loc">{e.city}, {e.state}</span>
                  </div>
                  {e.proposed && <span className="digest-event-proposed">Proposed</span>}
                </div>
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="digest-section">
              <h3>Recent Events ({pastEvents.length})</h3>
              {pastEvents.slice(0, 5).map(e => (
                <div key={e.id} className="digest-event-item digest-event-past">
                  <span className="digest-event-date">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="digest-event-info">
                    <span className="digest-event-name">{e.name}</span>
                    <span className="digest-event-loc">{e.city}, {e.state}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="digest-actions">
          <button className="digest-copy-btn" onClick={handleCopyDigest}>Copy Digest to Clipboard</button>
        </div>
      </div>
    </div>
  )
}

// Reports Modal Component
function ReportsModal({ isOpen, onClose, programs, events, sport }) {
  const [reportType, setReportType] = useState('overview')
  const [filterGender, setFilterGender] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterConf, setFilterConf] = useState('all')
  const [sortCols, setSortCols] = useState([{ col: 'name', dir: 'asc' }])

  if (!isOpen) return null

  const filtered = programs.filter(p => {
    if (filterGender !== 'all') {
      const programGender = p.gender || 'Boys'
      if (programGender !== filterGender) return false
    }
    if (filterLevel !== 'all' && (p.level || '') !== filterLevel) return false
    if (filterRegion !== 'all' && p.region !== filterRegion) return false
    if (filterConf !== 'all' && (p.conference || '') !== filterConf) return false
    return true
  })

  const uniqueLevels = [...new Set(programs.map(p => p.level).filter(Boolean))]
  const uniqueConfs = [...new Set(programs.map(p => p.conference).filter(Boolean))].sort()

  const handleSort = (col, e) => {
    const existingIndex = sortCols.findIndex(s => s.col === col)

    if (e && e.shiftKey) {
      // Shift+click: add to multi-sort or toggle direction if already exists
      if (existingIndex >= 0) {
        setSortCols(prev => prev.map((s, i) =>
          i === existingIndex ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : s
        ))
      } else {
        setSortCols(prev => [...prev, { col, dir: 'asc' }])
      }
    } else {
      // Regular click: single column sort (toggle direction if same column)
      if (existingIndex === 0 && sortCols.length === 1) {
        setSortCols([{ col, dir: sortCols[0].dir === 'asc' ? 'desc' : 'asc' }])
      } else {
        setSortCols([{ col, dir: 'asc' }])
      }
    }
  }

  const getColValue = (item, col) => {
    switch (col) {
      case 'name': return item.name || ''
      case 'gender': return item.gender || 'Boys'
      case 'location': return `${item.state || ''},${item.city || ''}`
      case 'region': return item.region || ''
      case 'level': {
        const levelOrder = { 'Gold': 0, 'Silver': 1, 'Bronze': 2, 'Regional': 3 }
        return levelOrder[item.level] ?? 4
      }
      case 'conference': return item.conference || ''
      case 'coach': return item.headCoach || ''
      case 'contact': return item.contactEmail || item.contactPhone || ''
      default: return item.name || ''
    }
  }

  const sortedFiltered = [...filtered].sort((a, b) => {
    for (const { col, dir } of sortCols) {
      const aVal = getColValue(a, col)
      const bVal = getColValue(b, col)
      const cmp = col === 'level' ? aVal - bVal : String(aVal).localeCompare(String(bVal))
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp
    }
    return 0
  })

  const SortTh = ({ col, children }) => {
    const sortIndex = sortCols.findIndex(s => s.col === col)
    const isActive = sortIndex >= 0
    const sortInfo = isActive ? sortCols[sortIndex] : null
    const showPriority = sortCols.length > 1 && isActive

    return (
      <th
        className={`report-sortable-th ${isActive ? 'active' : ''}`}
        onClick={(e) => handleSort(col, e)}
        title="Click to sort, Shift+click to add secondary sort"
      >
        {children}
        {showPriority && <span className="report-sort-priority">{sortIndex + 1}</span>}
        <span className="report-sort-arrow">
          {isActive ? (sortInfo.dir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4'}
        </span>
      </th>
    )
  }

  const handlePrint = () => {
    document.body.classList.add('printing-report')
    window.print()
    document.body.classList.remove('printing-report')
  }

  const handleExportReport = () => {
    const today = new Date().toISOString().split('T')[0]
    let csv = ''

    if (reportType === 'overview' || reportType === 'programs') {
      const headers = ['Name', 'Gender', 'City', 'State', 'Region', 'Level', 'Conference', 'Head Coach', 'Ranking', 'Contact Email', 'Contact Phone', 'Twitter', 'Instagram']
      const rows = filtered.map(p => [
        p.name || '', p.gender || 'Boys', p.city || '', p.state || '', p.region || '', p.level || '',
        p.conference || '', p.headCoach || '', p.ranking || '',
        p.contactEmail || '', p.contactPhone || '', p.twitter || '', p.instagram || ''
      ])
      csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    } else {
      const headers = ['Name', 'Date', 'End Date', 'City', 'State', 'Host/Partner', 'Proposed', 'Description']
      const rows = events.map(e => [
        e.name || '', e.date || '', e.endDate || '', e.city || '', e.state || '',
        e.hostPartner || '', e.proposed ? 'Yes' : 'No', e.description || ''
      ])
      csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.download = `adidas-select-${reportType}-report-${today}.csv`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const nowStr = new Date().toISOString().split('T')[0]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="reports-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Reports</h2>

        <div className="reports-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'programs', label: 'Programs' },
            { id: 'events', label: 'Events' }
          ].map(t => (
            <button key={t.id} className={`reports-tab ${reportType === t.id ? 'active' : ''}`} onClick={() => setReportType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {(reportType === 'overview' || reportType === 'programs') && (
          <div className="reports-filters">
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="all">All Genders</option>
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
            </select>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="all">All Levels</option>
              {uniqueLevels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
              <option value="all">All Regions</option>
              {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterConf} onChange={e => setFilterConf(e.target.value)}>
              <option value="all">All Conferences</option>
              {uniqueConfs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        <div className="reports-body printable-report">
          {reportType === 'overview' && (
            <div className="report-overview">
              <div className="report-summary-grid">
                <div className="report-summary-card">
                  <span className="report-card-value">{filtered.length}</span>
                  <span className="report-card-label">Programs</span>
                </div>
                <div className="report-summary-card">
                  <span className="report-card-value">{new Set(filtered.map(p => p.state).filter(Boolean)).size}</span>
                  <span className="report-card-label">States</span>
                </div>
                <div className="report-summary-card">
                  <span className="report-card-value">{new Set(filtered.map(p => p.region).filter(Boolean)).size}</span>
                  <span className="report-card-label">Regions</span>
                </div>
                <div className="report-summary-card">
                  <span className="report-card-value">{events.filter(e => e.date >= nowStr).length}</span>
                  <span className="report-card-label">Upcoming Events</span>
                </div>
              </div>

              <h3>Programs by Level</h3>
              <div className="report-level-breakdown">
                {['Gold', 'Silver', 'Bronze', 'Regional'].map(level => {
                  const count = filtered.filter(p => p.level === level).length
                  if (count === 0) return null
                  return (
                    <div key={level} className="report-level-row">
                      <span className="report-level-badge" style={{ background: LEVEL_COLORS[level] }}>{level}</span>
                      <div className="report-level-bar-track">
                        <div className="report-level-bar-fill" style={{ width: `${(count / Math.max(filtered.length, 1)) * 100}%`, background: LEVEL_COLORS[level] }} />
                      </div>
                      <span className="report-level-count">{count}</span>
                    </div>
                  )
                })}
                {filtered.filter(p => !p.level).length > 0 && (
                  <div className="report-level-row">
                    <span className="report-level-badge" style={{ background: '#666' }}>Unclassified</span>
                    <div className="report-level-bar-track">
                      <div className="report-level-bar-fill" style={{ width: `${(filtered.filter(p => !p.level).length / Math.max(filtered.length, 1)) * 100}%`, background: '#666' }} />
                    </div>
                    <span className="report-level-count">{filtered.filter(p => !p.level).length}</span>
                  </div>
                )}
              </div>

              <h3>Programs by Region</h3>
              {Object.keys(REGIONS).map(region => {
                const regionProgs = filtered.filter(p => p.region === region)
                if (regionProgs.length === 0) return null
                return (
                  <div key={region} className="report-region-group">
                    <div className="report-region-header">
                      <span className="report-region-dot" style={{ background: REGIONS[region].color }} />
                      <span>{region}</span>
                      <span className="report-region-count">{regionProgs.length}</span>
                    </div>
                    <table className="report-table">
                      <thead>
                        <tr><th>Program</th><th>Gender</th><th>City</th><th>Level</th><th>Coach</th></tr>
                      </thead>
                      <tbody>
                        {regionProgs.map(p => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td><span className={`report-gender-chip ${(p.gender || 'Boys') === 'Girls' ? 'girls' : 'boys'}`}>{p.gender || 'Boys'}</span></td>
                            <td>{p.city}, {p.state}</td>
                            <td>{p.level || '-'}</td>
                            <td>{p.headCoach || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}

          {reportType === 'programs' && (
            <div className="report-programs">
              <p className="report-count">{filtered.length} programs</p>
              <table className="report-table report-table-full">
                <thead>
                  <tr>
                    <SortTh col="name">Program</SortTh>
                    <SortTh col="gender">Gender</SortTh>
                    <SortTh col="location">Location</SortTh>
                    <SortTh col="region">Region</SortTh>
                    <SortTh col="level">Level</SortTh>
                    <SortTh col="conference">Conference</SortTh>
                    <SortTh col="coach">Coach</SortTh>
                    <SortTh col="contact">Contact</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map(p => (
                    <tr key={p.id}>
                      <td className="report-program-name">{p.logo && <img src={p.logo} alt="" className="report-program-logo" />}{p.name}</td>
                      <td><span className={`report-gender-chip ${(p.gender || 'Boys') === 'Girls' ? 'girls' : 'boys'}`}>{p.gender || 'Boys'}</span></td>
                      <td>{p.city}, {p.state}</td>
                      <td><span className="report-region-chip" style={{ background: REGIONS[p.region]?.color || '#666' }}>{p.region}</span></td>
                      <td>{p.level ? <span className="report-level-chip" style={{ background: LEVEL_COLORS[p.level] || '#666' }}>{p.level}</span> : '-'}</td>
                      <td>{p.conference || '-'}</td>
                      <td>{p.headCoach || '-'}</td>
                      <td>{p.contactEmail || p.contactPhone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'events' && (
            <div className="report-events">
              <h3>Upcoming Events ({events.filter(e => e.date >= nowStr).length})</h3>
              <table className="report-table report-table-full">
                <thead>
                  <tr><th>Event</th><th>Date</th><th>Location</th><th>Host</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {events.filter(e => e.date >= nowStr).sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                    <tr key={e.id}>
                      <td className="report-program-name">{e.name}</td>
                      <td>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>{e.city}, {e.state}</td>
                      <td>{e.hostPartner || '-'}</td>
                      <td>{e.proposed ? <span className="report-status-proposed">Proposed</span> : <span className="report-status-confirmed">Confirmed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ marginTop: 20 }}>Past Events ({events.filter(e => e.date < nowStr).length})</h3>
              <table className="report-table report-table-full">
                <thead>
                  <tr><th>Event</th><th>Date</th><th>Location</th><th>Host</th></tr>
                </thead>
                <tbody>
                  {events.filter(e => e.date < nowStr).sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>{e.city}, {e.state}</td>
                      <td>{e.hostPartner || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="reports-actions">
          <button className="reports-export-btn" onClick={handleExportReport}>Export CSV</button>
          <button className="reports-print-btn" onClick={handlePrint}>Print Report</button>
        </div>
      </div>
    </div>
  )
}

// Program Comparison Modal Component
function ComparisonModal({ isOpen, onClose, programs }) {
  const [program1Id, setProgram1Id] = useState('')
  const [program2Id, setProgram2Id] = useState('')

  if (!isOpen) return null

  const program1 = programs.find(p => p.id === program1Id)
  const program2 = programs.find(p => p.id === program2Id)

  const ComparisonField = ({ label, value1, value2 }) => (
    <div className="comparison-row">
      <span className="comparison-label">{label}</span>
      <span className="comparison-value">{value1 || '-'}</span>
      <span className="comparison-value">{value2 || '-'}</span>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Compare Programs</h2>

        <div className="comparison-selector">
          <select value={program1Id} onChange={e => setProgram1Id(e.target.value)}>
            <option value="">Select first program</option>
            {programs.filter(p => !p.isArchived).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={program2Id} onChange={e => setProgram2Id(e.target.value)}>
            <option value="">Select second program</option>
            {programs.filter(p => !p.isArchived).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {program1 && program2 && (
          <div className="comparison-grid">
            <div className="comparison-card">
              <div className="comparison-card-header">
                {program1.logo && <img src={program1.logo} alt="" className="comparison-card-logo" />}
                <div className="comparison-card-title">
                  <h3>{program1.name}</h3>
                  <p>{program1.city}, {program1.state}</p>
                </div>
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-card-header">
                {program2.logo && <img src={program2.logo} alt="" className="comparison-card-logo" />}
                <div className="comparison-card-title">
                  <h3>{program2.name}</h3>
                  <p>{program2.city}, {program2.state}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {program1 && program2 && (
          <table className="report-table report-table-full" style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>{program1.name}</th>
                <th>{program2.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Region</td><td>{program1.region || '-'}</td><td>{program2.region || '-'}</td></tr>
              <tr><td>Level</td><td>{program1.level || '-'}</td><td>{program2.level || '-'}</td></tr>
              <tr><td>Conference</td><td>{program1.conference || '-'}</td><td>{program2.conference || '-'}</td></tr>
              <tr><td>Head Coach</td><td>{program1.headCoach || '-'}</td><td>{program2.headCoach || '-'}</td></tr>
              <tr><td>Gender</td><td>{program1.gender || 'Boys'}</td><td>{program2.gender || 'Boys'}</td></tr>
              <tr><td>Ranking</td><td>{program1.ranking || '-'}</td><td>{program2.ranking || '-'}</td></tr>
              <tr><td>Instagram</td><td>{program1.instagram || '-'}</td><td>{program2.instagram || '-'}</td></tr>
              <tr><td>Twitter</td><td>{program1.twitter || '-'}</td><td>{program2.twitter || '-'}</td></tr>
            </tbody>
          </table>
        )}

        {(!program1 || !program2) && (
          <p className="detail-empty" style={{ textAlign: 'center', marginTop: 40 }}>
            Select two programs to compare their details side by side.
          </p>
        )}
      </div>
    </div>
  )
}

// Archive Modal Component
function ArchiveModal({ isOpen, onClose, archivedPrograms, onRestore, onDelete, sport }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="archive-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Archived Programs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Archived programs are hidden from the map but can be restored at any time.
        </p>

        {archivedPrograms.length === 0 ? (
          <p className="detail-empty">No archived programs.</p>
        ) : (
          <div className="archive-list">
            {archivedPrograms.map(program => (
              <div key={program.id} className="archive-item">
                {program.logo && <img src={program.logo} alt="" className="archive-item-logo" />}
                <div className="archive-item-info">
                  <div className="archive-item-name">{program.name}</div>
                  <div className="archive-item-location">{program.city}, {program.state}</div>
                  {program.archivedAt && (
                    <div className="archive-item-date">
                      Archived {new Date(program.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <button className="archive-restore-btn" onClick={() => onRestore(sport, program.id)}>
                  Restore
                </button>
                <button className="archive-delete-btn" onClick={() => onDelete(sport, program.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Bulk Edit Modal Component - for editing multiple programs at once
function BulkEditModal({ isOpen, onClose, programs, onSave, sport }) {
  const [editedPrograms, setEditedPrograms] = useState({})
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'missing-coach', 'missing-contact'

  useEffect(() => {
    if (isOpen) {
      setEditedPrograms({})
      setFilter('all')
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredPrograms = programs.filter(p => {
    if (filter === 'missing-coach') return !p.headCoach
    if (filter === 'missing-contact') return !p.contactEmail && !p.contactPhone
    if (filter === 'missing-instagram') return !p.instagram
    return true
  })

  const handleFieldChange = (programId, field, value) => {
    setEditedPrograms(prev => ({
      ...prev,
      [programId]: {
        ...(prev[programId] || {}),
        [field]: value
      }
    }))
  }

  const getFieldValue = (program, field) => {
    if (editedPrograms[program.id] && editedPrograms[program.id][field] !== undefined) {
      return editedPrograms[program.id][field]
    }
    return program[field] || ''
  }

  const hasChanges = Object.keys(editedPrograms).length > 0

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      for (const [programId, changes] of Object.entries(editedPrograms)) {
        const program = programs.find(p => p.id === programId)
        if (program) {
          await onSave({ ...program, ...changes })
        }
      }
      setEditedPrograms({})
      onClose()
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error saving changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const changedCount = Object.keys(editedPrograms).length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bulk-edit-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="bulk-edit-header">
          <h2>Bulk Edit Programs</h2>
          <p className="bulk-edit-subtitle">Edit multiple programs at once. Changes save when you click "Save All".</p>
        </div>

        <div className="bulk-edit-toolbar">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bulk-edit-filter">
            <option value="all">All Programs ({programs.length})</option>
            <option value="missing-coach">Missing Coach ({programs.filter(p => !p.headCoach).length})</option>
            <option value="missing-contact">Missing Contact ({programs.filter(p => !p.contactEmail && !p.contactPhone).length})</option>
            <option value="missing-instagram">Missing Instagram ({programs.filter(p => !p.instagram).length})</option>
          </select>
          <span className="bulk-edit-count">
            Showing {filteredPrograms.length} programs
            {changedCount > 0 && <span className="bulk-edit-changed"> • {changedCount} modified</span>}
          </span>
        </div>

        <div className="bulk-edit-table-wrapper">
          <table className="bulk-edit-table">
            <thead>
              <tr>
                <th className="bulk-edit-th-name">Program</th>
                <th>Head Coach</th>
                <th>Contact Email</th>
                <th>Contact Phone</th>
                <th>Instagram</th>
                <th>Twitter</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map(program => {
                const isModified = !!editedPrograms[program.id]
                return (
                  <tr key={program.id} className={isModified ? 'bulk-edit-row-modified' : ''}>
                    <td className="bulk-edit-td-name">
                      <div className="bulk-edit-program-info">
                        {program.logo && <img src={program.logo} alt="" className="bulk-edit-logo" />}
                        <div>
                          <div className="bulk-edit-program-name">{program.name}</div>
                          <div className="bulk-edit-program-location">{program.city}, {program.state}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={getFieldValue(program, 'headCoach')}
                        onChange={e => handleFieldChange(program.id, 'headCoach', e.target.value)}
                        placeholder="Coach name"
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={getFieldValue(program, 'contactEmail')}
                        onChange={e => handleFieldChange(program.id, 'contactEmail', e.target.value)}
                        placeholder="email@example.com"
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        value={getFieldValue(program, 'contactPhone')}
                        onChange={e => handleFieldChange(program.id, 'contactPhone', e.target.value)}
                        placeholder="555-123-4567"
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={getFieldValue(program, 'instagram')}
                        onChange={e => handleFieldChange(program.id, 'instagram', e.target.value)}
                        placeholder="@handle"
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={getFieldValue(program, 'twitter')}
                        onChange={e => handleFieldChange(program.id, 'twitter', e.target.value)}
                        placeholder="@handle"
                        className="bulk-edit-input"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="bulk-edit-footer">
          <button className="bulk-edit-cancel" onClick={onClose}>Cancel</button>
          <button
            className="bulk-edit-save"
            onClick={handleSaveAll}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : `Save All${changedCount > 0 ? ` (${changedCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [activeTab, setActiveTab] = useState('basketball')
  const [programs, setPrograms] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingProgram, setEditingProgram] = useState(null)

  // New state for features
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [user, setUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [historyProgram, setHistoryProgram] = useState(null)
  const [allowedUsers, setAllowedUsers] = useState([])
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [selectedMtZionGroup, setSelectedMtZionGroup] = useState(null)

  // Events state
  const [events, setEvents] = useState([])
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)

  // Calendar view state
  const [eventsViewMode, setEventsViewMode] = useState('list') // 'list' or 'calendar'
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null)

  // Advanced filter state
  const [sortBy, setSortBy] = useState('name') // 'name', 'region', 'state', 'conference'
  const [filterConference, setFilterConference] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Gender filter
  const [filterGender, setFilterGender] = useState('Boys') // 'Boys', 'Girls', 'all'

  // Mt Zion team type filter
  const [filterTeamType, setFilterTeamType] = useState('all') // 'Prep', 'National', 'all'

  // Mobile region popup
  const [showRegionPopup, setShowRegionPopup] = useState(false)

  // Analytics
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSubscribeMenu, setShowSubscribeMenu] = useState(false)

  // Digest & Reports
  const [isDigestOpen, setIsDigestOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)

  // Program comparison modal
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  // Archive modal and state
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [archivedPrograms, setArchivedPrograms] = useState([])

  // Bulk edit modal
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)

  // Ref for map screenshot
  const mapRef = useRef(null)

  const handleExportMap = useCallback(async () => {
    const node = mapRef.current
    if (!node || isExporting) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: { padding: '10px' }
      })
      const link = document.createElement('a')
      const tabName = activeTab === 'events' ? 'events' : activeTab
      link.download = `adidas-select-${tabName}-map-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
    setIsExporting(false)
  }, [activeTab, isExporting])

  // Check if current user is allowed to edit
  const isUserAllowed = user && allowedUsers.includes(user.email?.toLowerCase())

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(setUser)
    return () => unsubscribe()
  }, [])

  // Subscribe to allowed users list
  useEffect(() => {
    const unsubscribe = subscribeToAllowedUsers(setAllowedUsers)
    return () => unsubscribe()
  }, [])

  // Subscribe to Firebase for real-time updates (programs)
  useEffect(() => {
    if (activeTab === 'events') return
    setIsLoading(true)

    const unsubscribe = subscribeToPrograms(activeTab, (data) => {
      // Filter out archived programs for the main view
      setPrograms(data.filter(p => !p.isArchived).map(p => ({
        ...p,
        name: p.name?.replace(/\bMt\.?\s*Zion(?:\s+Prep)?\b/gi, 'Mt. Zion Prep')
      })))
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [activeTab])

  // Subscribe to events
  useEffect(() => {
    setIsEventsLoading(true)
    const unsubscribe = subscribeToEvents((data) => {
      setEvents(data)
      setIsEventsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to archived programs
  useEffect(() => {
    if (activeTab === 'events') return
    const unsubscribe = subscribeToArchivedPrograms(activeTab, setArchivedPrograms)
    return () => unsubscribe()
  }, [activeTab])

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Reset filters when switching tabs
  useEffect(() => {
    setSearchQuery('')
    setSelectedRegion('all')
    setFilterConference('all')
    setFilterGender('Boys')
    setFilterTeamType('all')
    setSortBy('name')
    setSelectedProgram(null)
    setSelectedMtZionGroup(null)
  }, [activeTab])

  // Check if any Mt Zion programs exist (to show team type filter)
  const hasMtZionPrograms = useMemo(() => {
    return programs.some(p => p.name?.toLowerCase().includes('mt. zion prep'))
  }, [programs])

  // Unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const confs = new Set()
    programs.forEach(p => { if (p.conference) confs.add(p.conference) })
    return [...confs].sort()
  }, [programs])

  // Filter programs based on search, region, and conference
  const filteredPrograms = useMemo(() => {
    let result = programs.filter(program => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        program.name?.toLowerCase().includes(searchLower) ||
        program.city?.toLowerCase().includes(searchLower) ||
        program.state?.toLowerCase().includes(searchLower) ||
        program.headCoach?.toLowerCase().includes(searchLower) ||
        program.conference?.toLowerCase().includes(searchLower)

      const matchesRegion = selectedRegion === 'all' || program.region === selectedRegion
      const matchesConference = filterConference === 'all' || program.conference === filterConference
      const matchesGender = filterGender === 'all' ||
        program.gender === filterGender ||
        (!program.gender && filterGender === 'Boys') // default unset programs to Boys

      const matchesTeamType = filterTeamType === 'all' ||
        program.teamType === filterTeamType ||
        (!program.name?.toLowerCase().includes('mt. zion prep')) // non-Mt. Zion Prep programs always match

      return matchesSearch && matchesRegion && matchesConference && matchesGender && matchesTeamType
    })

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '')
        case 'region': return (a.region || '').localeCompare(b.region || '')
        case 'state': return (a.state || '').localeCompare(b.state || '')
        case 'conference': return (a.conference || '').localeCompare(b.conference || '')
        default: return 0
      }
    })

    return result
  }, [programs, searchQuery, selectedRegion, filterConference, filterGender, filterTeamType, sortBy])

  // Create icons for all programs (memoized to prevent re-renders)
  const programIcons = useMemo(() => {
    const icons = {}
    filteredPrograms.forEach(program => {
      if (program && program.id) {
        icons[program.id] = createLogoIcon(program.logo, program.name)
      }
    })
    return icons
  }, [filteredPrograms])

  // Offset overlapping program markers
  const adjustedPositions = useMemo(() => {
    const progs = filteredPrograms.filter(p => p && p.coordinates)
    const pos = {}
    const orig = {}
    progs.forEach(p => {
      pos[p.id] = [p.coordinates[0], p.coordinates[1]]
      orig[p.id] = [p.coordinates[0], p.coordinates[1]]
    })

    if (progs.length <= 1) return pos

    // Repulsion to prevent overlap, but capped so markers stay near their real location
    const MIN_DIST = 1.2
    const MAX_DRIFT = 1.5 // never move more than 1.5 degrees from original
    const ITERATIONS = 8

    // East-coast states: prefer pushing toward ocean (east/southeast)
    const coastalEastStates = new Set(['FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'CT', 'RI', 'MA', 'NH', 'ME', 'NY'])

    for (let iter = 0; iter < ITERATIONS; iter++) {
      for (let i = 0; i < progs.length; i++) {
        for (let j = i + 1; j < progs.length; j++) {
          const a = progs[i], b = progs[j]
          const dLat = pos[b.id][0] - pos[a.id][0]
          const dLng = pos[b.id][1] - pos[a.id][1]
          const dist = Math.sqrt(dLat * dLat + dLng * dLng)
          if (dist < MIN_DIST && dist > 0) {
            const push = (MIN_DIST - dist) / 2
            let nLat = dLat / dist
            let nLng = dLng / dist

            // For east-coast programs, bias push eastward (positive lng direction is... wait, US lng is negative, so "east" = less negative = +lng)
            const aCoastal = coastalEastStates.has(a.state)
            const bCoastal = coastalEastStates.has(b.state)
            if (aCoastal || bCoastal) {
              // Add eastward bias to longitude push
              nLng = nLng > 0 ? nLng : nLng * 0.3
            }

            pos[a.id] = [pos[a.id][0] - nLat * push, pos[a.id][1] - nLng * push]
            pos[b.id] = [pos[b.id][0] + nLat * push, pos[b.id][1] + nLng * push]
          } else if (dist === 0) {
            // Spread exactly overlapping markers vertically
            pos[a.id] = [pos[a.id][0] - MIN_DIST * 0.5, pos[a.id][1]]
            pos[b.id] = [pos[b.id][0] + MIN_DIST * 0.5, pos[b.id][1]]
          }
        }
      }

      // Clamp: don't let any marker drift more than MAX_DRIFT from its original position
      progs.forEach(p => {
        const dLat = pos[p.id][0] - orig[p.id][0]
        const dLng = pos[p.id][1] - orig[p.id][1]
        const drift = Math.sqrt(dLat * dLat + dLng * dLng)
        if (drift > MAX_DRIFT) {
          const scale = MAX_DRIFT / drift
          pos[p.id] = [orig[p.id][0] + dLat * scale, orig[p.id][1] + dLng * scale]
        }
      })
    }

    return pos
  }, [filteredPrograms])

  // Group Mt. Zion programs by coordinates so they share a single marker
  const { displayPrograms, mtZionGroupMap } = useMemo(() => {
    const isMtZion = (p) => p.name?.toLowerCase().includes('mt. zion prep')
    const mtZion = filteredPrograms.filter(isMtZion)
    const others = filteredPrograms.filter(p => !isMtZion(p))

    // Group Mt. Zion programs by their coordinates (rounded to avoid float mismatch)
    const groups = {}
    mtZion.forEach(p => {
      if (!p.coordinates) return
      const key = `${p.coordinates[0].toFixed(3)},${p.coordinates[1].toFixed(3)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })

    // Use the first program in each group as the display marker, store mapping
    const groupMap = {} // displayProgramId -> [all programs in group]
    const reps = []
    Object.values(groups).forEach(group => {
      const rep = group[0]
      reps.push(rep)
      groupMap[rep.id] = group
    })

    return { displayPrograms: [...others, ...reps], mtZionGroupMap: groupMap }
  }, [filteredPrograms])

  // Count programs by region
  const regionCounts = useMemo(() => {
    const counts = { total: programs.length }
    Object.keys(REGIONS).forEach(region => {
      counts[region] = programs.filter(p => p.region === region).length
    })
    return counts
  }, [programs])

  // Sort events by date (upcoming first), past events at end
  const sortedEvents = useMemo(() => {
    const now = new Date().toISOString().split('T')[0]
    let filtered = [...events]

    // If calendar date is selected, filter to events on that date
    if (calendarSelectedDate) {
      filtered = filtered.filter(e => {
        const start = e.date
        const end = e.endDate || e.date
        return calendarSelectedDate >= start && calendarSelectedDate <= end
      })
    }

    return filtered.sort((a, b) => {
      const aUpcoming = a.date >= now
      const bUpcoming = b.date >= now
      if (aUpcoming && !bUpcoming) return -1
      if (!aUpcoming && bUpcoming) return 1
      return aUpcoming ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    })
  }, [events, calendarSelectedDate])

  const handleExportCSV = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    if (activeTab === 'events') {
      const headers = ['Name', 'Date', 'City', 'State', 'Type', 'Description']
      const rows = sortedEvents.map(e => [
        e.name || '', e.date || '', e.city || '', e.state || '', e.type || '', e.description || ''
      ])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const link = document.createElement('a')
      link.download = `adidas-select-events-${today}.csv`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    } else {
      const headers = ['Name', 'City', 'State', 'Region', 'Conference', 'Head Coach', 'Ranking', 'Website', 'MaxPreps', 'TCA Store']
      const rows = filteredPrograms.map(p => [
        p.name || '', p.city || '', p.state || '', p.region || '', p.conference || '',
        p.headCoach || '', p.ranking || '', p.website || '', p.maxprepsUrl || '', p.tcaStoreUrl || ''
      ])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const link = document.createElement('a')
      link.download = `adidas-select-${activeTab}-programs-${today}.csv`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    }
    setShowExportMenu(false)
  }, [activeTab, filteredPrograms, sortedEvents])


  // Event icons for map
  const eventIcons = useMemo(() => {
    const icons = {}
    events.forEach(event => {
      if (event && event.id && event.photo) {
        icons[event.id] = createLogoIcon(event.photo, event.name, true)
      } else if (event && event.id) {
        icons[event.id] = L.divIcon({
          className: 'custom-logo-marker',
          html: `<div class="logo-marker event-marker-icon" title="${event.name}"><span>E</span></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        })
      }
    })
    return icons
  }, [events])

  // Event handlers
  const handleAddEvent = async (eventData) => {
    try {
      await addEvent(eventData)
    } catch (err) {
      console.error('Error adding event:', err)
      alert('Could not add event. Please try again.')
    }
  }

  const handleEditEvent = async (eventData) => {
    try {
      await editEvent(eventData)
    } catch (err) {
      console.error('Error editing event:', err)
      alert('Could not update event. Please try again.')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to remove this event?')) {
      try {
        await deleteEvent(eventId)
      } catch (err) {
        console.error('Error deleting event:', err)
        alert('Could not remove event. Please try again.')
      }
    }
  }

  const openEditEventForm = (event) => {
    setEditingEvent(event)
    setIsEventFormOpen(true)
  }

  const closeEventForm = () => {
    setIsEventFormOpen(false)
    setEditingEvent(null)
  }

  // Add a new program
  const handleAddProgram = async (newProgram) => {
    try {
      await addProgram(activeTab, newProgram)
      if (user) {
        await addProgramHistory(activeTab, newProgram.id, 'created', user.email)
      }
    } catch (err) {
      console.error('Error adding program:', err)
      alert('Could not add program. Please try again.')
    }
  }

  // Delete a program (soft delete - archive instead)
  const handleDeleteProgram = async (programId) => {
    if (window.confirm('Archive this program? It will be hidden but can be restored later.')) {
      try {
        if (user) {
          await addProgramHistory(activeTab, programId, 'archived', user.email)
        }
        await archiveProgram(activeTab, programId)
        setSelectedProgram(null)
      } catch (err) {
        console.error('Error archiving program:', err)
        alert('Could not archive program. Please try again.')
      }
    }
  }

  // Restore an archived program
  const handleRestoreProgram = async (sport, programId) => {
    try {
      await restoreProgram(sport, programId)
      if (user) {
        await addProgramHistory(sport, programId, 'restored', user.email)
      }
    } catch (err) {
      console.error('Error restoring program:', err)
      alert('Could not restore program. Please try again.')
    }
  }

  // Permanently delete a program
  const handlePermanentDelete = async (sport, programId) => {
    if (window.confirm('Permanently delete this program? This cannot be undone.')) {
      try {
        if (user) {
          await addProgramHistory(sport, programId, 'deleted', user.email)
        }
        await deleteProgram(sport, programId)
      } catch (err) {
        console.error('Error deleting program:', err)
        alert('Could not delete program. Please try again.')
      }
    }
  }

  // PDF Export function
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF()
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const tabName = activeTab === 'football' ? 'Select Football' : 'Select Basketball'

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(`adidas ${tabName} Programs`, 14, 20)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${today}`, 14, 28)
      doc.text(`Total Programs: ${filteredPrograms.length}`, 14, 34)

      // Programs table
      const tableData = filteredPrograms.map(p => [
        p.name || '',
        p.city || '',
        p.state || '',
        p.region || '',
        p.level || '',
        p.conference || '',
        p.headCoach || ''
      ])

      doc.autoTable({
        startY: 42,
        head: [['Program', 'City', 'State', 'Region', 'Level', 'Conference', 'Coach']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      })

      const filename = `adidas-select-${activeTab}-programs-${new Date().toISOString().split('T')[0]}.pdf`

      // Mobile-friendly download approach
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        // Use blob URL for better mobile support
        const pdfBlob = doc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        alert('PDF downloaded! Check your Downloads folder or browser downloads.')
      } else {
        doc.save(filename)
      }

      setShowExportMenu(false)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Could not generate PDF. Please try again.')
    }
  }, [activeTab, filteredPrograms])

  // Edit a program
  const handleEditProgram = async (updatedProgram) => {
    try {
      await editProgram(activeTab, updatedProgram)
      if (user) {
        await addProgramHistory(activeTab, updatedProgram.id, 'edited', user.email)
      }
    } catch (err) {
      console.error('Error editing program:', err)
      alert('Could not update program. Please try again.')
    }
  }

  // Open form for editing
  const openEditForm = (program) => {
    setEditingProgram(program)
    setIsFormOpen(true)
  }

  // Close form and reset editing state
  const closeForm = () => {
    setIsFormOpen(false)
    setEditingProgram(null)
  }

  // Handle add button click
  const handleAddClick = () => {
    if (!user) {
      setIsAuthModalOpen(true)
    } else if (!isUserAllowed) {
      alert('Your account is not authorized. Please contact an administrator.')
    } else if (activeTab === 'events') {
      setIsEventFormOpen(true)
    } else {
      setIsFormOpen(true)
    }
  }

  // Center of continental US
  const mapCenter = [39.8283, -98.5795]
  const mapZoom = 4

  const activeTabInfo = TABS.find(t => t.id === activeTab)

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div className="title-row">
            <img src="/logos/adidas-logo.png" alt="adidas" className="header-logo" />
            <h1 className="title">Select Map</h1>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? '\u2600' : '\u263E'}
          </button>

          {user ? (
            <div className="user-menu">
              <span className="user-email">{user.email}</span>
              {isUserAllowed && (
                <button className="admin-btn" onClick={() => setIsAdminPanelOpen(true)}>
                  Admin
                </button>
              )}
              <button className="logout-btn" onClick={logOut}>Sign Out</button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setIsAuthModalOpen(true)}>
              Sign In
            </button>
          )}

          <button className="add-btn" onClick={handleAddClick}>
            <span className="add-btn-full">+ Add {activeTab === 'events' ? 'Event' : 'Program'}</span>
            <span className="add-btn-short">+</span>
          </button>
        </div>
      </header>

      {/* Dashboard Stats (programs only) */}
      {activeTab !== 'events' && (
        <div className="dashboard">
          <div className="dashboard-stats">
            <div className="stat-item stat-total" onClick={() => setShowRegionPopup(!showRegionPopup)}>
              <span className="stat-value">{regionCounts.total}</span>
              <span className="stat-label">Total Programs {selectedRegion !== 'all' ? `(${selectedRegion})` : ''}</span>
            </div>
            <div className="region-stats-desktop">
              {Object.keys(REGIONS).map(region => (
                <div
                  key={region}
                  className={`stat-item ${selectedRegion === region ? 'active' : ''}`}
                  style={{ '--region-color': REGIONS[region].color }}
                  onClick={() => setSelectedRegion(selectedRegion === region ? 'all' : region)}
                >
                  <span className="stat-value">{regionCounts[region] || 0}</span>
                  <span className="stat-label">{region}</span>
                </div>
              ))}
            </div>
            {showRegionPopup && (
              <>
                <div className="region-popup-overlay" onClick={() => setShowRegionPopup(false)} />
                <div className="region-popup">
                  {Object.keys(REGIONS).map(region => (
                    <div
                      key={region}
                      className={`region-popup-item ${selectedRegion === region ? 'active' : ''}`}
                      style={{ '--region-color': REGIONS[region].color }}
                      onClick={() => { setSelectedRegion(selectedRegion === region ? 'all' : region); setShowRegionPopup(false) }}
                    >
                      <span className="region-popup-color" style={{ background: REGIONS[region].color }} />
                      <span className="region-popup-name">{region}</span>
                      <span className="region-popup-count">{regionCounts[region] || 0}</span>
                    </div>
                  ))}
                  {selectedRegion !== 'all' && (
                    <div className="region-popup-item region-popup-clear" onClick={() => { setSelectedRegion('all'); setShowRegionPopup(false) }}>
                      <span className="region-popup-name">Clear filter</span>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="stat-item stat-analytics" onClick={() => setIsAnalyticsOpen(true)}>
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="10" width="4" height="8" rx="1"/>
                  <rect x="8" y="6" width="4" height="12" rx="1"/>
                  <rect x="14" y="2" width="4" height="16" rx="1"/>
                </svg>
              </span>
              <span className="stat-label">Analytics</span>
            </div>
            <div className="stat-item stat-digest" onClick={() => setIsDigestOpen(true)}>
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="2" width="14" height="16" rx="2"/>
                  <line x1="6" y1="6" x2="14" y2="6"/>
                  <line x1="6" y1="10" x2="14" y2="10"/>
                  <line x1="6" y1="14" x2="10" y2="14"/>
                </svg>
              </span>
              <span className="stat-label">Digest</span>
            </div>
            <div className="stat-item stat-reports" onClick={() => setIsReportsOpen(true)}>
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="2" width="6" height="6" rx="1"/>
                  <rect x="12" y="2" width="6" height="6" rx="1"/>
                  <rect x="2" y="12" width="6" height="6" rx="1"/>
                  <rect x="12" y="12" width="6" height="6" rx="1"/>
                </svg>
              </span>
              <span className="stat-label">Reports</span>
            </div>
            <div className="stat-item stat-compare" onClick={() => setIsComparisonOpen(true)}>
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="6" height="12" rx="1"/>
                  <rect x="12" y="4" width="6" height="12" rx="1"/>
                  <line x1="10" y1="8" x2="10" y2="12"/>
                  <polyline points="8,10 10,8 12,10"/>
                  <polyline points="8,10 10,12 12,10"/>
                </svg>
              </span>
              <span className="stat-label">Compare</span>
            </div>
            {isUserAllowed && (
              <div className="stat-item stat-archive" onClick={() => setIsArchiveModalOpen(true)}>
                <span className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="16" height="4" rx="1"/>
                    <path d="M3 7v9a1 1 0 001 1h12a1 1 0 001-1V7"/>
                    <line x1="8" y1="11" x2="12" y2="11"/>
                  </svg>
                </span>
                <span className="stat-label">Archive ({archivedPrograms.length})</span>
              </div>
            )}
            {isUserAllowed && (
              <div className="stat-item stat-bulk-edit" onClick={() => setIsBulkEditOpen(true)} title="Bulk edit programs">
                <span className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="2" width="16" height="16" rx="2"/>
                    <line x1="2" y1="7" x2="18" y2="7"/>
                    <line x1="2" y1="12" x2="18" y2="12"/>
                    <line x1="7" y1="2" x2="7" y2="18"/>
                    <line x1="13" y1="2" x2="13" y2="18"/>
                  </svg>
                </span>
                <span className="stat-label">Bulk Edit</span>
              </div>
            )}
            <div className="stat-item stat-export"
              onClick={() => setShowExportMenu(true)}
              onTouchEnd={(e) => { e.preventDefault(); setShowExportMenu(true) }}>
              <span className="stat-icon">
                {isExporting ? '...' : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3v10"/>
                    <polyline points="6,9 10,13 14,9"/>
                    <path d="M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3"/>
                  </svg>
                )}
              </span>
              <span className="stat-label">Export</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <img src={tab.icon} alt="" className="tab-icon" />
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </nav>

      {/* Search and Filter Bar (programs only) */}
      {activeTab !== 'events' && <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search programs, cities, coaches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              &times;
            </button>
          )}
        </div>

        {activeTab !== 'football' && (
          <div className="gender-filter-pills">
            {['Boys', 'Girls', 'all'].map(g => (
              <button
                key={g}
                className={`gender-pill ${filterGender === g ? 'active' : ''}`}
                onClick={() => setFilterGender(g)}
              >
                {g === 'all' ? 'All' : g}
              </button>
            ))}
          </div>
        )}


        <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Less Filters' : 'More Filters'}
        </button>

        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-box">
              <select
                value={filterConference}
                onChange={(e) => setFilterConference(e.target.value)}
                className="region-filter"
              >
                <option value="all">All Conferences</option>
                {uniqueConferences.map(conf => (
                  <option key={conf} value={conf}>{conf}</option>
                ))}
              </select>
            </div>

            <div className="filter-box">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="region-filter"
              >
                <option value="name">Sort: Name</option>
                <option value="region">Sort: Region</option>
                <option value="state">Sort: State</option>
                <option value="conference">Sort: Conference</option>
              </select>
            </div>
          </div>
        )}

        {(searchQuery || selectedRegion !== 'all' || filterConference !== 'all' || filterGender !== 'Boys' || filterTeamType !== 'all') && (
          <div className="filter-info">
            Showing {filteredPrograms.length} of {programs.length} programs
            {filterGender !== 'Boys' && <span className="filter-tag">{filterGender === 'all' ? 'All' : filterGender}</span>}
            {filterTeamType !== 'all' && <span className="filter-tag">{filterTeamType}</span>}
            <button className="clear-filters" onClick={() => {
              setSearchQuery('')
              setSelectedRegion('all')
              setFilterConference('all')
              setFilterGender('Boys')
              setFilterTeamType('all')
              setSortBy('name')
            }}>
              Clear filters
            </button>
          </div>
        )}
      </div>}

      <main className="main">
        {activeTab === 'events' ? (
          /* Events Split Layout */
          <div className="events-split-layout" ref={mapRef}>
            <div className="events-map-panel">
              {isEventsLoading ? (
                <div className="skeleton-map">
                  <span className="skeleton-map-label">Loading map...</span>
                </div>
              ) : (
                <MapContainer
                  key="events"
                  center={mapCenter}
                  zoom={mapZoom}
                  className="map-container"
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <DynamicTileLayer darkMode={darkMode} />
                  <MapViewPreserver />
                  <StateLabels />
                  {events.map(event => (
                    event && event.coordinates && (
                      <Marker
                        key={event.id}
                        position={event.coordinates}
                        icon={eventIcons[event.id]}
                      >
                        <Popup className="program-popup">
                          <div className="popup-card">
                            <div className="popup-header" style={{ backgroundColor: event.proposed ? '#e67e22' : '#000' }}>
                              <span className="popup-region-tag">{event.proposed ? 'Proposed Event' : 'Event'}</span>
                            </div>
                            <div className="popup-body">
                              <div className="popup-top">
                                {event.photo && (
                                  <div className="popup-logo-container">
                                    <img src={event.photo} alt={event.name} className="popup-logo" />
                                  </div>
                                )}
                                <div className="popup-info">
                                  <h3 className="popup-title">{event.name}</h3>
                                  <p className="popup-location">{event.city}, {event.state}</p>
                                </div>
                              </div>
                              <div className="popup-details">
                                <div className="popup-detail-row">
                                  <span className="detail-icon">&#9702;</span>
                                  <span className="detail-text">
                                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {event.endDate && ` - ${new Date(event.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                  </span>
                                </div>
                                {event.hostPartner && (
                                  <div className="popup-detail-row">
                                    <span className="detail-icon">&#9702;</span>
                                    <span className="detail-text">{event.hostPartner}</span>
                                  </div>
                                )}
                                {event.description && (
                                  <div className="popup-detail-row">
                                    <span className="detail-icon">&#9702;</span>
                                    <span className="detail-text">{event.description}</span>
                                  </div>
                                )}
                              </div>
                              {event.registrationLink && (
                                <div className="popup-links">
                                  <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="popup-link-btn">
                                    Register
                                  </a>
                                </div>
                              )}
                              {isUserAllowed && (
                                <div className="popup-actions">
                                  <button className="popup-edit-btn" onClick={() => openEditEventForm(event)}>
                                    Edit
                                  </button>
                                  <button className="popup-delete-btn" onClick={() => handleDeleteEvent(event.id)}>
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              )}
            </div>

            <div className="events-list-panel">
              <div className="events-list-header">
                <h2>{calendarSelectedDate ? new Date(calendarSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Events'}</h2>
                <div className="events-header-actions">
                  {calendarSelectedDate && (
                    <button className="cal-clear-btn" onClick={() => setCalendarSelectedDate(null)}>All</button>
                  )}
                  <button className="export-btn-small"
                    onClick={() => setShowExportMenu(true)}
                    onTouchEnd={(e) => { e.preventDefault(); setShowExportMenu(true) }}
                    title="Export">
                    {isExporting ? '...' : '⤓'}
                  </button>
                  <div className="subscribe-wrapper">
                    <button className="subscribe-btn"
                      onClick={() => setShowSubscribeMenu(prev => !prev)}>
                      Subscribe
                    </button>
                    {showSubscribeMenu && (
                      <div className="subscribe-dropdown">
                        <a
                          className="subscribe-option"
                          href={(() => {
                            const now = new Date().toISOString().split('T')[0]
                            const upcoming = events.filter(e => e.date >= now)
                            const icsEvents = upcoming.map(e => {
                              const start = e.date.replace(/-/g, '')
                              const end = e.endDate
                                ? new Date(new Date(e.endDate + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
                                : new Date(new Date(e.date + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
                              const details = [e.description, e.registrationLink ? `Register: ${e.registrationLink}` : ''].filter(Boolean).join('\n')
                              return `&text=${encodeURIComponent(e.name)}&dates=${start}/${end}&location=${encodeURIComponent(`${e.city}, ${e.state}`)}&details=${encodeURIComponent(details)}`
                            })
                            return `https://calendar.google.com/calendar/render?action=TEMPLATE${upcoming.length > 0 ? icsEvents[0] : ''}`
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            // For Google, open each event in a new tab
                            const now = new Date().toISOString().split('T')[0]
                            const upcoming = events.filter(e => e.date >= now)
                            upcoming.forEach(e => {
                              const start = e.date.replace(/-/g, '')
                              const end = e.endDate
                                ? new Date(new Date(e.endDate + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
                                : new Date(new Date(e.date + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
                              const details = [e.description, e.registrationLink ? `Register: ${e.registrationLink}` : ''].filter(Boolean).join('\n')
                              window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.name)}&dates=${start}/${end}&location=${encodeURIComponent(`${e.city}, ${e.state}`)}&details=${encodeURIComponent(details)}`, '_blank')
                            })
                            setShowSubscribeMenu(false)
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Google Calendar
                        </a>
                        <a
                          className="subscribe-option"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            const now = new Date().toISOString().split('T')[0]
                            const upcoming = events.filter(ev => ev.date >= now)
                            if (upcoming.length === 0) { alert('No upcoming events.'); return }
                            const icsEvents = upcoming.map(ev => {
                              const start = ev.date.replace(/-/g, '')
                              const end = ev.endDate
                                ? new Date(new Date(ev.endDate + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
                                : new Date(new Date(ev.date + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
                              const details = [ev.description, ev.registrationLink ? `Register: ${ev.registrationLink}` : ''].filter(Boolean).join('\\n')
                              return [
                                'BEGIN:VEVENT',
                                `DTSTART;VALUE=DATE:${start}`,
                                `DTEND;VALUE=DATE:${end}`,
                                `SUMMARY:${ev.name}`,
                                `LOCATION:${ev.city}, ${ev.state}`,
                                `DESCRIPTION:${details}`,
                                `UID:${ev.id}@adidas-select`,
                                'END:VEVENT'
                              ].join('\r\n')
                            }).join('\r\n')
                            const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//adidas Select//Events//EN\r\n${icsEvents}\r\nEND:VCALENDAR`
                            const blob = new Blob([ics], { type: 'text/calendar' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'adidas_select_events.ics'
                            a.click()
                            URL.revokeObjectURL(url)
                            setShowSubscribeMenu(false)
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="currentColor"/>
                          </svg>
                          Apple Calendar
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="events-count">{sortedEvents.length}</span>
                  <div className="view-toggle">
                    <button
                      className={`view-toggle-btn ${eventsViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setEventsViewMode('list')}
                      title="List view"
                    >&#9776;</button>
                    <button
                      className={`view-toggle-btn ${eventsViewMode === 'calendar' ? 'active' : ''}`}
                      onClick={() => setEventsViewMode('calendar')}
                      title="Calendar view"
                    >&#9638;</button>
                  </div>
                </div>
              </div>

              {eventsViewMode === 'calendar' && (
                <EventCalendar
                  events={events}
                  selectedDate={calendarSelectedDate}
                  onSelectDate={(d) => setCalendarSelectedDate(d === calendarSelectedDate ? null : d)}
                />
              )}

              <div className="events-list">
                {sortedEvents.length === 0 ? (
                  <div className="events-empty">{calendarSelectedDate ? 'No events on this date.' : 'No events yet. Add your first event!'}</div>
                ) : (
                  sortedEvents.map(event => {
                    const now = new Date().toISOString().split('T')[0]
                    const isPast = event.date < now
                    const isWithin2Weeks = !isPast && (new Date(event.date) - new Date()) <= 14 * 24 * 60 * 60 * 1000

                    return (
                      <div
                        key={event.id}
                        className={`event-card ${isPast ? 'event-past' : ''} ${selectedEventId === event.id ? 'event-selected' : ''}`}
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        {event.proposed && <span className="event-badge event-badge-proposed">Proposed</span>}
                        {!event.proposed && isWithin2Weeks && <span className="event-badge">Upcoming</span>}
                        {!event.proposed && isPast && <span className="event-badge event-badge-past">Past</span>}
                        {event.photo && (
                          <div className="event-card-photo">
                            <img src={event.photo} alt={event.name} />
                          </div>
                        )}
                        <div className="event-card-info">
                          <h3 className="event-card-name">{event.name}</h3>
                          <p className="event-card-location">{event.city}, {event.state}</p>
                          <p className="event-card-date">
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {event.endDate && ` - ${new Date(event.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </p>
                          {event.hostPartner && (
                            <p className="event-card-host">Host: {event.hostPartner}</p>
                          )}
                          {event.description && (
                            <p className="event-card-desc">{event.description}</p>
                          )}
                          <div className="event-card-actions">
                            {event.registrationLink && (
                              <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="event-register-btn">
                                Register
                              </a>
                            )}
                            {isUserAllowed && (
                              <>
                                <button className="event-edit-btn" onClick={(e) => { e.stopPropagation(); openEditEventForm(event) }}>Edit</button>
                                <button className="event-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id) }}>Remove</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Programs Map + Detail Panel */
          <div className="programs-layout" ref={mapRef}>
            {isLoading ? (
              <div className="skeleton-map">
                  <span className="skeleton-map-label">Loading map...</span>
                </div>
            ) : (
              <MapContainer
                key={activeTab}
                center={mapCenter}
                zoom={mapZoom}
                className="map-container"
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <DynamicTileLayer darkMode={darkMode} />
                <MapViewPreserver />
                <StateLabels />
                {selectedProgram && (
                  <FlyToMarker position={adjustedPositions[selectedProgram.id] || selectedProgram.coordinates} />
                )}

                {displayPrograms.map(program => (
                  program && program.coordinates && (
                    <Marker
                      key={program.id}
                      position={adjustedPositions[program.id] || program.coordinates}
                      icon={programIcons[program.id]}
                      eventHandlers={{
                        click: () => {
                          setSelectedProgram(program)
                          setSelectedMtZionGroup(mtZionGroupMap[program.id] || null)
                        }
                      }}
                    />
                  )
                ))}
              </MapContainer>
            )}

            <DetailPanel
              program={selectedProgram}
              mtZionPrograms={selectedMtZionGroup}
              sport={activeTab}
              isOpen={!!selectedProgram}
              onClose={() => { setSelectedProgram(null); setSelectedMtZionGroup(null) }}
              isUserAllowed={isUserAllowed}
              user={user}
              onEdit={(p) => { setSelectedProgram(null); setSelectedMtZionGroup(null); openEditForm(p) }}
              onDelete={(id) => { setSelectedProgram(null); setSelectedMtZionGroup(null); handleDeleteProgram(id) }}
            />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          {activeTab === 'events'
            ? `${events.length} events`
            : `${filteredPrograms.length} programs displayed`}
          {user && ` | Signed in as ${user.email}`}
        </p>
      </footer>

      <AddProgramForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onAdd={handleAddProgram}
        onEdit={handleEditProgram}
        sport={activeTab}
        editProgram={editingProgram}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      <HistoryModal
        isOpen={!!historyProgram}
        onClose={() => setHistoryProgram(null)}
        program={historyProgram}
        sport={activeTab}
      />

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        allowedUsers={allowedUsers}
      />

      <AddEventForm
        isOpen={isEventFormOpen}
        onClose={closeEventForm}
        onAdd={handleAddEvent}
        onEdit={handleEditEvent}
        editEvent={editingEvent}
        allPrograms={programs}
      />

      {showExportMenu && (
        <div className="modal-overlay" onClick={() => setShowExportMenu(false)}>
          <div className="export-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowExportMenu(false)}>&times;</button>
            <h3>Export</h3>
            <p className="export-modal-sub">Choose an export format</p>
            <div className="export-modal-options">
              <button className="export-modal-btn" onClick={() => { handleExportMap(); setShowExportMenu(false) }}>
                <span className="export-modal-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="16" height="14" rx="2"/>
                    <circle cx="6" cy="14" r="1" fill="currentColor"/>
                    <path d="M10 6l4 4-4 4"/>
                  </svg>
                </span>
                <span>Export Map (PNG)</span>
              </button>
              <button className="export-modal-btn" onClick={() => { handleExportCSV(); }}>
                <span className="export-modal-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="2" width="16" height="16" rx="2"/>
                    <line x1="2" y1="7" x2="18" y2="7"/>
                    <line x1="2" y1="12" x2="18" y2="12"/>
                    <line x1="7" y1="2" x2="7" y2="18"/>
                  </svg>
                </span>
                <span>Export List (CSV)</span>
              </button>
              {activeTab !== 'events' && (
                <button className="export-modal-btn" onClick={handleExportPDF}>
                  <span className="export-modal-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                      <polyline points="12,2 12,6 16,6"/>
                      <line x1="6" y1="11" x2="14" y2="11"/>
                      <line x1="6" y1="15" x2="14" y2="15"/>
                    </svg>
                  </span>
                  <span>Export Report (PDF)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        programs={programs}
        events={events}
        sport={activeTab}
      />

      <DigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        programs={programs}
        events={events}
        sport={activeTab}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        programs={programs}
        events={events}
        sport={activeTab}
      />

      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        programs={programs}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedPrograms={archivedPrograms}
        onRestore={handleRestoreProgram}
        onDelete={handlePermanentDelete}
        sport={activeTab}
      />

      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        programs={programs}
        onSave={handleEditProgram}
        sport={activeTab}
      />
    </div>
  )
}

export default App
