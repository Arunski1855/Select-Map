import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './AddProgramForm.css'
import './AddTargetForm.css'
import {
  US_STATES, CA_PROVINCES, REGION_LIST,
  PIPELINE_STATUSES, PRIORITIES, determineRegion
} from '../constants'

const COMPETITION_OPTIONS = ['Nike', 'Under Armour', 'Jordan', 'New Balance', 'Puma', 'None/Unknown', 'Other']

const initialFormState = {
  name: '', city: '', state: '', region: '', gender: 'Boys',
  headCoach: '', contactEmail: '', contactPhone: '',
  twitter: '', instagram: '', website: '',
  conference: '', ranking: '', topProspects: '', level: '',
  status: 'identified', priority: 'medium', targetSignDate: '',
  competition: '', competitionDetails: '', strengths: '', notes: ''
}

function AddTargetForm({ isOpen, onClose, onAdd, onEdit, sport, editTarget }) {
  const [formData, setFormData] = useState(initialFormState)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoData, setLogoData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('basic')

  // School lookup
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schoolResults, setSchoolResults] = useState([])
  const [schoolSearching, setSchoolSearching] = useState(false)
  const [schoolConfirm, setSchoolConfirm] = useState(null)
  const [schoolNoResults, setSchoolNoResults] = useState(false)
  const schoolSearchTimer = useRef(null)

  const isEditMode = !!editTarget

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
    setActiveSection('basic')
    setSchoolQuery('')
    setSchoolResults([])
    setSchoolConfirm(null)
  }, [editTarget])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStateChange = (e) => {
    const state = e.target.value
    setFormData(prev => ({ ...prev, state, region: determineRegion(state) }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    const reader = new FileReader()
    reader.onload = (ev) => { setLogoPreview(ev.target.result); setLogoData(ev.target.result) }
    reader.readAsDataURL(file)
    setError('')
  }

  // ── School lookup (same logic as AddProgramForm) ──────────────────────────
  const parseStateHint = (query) => {
    const trimmed = query.trim()
    const commaState = trimmed.match(/,\s*([A-Za-z]{2,})\s*$/)
    if (commaState) {
      const hint = commaState[1].trim()
      const found = US_STATES.find(s => s.abbr.toLowerCase() === hint.toLowerCase() || s.name.toLowerCase() === hint.toLowerCase())
        || CA_PROVINCES.find(s => s.abbr.toLowerCase() === hint.toLowerCase() || s.name.toLowerCase() === hint.toLowerCase())
      if (found) return { name: trimmed.slice(0, commaState.index).trim(), stateHint: found.abbr, stateHintFull: found.name }
    }
    return { name: trimmed, stateHint: null, stateHintFull: null }
  }

  const resolveState = (stateStr) => {
    if (!stateStr) return ''
    const found = US_STATES.find(s => s.name === stateStr || s.abbr === stateStr)
    if (found) return found.abbr
    const ca = CA_PROVINCES.find(s => s.name === stateStr || s.abbr === stateStr)
    if (ca) return ca.abbr
    return stateStr
  }

  const searchSchool = (query) => {
    if (schoolSearchTimer.current) clearTimeout(schoolSearchTimer.current)
    setSchoolNoResults(false)
    if (!query || query.length < 3) { setSchoolResults([]); return }
    setSchoolSearching(true)
    schoolSearchTimer.current = setTimeout(async () => {
      try {
        const { name: schoolName, stateHint, stateHintFull } = parseStateHint(query)
        const photonQ = encodeURIComponent(schoolName + (stateHintFull ? `, ${stateHintFull}` : ''))
        const nominatimQ = encodeURIComponent(schoolName + (stateHint ? `, ${stateHint}, USA` : ''))

        const [photonRes, nominatimRes] = await Promise.allSettled([
          fetch(`https://photon.komoot.io/api/?q=${photonQ}&limit=8&lang=en`, { headers: { 'User-Agent': 'AdidasSelectMap/1.0' } }).then(r => r.json()),
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${nominatimQ}&limit=5&addressdetails=1&countrycodes=us,ca`, { headers: { 'User-Agent': 'AdidasSelectMap/1.0' } }).then(r => r.json()),
        ])

        const seen = new Set()
        const results = []

        if (photonRes.status === 'fulfilled' && photonRes.value?.features) {
          for (const f of photonRes.value.features) {
            const p = f.properties || {}
            const city = p.city || p.locality || p.town || p.village || p.county || ''
            const state = resolveState(p.state || p.state_code || '')
            if (stateHint && state && state !== stateHint) continue
            const name = p.name || schoolName
            const key = `${name}|${city}|${state}`
            if (seen.has(key)) continue
            seen.add(key)
            const [lon, lat] = f.geometry?.coordinates || []
            results.push({ name, city, state, lat: String(lat), lon: String(lon), display: `${name}, ${city}, ${state}` })
            if (results.length >= 6) break
          }
        }

        if (nominatimRes.status === 'fulfilled' && Array.isArray(nominatimRes.value)) {
          for (const r of nominatimRes.value) {
            const addr = r.address || {}
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
            const state = resolveState(addr.state || '')
            if (stateHint && state && state !== stateHint) continue
            const name = r.name || r.display_name.split(',')[0].trim()
            const key = `${name}|${city}|${state}`
            if (seen.has(key)) continue
            seen.add(key)
            results.push({ name, city, state, lat: r.lat, lon: r.lon, display: r.display_name })
            if (results.length >= 8) break
          }
        }

        setSchoolResults(results)
        if (results.length === 0) setSchoolNoResults(true)
      } catch (err) {
        console.error('School search error:', err)
        setSchoolResults([])
        setSchoolNoResults(true)
      } finally {
        setSchoolSearching(false)
      }
    }, 500)
  }

  const confirmSchool = (school) => { setSchoolConfirm(school); setSchoolResults([]) }

  const applySchool = () => {
    if (!schoolConfirm) return
    setFormData(prev => ({
      ...prev,
      name: schoolConfirm.name,
      city: schoolConfirm.city,
      state: schoolConfirm.state,
      region: determineRegion(schoolConfirm.state),
    }))
    setSchoolConfirm(null)
    setSchoolQuery('')
  }
  // ──────────────────────────────────────────────────────────────────────────

  const getCoordinates = async (city, state) => {
    try {
      const isCanadian = CA_PROVINCES.some(p => p.abbr === state)
      const country = isCanadian ? 'Canada' : 'USA'
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city}, ${state}, ${country}`)}&limit=1`,
        { headers: { 'User-Agent': 'AdidasSelectMap/1.0' } }
      )
      const data = await res.json()
      if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      return null
    } catch { return null }
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
      const targetData = { ...formData, logo: logoData, coordinates }
      if (isEditMode) await onEdit({ ...editTarget, ...targetData })
      else await onAdd(targetData)
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
    { id: 'basic', label: 'Info' },
    { id: 'contact', label: 'Contact' },
    { id: 'specs', label: 'Specs' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'intel', label: 'Intel' },
  ]

  const formContent = (
    <div className="modal-content target-form-content" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>&times;</button>

      {/* Header banner */}
      <div className="target-form-banner">
        <div className="target-form-banner-eyebrow">Target Pipeline</div>
        <h2 className="target-form-banner-title">
          {isEditMode ? 'Edit Target' : 'Add Target'}
        </h2>
        {formData.name && (
          <div className="target-form-banner-name">{formData.name}</div>
        )}
      </div>

      {/* Section tabs */}
      <div className="form-section-tabs">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            className={`form-section-tab${activeSection === s.id ? ' active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── BASIC ── */}
        {activeSection === 'basic' && (
          <div className="form-section">

            {/* School lookup */}
            {!isEditMode && (
              <div className="school-lookup">
                <label className="school-lookup-label">Auto-fill from School Name</label>
                <div className="school-lookup-row">
                  <input
                    type="text"
                    className="school-lookup-input"
                    placeholder="e.g. Oak Hill Academy, VA"
                    value={schoolQuery}
                    onChange={e => { setSchoolQuery(e.target.value); searchSchool(e.target.value) }}
                  />
                  {schoolSearching && <span className="school-lookup-spinner" />}
                </div>
                {schoolNoResults && !schoolSearching && schoolQuery.length >= 3 && schoolResults.length === 0 && !schoolConfirm && (
                  <div className="school-no-results">No results — try a shorter name or city only</div>
                )}
                {schoolResults.length > 0 && (
                  <div className="school-lookup-results">
                    {schoolResults.map((r, i) => (
                      <button key={i} type="button" className="school-lookup-result" onClick={() => confirmSchool(r)}>
                        <span className="school-result-name">{r.name}</span>
                        <span className="school-result-location">{r.city}{r.state ? `, ${r.state}` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
                {schoolConfirm && (
                  <div className="school-confirm">
                    <span className="school-confirm-text">
                      Is this <strong>{schoolConfirm.name}</strong> in {schoolConfirm.city}, {schoolConfirm.state}?
                    </span>
                    <div className="school-confirm-actions">
                      <button type="button" className="school-confirm-yes" onClick={applySchool}>Yes, fill form</button>
                      <button type="button" className="school-confirm-no" onClick={() => setSchoolConfirm(null)}>No</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gender toggle */}
            <div className="gender-selector">
              <button type="button" className={`gender-selector-btn${formData.gender === 'Boys' ? ' active' : ''}`} onClick={() => setFormData(p => ({ ...p, gender: 'Boys' }))}>Boys</button>
              <button type="button" className={`gender-selector-btn${formData.gender === 'Girls' ? ' active' : ''}`} onClick={() => setFormData(p => ({ ...p, gender: 'Girls' }))}>Girls</button>
            </div>

            {/* Logo */}
            <div className="form-group">
              <label>Program Logo</label>
              {logoPreview && (
                <div className="logo-preview"><img src={logoPreview} alt="logo" style={{ maxWidth: 72, maxHeight: 72, objectFit: 'contain' }} /></div>
              )}
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
            </div>

            <div className="form-group">
              <label htmlFor="t-name">Program Name *</label>
              <input id="t-name" type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Oak Hill Academy" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="t-city">City *</label>
                <input id="t-city" type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Mouth of Wilson" />
              </div>
              <div className="form-group">
                <label htmlFor="t-state">State *</label>
                <select id="t-state" name="state" value={formData.state} onChange={handleStateChange}>
                  <option value="">Select</option>
                  <optgroup label="US States">{US_STATES.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}</optgroup>
                  <optgroup label="Canadian Provinces">{CA_PROVINCES.map(p => <option key={p.abbr} value={p.abbr}>{p.name}</option>)}</optgroup>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="t-region">Region</label>
                <select id="t-region" name="region" value={formData.region} onChange={handleInputChange}>
                  <option value="">Auto-detected</option>
                  {REGION_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="t-priority">Priority</label>
                <select id="t-priority" name="priority" value={formData.priority} onChange={handleInputChange}>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {activeSection === 'contact' && (
          <div className="form-section">
            <div className="form-group">
              <label>Head Coach</label>
              <input type="text" name="headCoach" value={formData.headCoach} onChange={handleInputChange} placeholder="e.g. Steve Smith" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} placeholder="coach@school.edu" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} placeholder="555-123-4567" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Twitter / X</label>
                <input type="text" name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="@handle" />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@handle" />
              </div>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." />
            </div>
          </div>
        )}

        {/* ── SPECS ── */}
        {activeSection === 'specs' && (
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Conference</label>
                <input type="text" name="conference" value={formData.conference} onChange={handleInputChange} placeholder="e.g. NIBC" />
              </div>
              <div className="form-group">
                <label>Ranking</label>
                <input type="text" name="ranking" value={formData.ranking} onChange={handleInputChange} placeholder="e.g. #5 National" />
              </div>
            </div>
            <div className="form-group">
              <label>Level</label>
              <select name="level" value={formData.level} onChange={handleInputChange}>
                <option value="">Select Level</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
                <option value="Regional">Regional</option>
              </select>
            </div>
            <div className="form-group">
              <label>Top Prospects</label>
              <textarea name="topProspects" value={formData.topProspects} onChange={handleInputChange} placeholder="List notable recruits or players..." rows={3} />
            </div>
          </div>
        )}

        {/* ── PIPELINE ── */}
        {activeSection === 'pipeline' && (
          <div className="form-section">
            <div className="form-group">
              <label>Pipeline Status *</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                {PIPELINE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label} — {s.description}</option>)}
              </select>
            </div>

            {/* Visual status pills */}
            <div className="target-status-pills">
              {PIPELINE_STATUSES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`target-status-pill${formData.status === s.id ? ' active' : ''}`}
                  onClick={() => setFormData(p => ({ ...p, status: s.id }))}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleInputChange}>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Target Sign Date</label>
                <input type="date" name="targetSignDate" value={formData.targetSignDate} onChange={handleInputChange} />
              </div>
            </div>
          </div>
        )}

        {/* ── INTEL ── */}
        {activeSection === 'intel' && (
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Current Competition</label>
                <select name="competition" value={formData.competition} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  {COMPETITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Competition Details</label>
                <input type="text" name="competitionDetails" value={formData.competitionDetails} onChange={handleInputChange} placeholder="Contract expires 2025, etc." />
              </div>
            </div>
            <div className="form-group">
              <label>Strengths / Why Target</label>
              <textarea name="strengths" value={formData.strengths} onChange={handleInputChange} placeholder="Why is this program a good target?" rows={3} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." rows={3} />
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Saving…' : isEditMode ? 'Save Changes' : 'Add Target'}
          </button>
        </div>
      </form>
    </div>
  )

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>{formContent}</div>,
    document.body
  )
}

export default AddTargetForm
