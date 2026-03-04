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

// Bahamas Islands for dropdown
const BS_ISLANDS = [
  { abbr: 'BS-NP', name: 'Nassau / New Providence' }, { abbr: 'BS-GBI', name: 'Grand Bahama' },
  { abbr: 'BS-AB', name: 'Abaco' }, { abbr: 'BS-EL', name: 'Eleuthera' },
  { abbr: 'BS-EX', name: 'Exuma' }, { abbr: 'BS-AN', name: 'Andros' },
  { abbr: 'BS-BI', name: 'Bimini' }, { abbr: 'BS-LI', name: 'Long Island' }
]

const REGIONS = ['Canada', 'Mid Atlantic', 'North', 'South', 'Midwest', 'West']

const PROGRAM_LEVELS = ['Gold', 'Silver', 'Bronze', 'Regional']

// Mahomes tier only available for football
const FOOTBALL_PROGRAM_LEVELS = ['Mahomes', 'Gold', 'Silver', 'Bronze', 'Regional']

const GENDER_OPTIONS = ['Boys', 'Girls']

const TEAM_TYPE_OPTIONS = ['Prep', 'National']

// Basic team colors
// adidas Zone Graphic color palette
const TEAM_COLORS = [
  // Primary Colors
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Team Maroon', hex: '#5C1F35' },
  { name: 'Team Burgundy', hex: '#6D2C3B' },
  { name: 'Team Power Red', hex: '#BF0D3E' },
  { name: 'Team Orange', hex: '#E35205' },
  { name: 'Team Collegiate Gold', hex: '#CC8A00' },
  { name: 'Team Gold', hex: '#FFB81C' },
  { name: 'Bright Yellow', hex: '#FFFF00' },
  { name: 'Solar Yellow', hex: '#FFF200' },
  { name: 'Team Solar Green', hex: '#C4D600' },
  { name: 'Team Kelly Green', hex: '#009639' },
  { name: 'Team Dark Green', hex: '#00573F' },
  { name: 'Team Forest Green', hex: '#0D381E' },
  // Secondary Colors
  { name: 'Teal', hex: '#00857D' },
  { name: 'Team Shock Blue', hex: '#009FDF' },
  { name: 'Team Royal Blue', hex: '#0065BD' },
  { name: 'Team Collegiate Royal', hex: '#002F87' },
  { name: 'Team Navy Blue', hex: '#001F5B' },
  { name: 'Team College Purple', hex: '#512D6D' },
  { name: 'Team Purple', hex: '#6D2077' },
  { name: 'Team Pink', hex: '#E31C79' },
  { name: 'Team Light Grey', hex: '#A2AAAD' },
  { name: 'Team Sand', hex: '#C5B9A0' },
  { name: 'Dark Grey Heather', hex: '#5C6670' },
  { name: 'Orange Rush', hex: '#FF6720' },
  { name: 'Red Rush', hex: '#ED174C' },
  { name: 'Blue Rush', hex: '#0033A0' }
]

const initialFormState = {
  name: '',
  city: '',
  state: '',
  region: '',
  website: '',
  roster: '',
  headCoach: '',
  ranking: '',
  stateRanking: '',
  topProspects: '',
  conference: '',
  maxprepsUrl: '',
  tcaStoreUrl: '',
  level: '',
  primaryColor: '',
  secondaryColor: '',
  contactEmail: '',
  contactPhone: '',
  twitter: '',
  instagram: '',
  gender: 'Boys',
  teamType: '',
  onboarding2026: false,
  isSelect: true
}

