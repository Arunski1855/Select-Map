import { useState, useEffect, useRef } from 'react'
import { addRankingMetric } from '../firebase'
import './AddProgramForm.css'
import {
  US_STATES, CA_PROVINCES, BS_ISLANDS,
  REGION_LIST, PROGRAM_LEVELS, FOOTBALL_PROGRAM_LEVELS,
  GENDER_OPTIONS, TEAM_TYPE_OPTIONS, TEAM_COLORS,
  determineRegion, BORDERING_STATES, SSB3_DIVISIONS, SSB3_AGE_GROUPS
} from '../constants'

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
  adiCustomUrl: '',
  brandGuideUrl: '',
  level: '',
  primaryColor: '',
  secondaryColor: '',
  contactEmail: '',
  contactPhone: '',
  twitter: '',
  instagram: '',
  gender: 'Boys',
  teamType: '',
  onboarding2027: false,
  isSelect: true,
  // 3SSB-specific fields
  programDirector: '',
  ssb3Divisions: [],
  age15u: false,
  age16u: false,
  age17u: false,
  teamSize15u: '',
  teamSize16u: '',
  teamSize17u: '',
  borderingStates: [],
}

function AddProgramForm({ isOpen, onClose, onAdd, onEdit, sport, editProgram, user, defaultLevel }) {
  const [formData, setFormData] = useState({ ...initialFormState, level: defaultLevel || '' })
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoData, setLogoData] = useState(null)
  const [gallery, setGallery] = useState([])
  const [brandGuide, setBrandGuide] = useState(null)
  const [brandGuideName, setBrandGuideName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // School lookup
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schoolResults, setSchoolResults] = useState([])
  const [schoolSearching, setSchoolSearching] = useState(false)
  const [schoolConfirm, setSchoolConfirm] = useState(null) // { name, city, state, lat, lon }
  const [schoolNoResults, setSchoolNoResults] = useState(false)
  const schoolSearchTimer = useRef(null)

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
        adiCustomUrl: editProgram.adiCustomUrl || '',
        brandGuideUrl: editProgram.brandGuideUrl || '',
        level: editProgram.level || '',
        primaryColor: editProgram.primaryColor || '',
        secondaryColor: editProgram.secondaryColor || '',
        contactEmail: editProgram.contactEmail || '',
        contactPhone: editProgram.contactPhone || '',
        twitter: editProgram.twitter || '',
        instagram: editProgram.instagram || '',
        gender: editProgram.gender || 'Boys',
        teamType: editProgram.teamType || '',
        onboarding2027: editProgram.onboarding2027 || false,
        isSelect: editProgram.isSelect !== false,
        // 3SSB fields
        programDirector: editProgram.programDirector || '',
        ssb3Divisions: editProgram.ssb3Divisions || [],
        age15u: editProgram.age15u || false,
        age16u: editProgram.age16u || false,
        age17u: editProgram.age17u || false,
        teamSize15u: editProgram.teamSize15u || '',
        teamSize16u: editProgram.teamSize16u || '',
        teamSize17u: editProgram.teamSize17u || '',
        borderingStates: editProgram.borderingStates || (BORDERING_STATES[editProgram.state] || []),
      })
      setLogoPreview(editProgram.logo)
      setLogoData(editProgram.logo)
      setGallery(editProgram.gallery || [])
      setBrandGuide(editProgram.brandGuide || null)
      setBrandGuideName(editProgram.brandGuideName || '')
    } else {
      const ssb3Defaults = sport === '3ssb'
        ? { name: 'Upward Stars', city: 'Columbia', state: 'SC', region: determineRegion('SC'), borderingStates: BORDERING_STATES['SC'] || [] }
        : {}
      setFormData({ ...initialFormState, level: defaultLevel || '', ...ssb3Defaults })
      setLogoPreview(null)
      setLogoData(null)
      setGallery([])
      setBrandGuide(null)
      setBrandGuideName('')
    }
  }, [editProgram, isOpen, defaultLevel, sport])

  // Placeholder examples based on sport
  const placeholders = sport === 'basketball'
    ? { name: 'e.g., Corona Centennial', city: 'e.g., Corona', coach: 'e.g., Jeff Kaufman' }
    : { name: 'e.g., Grimsley High School', city: 'e.g., Greensboro', coach: 'e.g., John Smith' }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStateChange = (e) => {
    const state = e.target.value
    const borders = sport === '3ssb' ? (BORDERING_STATES[state] || []) : undefined
    setFormData(prev => ({
      ...prev,
      state,
      region: determineRegion(state),
      ...(sport === '3ssb' && { borderingStates: borders })
    }))
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

  const parseStateHint = (query) => {
    // Extract trailing state hint like ", CA" or " CA" or ", California"
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

        // Build Photon query (better POI/school fuzzy search than Nominatim)
        const photonQ = encodeURIComponent(schoolName + (stateHintFull ? `, ${stateHintFull}` : ''))
        const photonUrl = `https://photon.komoot.io/api/?q=${photonQ}&limit=8&lang=en`

        // Also run Nominatim structured search in parallel as fallback
        const nominatimQ = encodeURIComponent(schoolName + (stateHint ? `, ${stateHint}, USA` : ''))
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${nominatimQ}&limit=5&addressdetails=1&countrycodes=us,ca`

        const [photonRes, nominatimRes] = await Promise.allSettled([
          fetch(photonUrl, { headers: { 'User-Agent': 'AdidasSelectMap/1.0' } }).then(r => r.json()),
          fetch(nominatimUrl, { headers: { 'User-Agent': 'AdidasSelectMap/1.0' } }).then(r => r.json()),
        ])

        const seen = new Set()
        const results = []

        // Process Photon results first (better for schools/POIs)
        if (photonRes.status === 'fulfilled' && photonRes.value?.features) {
          for (const f of photonRes.value.features) {
            const p = f.properties || {}
            const city = p.city || p.locality || p.town || p.village || p.county || ''
            const state = resolveState(p.state || p.state_code || '')
            // Filter by state hint if provided
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

        // Fill remaining slots from Nominatim
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

  const confirmSchool = (school) => {
    setSchoolConfirm(school)
    setSchoolResults([])
  }

  const applySchool = () => {
    if (!schoolConfirm) return
    const region = determineRegion(schoolConfirm.state)
    const bordering = BORDERING_STATES[schoolConfirm.state] || []
    setFormData(prev => ({
      ...prev,
      name: schoolConfirm.name,
      city: schoolConfirm.city,
      state: schoolConfirm.state,
      region,
      ...(sport === '3ssb' ? { borderingStates: bordering } : {}),
    }))
    setSchoolConfirm(null)
    setSchoolQuery('')
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
        adiCustomUrl: formData.adiCustomUrl || '',
        brandGuideUrl: formData.brandGuideUrl || '',
        level: formData.level || '',
        primaryColor: formData.primaryColor || '',
        secondaryColor: formData.secondaryColor || '',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        twitter: formData.twitter || '',
        instagram: formData.instagram || '',
        gender: sport === 'football' ? 'Boys' : (formData.gender || 'Boys'),
        teamType: formData.name?.toLowerCase().match(/mt\.?\s*zion/) ? (formData.teamType || '') : '',
        onboarding2027: formData.onboarding2027 || false,
        isSelect: formData.isSelect !== false,
        logo: logoData,
        gallery: gallery,
        brandGuide: brandGuide || '',
        brandGuideName: brandGuideName || '',
        coordinates: coordinates,
        // 3SSB fields
        ...(sport === '3ssb' && {
          programDirector: formData.programDirector || '',
          ssb3Divisions: formData.ssb3Divisions || [],
          age15u: formData.age15u || false,
          age16u: formData.age16u || false,
          age17u: formData.age17u || false,
          teamSize15u: formData.age15u ? (formData.teamSize15u || '') : '',
          teamSize16u: formData.age16u ? (formData.teamSize16u || '') : '',
          teamSize17u: formData.age17u ? (formData.teamSize17u || '') : '',
          borderingStates: formData.borderingStates || [],
        })
      }

      if (isEditMode) {
        await onEdit(programData)
      } else {
        await onAdd(programData)
      }

      // Sync ranking to ranking history if set/changed
      const rankingChanged = isEditMode
        ? (formData.ranking !== editProgram.ranking || formData.stateRanking !== editProgram.stateRanking)
        : (formData.ranking || formData.stateRanking)

      if (rankingChanged && (formData.ranking || formData.stateRanking)) {
        try {
          await addRankingMetric(sport, programData.id, {
            nationalRank: formData.ranking || null,
            stateRank: formData.stateRanking || null,
            date: new Date().toISOString().split('T')[0],
            addedBy: user?.email || 'system',
            timestamp: Date.now(),
            source: 'program-edit'
          })
        } catch (rankErr) {
          console.error('Error syncing ranking to history:', rankErr)
        }
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
          {/* School lookup — outside any form-group so dropdown isn't clipped */}
          {!isEditMode && (
            <div className="school-lookup">
              <label className="school-lookup-label">Auto-fill from School Name</label>
              <div className="school-lookup-row">
                <input
                  type="text"
                  className="school-lookup-input"
                  placeholder="e.g. Modesto Christian, CA"
                  value={schoolQuery}
                  onChange={e => {
                    setSchoolQuery(e.target.value)
                    searchSchool(e.target.value)
                  }}
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
                onChange={handleStateChange}
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
              <label htmlFor="region">Region * {formData.state && formData.region && <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--text-muted)' }}>(auto-detected)</span>}</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
              >
                <option value="">Select Region</option>
                {REGION_LIST.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {sport !== '3ssb' && (
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
            )}
          </div>

          <div className="form-group">
            <label htmlFor="headCoach">{sport === '3ssb' ? 'Program Director *' : 'Head Coach'}</label>
            <input
              type="text"
              id="headCoach"
              name={sport === '3ssb' ? 'programDirector' : 'headCoach'}
              value={sport === '3ssb' ? formData.programDirector : formData.headCoach}
              onChange={handleInputChange}
              placeholder={sport === '3ssb' ? 'e.g., John Smith' : placeholders.coach}
            />
          </div>

          {sport !== '3ssb' && (
            <>
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
            </>
          )}

          {sport !== '3ssb' && (sport === 'football' ? (
            <div className="form-group">
              <label>Program Tier</label>
              <div className="football-tier-toggle">
                <button
                  type="button"
                  className={`tier-btn tier-btn--mahomes${formData.level === 'Mahomes' ? ' active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, level: 'Mahomes' }))}
                >
                  <span className="tier-btn-label">MAHOMES</span>
                  <span className="tier-btn-sub">Tier 1 · Top programs</span>
                </button>
                <button
                  type="button"
                  className={`tier-btn tier-btn--sterling${formData.level === 'Gold' ? ' active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, level: 'Gold' }))}
                >
                  <span className="tier-btn-label">STERLING</span>
                  <span className="tier-btn-sub">Tier 2 · Gold programs</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="level">Program Level</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
              >
                <option value="">Select Level</option>
                {PROGRAM_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          ))}

          {sport === '3ssb' && (
            <>
              <div className="form-group">
                <label>Division</label>
                <div className="ssb3-division-checks">
                  {SSB3_DIVISIONS.map(div => (
                    <label key={div} className="ssb3-check-label">
                      <input
                        type="checkbox"
                        checked={formData.ssb3Divisions.includes(div)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...formData.ssb3Divisions, div]
                            : formData.ssb3Divisions.filter(d => d !== div)
                          setFormData(prev => ({ ...prev, ssb3Divisions: next }))
                        }}
                      />
                      {div}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Age Divisions Offered *</label>
                <div className="ssb3-age-checks">
                  {SSB3_AGE_GROUPS.map(age => {
                    const key = `age${age.replace('u','u')}`
                    return (
                      <label key={age} className={`ssb3-age-chip${formData[key] ? ' ssb3-age-chip--on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={formData[key] || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                          style={{ display: 'none' }}
                        />
                        {age}
                      </label>
                    )
                  })}
                </div>
              </div>

              {(formData.age15u || formData.age16u || formData.age17u) && (
                <div className="form-group">
                  <label>Roster Sizes (by age group)</label>
                  <div className="ssb3-sizes-row">
                    {formData.age15u && (
                      <div className="ssb3-size-field ssb3-size-field--15u">
                        <span className="ssb3-size-label">15u</span>
                        <input
                          type="number"
                          name="teamSize15u"
                          value={formData.teamSize15u}
                          onChange={handleInputChange}
                          placeholder="e.g. 12"
                          min="1"
                        />
                      </div>
                    )}
                    {formData.age16u && (
                      <div className="ssb3-size-field ssb3-size-field--16u">
                        <span className="ssb3-size-label">16u</span>
                        <input
                          type="number"
                          name="teamSize16u"
                          value={formData.teamSize16u}
                          onChange={handleInputChange}
                          placeholder="e.g. 10"
                          min="1"
                        />
                      </div>
                    )}
                    {formData.age17u && (
                      <div className="ssb3-size-field ssb3-size-field--17u">
                        <span className="ssb3-size-label">17u</span>
                        <input
                          type="number"
                          name="teamSize17u"
                          value={formData.teamSize17u}
                          onChange={handleInputChange}
                          placeholder="e.g. 10"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>
                  Bordering States
                  {formData.state && <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>(auto-populated from state)</span>}
                </label>
                <div className="ssb3-bordering-states">
                  {US_STATES.filter(s => (BORDERING_STATES[formData.state] || []).includes(s.abbr)).map(s => (
                    <label key={s.abbr} className={`ssb3-state-chip${formData.borderingStates.includes(s.abbr) ? ' ssb3-state-chip--on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={formData.borderingStates.includes(s.abbr)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...formData.borderingStates, s.abbr]
                            : formData.borderingStates.filter(a => a !== s.abbr)
                          setFormData(prev => ({ ...prev, borderingStates: next }))
                        }}
                        style={{ display: 'none' }}
                      />
                      {s.abbr}
                    </label>
                  ))}
                  {(!formData.state || !(BORDERING_STATES[formData.state] || []).length) && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select a state above to see bordering states</span>
                  )}
                </div>
              </div>
            </>
          )}

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

          {sport !== '3ssb' && (
            <>
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
                    name="onboarding2027"
                    checked={formData.onboarding2027}
                    onChange={(e) => setFormData(prev => ({ ...prev, onboarding2027: e.target.checked }))}
                  />
                  Onboarding 2027
                </label>
                <span className="checkbox-hint">Mark if this program is being onboarded in 2027</span>
              </div>
            </>
          )}

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

          {sport !== '3ssb' && (
            <>
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
            </>
          )}

          <div className="form-group">
            <label htmlFor="adiCustomUrl">adiCustom Uniform URL</label>
            <input
              type="url"
              id="adiCustomUrl"
              name="adiCustomUrl"
              value={formData.adiCustomUrl}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="brandGuideUrl">Brand Guidelines URL</label>
            <input
              type="url"
              id="brandGuideUrl"
              name="brandGuideUrl"
              value={formData.brandGuideUrl}
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
