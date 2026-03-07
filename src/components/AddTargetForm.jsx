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

const REGIONS = ['Canada', 'Mid Atlantic', 'North', 'South', 'Midwest', 'West']

const PIPELINE_STATUSES = [
  { id: 'identified', label: 'Identified', description: 'On our radar' },
  { id: 'contacted', label: 'Contacted', description: 'Initial outreach made' },
  { id: 'in_discussion', label: 'In Discussion', description: 'Active conversations' },
  { id: 'proposal_sent', label: 'Proposal Sent', description: 'Offer extended' },
  { id: 'negotiating', label: 'Negotiating', description: 'Working terms' },
  { id: 'signed', label: 'Signed', description: 'Won' },
  { id: 'lost', label: 'Lost', description: 'Went elsewhere' }
]

const PRIORITIES = [
  { id: 'high', label: 'High', description: 'Must-have programs' },
  { id: 'medium', label: 'Medium', description: 'Strong targets' },
  { id: 'low', label: 'Low', description: 'Nice to have' }
]

const COMPETITION_OPTIONS = ['Nike', 'Under Armour', 'Jordan', 'New Balance', 'Puma', 'None/Unknown', 'Other']

const GENDER_OPTIONS = ['Boys', 'Girls']

const initialFormState = {
  // Basic Info
  name: '',
  city: '',
  state: '',
  region: '',
  gender: 'Boys',

  // Contact
  headCoach: '',
  contactEmail: '',
  contactPhone: '',

  // Social
  twitter: '',
  instagram: '',
  website: '',

  // Specs
  conference: '',
  ranking: '',
  topProspects: '',
  level: '',

  // Pipeline
  status: 'identified',
  priority: 'medium',
  targetSignDate: '',

  // Intel
  competition: '',
  competitionDetails: '',
  strengths: '',

  // Notes
  notes: ''
}

function AddTargetForm({ isOpen, onClose, onAdd, onEdit, sport, editTarget, inline = false }) {
  const [formData, setFormData] = useState(initialFormState)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoData, setLogoData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('basic')

  const isEditMode = !!editTarget

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      setFormData({
        name: editTarget.name || '',
        city: editTarget.city || '',
        state: editTarget.state || '',
        region: editTarget.region || '',
        gender: editTarget.gender || 'Boys',
        headCoach: editTarget.headCoach || '',
        contactEmail: editTarget.contactEmail || '',
        contactPhone: editTarget.contactPhone || '',
        twitter: editTarget.twitter || '',
        instagram: editTarget.instagram || '',
        website: editTarget.website || '',
        conference: editTarget.conference || '',
        ranking: editTarget.ranking || '',
        topProspects: editTarget.topProspects || '',
        level: editTarget.level || '',
        status: editTarget.status || 'identified',
        priority: editTarget.priority || 'medium',
        targetSignDate: editTarget.targetSignDate || '',
        competition: editTarget.competition || '',
        competitionDetails: editTarget.competitionDetails || '',
        strengths: editTarget.strengths || '',
        notes: editTarget.notes || ''
      })
      setLogoPreview(editTarget.logo)
      setLogoData(editTarget.logo)
    } else {
      setFormData(initialFormState)
      setLogoPreview(null)
      setLogoData(null)
    }
  }, [editTarget])

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
      const isCanadian = CA_PROVINCES.some(prov => prov.abbr === state)
      const country = isCanadian ? 'Canada' : 'USA'
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)},${encodeURIComponent(state)},${country}`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
      return null
    } catch (error) {
      console.error('Error getting coordinates:', error)
      return null
    }
  }

  const determineRegion = (state) => {
    const regionMap = {
      'Canada': ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'],
      'Mid Atlantic': ['NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV'],
      'South': ['FL', 'GA', 'SC', 'NC', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'TX', 'OK'],
      'Midwest': ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
      'North': ['ME', 'NH', 'VT', 'MA', 'CT', 'RI'],
      'West': ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'CO', 'NM', 'ID', 'MT', 'WY', 'AK', 'HI']
    }
    for (const [region, states] of Object.entries(regionMap)) {
      if (states.includes(state)) return region
    }
    return ''
  }

  const handleStateChange = (e) => {
    const state = e.target.value
    setFormData(prev => ({
      ...prev,
      state,
      region: determineRegion(state)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!formData.name || !formData.city || !formData.state) {
      setError('Please fill in required fields (Name, City, State)')
      setIsLoading(false)
      return
    }

    try {
      const coordinates = await getCoordinates(formData.city, formData.state)

      const targetData = {
        ...formData,
        logo: logoData,
        coordinates
      }

      if (isEditMode) {
        await onEdit({ ...editTarget, ...targetData })
      } else {
        await onAdd(targetData)
      }

      // Reset form
      setFormData(initialFormState)
      setLogoPreview(null)
      setLogoData(null)
      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'contact', label: 'Contact' },
    { id: 'specs', label: 'Specs' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'intel', label: 'Intel' }
  ]

  const formContent = (
    <div className={`modal-content target-form-content${inline ? ' inline-form' : ''}`} onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>&times;</button>
      <h2>{isEditMode ? 'Edit Target Program' : 'Add Target Program'}</h2>

      <div className="form-section-tabs">
        {sections.map(section => (
          <button
            key={section.id}
            className={`form-section-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </div>

        <form onSubmit={handleSubmit} className="program-form">
          {activeSection === 'basic' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group logo-upload">
                  <label>Program Logo</label>
                  <div className="logo-preview-area">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="logo-preview" />
                    ) : (
                      <div className="logo-placeholder">No logo</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="file-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Program Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Oak Hill Academy"
                    required
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Mouth of Wilson"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    required
                  >
                    <option value="">Select State</option>
                    <optgroup label="US States">
                      {US_STATES.map(s => (
                        <option key={s.abbr} value={s.abbr}>{s.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Canadian Provinces">
                      {CA_PROVINCES.map(p => (
                        <option key={p.abbr} value={p.abbr}>{p.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                  >
                    <option value="">Auto-detected</option>
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    {GENDER_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label} - {p.description}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Head Coach</label>
                  <input
                    type="text"
                    name="headCoach"
                    value={formData.headCoach}
                    onChange={handleInputChange}
                    placeholder="e.g., Steve Smith"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="coach@school.edu"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="555-123-4567"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Twitter/X</label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="@handle"
                  />
                </div>
                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@handle"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'specs' && (
            <div className="form-section">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Conference</label>
                  <input
                    type="text"
                    name="conference"
                    value={formData.conference}
                    onChange={handleInputChange}
                    placeholder="e.g., NIBC"
                  />
                </div>
                <div className="form-group">
                  <label>Ranking</label>
                  <input
                    type="text"
                    name="ranking"
                    value={formData.ranking}
                    onChange={handleInputChange}
                    placeholder="e.g., #5 National"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Level</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Regional">Regional</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Top Prospects</label>
                  <textarea
                    name="topProspects"
                    value={formData.topProspects}
                    onChange={handleInputChange}
                    placeholder="List notable recruits or players..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pipeline' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Pipeline Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    {PIPELINE_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label} - {s.description}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label} - {p.description}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Sign Date</label>
                  <input
                    type="date"
                    name="targetSignDate"
                    value={formData.targetSignDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'intel' && (
            <div className="form-section">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Current Competition</label>
                  <select
                    name="competition"
                    value={formData.competition}
                    onChange={handleInputChange}
                  >
                    <option value="">Select...</option>
                    {COMPETITION_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Competition Details</label>
                  <input
                    type="text"
                    name="competitionDetails"
                    value={formData.competitionDetails}
                    onChange={handleInputChange}
                    placeholder="Contract expires 2025, etc."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Strengths / Why Target</label>
                  <textarea
                    name="strengths"
                    value={formData.strengths}
                    onChange={handleInputChange}
                    placeholder="Why is this program a good target?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Target')}
            </button>
          </div>
        </form>
      </div>
  )

  // Return inline or with overlay
  if (inline) {
    return formContent
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {formContent}
    </div>
  )
}

export default AddTargetForm
