import { useState, useEffect } from 'react'
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

// Canadian Provinces for dropdown
const CA_PROVINCES = [
  { abbr: 'AB', name: 'Alberta' }, { abbr: 'BC', name: 'British Columbia' },
  { abbr: 'MB', name: 'Manitoba' }, { abbr: 'NB', name: 'New Brunswick' },
  { abbr: 'NL', name: 'Newfoundland and Labrador' }, { abbr: 'NS', name: 'Nova Scotia' },
  { abbr: 'ON', name: 'Ontario' }, { abbr: 'PE', name: 'Prince Edward Island' },
  { abbr: 'QC', name: 'Quebec' }, { abbr: 'SK', name: 'Saskatchewan' }
]

const REGIONS = ['Canada', 'Mid Atlantic', 'South', 'Midwest', 'West']

const initialFormState = {
  name: '',
  city: '',
  state: '',
  region: '',
  website: '',
  roster: '',
  headCoach: '',
  ranking: '',
  topProspects: '',
  conference: ''
}

function AddProgramForm({ isOpen, onClose, onAdd, onEdit, sport, editProgram }) {
  const [formData, setFormData] = useState(initialFormState)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoData, setLogoData] = useState(null)
  const [gallery, setGallery] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!editProgram

  // Populate form when editing
  useEffect(() => {
    if (editProgram) {
      setFormData({
        name: editProgram.name || '',
        city: editProgram.city || '',
        state: editProgram.state || '',
        region: editProgram.region || '',
        website: editProgram.website || '',
        roster: editProgram.roster || '',
        headCoach: editProgram.headCoach || '',
        ranking: editProgram.ranking || '',
        topProspects: editProgram.topProspects || '',
        conference: editProgram.conference || ''
      })
      setLogoPreview(editProgram.logo)
      setLogoData(editProgram.logo)
      setGallery(editProgram.gallery || [])
    } else {
      setFormData(initialFormState)
      setLogoPreview(null)
      setLogoData(null)
      setGallery([])
    }
  }, [editProgram])

  // Placeholder examples based on sport
  const placeholders = sport === 'basketball'
    ? { name: 'e.g., Corona Centennial', city: 'e.g., Corona', coach: 'e.g., Jeff Kaufman' }
    : { name: 'e.g., Grimsley High School', city: 'e.g., Greensboro', coach: 'e.g., John Smith' }

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

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + gallery.length > 10) {
      setError('Maximum 10 gallery images allowed')
      return
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = (e) => {
        setGallery(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
    setError('')
  }

  const removeGalleryImage = (index) => {
    setGallery(prev => prev.filter((_, i) => i !== index))
  }

  const getCoordinates = async (city, state) => {
    try {
      // Check if state is a Canadian province
      const isCanadian = CA_PROVINCES.some(prov => prov.abbr === state)
      const country = isCanadian ? 'Canada' : 'USA'
      const query = encodeURIComponent(`${city}, ${state}, ${country}`)
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
      // Get coordinates from city/state (or use existing if editing same location)
      let coordinates
      if (isEditMode && editProgram.city === formData.city && editProgram.state === formData.state) {
        coordinates = editProgram.coordinates
      } else {
        coordinates = await getCoordinates(formData.city, formData.state)
      }

      if (!coordinates) {
        setError('Could not find location. Please check city and state.')
        setIsLoading(false)
        return
      }

      const programData = {
        id: isEditMode ? editProgram.id : `program-${Date.now()}`,
        name: formData.name,
        city: formData.city,
        state: formData.state,
        region: formData.region,
        website: formData.website || '',
        roster: formData.roster || '',
        headCoach: formData.headCoach || '',
        ranking: formData.ranking || '',
        topProspects: formData.topProspects || '',
        conference: formData.conference || '',
        logo: logoData,
        gallery: gallery,
        coordinates: coordinates
      }

      if (isEditMode) {
        onEdit(programData)
      } else {
        onAdd(programData)
      }

      // Reset form
      setFormData(initialFormState)
      setLogoPreview(null)
      setLogoData(null)
      setGallery([])
      onClose()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormState)
    setLogoPreview(null)
    setLogoData(null)
    setGallery([])
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>&times;</button>
        <h2>{isEditMode ? 'Edit Program' : 'Add New Program'}</h2>

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
              <label htmlFor="state">State/Province *</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              >
                <option value="">Select State/Province</option>
                <optgroup label="United States">
                  {US_STATES.map(state => (
                    <option key={state.abbr} value={state.abbr}>
                      {state.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Canada">
                  {CA_PROVINCES.map(prov => (
                    <option key={prov.abbr} value={prov.abbr}>
                      {prov.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="form-row">
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
              <label htmlFor="conference">Conference</label>
              <input
                type="text"
                id="conference"
                name="conference"
                value={formData.conference}
                onChange={handleInputChange}
                placeholder="e.g., Big South"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="headCoach">Head Coach</label>
            <input
              type="text"
              id="headCoach"
              name="headCoach"
              value={formData.headCoach}
              onChange={handleInputChange}
              placeholder={placeholders.coach}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ranking">Ranking</label>
              <input
                type="text"
                id="ranking"
                name="ranking"
                value={formData.ranking}
                onChange={handleInputChange}
                placeholder="e.g., #5 National"
              />
            </div>

            <div className="form-group">
              <label htmlFor="topProspects">Top Prospects</label>
              <input
                type="text"
                id="topProspects"
                name="topProspects"
                value={formData.topProspects}
                onChange={handleInputChange}
                placeholder="e.g., 3 five-stars"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="website">Website</label>
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
              <label htmlFor="roster">Roster Link</label>
              <input
                type="url"
                id="roster"
                name="roster"
                value={formData.roster}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo {!isEditMode && '*'}</label>
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

          <div className="form-group">
            <label htmlFor="gallery">Gallery Images (optional, max 10)</label>
            <input
              type="file"
              id="gallery"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
            />
            {gallery.length > 0 && (
              <div className="gallery-preview">
                {gallery.map((img, index) => (
                  <div key={index} className="gallery-item">
                    <img src={img} alt={`Gallery ${index + 1}`} />
                    <button
                      type="button"
                      className="gallery-remove"
                      onClick={() => removeGalleryImage(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Program')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddProgramForm
