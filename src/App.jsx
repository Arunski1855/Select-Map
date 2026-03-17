import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
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
  linkEventToPrograms,
  addTargetProgram,
  subscribeToTargetPrograms,
  editTargetProgram,
  deleteTargetProgram,
  addTargetNote,
  subscribeToTargetNotes,
  deleteTargetNote,
  addTargetRankingMetric,
  addRankingMetric,
  subscribeToAllContractDetails,
  subscribeToCompetitorEvents,
  addCompetitorEvent,
  updateCompetitorEvent,
  deleteCompetitorEvent,
  getBackupPin
} from './firebase'
import AddProgramForm from './components/AddProgramForm'
import AddEventForm from './components/AddEventForm'
import AddTargetForm from './components/AddTargetForm'
import SplashScreen from './components/SplashScreen'
import DetailPanel from './components/DetailPanel'
import TargetDetailPanel from './components/TargetDetailPanel'
import BackupPanel from './components/BackupPanel'
import { initAutoBackup, isBackupNeeded } from './utils/autoBackup'
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

// HTML escape utility to prevent XSS
const escapeHtml = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Create custom icon for each program logo (cached to prevent unnecessary re-renders)
const iconCache = new Map()
const createLogoIcon = (logoUrl, name, useContain = false, contractStatus = null, isSelect = true, yearsRemaining = null, contractTier = null) => {
  const cacheKey = `${logoUrl}|${name}|${useContain}|${contractStatus}|${isSelect}|${yearsRemaining}|${contractTier}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)
  const statusClass = contractStatus ? ` contract-marker-${contractStatus}` : ''
  const eliteClass = isSelect === false ? ' elite-tier' : ''
  // Years remaining gradient class: 0=urgent, 1=warning, 2=caution, 3+=healthy
  let yearsClass = ''
  if (yearsRemaining !== null && contractStatus !== 'none') {
    if (yearsRemaining === 0) yearsClass = ' contract-years-0'
    else if (yearsRemaining === 1) yearsClass = ' contract-years-1'
    else if (yearsRemaining === 2) yearsClass = ' contract-years-2'
    else yearsClass = ' contract-years-3plus'
  }
  // Contract tier class for intensity
  const tierClass = contractTier ? ` contract-tier-${contractTier}` : ''
  const safeName = escapeHtml(name)
  const icon = L.divIcon({
    className: 'custom-logo-marker',
    html: `
      <div class="logo-marker${useContain ? ' logo-contain' : ''}${statusClass}${yearsClass}${tierClass}${eliteClass}" title="${safeName}${isSelect === false ? ' (Elite)' : ''}">
        <img src="${escapeHtml(logoUrl)}" alt="${safeName}" onerror="this.style.display='none'" />
        ${isSelect === false ? '<span class="elite-badge">E</span>' : ''}
        ${contractTier === 'premium' ? '<span class="tier-badge">★</span>' : ''}
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
  { id: 'events', name: 'Select Events', icon: '/logos/adidas-logo.png' },
  { id: 'targets', name: 'Target Programs', icon: '/logos/adidas-logo.png' }
]

// Pipeline status configuration
const PIPELINE_STATUSES = [
  { id: 'identified', label: 'Identified', description: 'On our radar', color: '#6b7280' },
  { id: 'contacted', label: 'Contacted', description: 'Initial outreach made', color: '#3b82f6' },
  { id: 'in_discussion', label: 'In Discussion', description: 'Active conversations', color: '#8b5cf6' },
  { id: 'proposal_sent', label: 'Proposal Sent', description: 'Offer extended', color: '#f59e0b' },
  { id: 'negotiating', label: 'Negotiating', description: 'Working terms', color: '#ec4899' },
  { id: 'signed', label: 'Signed', description: 'Won', color: '#10b981' },
  { id: 'lost', label: 'Lost', description: 'Went elsewhere', color: '#ef4444' }
]

// Priority configuration
const PRIORITIES = [
  { id: 'high', label: 'High', description: 'Must-have programs', color: '#ef4444' },
  { id: 'medium', label: 'Medium', description: 'Strong targets', color: '#f59e0b' },
  { id: 'low', label: 'Low', description: 'Nice to have', color: '#6b7280' }
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

// Login Required Overlay - shows when content requires authentication
function LoginRequiredOverlay({ onLoginClick, title = "Sign in required", message = "Please sign in to access this content." }) {
  return (
    <div className="login-required-overlay">
      <div className="login-required-content">
        <div className="login-required-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <button className="login-required-btn" onClick={onLoginClick}>
          Sign In
        </button>
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

// High-quality tile providers with retina support
const TILE_PROVIDERS = {
  // Mapbox - Requires API key in VITE_MAPBOX_TOKEN env var (best quality)
  mapbox: {
    light: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN || ''}`,
    dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN || ''}`,
    attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  // Stadia Maps - Requires API key in VITE_STADIA_TOKEN env var
  stadia: {
    light: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_TOKEN || ''}`,
    dark: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_TOKEN || ''}`,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  // CartoDB Voyager - No auth required, clean modern style
  carto: {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
}

// Select provider: Mapbox > Stadia (if keys exist), otherwise CartoDB Voyager
const getActiveProvider = () => {
  if (import.meta.env.VITE_MAPBOX_TOKEN) return TILE_PROVIDERS.mapbox
  if (import.meta.env.VITE_STADIA_TOKEN) return TILE_PROVIDERS.stadia
  return TILE_PROVIDERS.carto
}

// Dynamic tile layer that swaps without remounting the map
function DynamicTileLayer({ darkMode }) {
  const map = useMap()
  const provider = getActiveProvider()
  const url = darkMode ? provider.dark : provider.light
  const isMapbox = import.meta.env.VITE_MAPBOX_TOKEN

  useEffect(() => {
    const tileLayer = L.tileLayer(url, {
      attribution: provider.attribution,
      maxZoom: 19,
      // Mapbox uses 512px tiles, others use 256px
      ...(isMapbox ? { tileSize: 512, zoomOffset: -1 } : {}),
      detectRetina: true
    })
    tileLayer.addTo(map)
    return () => { map.removeLayer(tileLayer) }
  }, [url, map, provider.attribution, isMapbox])

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
    const MIN_VALID_ZOOM = 3 // Don't save views zoomed out beyond this (prevents saving bad states)

    const onMoveEnd = () => {
      // Ignore view changes triggered by container resize or restoration
      if (resizing.current || restoring.current) return
      // Don't save extremely zoomed-out views (likely a bug, not user intent)
      const currentZoom = map.getZoom()
      if (currentZoom < MIN_VALID_ZOOM) return
      // Debounce saving to avoid capturing intermediate states during data updates
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        savedView.current = { center: map.getCenter(), zoom: map.getZoom() }
      }, 300) // Increased debounce to 300ms
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

  // On every render, if the map was reset or zoomed out unexpectedly, restore saved view
  useEffect(() => {
    if (savedView.current) {
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      const saved = savedView.current
      const dist = Math.abs(currentCenter.lat - saved.center.lat) + Math.abs(currentCenter.lng - saved.center.lng)
      // Restore if: view drifted significantly, OR zoom dropped below threshold (unexpected zoom-out)
      const driftedTooFar = dist > 0.5 || Math.abs(currentZoom - saved.zoom) > 0.5
      const zoomedOutUnexpectedly = currentZoom < 3 && saved.zoom >= 3
      if (driftedTooFar || zoomedOutUnexpectedly) {
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
      map.panTo(position, { duration: 0.5, easeLinearity: 0.25 })
    }
  }, [position, map])
  return null
}

// Hover Preview Card - shows on marker hover
function HoverPreviewCard({ program, position, regionColor }) {
  if (!program) return null

  // Position card near cursor but keep it on screen
  const style = {
    left: Math.min(position.x + 15, window.innerWidth - 280),
    top: Math.max(position.y - 60, 10)
  }

  return (
    <div className="hover-preview-card" style={style}>
      <div className="hpc-header" style={{ borderLeftColor: regionColor || '#000' }}>
        {program.logo && (
          <img src={program.logo} alt="" className="hpc-logo" />
        )}
        <div className="hpc-title">
          <span className="hpc-name">{program.name}</span>
          <span className="hpc-location">{program.city}, {program.state}</span>
        </div>
      </div>
      <div className="hpc-body">
        {program.teamType && (
          <div className="hpc-row">
            <span className="hpc-label">TYPE</span>
            <span className="hpc-value">{program.teamType}</span>
          </div>
        )}
        {program.headCoach && (
          <div className="hpc-row">
            <span className="hpc-label">COACH</span>
            <span className="hpc-value">{program.headCoach}</span>
          </div>
        )}
        {program.conference && (
          <div className="hpc-row">
            <span className="hpc-label">CONF</span>
            <span className="hpc-value">{program.conference}</span>
          </div>
        )}
      </div>
      <div className="hpc-footer">Click for details</div>
    </div>
  )
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
  'Mahomes': '#e31837',
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
function ReportsModal({ isOpen, onClose, programs, events, sport, allContractDetails = {} }) {
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

  const currentYear = new Date().getFullYear()

  const getContractStatus = (programId) => {
    const contract = allContractDetails[programId]
    if (!contract) return 'none'
    const termYears = contract.term?.match(/\b(20\d{2})\b/g)?.map(Number) || []
    const termEndYear = termYears.length > 0 ? Math.max(...termYears) : null
    const isExpiring = contract[`contractExpiring${currentYear}`] || termEndYear === currentYear
    return isExpiring ? 'expiring' : 'active'
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
      case 'contractStatus': {
        const statusOrder = { 'expiring': 0, 'active': 1, 'none': 2 }
        return statusOrder[getContractStatus(item.id)] ?? 2
      }
      case 'tcaStore': return item.tcaStoreUrl ? 0 : 1
      default: return item.name || ''
    }
  }

  const sortedFiltered = [...filtered].sort((a, b) => {
    for (const { col, dir } of sortCols) {
      const aVal = getColValue(a, col)
      const bVal = getColValue(b, col)
      const cmp = (col === 'level' || col === 'contractStatus' || col === 'tcaStore') ? aVal - bVal : String(aVal).localeCompare(String(bVal))
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
                    <SortTh col="contractStatus">Contract Status</SortTh>
                    <SortTh col="tcaStore">TCA Store</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map(p => {
                    const contractStatus = getContractStatus(p.id)
                    return (
                    <tr key={p.id}>
                      <td className="report-program-name">{p.logo && <img src={p.logo} alt="" className="report-program-logo" />}{p.name}</td>
                      <td><span className={`report-gender-chip ${(p.gender || 'Boys') === 'Girls' ? 'girls' : 'boys'}`}>{p.gender || 'Boys'}</span></td>
                      <td>{p.city}, {p.state}</td>
                      <td><span className="report-region-chip" style={{ background: REGIONS[p.region]?.color || '#666' }}>{p.region}</span></td>
                      <td>{p.level ? <span className="report-level-chip" style={{ background: LEVEL_COLORS[p.level] || '#666' }}>{p.level}</span> : '-'}</td>
                      <td>{p.conference || '-'}</td>
                      <td>{p.headCoach || '-'}</td>
                      <td>{p.contactEmail || p.contactPhone || '-'}</td>
                      <td><span className={`cd-status cd-status-${contractStatus}`}>{contractStatus === 'expiring' ? 'Expiring' : contractStatus === 'active' ? 'Active' : 'No Contract'}</span></td>
                      <td>{p.tcaStoreUrl ? <a href={p.tcaStoreUrl} target="_blank" rel="noopener noreferrer" className="bulk-edit-tca-yes">Yes</a> : '-'}</td>
                    </tr>
                    )
                  })}
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
function BulkEditModal({ isOpen, onClose, programs, onSave, onDelete, sport }) {
  const [editedPrograms, setEditedPrograms] = useState({})
  const [programsToDelete, setProgramsToDelete] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'missing-coach', 'missing-contact'

  useEffect(() => {
    if (isOpen) {
      setEditedPrograms({})
      setProgramsToDelete(new Set())
      setFilter('all')
    }
  }, [isOpen])

  const toggleDeleteProgram = (programId) => {
    setProgramsToDelete(prev => {
      const newSet = new Set(prev)
      if (newSet.has(programId)) {
        newSet.delete(programId)
      } else {
        newSet.add(programId)
      }
      return newSet
    })
  }

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

  const hasChanges = Object.keys(editedPrograms).length > 0 || programsToDelete.size > 0

  const handleSaveAll = async () => {
    if (programsToDelete.size > 0) {
      const confirmMsg = `Archive ${programsToDelete.size} program${programsToDelete.size > 1 ? 's' : ''}? They will be hidden but can be restored later.`
      if (!window.confirm(confirmMsg)) {
        return
      }
    }

    setSaving(true)
    try {
      // Handle deletions first (only if there are programs to delete)
      if (programsToDelete.size > 0 && onDelete) {
        const deleteIds = Array.from(programsToDelete)
        for (const programId of deleteIds) {
          await onDelete(programId)
        }
      }

      // Then handle edits (skip programs that were deleted)
      for (const [programId, changes] of Object.entries(editedPrograms)) {
        if (programsToDelete.size === 0 || !programsToDelete.has(programId)) {
          const program = programs.find(p => p.id === programId)
          if (program) {
            await onSave({ ...program, ...changes })
          }
        }
      }
      setEditedPrograms({})
      setProgramsToDelete(new Set())
      onClose()
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error saving changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const changedCount = Object.keys(editedPrograms).length
  const deleteCount = programsToDelete.size

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
            {deleteCount > 0 && <span className="bulk-edit-delete-count"> • {deleteCount} to archive</span>}
          </span>
        </div>

        <div className="bulk-edit-table-wrapper">
          <table className="bulk-edit-table">
            <thead>
              <tr>
                <th className="bulk-edit-th-delete">Archive</th>
                <th className="bulk-edit-th-name">Program</th>
                <th>Head Coach</th>
                <th>Contact Email</th>
                <th>Contact Phone</th>
                <th>Instagram</th>
                <th>Twitter</th>
                <th>TCA Store</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map(program => {
                const isModified = !!editedPrograms[program.id]
                const isMarkedForDelete = programsToDelete.has(program.id)
                return (
                  <tr key={program.id} className={`${isModified ? 'bulk-edit-row-modified' : ''} ${isMarkedForDelete ? 'bulk-edit-row-delete' : ''}`}>
                    <td className="bulk-edit-td-delete">
                      <input
                        type="checkbox"
                        checked={isMarkedForDelete}
                        onChange={() => toggleDeleteProgram(program.id)}
                        className="bulk-edit-delete-checkbox"
                        title="Mark for archive"
                      />
                    </td>
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
                    <td className="bulk-edit-tca-store">
                      {program.tcaStoreUrl ? (
                        <a href={program.tcaStoreUrl} target="_blank" rel="noopener noreferrer" className="bulk-edit-tca-yes">Yes</a>
                      ) : (
                        <span className="bulk-edit-tca-no">No</span>
                      )}
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
            {saving ? 'Saving...' : `Save All${changedCount > 0 || deleteCount > 0 ? ` (${changedCount + deleteCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Contract Dashboard Modal Component
function ContractDashboard({ isOpen, onClose, programs, allContractDetails, sport }) {
  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'expiring', 'active', 'none'

  if (!isOpen) return null

  const currentYear = new Date().getFullYear()

  const getContractStatus = (contract) => {
    if (!contract) return 'none'
    const termYears = contract.term?.match(/\b(20\d{2})\b/g)?.map(Number) || []
    const termEndYear = termYears.length > 0 ? Math.max(...termYears) : null
    const isExpiring = contract.contractExpiring2026 || termEndYear === currentYear
    return isExpiring ? 'expiring' : 'active'
  }

  const rows = programs
    .filter(p => p && p.id)
    .map(p => {
      const contract = allContractDetails[p.id] || null
      const status = getContractStatus(contract)
      return { program: p, contract, status }
    })
    .filter(r => filterStatus === 'all' || r.status === filterStatus)

  rows.sort((a, b) => {
    let aVal, bVal
    switch (sortCol) {
      case 'name': aVal = a.program.name || ''; bVal = b.program.name || ''; break
      case 'region': aVal = a.program.region || ''; bVal = b.program.region || ''; break
      case 'term': aVal = a.contract?.term || ''; bVal = b.contract?.term || ''; break
      case 'travel': aVal = a.contract?.travelStipend || ''; bVal = b.contract?.travelStipend || ''; break
      case 'product': aVal = a.contract?.productAllotment || ''; bVal = b.contract?.productAllotment || ''; break
      case 'status': aVal = a.status; bVal = b.status; break
      default: aVal = ''; bVal = ''
    }
    const cmp = aVal.localeCompare(bVal)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const totalContracts = programs.filter(p => allContractDetails[p.id]).length
  const expiringCount = programs.filter(p => getContractStatus(allContractDetails[p.id]) === 'expiring').length
  const activeCount = programs.filter(p => getContractStatus(allContractDetails[p.id]) === 'active').length
  const noContractCount = programs.length - totalContracts

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="sort-icon sort-icon-neutral">⇅</span>
    return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const statusLabel = (status) => {
    if (status === 'expiring') return <span className="cd-status cd-status-expiring">Expiring {currentYear}</span>
    if (status === 'active') return <span className="cd-status cd-status-active">Active</span>
    return <span className="cd-status cd-status-none">No Contract</span>
  }

  const handleExportCSV = () => {
    const headers = ['School', 'Region', 'State', 'Term', 'Travel Stipend', 'Product Allotment', 'Incentive Structure', 'Status', 'Last Updated']
    const csvRows = rows.map(r => [
      r.program.name || '',
      r.program.region || '',
      r.program.state || '',
      r.contract?.term || '',
      r.contract?.travelStipend || '',
      r.contract?.productAllotment || '',
      r.contract?.incentiveStructure || '',
      r.status,
      r.contract?.lastUpdated ? new Date(r.contract.lastUpdated).toLocaleDateString() : ''
    ])
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.download = `adidas-select-contracts-${sport}-${new Date().toISOString().split('T')[0]}.csv`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contract-dashboard-modal" onClick={e => e.stopPropagation()}>
        <div className="cd-header">
          <div className="cd-title-row">
            <h2 className="cd-title">Contract Overview — {sport === 'basketball' ? 'Select Basketball' : 'Select Football'}</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="cd-summary">
            <div className="cd-summary-item">
              <span className="cd-summary-value">{programs.length}</span>
              <span className="cd-summary-label">Total Programs</span>
            </div>
            <div className="cd-summary-item">
              <span className="cd-summary-value">{totalContracts}</span>
              <span className="cd-summary-label">Under Contract</span>
            </div>
            <div className="cd-summary-item cd-summary-expiring">
              <span className="cd-summary-value">{expiringCount}</span>
              <span className="cd-summary-label">Expiring {currentYear}</span>
            </div>
            <div className="cd-summary-item cd-summary-active">
              <span className="cd-summary-value">{activeCount}</span>
              <span className="cd-summary-label">Active</span>
            </div>
            <div className="cd-summary-item cd-summary-none">
              <span className="cd-summary-value">{noContractCount}</span>
              <span className="cd-summary-label">No Data</span>
            </div>
          </div>
          <div className="cd-controls">
            <div className="cd-filter-pills">
              {['all', 'expiring', 'active', 'none'].map(s => (
                <button
                  key={s}
                  className={`cd-filter-pill ${filterStatus === s ? 'active' : ''} ${s !== 'all' ? `cd-pill-${s}` : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? 'All' : s === 'none' ? 'No Contract' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <button className="cd-export-btn" onClick={handleExportCSV}>Export CSV</button>
          </div>
        </div>

        <div className="cd-table-wrap">
          <table className="cd-table">
            <thead>
              <tr>
                <th className="cd-th sortable" onClick={() => handleSort('name')}>School <SortIcon col="name" /></th>
                <th className="cd-th sortable" onClick={() => handleSort('region')}>Region <SortIcon col="region" /></th>
                <th className="cd-th sortable" onClick={() => handleSort('term')}>Term <SortIcon col="term" /></th>
                <th className="cd-th sortable" onClick={() => handleSort('travel')}>Travel Stipend <SortIcon col="travel" /></th>
                <th className="cd-th sortable" onClick={() => handleSort('product')}>Product Allotment <SortIcon col="product" /></th>
                <th className="cd-th">Incentive Structure</th>
                <th className="cd-th sortable" onClick={() => handleSort('status')}>Status <SortIcon col="status" /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ program, contract, status }) => (
                <tr key={program.id} className={`cd-row cd-row-${status}`}>
                  <td className="cd-td cd-td-name">
                    {program.logo && <img src={program.logo} alt="" className="cd-logo" />}
                    <span>{program.name}</span>
                  </td>
                  <td className="cd-td">{program.region || '—'}</td>
                  <td className="cd-td">{contract?.term || '—'}</td>
                  <td className="cd-td">{contract?.travelStipend || '—'}</td>
                  <td className="cd-td">{contract?.productAllotment || '—'}</td>
                  <td className="cd-td cd-td-incentive">{contract?.incentiveStructure || '—'}</td>
                  <td className="cd-td">{statusLabel(status)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="cd-empty">No programs match the selected filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cd-footer">
          <span>{rows.length} program{rows.length !== 1 ? 's' : ''} shown</span>
        </div>
      </div>
    </div>
  )
}

// Competitor Events Modal Component
const COMPETITOR_BRANDS = {
  nike: { label: 'Nike', color: '#F35B04' },
  ua: { label: 'Under Armour', color: '#E03A3E' },
  puma: { label: 'Puma', color: '#00857C' },
  general: { label: 'General', color: '#6b7280' }
}

const EVENT_TYPES = ['Circuit', 'Camp', 'Showcase', 'Combine', 'Tournament', 'Other']

function CompetitorEventsModal({ isOpen, onClose, events, onAdd, onUpdate, onDelete, isUserAllowed, userEmail }) {
  const [filterBrand, setFilterBrand] = useState('all')
  const [isAdding, setIsAdding] = useState(false)
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [bulkImportText, setBulkImportText] = useState('')
  const [bulkImportStatus, setBulkImportStatus] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: 'nike',
    date: '',
    endDate: '',
    city: '',
    state: '',
    type: 'Circuit',
    isLivePeriod: false,
    notes: ''
  })

  if (!isOpen) return null

  const filteredEvents = filterBrand === 'all'
    ? events
    : events.filter(e => e.brand === filterBrand)

  // Split into upcoming and past
  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = filteredEvents.filter(e => e.date >= today)
  const pastEvents = filteredEvents.filter(e => e.date < today).reverse()

  const resetForm = () => {
    setFormData({
      name: '',
      brand: 'nike',
      date: '',
      endDate: '',
      city: '',
      state: '',
      type: 'Circuit',
      isLivePeriod: false,
      notes: ''
    })
    setIsAdding(false)
    setEditingEvent(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEvent) {
        await onUpdate(editingEvent.id, { ...formData, addedBy: editingEvent.addedBy })
      } else {
        await onAdd({ ...formData, addedBy: userEmail })
      }
      resetForm()
    } catch (err) {
      console.error('Error saving competitor event:', err)
      alert('Failed to save event. Please try again.')
    }
  }

  const handleEdit = (event) => {
    setFormData({
      name: event.name || '',
      brand: event.brand || 'nike',
      date: event.date || '',
      endDate: event.endDate || '',
      city: event.city || '',
      state: event.state || '',
      type: event.type || 'Circuit',
      isLivePeriod: event.isLivePeriod || false,
      notes: event.notes || ''
    })
    setEditingEvent(event)
    setIsAdding(true)
  }

  const handleDelete = async (eventId) => {
    if (!confirm('Delete this competitor event?')) return
    try {
      await onDelete(eventId)
    } catch (err) {
      console.error('Error deleting competitor event:', err)
    }
  }

  const handleBulkImport = async () => {
    setBulkImportStatus({ type: 'loading', message: 'Importing...' })
    try {
      const eventsToAdd = JSON.parse(bulkImportText)
      if (!Array.isArray(eventsToAdd)) {
        throw new Error('Input must be a JSON array')
      }
      let added = 0
      for (const event of eventsToAdd) {
        if (!event.name || !event.date) {
          console.warn('Skipping event missing name or date:', event)
          continue
        }
        await onAdd({
          name: event.name,
          brand: event.brand || 'general',
          date: event.date,
          endDate: event.endDate || '',
          city: event.city || '',
          state: event.state || '',
          type: event.type || 'Circuit',
          isLivePeriod: event.isLivePeriod || false,
          notes: event.notes || '',
          addedBy: userEmail
        })
        added++
      }
      setBulkImportStatus({ type: 'success', message: `Added ${added} events!` })
      setBulkImportText('')
      setTimeout(() => {
        setIsBulkImporting(false)
        setBulkImportStatus(null)
      }, 1500)
    } catch (err) {
      console.error('Bulk import error:', err)
      setBulkImportStatus({ type: 'error', message: `Error: ${err.message}` })
    }
  }

  const formatDateRange = (start, end) => {
    const startDate = new Date(start + 'T00:00:00')
    const opts = { month: 'short', day: 'numeric' }
    if (!end || start === end) {
      return startDate.toLocaleDateString('en-US', opts)
    }
    const endDate = new Date(end + 'T00:00:00')
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', opts)}-${endDate.getDate()}`
    }
    return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
  }

  const renderEventRow = (event) => (
    <div key={event.id} className="ce-row">
      <span className="ce-row-date">{formatDateRange(event.date, event.endDate)}</span>
      <span className="ce-row-name">{event.name}</span>
      <span className="ce-row-brand" style={{ background: COMPETITOR_BRANDS[event.brand]?.color || '#6b7280' }}>
        {COMPETITOR_BRANDS[event.brand]?.label || event.brand}
      </span>
      <span className="ce-row-loc">{event.city}, {event.state}</span>
      {event.isLivePeriod && <span className="ce-row-live">LIVE</span>}
      {isUserAllowed && (
        <span className="ce-row-actions">
          <button onClick={() => handleEdit(event)} title="Edit">✎</button>
          <button onClick={() => handleDelete(event.id)} title="Delete">×</button>
        </span>
      )}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ce-modal" onClick={e => e.stopPropagation()}>
        <div className="ce-header">
          <div className="ce-title-row">
            <h2 className="ce-title">Competitor Events</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="ce-controls">
            <div className="ce-filter-pills">
              <button
                className={`ce-filter-pill ${filterBrand === 'all' ? 'active' : ''}`}
                onClick={() => setFilterBrand('all')}
              >
                All ({events.length})
              </button>
              {Object.entries(COMPETITOR_BRANDS).map(([key, { label, color }]) => {
                const count = events.filter(e => e.brand === key).length
                return (
                  <button
                    key={key}
                    className={`ce-filter-pill ${filterBrand === key ? 'active' : ''}`}
                    style={filterBrand === key ? { background: color, borderColor: color } : {}}
                    onClick={() => setFilterBrand(key)}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>
            {isUserAllowed && !isAdding && !isBulkImporting && (
              <div className="ce-action-btns">
                <button className="ce-add-btn" onClick={() => setIsAdding(true)}>+ Add Event</button>
                <button className="ce-bulk-btn" onClick={() => setIsBulkImporting(true)}>Bulk Import</button>
              </div>
            )}
          </div>
        </div>

        <div className="ce-body">
          {isBulkImporting && (
            <div className="ce-bulk-form">
              <div className="ce-bulk-header">
                <h3>Bulk Import Events</h3>
                <button className="ce-bulk-close" onClick={() => { setIsBulkImporting(false); setBulkImportStatus(null); setBulkImportText(''); }}>×</button>
              </div>
              <p className="ce-bulk-help">Paste JSON array of events. Each event needs: name, brand (nike/ua/puma/general), date (YYYY-MM-DD), and optionally: endDate, city, state, type, isLivePeriod, notes.</p>
              <textarea
                className="ce-bulk-textarea"
                value={bulkImportText}
                onChange={e => setBulkImportText(e.target.value)}
                placeholder={`[
  {"name": "EYBL Session 1", "brand": "nike", "date": "2026-04-24", "endDate": "2026-04-26", "city": "Atlanta", "state": "GA", "type": "Circuit"},
  {"name": "EYBL Session 2", "brand": "nike", "date": "2026-05-15", "endDate": "2026-05-17", "city": "Memphis", "state": "TN", "type": "Circuit", "isLivePeriod": true}
]`}
                rows={8}
              />
              {bulkImportStatus && (
                <div className={`ce-bulk-status ce-bulk-status-${bulkImportStatus.type}`}>
                  {bulkImportStatus.message}
                </div>
              )}
              <div className="ce-form-actions">
                <button type="button" className="ce-cancel-btn" onClick={() => { setIsBulkImporting(false); setBulkImportStatus(null); setBulkImportText(''); }}>Cancel</button>
                <button type="button" className="ce-save-btn" onClick={handleBulkImport} disabled={!bulkImportText.trim()}>Import Events</button>
              </div>
            </div>
          )}

          {isAdding && !isBulkImporting && (
            <form className="ce-form" onSubmit={handleSubmit}>
              <div className="ce-form-row">
                <div className="ce-form-field ce-form-field-wide">
                  <label>Event Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., EYBL Session 1"
                    required
                  />
                </div>
                <div className="ce-form-field">
                  <label>Brand</label>
                  <select
                    value={formData.brand}
                    onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  >
                    {Object.entries(COMPETITOR_BRANDS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="ce-form-row">
                <div className="ce-form-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="ce-form-field">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="ce-form-field">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="ce-form-row">
                <div className="ce-form-field">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Detroit"
                    required
                  />
                </div>
                <div className="ce-form-field">
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="MI"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="ce-form-field ce-form-field-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isLivePeriod}
                      onChange={e => setFormData(prev => ({ ...prev, isLivePeriod: e.target.checked }))}
                    />
                    <span>Live Period</span>
                  </label>
                </div>
              </div>
              <div className="ce-form-row">
                <div className="ce-form-field ce-form-field-wide">
                  <label>Notes (optional)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional info..."
                  />
                </div>
              </div>
              <div className="ce-form-actions">
                <button type="button" className="ce-cancel-btn" onClick={resetForm}>Cancel</button>
                <button type="submit" className="ce-save-btn">
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          )}

          {upcomingEvents.length > 0 && (
            <div className="ce-section">
              <h3 className="ce-section-title">Upcoming</h3>
              <div className="ce-event-list">
                {upcomingEvents.map(renderEventRow)}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="ce-section">
              <h3 className="ce-section-title ce-section-title-past">Past</h3>
              <div className="ce-event-list ce-event-list-past">
                {pastEvents.map(renderEventRow)}
              </div>
            </div>
          )}

          {filteredEvents.length === 0 && !isAdding && (
            <div className="ce-empty">
              No competitor events {filterBrand !== 'all' ? `for ${COMPETITOR_BRANDS[filterBrand]?.label}` : 'yet'}.
              {isUserAllowed && ' Click "Add Event" to get started.'}
            </div>
          )}
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
  const [isBackupPanelOpen, setIsBackupPanelOpen] = useState(false)
  const [backupReminder, setBackupReminder] = useState(null)
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

  // Region dropdown (unused - kept for mobile compatibility)
  const [showRegionPopup, setShowRegionPopup] = useState(false)

  // Mobile UX states
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true')
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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

  // Analytics dropdown menu (desktop)
  const [analyticsMenuOpen, setAnalyticsMenuOpen] = useState(false)
  // Total Programs dropdown menu (desktop)
  const [totalProgramsMenuOpen, setTotalProgramsMenuOpen] = useState(false)
  // Data dropdown menu (desktop) - Archive & Backup
  const [dataMenuOpen, setDataMenuOpen] = useState(false)

  // Backup PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  // Archive modal and state
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [archivedPrograms, setArchivedPrograms] = useState([])

  // Bulk edit modal
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)

  // Target Programs state
  const [targetPrograms, setTargetPrograms] = useState([])
  const [isTargetsLoading, setIsTargetsLoading] = useState(true)
  const [selectedTargetProgram, setSelectedTargetProgram] = useState(null)
  const [isTargetFormOpen, setIsTargetFormOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState(null)
  const [targetsSport, setTargetsSport] = useState('basketball') // which sport we're viewing targets for
  const [targetsViewMode, setTargetsViewMode] = useState('kanban') // 'kanban' or 'list' or 'map'
  const [targetStatusFilter, setTargetStatusFilter] = useState('all')
  const [targetPriorityFilter, setTargetPriorityFilter] = useState('all')
  const [targetDashboardView, setTargetDashboardView] = useState('dashboard') // 'dashboard' or 'kanban' or 'list' or 'map'
  const [draggedTarget, setDraggedTarget] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  // Contract dashboard and map layer
  const [allContractDetails, setAllContractDetails] = useState({})
  const [showContractMapLayer, setShowContractMapLayer] = useState(false)
  const [isContractDashboardOpen, setIsContractDashboardOpen] = useState(false)

  // Hover preview state
  const [hoveredProgram, setHoveredProgram] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  // Competitor events
  const [competitorEvents, setCompetitorEvents] = useState([])
  const [isCompetitorEventsOpen, setIsCompetitorEventsOpen] = useState(false)

  // Ref for map screenshot
  const mapRef = useRef(null)

  const handleExportMap = useCallback(async () => {
    const node = mapRef.current
    if (!node || isExporting) return
    setIsExporting(true)
    try {
      // Lazy load html-to-image only when needed
      const { toPng } = await import('html-to-image')
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

  // Handle backup access with PIN verification
  const handleBackupAccess = useCallback(() => {
    setPinInput('')
    setPinError(false)
    setIsPinModalOpen(true)
  }, [])

  const handlePinSubmit = useCallback(() => {
    getBackupPin((correctPin) => {
      if (pinInput === correctPin) {
        setIsPinModalOpen(false)
        setPinInput('')
        setPinError(false)
        setIsBackupPanelOpen(true)
      } else {
        setPinError(true)
      }
    })
  }, [pinInput])

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

  // Check backup status when user logs in
  useEffect(() => {
    if (!user || !isUserAllowed) return

    const checkBackup = async () => {
      try {
        const status = await isBackupNeeded()
        if (status.needed) {
          setBackupReminder({
            reason: status.reason,
            daysSinceBackup: status.daysSinceBackup
          })
        }
      } catch (error) {
        console.error('Backup check error:', error)
      }
    }

    // Check after a short delay to not block initial load
    const timeout = setTimeout(checkBackup, 3000)
    return () => clearTimeout(timeout)
  }, [user, isUserAllowed])

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

  // Subscribe to events (deferred to prioritize main program load)
  useEffect(() => {
    setIsEventsLoading(true)
    // Defer events load by 500ms to let main programs load first
    const timeout = setTimeout(() => {
      const unsubscribe = subscribeToEvents((data) => {
        setEvents(data)
        setIsEventsLoading(false)
      })
      return () => unsubscribe()
    }, 500)
    return () => clearTimeout(timeout)
  }, [])

  // Subscribe to competitor events (deferred - not critical for initial load)
  useEffect(() => {
    // Only load competitor events when panel is opened or after delay
    const timeout = setTimeout(() => {
      const unsubscribe = subscribeToCompetitorEvents(setCompetitorEvents)
      return () => unsubscribe()
    }, 2000)
    return () => clearTimeout(timeout)
  }, [])

  // Subscribe to archived programs (deferred - only needed when archive modal opened)
  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'targets') return
    // Defer archived programs by 1s
    const timeout = setTimeout(() => {
      const unsubscribe = subscribeToArchivedPrograms(activeTab, setArchivedPrograms)
      return () => unsubscribe()
    }, 1000)
    return () => clearTimeout(timeout)
  }, [activeTab])

  // Subscribe to target programs
  useEffect(() => {
    if (activeTab !== 'targets') return
    setIsTargetsLoading(true)
    const unsubscribe = subscribeToTargetPrograms(targetsSport, (data) => {
      setTargetPrograms(data)
      setIsTargetsLoading(false)
    })
    return () => unsubscribe()
  }, [activeTab, targetsSport])


  // Subscribe to all contract details for the current sport (auth-gated)
  useEffect(() => {
    if (!isUserAllowed || activeTab === 'events' || activeTab === 'targets') {
      setAllContractDetails({})
      return
    }
    const unsubscribe = subscribeToAllContractDetails(activeTab, setAllContractDetails)
    return () => unsubscribe()
  }, [isUserAllowed, activeTab])

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Apply compact mode to document and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-compact', compactMode ? 'true' : 'false')
    localStorage.setItem('compactMode', compactMode)
  }, [compactMode])

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
    const currentYear = new Date().getFullYear()
    filteredPrograms.forEach((program) => {
      if (program && program.id) {
        // Normal mode with optional contract status and gradient
        let contractStatus = null
        let contractYearsRemaining = null
        let contractTier = null
        if (showContractMapLayer && isUserAllowed) {
          const contract = allContractDetails[program.id]
          if (contract) {
            const termYears = contract.term?.match(/\b(20\d{2})\b/g)?.map(Number) || []
            const termEndYear = termYears.length > 0 ? Math.max(...termYears) : null
            const isExpiring = contract.contractExpiring2026 || termEndYear === currentYear
            contractStatus = isExpiring ? 'expiring' : 'active'
            // Calculate years remaining for gradient
            if (termEndYear) {
              contractYearsRemaining = Math.max(0, termEndYear - currentYear)
            }
            // Determine contract tier based on product allotment value
            const allotment = contract.productAllotment?.replace(/[^0-9]/g, '')
            const allotmentValue = allotment ? parseInt(allotment, 10) : 0
            if (allotmentValue >= 50000) contractTier = 'premium'
            else if (allotmentValue >= 25000) contractTier = 'standard'
            else if (allotmentValue > 0) contractTier = 'basic'
          } else {
            contractStatus = 'none'
          }
        }
        icons[program.id] = createLogoIcon(program.logo, program.name, false, contractStatus, program.isSelect, contractYearsRemaining, contractTier)
      }
    })
    return icons
  }, [filteredPrograms, showContractMapLayer, allContractDetails, isUserAllowed])

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
        alert(`Could not archive program: ${err.code || err.message || 'Unknown error'}. Check console for details.`)
      }
    }
  }

  // Bulk delete a program (no confirm - handled by bulk edit modal)
  const handleBulkDeleteProgram = async (programId) => {
    try {
      if (user) {
        await addProgramHistory(activeTab, programId, 'archived', user.email)
      }
      await archiveProgram(activeTab, programId)
    } catch (err) {
      console.error('Error archiving program:', err)
      throw err // Re-throw to be caught by bulk edit modal
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

  // Target Program handlers
  const handleAddTargetProgram = async (targetData) => {
    try {
      await addTargetProgram(targetsSport, {
        ...targetData,
        addedBy: user?.email || 'unknown',
        timestamp: Date.now()
      })
      setIsTargetFormOpen(false)
    } catch (err) {
      console.error('Error adding target program:', err)
      alert('Could not add target program. Please try again.')
    }
  }

  const handleEditTargetProgram = async (targetData) => {
    try {
      // Check if ranking changed and auto-save to history
      if (editingTarget && targetData.ranking && targetData.ranking !== editingTarget.ranking) {
        await addTargetRankingMetric(targetsSport, targetData.id, {
          ranking: targetData.ranking,
          date: new Date().toISOString().split('T')[0],
          addedBy: user?.email || 'unknown',
          timestamp: Date.now()
        })
      }

      await editTargetProgram(targetsSport, targetData)
      setIsTargetFormOpen(false)
      setEditingTarget(null)
      // Update selected if it's the same one
      if (selectedTargetProgram?.id === targetData.id) {
        setSelectedTargetProgram(targetData)
      }
    } catch (err) {
      console.error('Error editing target program:', err)
      alert('Could not update target program. Please try again.')
    }
  }

  const handleDeleteTargetProgram = async (targetId) => {
    if (window.confirm('Delete this target program? This cannot be undone.')) {
      try {
        await deleteTargetProgram(targetsSport, targetId)
        if (selectedTargetProgram?.id === targetId) {
          setSelectedTargetProgram(null)
        }
      } catch (err) {
        console.error('Error deleting target program:', err)
        alert('Could not delete target program. Please try again.')
      }
    }
  }

  const handleUpdateTargetStatus = async (targetId, newStatus) => {
    // First try to find in current targetPrograms, fallback to selectedTargetProgram
    let target = targetPrograms.find(t => t.id === targetId)
    if (!target && selectedTargetProgram?.id === targetId) {
      target = selectedTargetProgram
    }
    if (target) {
      try {
        await editTargetProgram(targetsSport, { ...target, status: newStatus })
        // Update selectedTargetProgram if it's the same one
        if (selectedTargetProgram?.id === targetId) {
          setSelectedTargetProgram({ ...target, status: newStatus })
        }
      } catch (err) {
        console.error('Error updating target status:', err)
        alert('Could not update target status. Please try again.')
      }
    } else {
      console.error('Target not found for status update:', targetId)
      alert('Could not update target status. Please close and reopen the target.')
    }
  }

  const openEditTargetForm = (target) => {
    setEditingTarget(target)
    setIsTargetFormOpen(true)
  }

  const closeTargetForm = () => {
    setIsTargetFormOpen(false)
    setEditingTarget(null)
  }

  // Filtered target programs
  const filteredTargetPrograms = useMemo(() => {
    return targetPrograms.filter(target => {
      const matchesStatus = targetStatusFilter === 'all' || target.status === targetStatusFilter
      const matchesPriority = targetPriorityFilter === 'all' || target.priority === targetPriorityFilter
      return matchesStatus && matchesPriority
    })
  }, [targetPrograms, targetStatusFilter, targetPriorityFilter])

  // Group targets by status for kanban view
  const targetsByStatus = useMemo(() => {
    const groups = {}
    PIPELINE_STATUSES.forEach(status => {
      groups[status.id] = filteredTargetPrograms.filter(t => t.status === status.id)
    })
    return groups
  }, [filteredTargetPrograms])

  // Target Dashboard KPIs
  const targetKPIs = useMemo(() => {
    const total = targetPrograms.length
    const signed = targetPrograms.filter(t => t.status === 'signed').length
    const lost = targetPrograms.filter(t => t.status === 'lost').length
    const active = targetPrograms.filter(t => !['signed', 'lost'].includes(t.status)).length
    const highPriority = targetPrograms.filter(t => t.priority === 'high' && !['signed', 'lost'].includes(t.status)).length

    // Calculate "at risk" - no activity in 14+ days (using timestamp or targetSignDate)
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)
    const atRisk = targetPrograms.filter(t => {
      if (['signed', 'lost'].includes(t.status)) return false
      const lastActivity = t.lastActivityAt || t.timestamp || 0
      return lastActivity < twoWeeksAgo
    }).length

    // Conversion rate
    const conversionRate = total > 0 ? Math.round((signed / total) * 100) : 0

    // Hot targets (high priority + in advanced stages)
    const hotTargets = targetPrograms.filter(t =>
      t.priority === 'high' &&
      ['in_discussion', 'proposal_sent', 'negotiating'].includes(t.status)
    )

    return { total, signed, lost, active, highPriority, atRisk, conversionRate, hotTargets }
  }, [targetPrograms])

  // Recent target activity (last 10 changes)
  const recentTargetActivity = useMemo(() => {
    return [...targetPrograms]
      .filter(t => t.timestamp)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        name: t.name,
        logo: t.logo,
        action: t.status === 'signed' ? 'signed' : t.status === 'lost' ? 'lost' : 'updated',
        status: t.status,
        timestamp: t.timestamp,
        addedBy: t.addedBy
      }))
  }, [targetPrograms])

  // Drag and drop handlers for Kanban
  const handleDragStart = useCallback((e, target) => {
    setDraggedTarget(target)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', target.id)
  }, [])

  const handleDragOver = useCallback((e, statusId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(statusId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(async (e, newStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    if (draggedTarget && draggedTarget.status !== newStatus) {
      await handleUpdateTargetStatus(draggedTarget.id, newStatus)
    }
    setDraggedTarget(null)
  }, [draggedTarget, handleUpdateTargetStatus])

  const handleDragEnd = useCallback(() => {
    setDraggedTarget(null)
    setDragOverColumn(null)
  }, [])

  // PDF Export function (lazy loads jsPDF for smaller initial bundle)
  const handleExportPDF = useCallback(async () => {
    try {
      // Lazy load jsPDF only when user exports
      const jsPDF = (await import('jspdf')).default
      await import('jspdf-autotable')

      const doc = new jsPDF()
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const tabName = activeTab === 'football' ? 'Select Football' : 'Select Basketball'
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(`adidas ${tabName} Programs`, 14, 20)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${today}`, 14, 28)
      doc.text(`Total Programs: ${filteredPrograms.length}`, 14, 34)

      if (isMobile) {
        // Simpler text-based list for mobile (autoTable can crash on mobile Safari)
        let yPos = 46
        const lineHeight = 6
        const pageHeight = doc.internal.pageSize.height - 20

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('Program | City | State | Level | Coach', 14, yPos)
        yPos += lineHeight + 2

        doc.setFont('helvetica', 'normal')
        filteredPrograms.forEach((p) => {
          if (yPos > pageHeight) {
            doc.addPage()
            yPos = 20
          }
          const line = `${p.name || '-'} | ${p.city || '-'}, ${p.state || '-'} | ${p.level || '-'} | ${p.headCoach || '-'}`
          doc.text(line.substring(0, 100), 14, yPos)
          yPos += lineHeight
        })
      } else {
        // Full table for desktop
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
      }

      const filename = `adidas-select-${activeTab}-programs-${new Date().toISOString().split('T')[0]}.pdf`

      // Mobile-friendly download approach
      if (isMobile) {
        // Use blob URL for better mobile support
        const pdfBlob = doc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        alert('PDF ready! Check your Downloads or tap the download icon in your browser.')
      } else {
        doc.save(filename)
      }

      setShowExportMenu(false)
    } catch (err) {
      console.error('PDF export error:', err)
      alert(`Could not generate PDF: ${err.message || 'Unknown error'}. Try exporting CSV instead.`)
    }
  }, [activeTab, filteredPrograms])

  // Edit a program
  const handleEditProgram = async (updatedProgram) => {
    try {
      // Check if ranking changed and auto-save to history
      if (editingProgram && user) {
        // Normalize ranking values (treat empty string, undefined, null as empty)
        const normalizeRank = (r) => (r || '').toString().trim()
        const oldNational = normalizeRank(editingProgram.ranking)
        const newNational = normalizeRank(updatedProgram.ranking)
        const oldState = normalizeRank(editingProgram.stateRanking)
        const newState = normalizeRank(updatedProgram.stateRanking)

        const nationalChanged = newNational !== oldNational
        const stateChanged = newState !== oldState

        // Save to ranking history if either ranking changed and has a new value
        if ((nationalChanged && newNational) || (stateChanged && newState)) {
          await addRankingMetric(activeTab, updatedProgram.id, {
            nationalRank: newNational || null,
            stateRank: newState || null,
            date: new Date().toISOString().split('T')[0],
            addedBy: user.email,
            timestamp: Date.now()
          })
        }
      }

      await editProgram(activeTab, updatedProgram)
      if (user) {
        await addProgramHistory(activeTab, updatedProgram.id, 'edited', user.email)
      }
    } catch (err) {
      console.error('Error editing program:', err)
      alert(`Could not update program: ${err.code || err.message || 'Unknown error'}. Check console for details.`)
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

  // Center of continental US - adjust zoom for mobile screens
  const mapCenter = [39.8283, -98.5795]
  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 768
  const mapZoom = isMobileView ? 3 : 4

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
            <h1 className="title">ADI SEL3CT</h1>
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

      {/* Backup Reminder Banner */}
      {backupReminder && isUserAllowed && (
        <div className="backup-reminder-banner">
          <div className="backup-reminder-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              {backupReminder.reason === 'no_backups'
                ? 'No backups found. Create your first backup to protect your data.'
                : `Last backup was ${backupReminder.daysSinceBackup} days ago. Consider creating a new backup.`}
            </span>
            <button
              className="backup-reminder-action"
              onClick={() => { handleBackupAccess(); setBackupReminder(null) }}
            >
              Backup Now
            </button>
            <button
              className="backup-reminder-dismiss"
              onClick={() => setBackupReminder(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Stats (programs only, requires login except targets which has its own gate) */}
      {activeTab !== 'events' && activeTab !== 'targets' && user && (
        <div className="dashboard">
          <div className="dashboard-stats">
            {/* Total Programs Dropdown - shows region populations */}
            <div
              className={`stat-item stat-total-dropdown ${totalProgramsMenuOpen ? 'open' : ''}`}
              onMouseEnter={() => setTotalProgramsMenuOpen(true)}
              onMouseLeave={() => setTotalProgramsMenuOpen(false)}
            >
              <span className="stat-value">{regionCounts.total}</span>
              <span className="stat-label">Total Programs {selectedRegion !== 'all' ? `(${selectedRegion})` : ''}</span>
              <span className="stat-dropdown-arrow">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,4.5 6,7.5 9,4.5"/>
                </svg>
              </span>

              {/* Dropdown Menu */}
              <div className="analytics-dropdown-menu total-programs-menu">
                {Object.keys(REGIONS).map(region => (
                  <button
                    key={region}
                    className={`analytics-dropdown-item ${selectedRegion === region ? 'active' : ''}`}
                    onClick={() => { setSelectedRegion(selectedRegion === region ? 'all' : region); setTotalProgramsMenuOpen(false) }}
                  >
                    <span className="analytics-dropdown-icon">
                      <span className="region-color-dot" style={{ background: REGIONS[region].color }} />
                    </span>
                    <span>{region}</span>
                    <span className="region-dropdown-count">{regionCounts[region] || 0}</span>
                  </button>
                ))}
                {selectedRegion !== 'all' && (
                  <button
                    className="analytics-dropdown-item region-clear-item"
                    onClick={() => { setSelectedRegion('all'); setTotalProgramsMenuOpen(false) }}
                  >
                    <span className="analytics-dropdown-icon">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="5" x2="15" y2="15"/>
                        <line x1="15" y1="5" x2="5" y2="15"/>
                      </svg>
                    </span>
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>
            </div>
            {/* Analytics Dropdown - nests Dashboard, Digest, Reports, Compare */}
            <div
              className={`stat-item stat-analytics-dropdown ${analyticsMenuOpen ? 'open' : ''}`}
              onMouseEnter={() => setAnalyticsMenuOpen(true)}
              onMouseLeave={() => setAnalyticsMenuOpen(false)}
            >
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="10" width="4" height="8" rx="1"/>
                  <rect x="8" y="6" width="4" height="12" rx="1"/>
                  <rect x="14" y="2" width="4" height="16" rx="1"/>
                </svg>
              </span>
              <span className="stat-label">Analytics</span>
              <span className="stat-dropdown-arrow">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,4.5 6,7.5 9,4.5"/>
                </svg>
              </span>

              {/* Dropdown Menu */}
              <div className="analytics-dropdown-menu">
                <button className="analytics-dropdown-item" onClick={() => { setIsAnalyticsOpen(true); setAnalyticsMenuOpen(false) }}>
                  <span className="analytics-dropdown-icon">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="10" width="4" height="8" rx="1"/>
                      <rect x="8" y="6" width="4" height="12" rx="1"/>
                      <rect x="14" y="2" width="4" height="16" rx="1"/>
                    </svg>
                  </span>
                  <span>Dashboard</span>
                </button>
                <button className="analytics-dropdown-item" onClick={() => { setIsDigestOpen(true); setAnalyticsMenuOpen(false) }}>
                  <span className="analytics-dropdown-icon">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="2" width="14" height="16" rx="2"/>
                      <line x1="6" y1="6" x2="14" y2="6"/>
                      <line x1="6" y1="10" x2="14" y2="10"/>
                      <line x1="6" y1="14" x2="10" y2="14"/>
                    </svg>
                  </span>
                  <span>Digest</span>
                </button>
                <button className="analytics-dropdown-item" onClick={() => { setIsReportsOpen(true); setAnalyticsMenuOpen(false) }}>
                  <span className="analytics-dropdown-icon">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="6" height="6" rx="1"/>
                      <rect x="12" y="2" width="6" height="6" rx="1"/>
                      <rect x="2" y="12" width="6" height="6" rx="1"/>
                      <rect x="12" y="12" width="6" height="6" rx="1"/>
                    </svg>
                  </span>
                  <span>Reports</span>
                </button>
                <button className="analytics-dropdown-item" onClick={() => { setIsComparisonOpen(true); setAnalyticsMenuOpen(false) }}>
                  <span className="analytics-dropdown-icon">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="6" height="12" rx="1"/>
                      <rect x="12" y="4" width="6" height="12" rx="1"/>
                    </svg>
                  </span>
                  <span>Compare</span>
                </button>
              </div>
            </div>
            {/* Contracts - next to Analytics */}
            {isUserAllowed && activeTab !== 'events' && activeTab !== 'targets' && (
              <div className="stat-item stat-contracts" onClick={() => setIsContractDashboardOpen(true)} title="Contract overview">
                <span className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="2" width="14" height="16" rx="2"/>
                    <line x1="6" y1="6" x2="14" y2="6"/>
                    <line x1="6" y1="10" x2="14" y2="10"/>
                    <line x1="6" y1="14" x2="10" y2="14"/>
                    <circle cx="14" cy="14" r="3" fill="none"/>
                    <line x1="12.5" y1="14" x2="15.5" y2="14"/>
                    <line x1="14" y1="12.5" x2="14" y2="15.5"/>
                  </svg>
                </span>
                <span className="stat-label">Contracts</span>
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
            {/* Export */}
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
            {/* Data Dropdown - Archive & Backup (logged in users only) */}
            {isUserAllowed && (
              <div
                className={`stat-item stat-analytics-dropdown stat-data-dropdown ${dataMenuOpen ? 'open' : ''}`}
                onMouseEnter={() => setDataMenuOpen(true)}
                onMouseLeave={() => setDataMenuOpen(false)}
              >
                <span className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="10" cy="5" rx="7" ry="3"/>
                    <path d="M3 5v10c0 1.66 3.13 3 7 3s7-1.34 7-3V5"/>
                    <path d="M3 10c0 1.66 3.13 3 7 3s7-1.34 7-3"/>
                  </svg>
                </span>
                <span className="stat-label">Data</span>
                <span className="stat-dropdown-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,4.5 6,7.5 9,4.5"/>
                  </svg>
                </span>

                {/* Dropdown Menu */}
                <div className="analytics-dropdown-menu">
                  <button className="analytics-dropdown-item" onClick={() => { setIsArchiveModalOpen(true); setDataMenuOpen(false) }}>
                    <span className="analytics-dropdown-icon">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="16" height="4" rx="1"/>
                        <path d="M3 7v9a1 1 0 001 1h12a1 1 0 001-1V7"/>
                        <line x1="8" y1="11" x2="12" y2="11"/>
                      </svg>
                    </span>
                    <span>Archive ({archivedPrograms.length})</span>
                  </button>
                  <button className="analytics-dropdown-item" onClick={() => { handleBackupAccess(); setDataMenuOpen(false) }}>
                    <span className="analytics-dropdown-icon">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" transform="scale(0.85) translate(1,1)"/>
                        <polyline points="14,2 14,8 20,8" transform="scale(0.85) translate(1,1)"/>
                        <line x1="8" y1="13" x2="14" y2="13" transform="scale(0.85) translate(1,1)"/>
                        <line x1="8" y1="17" x2="14" y2="17" transform="scale(0.85) translate(1,1)"/>
                      </svg>
                    </span>
                    <span>Backup</span>
                  </button>
                </div>
              </div>
            )}
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

      {/* Search and Filter Bar (programs only, requires login except targets which has its own gate) */}
      {activeTab !== 'events' && activeTab !== 'targets' && user && <div className="toolbar">
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


        {isUserAllowed && activeTab !== 'targets' && (
          <button
            className={`contract-layer-toggle-btn${showContractMapLayer ? ' active' : ''}`}
            onClick={() => setShowContractMapLayer(v => !v)}
            title="Toggle contract status map layer"
          >
            <span className="contract-layer-dot contract-layer-dot-expiring" />
            <span className="contract-layer-dot contract-layer-dot-active" />
            <span className="contract-layer-dot contract-layer-dot-none" />
            {showContractMapLayer ? 'Contracts On' : 'Contracts'}
          </button>
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
        {activeTab === 'targets' ? (
          /* Targets Pipeline View - Login Required */
          <div className="targets-layout targets-dashboard-v2" style={{ background: 'var(--bg-primary)', position: 'relative' }}>
            {!user ? (
              <LoginRequiredOverlay
                onLoginClick={() => setIsAuthModalOpen(true)}
                title="Program Access Restricted"
                message="Sign in to view target programs and pipeline information."
              />
            ) : (
              <>
            {/* New Dashboard Header */}
            <div className="td-header">
              <div className="td-header-left">
                <div className="td-sport-toggle">
                  <button
                    className={`td-sport-btn${targetsSport === 'basketball' ? ' active' : ''}`}
                    onClick={() => setTargetsSport('basketball')}
                  >
                    <img src="/logos/adidas-select-basketball.png" alt="" className="td-sport-logo" />
                    <span>Basketball</span>
                  </button>
                  <button
                    className={`td-sport-btn${targetsSport === 'football' ? ' active' : ''}`}
                    onClick={() => setTargetsSport('football')}
                  >
                    <img src="/logos/mahomes-logo.png" alt="" className="td-sport-logo" />
                    <span>Football</span>
                  </button>
                </div>
              </div>

              <div className="td-header-center">
                <div className="td-view-toggle">
                  <button
                    className={`td-view-btn${targetDashboardView === 'dashboard' ? ' active' : ''}`}
                    onClick={() => setTargetDashboardView('dashboard')}
                    title="Dashboard View"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9"/>
                      <rect x="14" y="3" width="7" height="5"/>
                      <rect x="14" y="12" width="7" height="9"/>
                      <rect x="3" y="16" width="7" height="5"/>
                    </svg>
                  </button>
                  <button
                    className={`td-view-btn${targetDashboardView === 'kanban' ? ' active' : ''}`}
                    onClick={() => setTargetDashboardView('kanban')}
                    title="Pipeline View"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="4" width="4" height="16"/>
                      <rect x="10" y="4" width="4" height="12"/>
                      <rect x="16" y="4" width="4" height="8"/>
                    </svg>
                  </button>
                  <button
                    className={`td-view-btn${targetDashboardView === 'list' ? ' active' : ''}`}
                    onClick={() => setTargetDashboardView('list')}
                    title="List View"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="6" x2="20" y2="6"/>
                      <line x1="4" y1="12" x2="20" y2="12"/>
                      <line x1="4" y1="18" x2="20" y2="18"/>
                    </svg>
                  </button>
                  <button
                    className={`td-view-btn${targetDashboardView === 'map' ? ' active' : ''}`}
                    onClick={() => setTargetDashboardView('map')}
                    title="Map View"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                      <line x1="8" y1="2" x2="8" y2="18"/>
                      <line x1="16" y1="6" x2="16" y2="22"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="td-header-right">
                <select
                  value={targetPriorityFilter}
                  onChange={(e) => setTargetPriorityFilter(e.target.value)}
                  className="td-filter-select"
                >
                  <option value="all">All Priorities</option>
                  {PRIORITIES.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>

                {isUserAllowed && (
                  <button className="td-add-btn" onClick={() => setIsTargetFormOpen(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>Add Target</span>
                  </button>
                )}
              </div>
            </div>

            {/* KPI Metrics Bar */}
            <div className="td-kpi-bar">
              <div className="td-kpi-item">
                <span className="td-kpi-value">{targetKPIs.total}</span>
                <span className="td-kpi-label">Total Targets</span>
              </div>
              <div className="td-kpi-divider" />
              <div className="td-kpi-item">
                <span className="td-kpi-value">{targetKPIs.active}</span>
                <span className="td-kpi-label">Active Pipeline</span>
              </div>
              <div className="td-kpi-divider" />
              <div className="td-kpi-item td-kpi-highlight">
                <span className="td-kpi-value">{targetKPIs.highPriority}</span>
                <span className="td-kpi-label">High Priority</span>
              </div>
              <div className="td-kpi-divider" />
              <div className="td-kpi-item td-kpi-success">
                <span className="td-kpi-value">{targetKPIs.signed}</span>
                <span className="td-kpi-label">Signed</span>
              </div>
              <div className="td-kpi-divider" />
              <div className="td-kpi-item">
                <span className="td-kpi-value">{targetKPIs.conversionRate}%</span>
                <span className="td-kpi-label">Win Rate</span>
              </div>
              <div className="td-kpi-divider" />
              <div className="td-kpi-item td-kpi-warning">
                <span className="td-kpi-value">{targetKPIs.atRisk}</span>
                <span className="td-kpi-label">At Risk</span>
              </div>
            </div>

            {/* Main Content */}
            {isTargetsLoading ? (
              <div className="td-loading">
                <div className="td-loading-spinner" />
                <span>Loading targets...</span>
              </div>
            ) : targetDashboardView === 'dashboard' ? (
              /* NEW: Dashboard View with Hot Targets + Mini Kanban + Activity */
              <div className="td-dashboard">
                {/* Main Grid: Left (Pipeline + Activity) | Right (Hot Targets) | Form (when open) */}
                <div className="td-dashboard-main">
                  {/* Left Column: Pipeline Overview + Activity Feed */}
                  <div className="td-dashboard-left">
                    {/* Mini Pipeline Overview */}
                    <section className="td-section td-pipeline-overview">
                      <div className="td-section-header">
                        <h3>Pipeline Overview</h3>
                        <button className="td-section-link" onClick={() => setTargetDashboardView('kanban')}>
                          View Full Pipeline →
                        </button>
                      </div>
                      <div className="td-pipeline-bars">
                        {PIPELINE_STATUSES.map(status => {
                          const count = targetsByStatus[status.id]?.length || 0
                          const percentage = targetPrograms.length > 0 ? (count / targetPrograms.length) * 100 : 0
                          return (
                            <div key={status.id} className="td-pipeline-row">
                              <span className="td-pipeline-label">{status.label}</span>
                              <div className="td-pipeline-track">
                                <div
                                  className="td-pipeline-fill"
                                  style={{
                                    width: `${Math.max(percentage, count > 0 ? 8 : 0)}%`,
                                    backgroundColor: status.color
                                  }}
                                />
                              </div>
                              <span className="td-pipeline-count">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </section>

                    {/* Recent Activity Feed */}
                    <section className="td-section td-activity-feed">
                      <div className="td-section-header">
                        <h3>Recent Activity</h3>
                      </div>
                      <div className="td-activity-list">
                        {recentTargetActivity.length > 0 ? (
                          recentTargetActivity.slice(0, 10).map(activity => (
                            <div
                              key={activity.id}
                              className="td-activity-item"
                              onClick={() => {
                                const target = targetPrograms.find(t => t.id === activity.id)
                                if (target && isUserAllowed) {
                                  openEditTargetForm(target)
                                } else if (target) {
                                  setSelectedTargetProgram(target)
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="td-activity-icon">
                                {activity.logo ? (
                                  <img src={activity.logo} alt="" />
                                ) : (
                                  <span>{activity.name?.charAt(0)}</span>
                                )}
                              </div>
                              <div className="td-activity-content">
                                <span className="td-activity-name">{activity.name}</span>
                                <span className="td-activity-action">
                                  {activity.action === 'signed' ? 'was signed' :
                                   activity.action === 'lost' ? 'was lost' : 'was updated'}
                                </span>
                              </div>
                              <div className="td-activity-meta">
                                <span className="td-activity-time">
                                  {activity.timestamp && new Date(activity.timestamp).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric'
                                  })}
                                </span>
                                {activity.addedBy && (
                                  <span className="td-activity-user">@{activity.addedBy.split('@')[0]}</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="td-empty-state">
                            <p>No recent activity</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Hot Targets */}
                  <div className="td-dashboard-right">
                    <section className="td-section td-hot-targets">
                      <div className="td-section-header">
                        <h3>Hot Targets</h3>
                        <span className="td-section-badge">{targetKPIs.hotTargets.length}</span>
                      </div>
                      <div className="td-hot-cards">
                        {targetKPIs.hotTargets.length > 0 ? (
                          targetKPIs.hotTargets.slice(0, 10).map(target => (
                            <div
                              key={target.id}
                              className="td-hot-card"
                              onClick={() => setSelectedTargetProgram(target)}
                            >
                              <div className="td-hot-card-logo">
                                {target.logo ? (
                                  <img src={target.logo} alt="" />
                                ) : (
                                  <span className="td-hot-card-fallback">{target.name?.charAt(0)}</span>
                                )}
                                {target.ranking && (
                                  <span className="td-hot-card-rank">{target.ranking}</span>
                                )}
                              </div>
                              <div className="td-hot-card-info">
                                <h4>{target.name}</h4>
                                <p>{target.city}, {target.state}</p>
                              </div>
                              <div className="td-hot-card-progress">
                                <div
                                  className="td-hot-card-bar"
                                  style={{
                                    width: target.status === 'negotiating' ? '90%' :
                                           target.status === 'proposal_sent' ? '70%' :
                                           target.status === 'in_discussion' ? '50%' : '30%'
                                  }}
                                />
                              </div>
                              <div className="td-hot-card-status">
                                <span
                                  className="td-status-badge"
                                  style={{ backgroundColor: PIPELINE_STATUSES.find(s => s.id === target.status)?.color }}
                                >
                                  {PIPELINE_STATUSES.find(s => s.id === target.status)?.label}
                                </span>
                              </div>
                              <div className="td-hot-card-actions">
                                {target.contactPhone && (
                                  <a href={`tel:${target.contactPhone}`} className="td-action-btn" title="Call">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                  </a>
                                )}
                                {target.contactEmail && (
                                  <a href={`mailto:${target.contactEmail}`} className="td-action-btn" title="Email">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                      <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="td-empty-state td-empty-large">
                            <div className="td-empty-icon">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            </div>
                            <p>No hot targets yet</p>
                            <span>High priority targets in discussion or later stages appear here</span>
                            {isUserAllowed && (
                              <button className="td-empty-action" onClick={() => setIsTargetFormOpen(true)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19"/>
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Add Target
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                </div>

                {/* Regional Distribution - Below main grid */}
                <section className="td-section td-region-section">
                  <div className="td-section-header">
                    <h3>Regional Distribution</h3>
                  </div>
                  <div className="td-region-grid">
                    {Object.entries(REGIONS).map(([region, data]) => {
                      const count = targetPrograms.filter(t => t.region === region).length
                      return (
                        <div key={region} className="td-region-item" style={{ '--region-color': data.color }}>
                          <span className="td-region-dot" />
                          <span className="td-region-name">{region}</span>
                          <span className="td-region-count">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>
            ) : targetDashboardView === 'kanban' ? (
              /* Improved Kanban Pipeline View with Drag & Drop */
              <div className="td-kanban">
                {PIPELINE_STATUSES.filter(s => s.id !== 'signed' && s.id !== 'lost').map(status => (
                  <div
                    key={status.id}
                    className={`td-kanban-column${dragOverColumn === status.id ? ' drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, status.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status.id)}
                  >
                    <div className="td-kanban-header" style={{ '--status-color': status.color }}>
                      <div className="td-kanban-header-left">
                        <span className="td-kanban-dot" />
                        <h4>{status.label}</h4>
                      </div>
                      <span className="td-kanban-count">{targetsByStatus[status.id]?.length || 0}</span>
                    </div>
                    <div className="td-kanban-cards">
                      {targetsByStatus[status.id]?.map(target => (
                        <div
                          key={target.id}
                          className={`td-kanban-card priority-${target.priority}${draggedTarget?.id === target.id ? ' dragging' : ''}`}
                          draggable={isUserAllowed}
                          onDragStart={(e) => handleDragStart(e, target)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedTargetProgram(target)}
                        >
                          <div className="td-card-top">
                            {target.logo && <img src={target.logo} alt="" className="td-card-logo" />}
                            <div className="td-card-info">
                              <h5>{target.name}</h5>
                              <p>{target.city}, {target.state}</p>
                            </div>
                            <span
                              className="td-card-priority"
                              style={{ backgroundColor: PRIORITIES.find(p => p.id === target.priority)?.color }}
                            >
                              {target.priority?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {target.competition && (
                            <div className="td-card-competition">
                              <span className="td-card-comp-label">vs</span>
                              <span>{target.competition}</span>
                            </div>
                          )}
                          <div className="td-card-bottom">
                            {target.ranking && (
                              <span className="td-card-ranking">{target.ranking}</span>
                            )}
                            {target.targetSignDate && (
                              <span className="td-card-date">
                                {new Date(target.targetSignDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!targetsByStatus[status.id] || targetsByStatus[status.id].length === 0) && (
                        <div className="td-kanban-empty">
                          <span>No targets</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Closed Columns */}
                <div className="td-kanban-closed">
                  <div
                    className={`td-kanban-column td-kanban-signed${dragOverColumn === 'signed' ? ' drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'signed')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'signed')}
                  >
                    <div className="td-kanban-header" style={{ '--status-color': '#10b981' }}>
                      <div className="td-kanban-header-left">
                        <span className="td-kanban-dot" />
                        <h4>Signed</h4>
                      </div>
                      <span className="td-kanban-count">{targetsByStatus['signed']?.length || 0}</span>
                    </div>
                    <div className="td-kanban-cards">
                      {targetsByStatus['signed']?.map(target => (
                        <div
                          key={target.id}
                          className="td-kanban-card closed"
                          onClick={() => setSelectedTargetProgram(target)}
                        >
                          {target.logo && <img src={target.logo} alt="" className="td-card-logo-sm" />}
                          <span>{target.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`td-kanban-column td-kanban-lost${dragOverColumn === 'lost' ? ' drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'lost')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'lost')}
                  >
                    <div className="td-kanban-header" style={{ '--status-color': '#ef4444' }}>
                      <div className="td-kanban-header-left">
                        <span className="td-kanban-dot" />
                        <h4>Lost</h4>
                      </div>
                      <span className="td-kanban-count">{targetsByStatus['lost']?.length || 0}</span>
                    </div>
                    <div className="td-kanban-cards">
                      {targetsByStatus['lost']?.map(target => (
                        <div
                          key={target.id}
                          className="td-kanban-card closed lost"
                          onClick={() => setSelectedTargetProgram(target)}
                        >
                          {target.logo && <img src={target.logo} alt="" className="td-card-logo-sm" />}
                          <span>{target.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : targetDashboardView === 'list' ? (
              /* Improved List View */
              <div className="td-list">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Competition</th>
                      <th>Ranking</th>
                      <th>Target Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTargetPrograms.map(target => (
                      <tr
                        key={target.id}
                        onClick={() => setSelectedTargetProgram(target)}
                        className={`td-table-row priority-${target.priority}`}
                      >
                        <td className="td-table-name">
                          {target.logo && <img src={target.logo} alt="" className="td-table-logo" />}
                          <span>{target.name}</span>
                        </td>
                        <td>{target.city}, {target.state}</td>
                        <td>
                          <span
                            className="td-status-badge"
                            style={{ backgroundColor: PIPELINE_STATUSES.find(s => s.id === target.status)?.color || '#6b7280' }}
                          >
                            {PIPELINE_STATUSES.find(s => s.id === target.status)?.label || target.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className="td-priority-badge"
                            style={{ backgroundColor: PRIORITIES.find(p => p.id === target.priority)?.color || '#6b7280' }}
                          >
                            {target.priority}
                          </span>
                        </td>
                        <td className="td-table-competition">{target.competition || '-'}</td>
                        <td className="td-table-ranking">{target.ranking || '-'}</td>
                        <td>
                          {target.targetSignDate
                            ? new Date(target.targetSignDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                    {filteredTargetPrograms.length === 0 && (
                      <tr>
                        <td colSpan={7} className="td-table-empty">
                          No target programs found.
                          {isUserAllowed && <button onClick={() => setIsTargetFormOpen(true)}>Add your first target</button>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Map View */
              <div className="td-map-layout">
                <MapContainer
                  key="targets"
                  center={mapCenter}
                  zoom={mapZoom}
                  className="map-container"
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <DynamicTileLayer darkMode={darkMode} />
                  <MapViewPreserver />
                  <StateLabels />
                  {filteredTargetPrograms.map(target => (
                    target && target.coordinates && (
                      <Marker
                        key={target.id}
                        position={target.coordinates}
                        icon={L.divIcon({
                          className: 'target-marker',
                          html: `<div class="target-marker-icon" style="border-color: ${PIPELINE_STATUSES.find(s => s.id === target.status)?.color || '#6b7280'}">
                            ${target.logo ? `<img src="${target.logo}" alt="" />` : '<span>T</span>'}
                          </div>`,
                          iconSize: [32, 32],
                          iconAnchor: [16, 32],
                          popupAnchor: [0, -32]
                        })}
                        eventHandlers={{
                          click: () => setSelectedTargetProgram(target)
                        }}
                      />
                    )
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Target Detail Panel */}
            <TargetDetailPanel
              target={selectedTargetProgram}
              sport={targetsSport}
              isOpen={!!selectedTargetProgram}
              onClose={() => setSelectedTargetProgram(null)}
              isUserAllowed={isUserAllowed}
              user={user}
              onEdit={(t) => { setSelectedTargetProgram(null); openEditTargetForm(t) }}
              onDelete={(id) => { setSelectedTargetProgram(null); handleDeleteTargetProgram(id) }}
              onStatusChange={handleUpdateTargetStatus}
            />

              </>
            )}
          </div>
        ) : activeTab === 'events' ? (
          /* Events Split Layout - Login Required */
          <div className="events-split-layout" ref={mapRef} style={{ position: 'relative' }}>
            {!user ? (
              <LoginRequiredOverlay
                onLoginClick={() => setIsAuthModalOpen(true)}
                title="Program Access Restricted"
                message="Sign in to view events and program information."
              />
            ) : (
            <>
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
                  <button
                    className="competitor-events-btn"
                    onClick={() => setIsCompetitorEventsOpen(true)}
                    title="Competitor Events"
                  >
                    Competitors
                  </button>
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
            </>
            )}
          </div>
        ) : (
          /* Programs Map + Detail Panel - Login Required */
          <div className="programs-layout" ref={mapRef} style={{ position: 'relative' }}>
            {!user ? (
              <LoginRequiredOverlay
                onLoginClick={() => setIsAuthModalOpen(true)}
                title="Program Access Restricted"
                message="Sign in to view program information and details."
              />
            ) : isLoading ? (
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
                          setHoveredProgram(null)
                        },
                        mouseover: (e) => {
                          const { clientX, clientY } = e.originalEvent
                          setHoverPosition({ x: clientX, y: clientY })
                          setHoveredProgram(program)
                        },
                        mouseout: () => {
                          setHoveredProgram(null)
                        }
                      }}
                    />
                  )
                ))}
              </MapContainer>
            )}

            {showContractMapLayer && isUserAllowed && !selectedProgram && (
              <div className="contract-map-legend">
                <div className="cml-section">
                  <span className="cml-section-title">YEARS REMAINING</span>
                  <div className="cml-gradient">
                    <div className="cml-item"><span className="cml-dot cml-dot-urgent" /> 0 (Urgent)</div>
                    <div className="cml-item"><span className="cml-dot cml-dot-warning" /> 1 Year</div>
                    <div className="cml-item"><span className="cml-dot cml-dot-caution" /> 2 Years</div>
                    <div className="cml-item"><span className="cml-dot cml-dot-healthy" /> 3+ Years</div>
                  </div>
                </div>
                <div className="cml-section">
                  <span className="cml-section-title">STATUS</span>
                  <div className="cml-item"><span className="cml-dot cml-dot-none" /> No Data</div>
                  <div className="cml-item"><span className="cml-star">★</span> Premium Tier</div>
                </div>
              </div>
            )}

            {hoveredProgram && !selectedProgram && (
              <HoverPreviewCard
                program={hoveredProgram}
                position={hoverPosition}
                regionColor={REGIONS[hoveredProgram.region]?.color}
              />
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`mobile-bottom-nav${mobileNavExpanded ? ' expanded' : ''}${mobileSearchOpen ? ' search-open' : ''}`}>
        {/* Search overlay */}
        {mobileSearchOpen && (
          <div className="mobile-search-overlay">
            <div className="mobile-search-container">
              <input
                type="text"
                placeholder="Search programs, cities, coaches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search-input"
                autoFocus
              />
              {searchQuery && (
                <button className="mobile-search-clear" onClick={() => setSearchQuery('')}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="5" x2="15" y2="15"/>
                    <line x1="15" y1="5" x2="5" y2="15"/>
                  </svg>
                </button>
              )}
              <button className="mobile-search-close" onClick={() => setMobileSearchOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Expanded nav items - Bottom Sheet style */}
        {mobileNavExpanded && (
          <>
            <div className="mobile-nav-backdrop" onClick={() => setMobileNavExpanded(false)} />
            <div className="mobile-nav-sheet">
              <div className="mobile-nav-sheet-handle" />
              <div className="mobile-nav-sheet-header">
                <h3>Quick Actions</h3>
                <button className="mobile-nav-sheet-close" onClick={() => setMobileNavExpanded(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="6" y1="6" x2="18" y2="18"/>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="mobile-nav-sheet-items">
                <button className="mobile-nav-sheet-item" onClick={() => { setIsAnalyticsOpen(true); setMobileNavExpanded(false) }}>
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="10" width="4" height="8" rx="1"/>
                      <rect x="8" y="6" width="4" height="12" rx="1"/>
                      <rect x="14" y="2" width="4" height="16" rx="1"/>
                    </svg>
                  </span>
                  <span>Analytics</span>
                </button>
                <button className="mobile-nav-sheet-item" onClick={() => { setIsDigestOpen(true); setMobileNavExpanded(false) }}>
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="2" width="14" height="16" rx="2"/>
                      <line x1="6" y1="6" x2="14" y2="6"/>
                      <line x1="6" y1="10" x2="14" y2="10"/>
                      <line x1="6" y1="14" x2="10" y2="14"/>
                    </svg>
                  </span>
                  <span>Digest</span>
                </button>
                <button className="mobile-nav-sheet-item" onClick={() => { setIsReportsOpen(true); setMobileNavExpanded(false) }}>
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="6" height="6" rx="1"/>
                      <rect x="12" y="2" width="6" height="6" rx="1"/>
                      <rect x="2" y="12" width="6" height="6" rx="1"/>
                      <rect x="12" y="12" width="6" height="6" rx="1"/>
                    </svg>
                  </span>
                  <span>Reports</span>
                </button>
                <button className="mobile-nav-sheet-item" onClick={() => { setIsComparisonOpen(true); setMobileNavExpanded(false) }}>
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="6" height="12" rx="1"/>
                      <rect x="12" y="4" width="6" height="12" rx="1"/>
                    </svg>
                  </span>
                  <span>Compare</span>
                </button>
                <button className="mobile-nav-sheet-item" onClick={() => { setShowFilters(!showFilters); setMobileNavExpanded(false) }}>
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="5" x2="17" y2="5"/>
                      <line x1="5" y1="10" x2="15" y2="10"/>
                      <line x1="7" y1="15" x2="13" y2="15"/>
                    </svg>
                  </span>
                  <span>Filters {showFilters ? 'On' : 'Off'}</span>
                </button>
                {isUserAllowed && (
                  <button className="mobile-nav-sheet-item" onClick={() => { setIsContractDashboardOpen(true); setMobileNavExpanded(false) }}>
                    <span className="mobile-nav-sheet-icon">
                      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="2" width="14" height="16" rx="2"/>
                        <line x1="6" y1="6" x2="14" y2="6"/>
                        <line x1="6" y1="10" x2="14" y2="10"/>
                        <circle cx="14" cy="14" r="3"/>
                      </svg>
                    </span>
                    <span>Contracts</span>
                  </button>
                )}
                <button className="mobile-nav-sheet-item" onClick={() => { setShowExportMenu(true); setMobileNavExpanded(false) }}>
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 3v10"/>
                      <polyline points="6,9 10,13 14,9"/>
                      <path d="M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3"/>
                    </svg>
                  </span>
                  <span>Export</span>
                </button>
                <div className="mobile-nav-sheet-divider" />
                <button
                  className={`mobile-nav-sheet-item${compactMode ? ' active' : ''}`}
                  onClick={() => setCompactMode(!compactMode)}
                >
                  <span className="mobile-nav-sheet-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="16" height="3" rx="1"/>
                      <rect x="2" y="9" width="16" height="3" rx="1"/>
                      <rect x="2" y="14" width="16" height="3" rx="1"/>
                    </svg>
                  </span>
                  <span>Compact Mode {compactMode ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Fixed bottom bar */}
        <div className="mobile-bottom-bar">
          <button
            className="mobile-nav-btn"
            onClick={() => setMobileSearchOpen(true)}
            title="Search"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/>
              <line x1="16" y1="16" x2="22" y2="22"/>
            </svg>
            <span>Search</span>
          </button>
          <button
            className="mobile-nav-btn mobile-nav-btn-primary"
            onClick={handleAddClick}
            title="Add"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button
            className={`mobile-nav-btn${darkMode ? ' active' : ''}`}
            onClick={() => setDarkMode(!darkMode)}
            title="Theme"
          >
            {darkMode ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span>Theme</span>
          </button>
          <button
            className="mobile-nav-btn"
            onClick={() => setMobileNavExpanded(true)}
            title="More"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
            <span>More</span>
          </button>
        </div>
      </nav>

      <footer className="footer">
        {(activeTab === 'basketball' || activeTab === 'football') && (
          <div className="stier-banner">
            <span className="stier-text">WELCOME TO THE S-TIER</span>
          </div>
        )}
        <p>
          {activeTab === 'events'
            ? `${events.length} events`
            : activeTab === 'targets'
            ? `${filteredTargetPrograms.length} target programs`
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
        user={user}
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

      {/* Backup PIN Modal */}
      {isPinModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPinModalOpen(false)}>
          <div className="pin-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsPinModalOpen(false)}>&times;</button>
            <h2>Enter Backup PIN</h2>
            <p className="pin-description">Enter the PIN to access backup features.</p>
            <div className="pin-input-container">
              <input
                type="password"
                className={`pin-input ${pinError ? 'error' : ''}`}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit() }}
                placeholder="Enter PIN"
                maxLength={10}
                autoFocus
              />
              {pinError && <span className="pin-error-text">Incorrect PIN</span>}
            </div>
            <button className="pin-submit-btn" onClick={handlePinSubmit}>
              Access Backup
            </button>
          </div>
        </div>
      )}

      <BackupPanel
        isOpen={isBackupPanelOpen}
        onClose={() => setIsBackupPanelOpen(false)}
        userEmail={user?.email}
      />

      <AddEventForm
        isOpen={isEventFormOpen}
        onClose={closeEventForm}
        onAdd={handleAddEvent}
        onEdit={handleEditEvent}
        editEvent={editingEvent}
        allPrograms={programs}
      />

      <AddTargetForm
        isOpen={isTargetFormOpen}
        onClose={closeTargetForm}
        onAdd={handleAddTargetProgram}
        onEdit={handleEditTargetProgram}
        sport={targetsSport}
        editTarget={editingTarget}
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
        allContractDetails={allContractDetails}
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
        onDelete={handleBulkDeleteProgram}
        sport={activeTab}
      />

      <ContractDashboard
        isOpen={isContractDashboardOpen}
        onClose={() => setIsContractDashboardOpen(false)}
        programs={programs}
        allContractDetails={allContractDetails}
        sport={activeTab}
      />

      <CompetitorEventsModal
        isOpen={isCompetitorEventsOpen}
        onClose={() => setIsCompetitorEventsOpen(false)}
        events={competitorEvents}
        onAdd={addCompetitorEvent}
        onUpdate={updateCompetitorEvent}
        onDelete={deleteCompetitorEvent}
        isUserAllowed={isUserAllowed}
        userEmail={user?.email}
      />
    </div>
  )
}

export default App
