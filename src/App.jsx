import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { programs } from './data/programs'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Custom hook to handle map events
function MapEvents({ onMapClick }) {
  const map = useMap()
  map.on('click', onMapClick)
  return null
}

// Create custom icon for each program logo
const createLogoIcon = (logoUrl, isSelected) => {
  return L.divIcon({
    className: 'custom-logo-marker',
    html: `
      <div class="logo-marker ${isSelected ? 'selected' : ''}">
        <img src="${logoUrl}" alt="Program Logo" onerror="this.src='/logos/placeholder.svg'" />
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
  })
}

function App() {
  const [selectedProgram, setSelectedProgram] = useState(null)

  // Center of continental US
  const mapCenter = [39.8283, -98.5795]
  const mapZoom = 4

  const handleMarkerClick = (program) => {
    setSelectedProgram(program)
  }

  const handleClosePopup = () => {
    setSelectedProgram(null)
  }

  const handleMapClick = () => {
    setSelectedProgram(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">adidas Select Programs</h1>
          <p className="subtitle">Interactive Map of Programs Across the United States</p>
        </div>
      </header>

      <main className="main">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="map-container"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          {/* Gray/white map style similar to screenshot */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapEvents onMapClick={handleMapClick} />

          {programs.map((program) => (
            <Marker
              key={program.id}
              position={program.coordinates}
              icon={createLogoIcon(program.logo, selectedProgram?.id === program.id)}
              eventHandlers={{
                click: () => handleMarkerClick(program)
              }}
            >
              {selectedProgram?.id === program.id && (
                <Popup
                  closeButton={true}
                  onClose={handleClosePopup}
                  className="program-popup"
                >
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
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </main>

      <footer className="footer">
        <p>Click on a program logo to view details</p>
      </footer>
    </div>
  )
}

export default App
