import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { programs as defaultPrograms } from './data/programs'
import AddProgramForm from './components/AddProgramForm'
import 'leaflet/dist/leaflet.css'
import './App.css'

// LocalStorage key
const STORAGE_KEY = 'adidas-select-programs'

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

function App() {
  const [programs, setPrograms] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Load programs from localStorage on mount
  useEffect(() => {
    const savedPrograms = localStorage.getItem(STORAGE_KEY)
    if (savedPrograms) {
      setPrograms(JSON.parse(savedPrograms))
    } else {
      // Use default programs if none saved
      setPrograms(defaultPrograms)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPrograms))
    }
  }, [])

  // Create icons for all programs (memoized to prevent re-renders)
  const programIcons = useMemo(() => {
    const icons = {}
    programs.forEach(program => {
      icons[program.id] = createLogoIcon(program.logo)
    })
    return icons
  }, [programs])

  // Add a new program
  const handleAddProgram = (newProgram) => {
    const updatedPrograms = [...programs, newProgram]
    setPrograms(updatedPrograms)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrograms))
  }

  // Delete a program
  const handleDeleteProgram = (programId) => {
    const updatedPrograms = programs.filter(p => p.id !== programId)
    setPrograms(updatedPrograms)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrograms))
  }

  // Center of continental US
  const mapCenter = [39.8283, -98.5795]
  const mapZoom = 4

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">adidas Select Programs</h1>
          <p className="subtitle">Interactive Map of Programs Across the United States</p>
        </div>
        <button className="add-btn" onClick={() => setIsFormOpen(true)}>
          + Add Program
        </button>
      </header>

      <main className="main">
        <MapContainer
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
          ))}
        </MapContainer>
      </main>

      <footer className="footer">
        <p>Click on a logo to view details | {programs.length} programs on the map</p>
      </footer>

      <AddProgramForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onAdd={handleAddProgram}
      />
    </div>
  )
}

export default App
