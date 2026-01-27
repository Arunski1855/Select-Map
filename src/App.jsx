import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { subscribeToPrograms, addProgram, deleteProgram, editProgram } from './firebase'
import AddProgramForm from './components/AddProgramForm'
import 'leaflet/dist/leaflet.css'
import './App.css'

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

function App() {
  const [activeTab, setActiveTab] = useState('basketball')
  const [programs, setPrograms] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingProgram, setEditingProgram] = useState(null)

  // Subscribe to Firebase for real-time updates
  useEffect(() => {
    setIsLoading(true)

    const unsubscribe = subscribeToPrograms(activeTab, (data) => {
      setPrograms(data)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [activeTab])

  // Create icons for all programs (memoized to prevent re-renders)
  const programIcons = useMemo(() => {
    const icons = {}
    programs.forEach(program => {
      if (program && program.id) {
        icons[program.id] = createLogoIcon(program.logo, program.name)
      }
    })
    return icons
  }, [programs])

  // Add a new program
  const handleAddProgram = async (newProgram) => {
    try {
      await addProgram(activeTab, newProgram)
    } catch (err) {
      console.error('Error adding program:', err)
      alert('Could not add program. Please try again.')
    }
  }

  // Delete a program
  const handleDeleteProgram = async (programId) => {
    if (window.confirm('Are you sure you want to remove this program?')) {
      try {
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

  // Center of continental US
  const mapCenter = [39.8283, -98.5795]
  const mapZoom = 4

  const activeTabInfo = TABS.find(t => t.id === activeTab)

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="title-row">
            <img src="/logos/adidas-logo.png" alt="adidas" className="header-logo" />
            <h1 className="title">adidas Select Programs</h1>
          </div>
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
            <img src={tab.icon} alt="" className="tab-icon" />
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </nav>

      <main className="main">
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
                      {program.conference && (
                        <p className="popup-detail"><strong>Conference:</strong> {program.conference}</p>
                      )}
                      {program.headCoach && (
                        <p className="popup-detail"><strong>Head Coach:</strong> {program.headCoach}</p>
                      )}
                      {program.ranking && (
                        <p className="popup-detail"><strong>Ranking:</strong> {program.ranking}</p>
                      )}
                      {program.topProspects && (
                        <p className="popup-detail"><strong>Top Prospects:</strong> {program.topProspects}</p>
                      )}
                      <div className="popup-links">
                        {program.website && (
                          <a
                            href={program.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="popup-link"
                          >
                            Website
                          </a>
                        )}
                        {program.roster && (
                          <a
                            href={program.roster}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="popup-link"
                          >
                            Roster
                          </a>
                        )}
                      </div>
                      <button
                        className="edit-btn"
                        onClick={() => openEditForm(program)}
                      >
                        Edit
                      </button>
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
        )}
      </main>

      <footer className="footer">
        <p>{programs.length} programs | Shared with all users</p>
      </footer>

      <AddProgramForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onAdd={handleAddProgram}
        onEdit={handleEditProgram}
        sport={activeTab}
        editProgram={editingProgram}
      />
    </div>
  )
}

export default App
