import { useState, useEffect } from 'react'
import './AddProgramForm.css'

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

const CA_PROVINCES = [
  { abbr: 'AB', name: 'Alberta' }, { abbr: 'BC', name: 'British Columbia' },
  { abbr: 'MB', name: 'Manitoba' }, { abbr: 'NB', name: 'New Brunswick' },
  { abbr: 'NL', name: 'Newfoundland and Labrador' }, { abbr: 'NS', name: 'Nova Scotia' },
  { abbr: 'ON', name: 'Ontario' }, { abbr: 'PE', name: 'Prince Edward Island' },
  { abbr: 'QC', name: 'Quebec' }, { abbr: 'SK', name: 'Saskatchewan' }
]

const BS_ISLANDS = [
  { abbr: 'NP', name: 'Nassau / New Providence' }, { abbr: 'GBI', name: 'Grand Bahama' },
  { abbr: 'AB', name: 'Abaco' }, { abbr: 'EL', name: 'Eleuthera' },
  { abbr: 'EX', name: 'Exuma' }, { abbr: 'AN', name: 'Andros' },
  { abbr: 'BI', name: 'Bimini' }, { abbr: 'LI', name: 'Long Island' }
]

const initialFormState = {
  name: '',
  city: '',
  state: '',
  hostPartner: '',
  date: '',
  endDate: '',
  description: '',
  registrationLink: '',
  proposed: false
}

function AddEventForm({ isOpen, onClose, onAdd, onEdit, editEvent }) {
  const [formData, setFormData] = useState(initialFormState)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoData, setPhotoData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!editEvent

  useEffect(() => {
    if (editEvent) {
      setFormData({
        name: editEvent.name || '',
        city: editEvent.city || '',
        state: editEvent.state || '',
        hostPartner: editEvent.hostPartner || '',
        date: editEvent.date || '',
        endDate: editEvent.endDate || '',
        description: editEvent.description || '',
        registrationLink: editEvent.registrationLink || '',
        proposed: editEvent.proposed || false
      })
      setPhotoPreview(editEvent.photo)
      setPhotoData(editEvent.photo)
    } else {
      setFormData(initialFormState)
      setPhotoPreview(null)
      setPhotoData(null)
    }
  }, [editEvent])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target.result)
        setPhotoData(e.target.result)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const getCoordinates = async (city, state) => {
    try {
      const isCanadian = CA_PROVINCES.some(prov => prov.abbr === state)
      const isBahamian = BS_ISLANDS.some(isl => isl.abbr === state)
      const country = isBahamian ? 'Bahamas' : isCanadian ? 'Canada' : 'USA'
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

    if (!formData.name || !formData.city || !formData.state || !formData.date) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      let coordinates
      if (isEditMode && editEvent.city === formData.city && editEvent.state === formData.state) {
        coordinates = editEvent.coordinates
      } else {
        coordinates = await getCoordinates(formData.city, formData.state)
      }

      if (!coordinates) {
        setError('Could not find location. Please check city and state.')
        setIsLoading(false)
        return
      }

      const eventData = {
        id: isEditMode ? editEvent.id : `event-${Date.now()}`,
        name: formData.name,
        city: formData.city,
        state: formData.state,
        hostPartner: formData.hostPartner || '',
        date: formData.date,
        endDate: formData.endDate || '',
        description: formData.description || '',
        registrationLink: formData.registrationLink || '',
        proposed: formData.proposed || false,
        photo: photoData || '',
        coordinates: coordinates
      }

      if (isEditMode) {
        onEdit(eventData)
      } else {
        onAdd(eventData)
      }

      setFormData(initialFormState)
      setPhotoPreview(null)
      setPhotoData(null)
      onClose()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormState)
    setPhotoPreview(null)
    setPhotoData(null)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>&times;</button>
        <h2>{isEditMode ? 'Edit Event' : 'Add New Event'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="event-name">Event Name *</label>
            <input
              type="text"
              id="event-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., adidas Select Showcase"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-city">City *</label>
              <input
                type="text"
                id="event-city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g., Miami"
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-state">State/Province *</label>
              <select
                id="event-state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              >
                <option value="">Select State/Province</option>
                <optgroup label="United States">
                  {US_STATES.map(state => (
                    <option key={state.abbr} value={state.abbr}>{state.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Canada">
                  {CA_PROVINCES.map(prov => (
                    <option key={prov.abbr} value={prov.abbr}>{prov.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Bahamas">
                  {BS_ISLANDS.map(isl => (
                    <option key={isl.abbr} value={isl.abbr}>{isl.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="event-host">Host Partner</label>
            <input
              type="text"
              id="event-host"
              name="hostPartner"
              value={formData.hostPartner}
              onChange={handleInputChange}
              placeholder="e.g., Miami Dade"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-date">Start Date *</label>
              <input
                type="date"
                id="event-date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-endDate">End Date</label>
              <input
                type="date"
                id="event-endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input
                type="checkbox"
                name="proposed"
                checked={formData.proposed}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed: e.target.checked }))}
              />
              Proposed Event
            </label>
            <span className="checkbox-hint">Mark if this event is not yet confirmed</span>
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Description</label>
            <input
              type="text"
              id="event-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief event description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-registration">Registration Link</label>
            <input
              type="url"
              id="event-registration"
              name="registrationLink"
              value={formData.registrationLink}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-photo">Event Photo</label>
            <input
              type="file"
              id="event-photo"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            {photoPreview && (
              <div className="logo-preview">
                <img src={photoPreview} alt="Event preview" />
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Event')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddEventForm
