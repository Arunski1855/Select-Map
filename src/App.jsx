import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { subscribeToPrograms, addProgram, deleteProgram, getPrograms } from './storage'
import AddProgramForm from './components/AddProgramForm'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Create custom icon for each program logo
const createLogoIcon = (logoUrl) => {
  return L.divIcon({
    className: 'custom-logo-marker',
    html: `
      <div class="logo-marker">
        <img src="${logoUrl}" alt="Program Logo" onerror="this.style.display='none'" />
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
  })
}

// Tab configuration
const TABS = [
  { id: 'basketball', name: 'Select Basketball', icon: '🏀' },
  { id: 'football', name: 'Select Football (Mahomes)', icon: '🏈' }
]

function App() {
  const [activeTab, setActiveTab] = useState('basketball')
  const [programs, setPrograms] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Load programs when tab changes
  useEffect(() => {
    const loadedPrograms = getPrograms(activeTab)
    setPrograms(loadedPrograms)
  }, [activeTab])

  // Create icons for all programs (memoized to prevent re-renders)
  const programIcons = useMemo(() => {
    const icons = {}
    programs.forEach(program => {
      if (program && program.id) {
        icons[program.id] = createLogoIcon(program.logo)
      }
    })
    return icons
  }, [programs])

  // Add a new program
  const handleAddProgram = (newProgram) => {
    addProgram(activeTab, newProgram)
    // Reload programs
    setPrograms(getPrograms(activeTab))
  }

  // Delete a program
  const handleDeleteProgram = (programId) => {
    if (window.confirm('Are you sure you want to remove this program?')) {
      deleteProgram(activeTab, programId)
      // Reload programs
      setPrograms(getPrograms(activeTab))
    }
  }

  // Center of continental US
  const mapCenter = [39.8283, -98.5795]
  const mapZoom = 4

  const activeTabInfo = TABS.find(t => t.id === activeTab)

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">adidas Select Programs</h1>
          <p className="subtitle">{activeTabInfo?.name} - Interactive Map</p>
        </div>
        <button className="add-btn" onClick={() => setIsFormOpen(true)}>
          + Add Program
        </button>
      </header>

      {/* Tab Navigation */}
      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        <MapContainer
          key={activeTab}
          center={mapCenter}
          zoom={mapZoom}
          className="map-container"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {programs.map((program) => (
            program && program.id && program.coordinates && (
              <Marker
                key={program.id}
                position={program.coordinates}
                icon={programIcons[program.id]}
              >
                <Popup className="program-popup">
                  <div className="popup-content">
                    <h3 className="popup-title">{program.name}</h3>
                    <p className="popup-location">{program.city}, {program.state}</p>
                    <p className="popup-region">{program.region}</p>
                    {program.website && (
                      <a
                        href={program.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="popup-link"
                      >
                        Visit Website
                      </a>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteProgram(program.id)}
                    >
                      Remove
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </main>

      <footer className="footer">
        <p>{activeTabInfo?.icon} {programs.length} programs on the map</p>
      </footer>

      <AddProgramForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onAdd={handleAddProgram}
        sport={activeTab}
      />
    </div>
  )
}

export default App