function AddProgramForm({ isOpen, onClose, onAdd, onEdit, sport, editProgram }) {
  const [formData, setFormData] = useState(initialFormState)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoData, setLogoData] = useState(null)
  const [gallery, setGallery] = useState([])
  const [brandGuide, setBrandGuide] = useState(null)
  const [brandGuideName, setBrandGuideName] = useState('')
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
        stateRanking: editProgram.stateRanking || '',
        topProspects: editProgram.topProspects || '',
        conference: editProgram.conference || '',
        maxprepsUrl: editProgram.maxprepsUrl || '',
        tcaStoreUrl: editProgram.tcaStoreUrl || '',
        level: editProgram.level || '',
        primaryColor: editProgram.primaryColor || '',
        secondaryColor: editProgram.secondaryColor || '',
        contactEmail: editProgram.contactEmail || '',
        contactPhone: editProgram.contactPhone || '',
        twitter: editProgram.twitter || '',
        instagram: editProgram.instagram || '',
        gender: editProgram.gender || 'Boys',
        teamType: editProgram.teamType || '',
        onboarding2026: editProgram.onboarding2026 || false,
        isSelect: editProgram.isSelect !== false
      })
      setLogoPreview(editProgram.logo)
      setLogoData(editProgram.logo)
      setGallery(editProgram.gallery || [])
      setBrandGuide(editProgram.brandGuide || null)
      setBrandGuideName(editProgram.brandGuideName || '')
    } else {
      setFormData(initialFormState)
      setLogoPreview(null)
      setLogoData(null)
      setGallery([])
      setBrandGuide(null)
      setBrandGuideName('')
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

  const handleBrandGuideUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('PDF must be under 10MB')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setBrandGuide(e.target.result)
        setBrandGuideName(file.name)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const getCoordinates = async (city, state) => {
    try {
      // Check if state is a Canadian province
      const isCanadian = CA_PROVINCES.some(prov => prov.abbr === state)
      const bahamasIsland = BS_ISLANDS.find(isl => isl.abbr === state)
      const country = bahamasIsland ? 'Bahamas' : isCanadian ? 'Canada' : 'USA'
      const region = bahamasIsland ? bahamasIsland.name : state
      const query = encodeURIComponent(`${city}, ${region}, ${country}`)
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
        stateRanking: formData.stateRanking || '',
        topProspects: formData.topProspects || '',
        conference: formData.conference || '',
        maxprepsUrl: formData.maxprepsUrl || '',
        tcaStoreUrl: formData.tcaStoreUrl || '',
        level: formData.level || '',
        primaryColor: formData.primaryColor || '',
        secondaryColor: formData.secondaryColor || '',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        twitter: formData.twitter || '',
        instagram: formData.instagram || '',
        gender: sport === 'football' ? 'Boys' : (formData.gender || 'Boys'),
        teamType: formData.name?.toLowerCase().match(/mt\.?\s*zion/) ? (formData.teamType || '') : '',
        onboarding2026: formData.onboarding2026 || false,
        isSelect: formData.isSelect !== false,
        logo: logoData,
        gallery: gallery,
        brandGuide: brandGuide || '',
        brandGuideName: brandGuideName || '',
        coordinates: coordinates
      }

      if (isEditMode) {
        await onEdit(programData)
      } else {
        await onAdd(programData)
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

        {sport !== 'football' && (
          <div className="gender-selector">
            {GENDER_OPTIONS.map(g => (
              <button
                key={g}
                type="button"
                className={`gender-selector-btn ${formData.gender === g ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {formData.name?.toLowerCase().match(/mt\.?\s*zion/) && (
          <div className="gender-selector" style={{ marginTop: '8px' }}>
            <label style={{ width: '100%', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Team Type</label>
            {TEAM_TYPE_OPTIONS.map(t => (
              <button
                key={t}
                type="button"
                className={`gender-selector-btn ${formData.teamType === t ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, teamType: t }))}
              >
                {t}
              </button>
            ))}
          </div>
        )}

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
                <optgroup label="Bahamas">
                  {BS_ISLANDS.map(isl => (
                    <option key={isl.abbr} value={isl.abbr}>
                      {isl.name}
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
              <label htmlFor="ranking">National Ranking</label>
              <input
                type="text"
                id="ranking"
                name="ranking"
                value={formData.ranking}
                onChange={handleInputChange}
                placeholder="e.g., #5, #479, Unranked"
              />
            </div>

            <div className="form-group">
              <label htmlFor="stateRanking">State Ranking</label>
              <input
                type="text"
                id="stateRanking"
                name="stateRanking"
                value={formData.stateRanking}
                onChange={handleInputChange}
                placeholder="e.g., #1, #50, Unranked"
              />
            </div>
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

          <div className="form-group">
            <label htmlFor="level">Program Level</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
            >
              <option value="">Select Level</option>
              {(sport === 'football' ? FOOTBALL_PROGRAM_LEVELS : PROGRAM_LEVELS).map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="primaryColor">Primary Color</label>
              <select
                id="primaryColor"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleInputChange}
                style={formData.primaryColor ? { borderLeft: `4px solid ${TEAM_COLORS.find(c => c.name === formData.primaryColor)?.hex || '#ccc'}` } : {}}
              >
                <option value="">Select Color</option>
                {TEAM_COLORS.map(color => (
                  <option key={color.name} value={color.name}>{color.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="secondaryColor">Secondary Color</label>
              <select
                id="secondaryColor"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleInputChange}
                style={formData.secondaryColor ? { borderLeft: `4px solid ${TEAM_COLORS.find(c => c.name === formData.secondaryColor)?.hex || '#ccc'}` } : {}}
              >
                <option value="">Select Color</option>
                {TEAM_COLORS.map(color => (
                  <option key={color.name} value={color.name}>{color.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input
                type="checkbox"
                name="isSelect"
                checked={formData.isSelect}
                onChange={(e) => setFormData(prev => ({ ...prev, isSelect: e.target.checked }))}
              />
              Adidas Select Program
            </label>
            <span className="checkbox-hint">Uncheck for elite tier programs that are not officially Select</span>
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input
                type="checkbox"
                name="onboarding2026"
                checked={formData.onboarding2026}
                onChange={(e) => setFormData(prev => ({ ...prev, onboarding2026: e.target.checked }))}
              />
              Onboarding 2026
            </label>
            <span className="checkbox-hint">Mark if this program is being onboarded in 2026</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="coach@program.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="twitter">Twitter / X Handle</label>
              <input
                type="text"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                placeholder="@handle"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instagram">Instagram Handle</label>
              <input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                placeholder="@handle"
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
            <label htmlFor="maxprepsUrl">MaxPreps URL</label>
            <input
              type="url"
              id="maxprepsUrl"
              name="maxprepsUrl"
              value={formData.maxprepsUrl}
              onChange={handleInputChange}
              placeholder="https://www.maxpreps.com/high-schools/..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="tcaStoreUrl">TCA Store URL</label>
            <input
              type="url"
              id="tcaStoreUrl"
              name="tcaStoreUrl"
              value={formData.tcaStoreUrl}
              onChange={handleInputChange}
              placeholder="https://..."
            />
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

          <div className="form-group">
            <label htmlFor="brandGuide">Brand Guidelines (PDF, max 10MB)</label>
            <input
              type="file"
              id="brandGuide"
              accept="application/pdf"
              onChange={handleBrandGuideUpload}
            />
            {brandGuideName && (
              <div className="brand-guide-preview">
                <span className="brand-guide-file">{brandGuideName}</span>
                <button type="button" className="brand-guide-remove" onClick={() => { setBrandGuide(null); setBrandGuideName('') }}>&times;</button>
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
