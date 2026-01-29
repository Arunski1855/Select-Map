import { useState, useEffect, useMemo } from 'react'
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
  subscribeToSchedule
} from './firebase'
import AddProgramForm from './components/AddProgramForm'
import AddEventForm from './components/AddEventForm'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Region definitions with colors
const REGIONS = {
  'Canada': { color: '#e74c3c', states: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'] },
  'Mid Atlantic': { color: '#3498db', states: ['NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV'] },
  'South': { color: '#f39c12', states: ['FL', 'GA', 'SC', 'NC', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'TX', 'OK'] },
  'Midwest': { color: '#9b59b6', states: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'] },
  'West': { color: '#2ecc71', states: ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'CO', 'NM', 'ID', 'MT', 'WY', 'AK', 'HI'] }
}

// Create custom icon for each program logo
const createLogoIcon = (logoUrl, name, useContain = false) => {
  return L.divIcon({
    className: 'custom-logo-marker',
    html: `
      <div class="logo-marker${useContain ? ' logo-contain' : ''}" title="${name}">
        <img src="${logoUrl}" alt="${name}" onerror="this.style.display='none'" />
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  })
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

// Detail Panel Component (slide-out drawer)
function DetailPanel({ program, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete }) {
  const [activeDetailTab, setActiveDetailTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [schedule, setSchedule] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newGame, setNewGame] = useState({ date: '', opponent: '', result: '', score: '' })
  const [noteLoading, setNoteLoading] = useState(false)

  useEffect(() => {
    if (!program || !sport) return
    const unsub1 = subscribeToNotes(sport, program.id, setNotes)
    const unsub2 = subscribeToSchedule(sport, program.id, setSchedule)
    return () => { unsub1(); unsub2() }
  }, [program, sport])

  useEffect(() => {
    setActiveDetailTab('info')
  }, [program?.id])

  if (!isOpen || !program) return null

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || !user) return
    setNoteLoading(true)
    try {
      await addNote(sport, program.id, {
        text: newNote.trim(),
        author: user.email,
        timestamp: Date.now()
      })
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
    } finally {
      setNoteLoading(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(sport, program.id, noteId)
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  const handleAddGame = async (e) => {
    e.preventDefault()
    if (!newGame.date || !newGame.opponent) return
    try {
      await addScheduleEntry(sport, program.id, {
        date: newGame.date,
        opponent: newGame.opponent,
        result: newGame.result || '',
        score: newGame.score || '',
        addedBy: user?.email || '',
        timestamp: Date.now()
      })
      setNewGame({ date: '', opponent: '', result: '', score: '' })
    } catch (err) {
      console.error('Error adding game:', err)
    }
  }

  const handleDeleteGame = async (entryId) => {
    try {
      await deleteScheduleEntry(sport, program.id, entryId)
    } catch (err) {
      console.error('Error deleting game:', err)
    }
  }

  const regionColor = REGIONS[program.region]?.color || '#333'

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
      <div className="detail-panel-header" style={{ background: regionColor }}>
        <button className="detail-panel-close" onClick={onClose}>&times;</button>
        <span className="detail-panel-region">{program.region}</span>
      </div>

      <div className="detail-panel-profile">
        <div className="detail-panel-logo">
          <img src={program.logo} alt={program.name} />
        </div>
        <div className="detail-panel-title">
          <h2>{program.name}</h2>
          <p>{program.city}, {program.state}</p>
        </div>
      </div>

      <div className="detail-panel-tabs">
        {['info', 'schedule', 'notes'].map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeDetailTab === tab ? 'active' : ''}`}
            onClick={() => setActiveDetailTab(tab)}
          >
            {tab === 'info' ? 'Details' : tab === 'schedule' ? 'Schedule' : `Notes (${notes.length})`}
          </button>
        ))}
      </div>

      <div className="detail-panel-content">
        {activeDetailTab === 'info' && (
          <div className="detail-info-tab">
            {(program.conference || program.headCoach || program.ranking || program.topProspects) && (
              <div className="detail-section">
                {program.conference && (
                  <div className="detail-row"><span className="detail-label">Conference</span><span>{program.conference}</span></div>
                )}
                {program.headCoach && (
                  <div className="detail-row"><span className="detail-label">Head Coach</span><span>{program.headCoach}</span></div>
                )}
                {program.ranking && (
                  <div className="detail-row"><span className="detail-label">Ranking</span><span>{program.ranking}</span></div>
                )}
                {program.topProspects && (
                  <div className="detail-row"><span className="detail-label">Top Prospects</span><span>{program.topProspects}</span></div>
                )}
              </div>
            )}

            <div className="detail-links-section">
              {program.website && (
                <a href={program.website} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
                  Website
                </a>
              )}
              {program.roster && (
                <a href={program.roster} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
                  Roster
                </a>
              )}
              {program.maxprepsUrl && (
                <a href={program.maxprepsUrl} target="_blank" rel="noopener noreferrer" className="detail-link-btn detail-link-maxpreps">
                  MaxPreps
                </a>
              )}
            </div>

            {program.gallery && program.gallery.length > 0 && (
              <div className="detail-gallery">
                <h4>Gallery</h4>
                <div className="detail-gallery-grid">
                  {program.gallery.map((img, idx) => (
                    <img key={idx} src={img} alt={`Gallery ${idx + 1}`} className="detail-gallery-img" />
                  ))}
                </div>
              </div>
            )}

            {isUserAllowed && (
              <div className="detail-actions">
                <button className="detail-edit-btn" onClick={() => onEdit(program)}>Edit Program</button>
                <button className="detail-delete-btn" onClick={() => onDelete(program.id)}>Remove</button>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'schedule' && (
          <div className="detail-schedule-tab">
            {program.maxprepsUrl && (
              <a href={program.maxprepsUrl} target="_blank" rel="noopener noreferrer" className="maxpreps-banner">
                View full schedule & results on MaxPreps &rarr;
              </a>
            )}

            {isUserAllowed && (
              <form className="add-game-form" onSubmit={handleAddGame}>
                <h4>Add Game</h4>
                <div className="game-form-row">
                  <input type="date" value={newGame.date} onChange={e => setNewGame(g => ({ ...g, date: e.target.value }))} required />
                  <input type="text" placeholder="Opponent" value={newGame.opponent} onChange={e => setNewGame(g => ({ ...g, opponent: e.target.value }))} required />
                </div>
                <div className="game-form-row">
                  <select value={newGame.result} onChange={e => setNewGame(g => ({ ...g, result: e.target.value }))}>
                    <option value="">Result</option>
                    <option value="W">Win</option>
                    <option value="L">Loss</option>
                    <option value="T">Tie</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                  <input type="text" placeholder="Score (e.g. 72-65)" value={newGame.score} onChange={e => setNewGame(g => ({ ...g, score: e.target.value }))} />
                </div>
                <button type="submit" className="add-game-btn">Add Game</button>
              </form>
            )}

            {schedule.length === 0 ? (
              <p className="detail-empty">No games added yet.</p>
            ) : (
              <div className="schedule-list">
                {schedule.map(game => (
                  <div key={game.id} className={`schedule-item ${game.result === 'W' ? 'win' : game.result === 'L' ? 'loss' : ''}`}>
                    <div className="schedule-date">
                      {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="schedule-details">
                      <span className="schedule-opponent">{game.opponent}</span>
                      {game.score && <span className="schedule-score">{game.score}</span>}
                    </div>
                    {game.result && game.result !== 'upcoming' && (
                      <span className={`schedule-result ${game.result}`}>{game.result}</span>
                    )}
                    {game.result === 'upcoming' && (
                      <span className="schedule-result upcoming">TBD</span>
                    )}
                    {isUserAllowed && (
                      <button className="schedule-delete" onClick={() => handleDeleteGame(game.id)}>&times;</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'notes' && (
          <div className="detail-notes-tab">
            {!isUserAllowed ? (
              <p className="detail-empty">Sign in to view internal notes.</p>
            ) : (
              <>
                <form className="add-note-form" onSubmit={handleAddNote}>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={3}
                  />
                  <button type="submit" disabled={noteLoading || !newNote.trim()}>
                    {noteLoading ? 'Adding...' : 'Add Note'}
                  </button>
                </form>

                {notes.length === 0 ? (
                  <p className="detail-empty">No notes yet.</p>
                ) : (
                  <div className="notes-list">
                    {notes.map(note => (
                      <div key={note.id} className="note-item">
                        <div className="note-header">
                          <span className="note-author">{note.author}</span>
                          <span className="note-time">{new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <p className="note-text">{note.text}</p>
                        <button className="note-delete" onClick={() => handleDeleteNote(note.id)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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

function App() {
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

  // Events state
  const [events, setEvents] = useState([])
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)

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
      setPrograms(data)
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

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Filter programs based on search and region
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        program.name?.toLowerCase().includes(searchLower) ||
        program.city?.toLowerCase().includes(searchLower) ||
        program.state?.toLowerCase().includes(searchLower) ||
        program.headCoach?.toLowerCase().includes(searchLower) ||
        program.conference?.toLowerCase().includes(searchLower)

      // Region filter
      const matchesRegion = selectedRegion === 'all' || program.region === selectedRegion

      return matchesSearch && matchesRegion
    })
  }, [programs, searchQuery, selectedRegion])

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
    const positions = {}
    const seen = {}
    filteredPrograms.forEach(program => {
      if (!program || !program.coordinates) return
      const key = `${program.coordinates[0].toFixed(3)},${program.coordinates[1].toFixed(3)}`
      if (!seen[key]) seen[key] = []
      seen[key].push(program.id)
    })
    filteredPrograms.forEach(program => {
      if (!program || !program.coordinates) return
      const key = `${program.coordinates[0].toFixed(3)},${program.coordinates[1].toFixed(3)}`
      const group = seen[key]
      if (group.length > 1) {
        const idx = group.indexOf(program.id)
        const angle = (2 * Math.PI * idx) / group.length
        const offset = 0.015
        positions[program.id] = [
          program.coordinates[0] + offset * Math.cos(angle),
          program.coordinates[1] + offset * Math.sin(angle)
        ]
      } else {
        positions[program.id] = program.coordinates
      }
    })
    return positions
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
    return [...events].sort((a, b) => {
      const aUpcoming = a.date >= now
      const bUpcoming = b.date >= now
      if (aUpcoming && !bUpcoming) return -1
      if (!aUpcoming && bUpcoming) return 1
      return aUpcoming ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    })
  }, [events])

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
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14]
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

  // Delete a program
  const handleDeleteProgram = async (programId) => {
    if (window.confirm('Are you sure you want to remove this program?')) {
      try {
        if (user) {
          await addProgramHistory(activeTab, programId, 'deleted', user.email)
        }
        await deleteProgram(activeTab, programId)
      } catch (err) {
        console.error('Error deleting program:', err)
        alert('Could not remove program. Please try again.')
      }
    }
  }

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

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div className="title-row">
            <img src="/logos/adidas-logo.png" alt="adidas" className="header-logo" />
            <h1 className="title">adidas Select Programs</h1>
          </div>
          <p className="subtitle">{activeTabInfo?.name} - Interactive Map</p>
        </div>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
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
            + Add {activeTab === 'events' ? 'Event' : 'Program'}
          </button>
        </div>
      </header>

      {/* Dashboard Stats (programs only) */}
      {activeTab !== 'events' && (
        <div className="dashboard">
          <div className="dashboard-stats">
            <div className="stat-item stat-total">
              <span className="stat-value">{regionCounts.total}</span>
              <span className="stat-label">Total Programs</span>
            </div>
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

        <div className="filter-box">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="region-filter"
          >
            <option value="all">All Regions</option>
            {Object.keys(REGIONS).map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedRegion !== 'all') && (
          <div className="filter-info">
            Showing {filteredPrograms.length} of {programs.length} programs
            <button className="clear-filters" onClick={() => {
              setSearchQuery('')
              setSelectedRegion('all')
            }}>
              Clear filters
            </button>
          </div>
        )}
      </div>}

      <main className="main">
        {activeTab === 'events' ? (
          /* Events Split Layout */
          <div className="events-split-layout">
            <div className="events-map-panel">
              {isEventsLoading ? (
                <div className="loading">Loading events...</div>
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
                                  <span className="detail-icon">📅</span>
                                  <span className="detail-text">
                                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {event.endDate && ` - ${new Date(event.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                  </span>
                                </div>
                                {event.hostPartner && (
                                  <div className="popup-detail-row">
                                    <span className="detail-icon">🤝</span>
                                    <span className="detail-text">{event.hostPartner}</span>
                                  </div>
                                )}
                                {event.description && (
                                  <div className="popup-detail-row">
                                    <span className="detail-icon">📝</span>
                                    <span className="detail-text">{event.description}</span>
                                  </div>
                                )}
                              </div>
                              {event.registrationLink && (
                                <div className="popup-links">
                                  <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="popup-link-btn">
                                    <span>🔗</span> Register
                                  </a>
                                </div>
                              )}
                              {isUserAllowed && (
                                <div className="popup-actions">
                                  <button className="popup-edit-btn" onClick={() => openEditEventForm(event)}>
                                    ✏️ Edit
                                  </button>
                                  <button className="popup-delete-btn" onClick={() => handleDeleteEvent(event.id)}>
                                    🗑️ Remove
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
                <h2>Upcoming Events</h2>
                <span className="events-count">{events.length} events</span>
              </div>
              <div className="events-list">
                {sortedEvents.length === 0 ? (
                  <div className="events-empty">No events yet. Add your first event!</div>
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
          <div className="programs-layout">
            {isLoading ? (
              <div className="loading">Loading programs...</div>
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
                {selectedProgram && (
                  <FlyToMarker position={adjustedPositions[selectedProgram.id] || selectedProgram.coordinates} />
                )}

                {filteredPrograms.map(program => (
                  program && program.coordinates && (
                    <Marker
                      key={program.id}
                      position={adjustedPositions[program.id] || program.coordinates}
                      icon={programIcons[program.id]}
                      eventHandlers={{
                        click: () => setSelectedProgram(program)
                      }}
                    />
                  )
                ))}
              </MapContainer>
            )}

            <DetailPanel
              program={selectedProgram}
              sport={activeTab}
              isOpen={!!selectedProgram}
              onClose={() => setSelectedProgram(null)}
              isUserAllowed={isUserAllowed}
              user={user}
              onEdit={(p) => { setSelectedProgram(null); openEditForm(p) }}
              onDelete={(id) => { setSelectedProgram(null); handleDeleteProgram(id) }}
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
      />
    </div>
  )
}

export default App
