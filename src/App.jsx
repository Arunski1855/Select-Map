import { useState, useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
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
  subscribeToProgramHistory
} from './firebase'
import AddProgramForm from './components/AddProgramForm'
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
const createLogoIcon = (logoUrl, programName) => {
  return L.divIcon({
    className: 'custom-logo-marker',
    html: `
      <div class="logo-marker" title="${programName}">
        <img src="${logoUrl}" alt="${programName}" onerror="this.style.display='none'" />
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
  { id: 'football', name: 'Select Football (Mahomes)', icon: '/logos/mahomes-logo.png' }
]

// Marker Cluster Component
function MarkerClusterGroup({ programs, programIcons, onEditClick, onDeleteClick, user }) {
  const map = useMap()
  const clusterRef = useRef(null)

  useEffect(() => {
    if (!map) return

    // Create cluster group
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let size = 'small'
        if (count > 10) size = 'medium'
        if (count > 25) size = 'large'
        return L.divIcon({
          html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40)
        })
      }
    })

    clusterRef.current = cluster

    // Add markers to cluster
    programs.forEach(program => {
      if (program && program.id && program.coordinates) {
        const marker = L.marker(program.coordinates, {
          icon: programIcons[program.id]
        })

        // Create popup content
        const popupContent = document.createElement('div')
        popupContent.className = 'popup-content'
        popupContent.innerHTML = `
          <h3 class="popup-title">${program.name}</h3>
          <p class="popup-location">${program.city}, ${program.state}</p>
          <p class="popup-region">${program.region}</p>
          ${program.conference ? `<p class="popup-detail"><strong>Conference:</strong> ${program.conference}</p>` : ''}
          ${program.headCoach ? `<p class="popup-detail"><strong>Head Coach:</strong> ${program.headCoach}</p>` : ''}
          ${program.ranking ? `<p class="popup-detail"><strong>Ranking:</strong> ${program.ranking}</p>` : ''}
          ${program.topProspects ? `<p class="popup-detail"><strong>Top Prospects:</strong> ${program.topProspects}</p>` : ''}
          <div class="popup-links">
            ${program.website ? `<a href="${program.website}" target="_blank" rel="noopener noreferrer" class="popup-link">Website</a>` : ''}
            ${program.roster ? `<a href="${program.roster}" target="_blank" rel="noopener noreferrer" class="popup-link">Roster</a>` : ''}
          </div>
          ${program.gallery && program.gallery.length > 0 ? `
            <div class="popup-gallery">
              ${program.gallery.slice(0, 3).map(img => `<img src="${img}" alt="Gallery" class="gallery-thumb" />`).join('')}
              ${program.gallery.length > 3 ? `<span class="gallery-more">+${program.gallery.length - 3}</span>` : ''}
            </div>
          ` : ''}
        `

        // Add edit/delete buttons if user is logged in
        if (user) {
          const editBtn = document.createElement('button')
          editBtn.className = 'edit-btn'
          editBtn.textContent = 'Edit'
          editBtn.onclick = () => onEditClick(program)
          popupContent.appendChild(editBtn)

          const deleteBtn = document.createElement('button')
          deleteBtn.className = 'delete-btn'
          deleteBtn.textContent = 'Remove'
          deleteBtn.onclick = () => onDeleteClick(program.id)
          popupContent.appendChild(deleteBtn)
        }

        marker.bindPopup(popupContent)
        cluster.addLayer(marker)
      }
    })

    map.addLayer(cluster)

    return () => {
      map.removeLayer(cluster)
    }
  }, [map, programs, programIcons, onEditClick, onDeleteClick, user])

  return null
}

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

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(setUser)
    return () => unsubscribe()
  }, [])

  // Subscribe to Firebase for real-time updates
  useEffect(() => {
    setIsLoading(true)

    const unsubscribe = subscribeToPrograms(activeTab, (data) => {
      setPrograms(data)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [activeTab])

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

  // Count programs by region
  const regionCounts = useMemo(() => {
    const counts = { total: programs.length }
    Object.keys(REGIONS).forEach(region => {
      counts[region] = programs.filter(p => p.region === region).length
    })
    return counts
  }, [programs])

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
              <button className="logout-btn" onClick={logOut}>Sign Out</button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setIsAuthModalOpen(true)}>
              Sign In
            </button>
          )}

          <button className="add-btn" onClick={handleAddClick}>
            + Add Program
          </button>
        </div>
      </header>

      {/* Dashboard Stats */}
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

      {/* Search and Filter Bar */}
      <div className="toolbar">
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
      </div>

      <main className="main">
        {isLoading ? (
          <div className="loading">Loading programs...</div>
        ) : (
          <MapContainer
            key={`${activeTab}-${darkMode}`}
            center={mapCenter}
            zoom={mapZoom}
            className="map-container"
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={darkMode
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
            />

            <MarkerClusterGroup
              programs={filteredPrograms}
              programIcons={programIcons}
              onEditClick={openEditForm}
              onDeleteClick={handleDeleteProgram}
              user={user}
            />
          </MapContainer>
        )}
      </main>

      <footer className="footer">
        <p>
          {filteredPrograms.length} programs displayed
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
    </div>
  )
}

export default App
