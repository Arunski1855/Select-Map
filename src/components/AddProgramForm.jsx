import { useState } from 'react'
import './AddProgramForm.css'

// US States for dropdown
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
]

const REGIONS = ['East', 'West', 'Midwest', 'South']

function AddProgramForm({ isOpen, onClose, onAdd, sport }) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    region: '',
    website: ''
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoData, setLogoData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Placeholder examples based on sport
  const placeholders = sport === 'basketball'
    ? { name: 'e.g., Corona Centennial', city: 'e.g., Corona' }
    : { name: 'e.g., Grimsley High School', city: 'e.g., Greensboro' }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result)
        setLogoData(e.target.result)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const getCoordinates = async (city, state) => {
    try {
      const query = encodeURIComponent(`${city}, ${state}, USA`)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        { headers: { 'User-Agent': 'AdidasSelectMap/1.0' } }
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
      return null
    } catch (err) {
      console.error('Geocoding error:', err)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name || !formData.city || !formData.state || !formData.region) {
      setError('Please fill in all required fields')
      return
    }
    if (!logoData) {
      setError('Please upload a logo')
      return
    }

    setIsLoading(true)

    try {
      // Get coordinates from city/state
      const coordinates = await getCoordinates(formData.city, formData.state)

      if (!coordinates) {
        setError('Could not find location. Please check city and state.')
        setIsLoading(false)
        return
      }

      const newProgram = {
        id: `program-${Date.now()}`,
        name: formData.name,
        city: formData.city,
        state: formData.state,
        region: formData.region,
        website: formData.website || '',
        logo: logoData,
        coordinates: coordinates
      }

      onAdd(newProgram)

      // Reset form
      setFormData({ name: '', city: '', state: '', region: '', website: '' })
      setLogoPreview(null)
      setLogoData(null)
      onClose()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Add New Program</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Program Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={placeholders.name}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder={placeholders.city}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State *</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              >
                <option value="">Select State</option>
                {US_STATES.map(state => (
                  <option key={state.abbr} value={state.abbr}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="region">Region *</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
            >
              <option value="">Select Region</option>
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="website">Website (optional)</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo *</label>
            <input
              type="file"
              id="logo"
              accept="image/*"
              onChange={handleLogoUpload}
            />
            {logoPreview && (
              <div className="logo-preview">
                <img src={logoPreview} alt="Logo preview" />
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Program'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddProgramForm
