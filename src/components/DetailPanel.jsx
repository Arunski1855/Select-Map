import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from 'react'
import jsPDF from 'jspdf'
import {
  addNote,
  deleteNote,
  subscribeToNotes,
  addScheduleEntry,
  deleteScheduleEntry,
  subscribeToSchedule,
  addSocialMetric,
  subscribeToSocialMetrics,
  deleteSocialMetric,
  subscribeToLinkedEvents
} from '../firebase'

// Error boundary to prevent white-screen crashes
class DetailPanelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('DetailPanel crash:', error, info)
  }
  componentDidUpdate(prevProps) {
    if (prevProps.programId !== this.props.programId) {
      this.setState({ hasError: false, error: null })
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="detail-panel open" style={{ padding: 20 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Something went wrong loading this program.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); this.props.onClose?.() }}
            style={{ marginTop: 10, padding: '6px 16px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Region definitions with colors
const REGIONS = {
  'Canada': { color: '#d4002a' },
  'Mid Atlantic': { color: '#005eb8' },
  'South': { color: '#ff6b00' },
  'Midwest': { color: '#7d2d8e' },
  'West': { color: '#00a550' }
}

const LEVEL_COLORS = {
  'Gold': '#c9a84c',
  'Silver': '#8a8d8f',
  'Bronze': '#a0714f',
  'Regional': '#005eb8'
}

function formatPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

function DetailPanel({ program: initialProgram, mtZionPrograms, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete }) {
  const [activeDetailTab, setActiveDetailTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [schedule, setSchedule] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newGame, setNewGame] = useState({ date: '', opponent: '', result: '', score: '' })
  const [noteLoading, setNoteLoading] = useState(false)

  // Mt. Zion Prep/National toggle
  const [mtZionActiveIdx, setMtZionActiveIdx] = useState(0)
  const hasMtZionToggle = mtZionPrograms && mtZionPrograms.length > 1
  const program = hasMtZionToggle ? mtZionPrograms[mtZionActiveIdx] : initialProgram

  // Reset toggle when a different program is selected
  useEffect(() => {
    setMtZionActiveIdx(0)
  }, [initialProgram?.id])

  // Social metrics state
  const [socialMetrics, setSocialMetrics] = useState([])
  const [newFollowerCount, setNewFollowerCount] = useState('')
  const [metricLoading, setMetricLoading] = useState(false)

  // Linked events state
  const [linkedEvents, setLinkedEvents] = useState([])

  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!program?.id || !sport || sport === 'events') return
    const unsub1 = subscribeToNotes(sport, program.id, setNotes)
    const unsub2 = subscribeToSchedule(sport, program.id, setSchedule)
    const unsub3 = subscribeToSocialMetrics(sport, program.id, setSocialMetrics)
    const unsub4 = subscribeToLinkedEvents(program.id, setLinkedEvents)
    return () => { unsub1(); unsub2(); unsub3(); unsub4() }
  }, [program?.id, sport])

  useEffect(() => {
    setActiveDetailTab('info')
    setSheetHeight(null)
    setNotes([])
    setSchedule([])
    setSocialMetrics([])
    setNewFollowerCount('')
    setLinkedEvents([])
  }, [program?.id])

  useEffect(() => {
    if (!isOpen) setSheetHeight(null)
  }, [isOpen])

  // Touch drag handlers for mobile bottom sheet
  const handleDragStart = useCallback((e) => {
    if (window.innerWidth > 768) return
    const touch = e.touches?.[0] || e
    dragStartY.current = touch.clientY
    dragStartHeight.current = panelRef.current?.offsetHeight || window.innerHeight * 0.4
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    const touch = e.touches?.[0] || e
    const deltaY = dragStartY.current - touch.clientY
    const newHeight = Math.min(
      Math.max(dragStartHeight.current + deltaY, 120),
      window.innerHeight * 0.85
    )
    setSheetHeight(newHeight)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const currentHeight = panelRef.current?.offsetHeight || 0
    const viewHeight = window.innerHeight

    if (currentHeight < viewHeight * 0.15) {
      onClose()
    } else if (currentHeight < viewHeight * 0.55) {
      setSheetHeight(viewHeight * 0.4)
    } else {
      setSheetHeight(viewHeight * 0.75)
    }
  }, [isDragging, onClose])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e) => handleDragMove(e)
    const onEnd = () => handleDragEnd()
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  if (!isOpen || !program) return null

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || !user) return
    setNoteLoading(true)
    try {
      await addNote(sport, program.id, {
        text: newNote.trim(),
        author: user.email,
        timestamp: Date.now()
      })
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
    } finally {
      setNoteLoading(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(sport, program.id, noteId)
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  const handleAddMetric = async (e) => {
    e.preventDefault()
    const count = parseInt(newFollowerCount, 10)
    if (!count || count < 0 || !user) return
    setMetricLoading(true)
    try {
      await addSocialMetric(sport, program.id, {
        platform: 'instagram',
        followers: count,
        date: new Date().toISOString().split('T')[0],
        addedBy: user.email,
        timestamp: Date.now()
      })
      setNewFollowerCount('')
    } catch (err) {
      console.error('Error adding metric:', err)
    } finally {
      setMetricLoading(false)
    }
  }

  const handleDeleteMetric = async (metricId) => {
    try {
      await deleteSocialMetric(sport, program.id, metricId)
    } catch (err) {
      console.error('Error deleting metric:', err)
    }
  }

  // Compute chart data for Instagram follower growth
  const igMetrics = useMemo(() => socialMetrics.filter(m => m.platform === 'instagram'), [socialMetrics])

  const regionColor = REGIONS[program.region]?.color || '#333'
  const levelColor = LEVEL_COLORS[program.level] || null

  const sheetStyle = sheetHeight ? {
    height: `${sheetHeight}px`,
    maxHeight: `${sheetHeight}px`,
    transition: isDragging ? 'none' : undefined
  } : {}

  const tabs = ['info', 'contact', 'schedule', 'notes']

  // Helper to load image and convert to data URL for PDF
  const loadImageAsDataUrl = (url) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  // Generate individual program PDF report
  const handleExportProgramPDF = useCallback(async () => {
    try {
      const doc = new jsPDF()
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const sportName = sport === 'football' ? 'Select Football' : 'Select Basketball'
      let yPos = 20

      // Helper to add new page if needed
      const checkPage = (height = 10) => {
        if (yPos + height > 270) {
          doc.addPage()
          yPos = 20
        }
      }

      // Add team logo if available
      if (program.logo) {
        try {
          const logoDataUrl = await loadImageAsDataUrl(program.logo)
          if (logoDataUrl) {
            doc.addImage(logoDataUrl, 'PNG', 165, 12, 30, 30)
          }
        } catch (e) {
          console.warn('Could not load logo for PDF:', e)
        }
      }

      // Header with program name
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text(program.name, 14, yPos)
      yPos += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`${program.city}, ${program.state}`, 14, yPos)
      yPos += 6

      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`adidas ${sportName} | ${program.region} Region`, 14, yPos)
      yPos += 4
      doc.text(`Report Generated: ${today}`, 14, yPos)
      doc.setTextColor(0)
      yPos += 12

      // Program Details Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Program Details', 14, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const details = [
        ['Level', program.level],
        ['Gender', program.gender],
        ['Conference', program.conference],
        ['Head Coach', program.headCoach],
        ['Ranking', program.ranking],
        ['Team Type', program.teamType]
      ].filter(([, val]) => val)

      details.forEach(([label, value]) => {
        checkPage()
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 14, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 50, yPos)
        yPos += 6
      })
      yPos += 6

      // Contact Information
      if (program.contactEmail || program.contactPhone || program.headCoach) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Contact Information', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        if (program.contactEmail) {
          doc.text(`Email: ${program.contactEmail}`, 14, yPos)
          yPos += 6
        }
        if (program.contactPhone) {
          doc.text(`Phone: ${program.contactPhone}`, 14, yPos)
          yPos += 6
        }
        yPos += 6
      }

      // Social Media
      if (program.twitter || program.instagram) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Social Media', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        if (program.twitter) {
          const twitterHandle = program.twitter.replace(/^@+/, '')
          doc.text(`Twitter: @${twitterHandle}`, 14, yPos)
          yPos += 6
        }
        if (program.instagram) {
          const instagramHandle = program.instagram.replace(/^@+/, '')
          doc.text(`Instagram: @${instagramHandle}`, 14, yPos)
          yPos += 6
        }
        yPos += 6
      }

      // Linked Events
      if (linkedEvents.length > 0) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Upcoming Events (${linkedEvents.length})`, 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        linkedEvents.forEach((event) => {
          checkPage(8)
          const eventDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          doc.setFont('helvetica', 'normal')
          doc.text(`• ${eventDate} - ${event.name} (${event.city}, ${event.state})`, 14, yPos)
          yPos += 6
        })
        yPos += 4
      }

      // Top Prospects
      if (program.topProspects) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Top Prospects', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const prospects = doc.splitTextToSize(program.topProspects, 180)
        prospects.forEach((line) => {
          checkPage()
          doc.text(line, 14, yPos)
          yPos += 5
        })
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`adidas ${sportName} - ${program.name}`, 14, 285)
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' })
      }

      // Save the PDF
      const filename = `${program.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        const pdfBlob = doc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        alert('PDF ready! Check your Downloads.')
      } else {
        doc.save(filename)
      }
    } catch (err) {
      console.error('PDF export error:', err)
      alert(`Could not generate PDF: ${err.message || 'Unknown error'}`)
    }
  }, [program, sport, mentions, linkedEvents])

  return (
    <div
      ref={panelRef}
      className={`detail-panel ${isOpen ? 'open' : ''} ${isDragging ? 'dragging' : ''}`}
      style={sheetStyle}
    >
      {/* Banner area */}
      <div className="detail-panel-banner" style={{ background: regionColor }}>
        <span className="detail-panel-banner-text">{sport === 'football' ? 'Select Football' : 'Select Basketball'}</span>
      </div>

      {/* Drag handle for mobile */}
      <div
        className="detail-panel-handle"
        onTouchStart={handleDragStart}
        onMouseDown={handleDragStart}
      >
        <div className="detail-panel-handle-bar" />
      </div>

      <div className="detail-panel-profile">
        <div className="detail-panel-logo">
          <img src={program.logo} alt={program.name} />
        </div>
        <div className="detail-panel-title">
          <h2>{program.name}</h2>
          <p>{program.city}, {program.state}</p>
          <div className="detail-badges-row">
            <span className="detail-region-badge" style={{ background: regionColor }}>{program.region}</span>
            {program.level && (
              <span className="detail-level-badge" style={{ background: levelColor || '#333' }}>{program.level}</span>
            )}
            {program.gender && program.gender !== 'Boys' && (
              <span className="detail-gender-badge">{program.gender}</span>
            )}
            {program.teamType && (
              <span className="detail-gender-badge" style={{ background: '#1a5c2e' }}>{program.teamType}</span>
            )}
            {program.onboarding2026 && (
              <span className="detail-onboarding-badge">2026</span>
            )}
          </div>
        </div>
        <button className="detail-panel-close" onClick={onClose}>&times;</button>
      </div>

      {hasMtZionToggle && (
        <div className="mtzion-toggle">
          {mtZionPrograms.map((p, idx) => (
            <button
              key={p.id}
              className={`mtzion-toggle-btn ${mtZionActiveIdx === idx ? 'active' : ''}`}
              onClick={() => setMtZionActiveIdx(idx)}
            >
              {p.teamType || (idx === 0 ? 'Prep' : 'National')}
            </button>
          ))}
        </div>
      )}

      <div className="detail-panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeDetailTab === tab ? 'active' : ''}`}
            onClick={() => setActiveDetailTab(tab)}
          >
            {tab === 'info' ? 'Details' : tab === 'contact' ? 'Contact' : tab === 'schedule' ? 'Schedule' : `Notes (${notes.length})`}
          </button>
        ))}
      </div>

      <div className="detail-panel-content">
        {activeDetailTab === 'info' && (
          <div className="detail-info-tab">
            {(program.conference || program.headCoach || program.ranking || program.level) && (
              <div className="detail-section">
                {program.headCoach && (
                  <div className="detail-row"><span className="detail-label">Head Coach</span><span>{program.headCoach}</span></div>
                )}
                {program.conference && (
                  <div className="detail-row"><span className="detail-label">Conference</span><span>{program.conference}</span></div>
                )}
                {program.ranking && (
                  <div className="detail-row"><span className="detail-label">Ranking</span><span>{program.ranking}</span></div>
                )}
                {program.level && (
                  <div className="detail-row"><span className="detail-label">Level</span><span className="detail-level-value" style={{ color: levelColor || 'inherit' }}>{program.level}</span></div>
                )}
              </div>
            )}

            <div className="detail-links-section">
              {program.website && (
                <a href={program.website} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
                  Website
                </a>
              )}
              {program.roster && (
                <a href={program.roster} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
                  Roster
                </a>
              )}
              {program.maxprepsUrl && (
                <a href={program.maxprepsUrl} target="_blank" rel="noopener noreferrer" className="detail-link-btn detail-link-maxpreps">
                  MaxPreps
                </a>
              )}
              {program.tcaStoreUrl && (
                <a href={program.tcaStoreUrl} target="_blank" rel="noopener noreferrer" className="detail-link-btn detail-link-tca">
                  TCA Store
                </a>
              )}
              {program.brandGuide && (
                <a href={program.brandGuide} download={program.brandGuideName || 'brand-guidelines.pdf'} className="detail-link-btn detail-link-brand">
                  Brand Guidelines
                </a>
              )}
            </div>

            {program.gallery && (Array.isArray(program.gallery) ? program.gallery : Object.values(program.gallery)).length > 0 && (
              <div className="detail-gallery">
                <h4>Gallery</h4>
                <div className="detail-gallery-grid">
                  {(Array.isArray(program.gallery) ? program.gallery : Object.values(program.gallery)).map((img, idx) => (
                    <img key={idx} src={img} alt={`Gallery ${idx + 1}`} className="detail-gallery-img" />
                  ))}
                </div>
              </div>
            )}

            {program.topProspects && (
              <div className="detail-prospects">
                <span className="detail-label">Top Prospects</span>
                <p className="detail-prospects-text">{program.topProspects}</p>
              </div>
            )}

            <div className="detail-actions">
              {isUserAllowed && (
                <>
                  <button className="detail-edit-btn" onClick={() => onEdit(program)}>Edit Program</button>
                  <button className="detail-delete-btn" onClick={() => onDelete(program.id)}>Remove</button>
                </>
              )}
              <button className="detail-export-btn" onClick={handleExportProgramPDF}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                  <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                  <polyline points="12,2 12,6 16,6"/>
                </svg>
                Team Report
              </button>
            </div>
          </div>
        )}

        {activeDetailTab === 'contact' && (
          <div className="detail-contact-tab">
            {(program.contactEmail || program.contactPhone || program.headCoach) ? (
              <div className="detail-section">
                {program.headCoach && (
                  <div className="detail-row"><span className="detail-label">Head Coach</span><span>{program.headCoach}</span></div>
                )}
                {program.contactEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <a href={`mailto:${program.contactEmail}`} className="detail-contact-link">{program.contactEmail}</a>
                  </div>
                )}
                {program.contactPhone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    <a href={`tel:${program.contactPhone}`} className="detail-contact-link">{formatPhone(program.contactPhone)}</a>
                  </div>
                )}
              </div>
            ) : (
              <p className="detail-empty">No contact information added yet.</p>
            )}

            {(program.twitter || program.instagram) && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Social Media</h4>
                <div className="detail-social-links">
                  {program.twitter && (
                    <a
                      href={`https://twitter.com/${program.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-social-btn detail-social-twitter"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      {program.twitter}
                    </a>
                  )}
                  {program.instagram && (
                    <a
                      href={`https://instagram.com/${program.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-social-btn detail-social-instagram"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      {program.instagram}
                    </a>
                  )}
                </div>
              </div>
            )}

            {program.website && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Website</h4>
                <a href={program.website} target="_blank" rel="noopener noreferrer" className="detail-link-btn" style={{ display: 'inline-block' }}>
                  Visit Website
                </a>
              </div>
            )}

            {/* Instagram Follower Growth Tracking */}
            {program.instagram && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Instagram Growth</h4>

                {igMetrics.length >= 2 && (() => {
                  try {
                  const minF = Math.min(...igMetrics.map(m => m.followers || 0))
                  const maxF = Math.max(...igMetrics.map(m => m.followers || 0))
                  const range = maxF - minF || 1
                  const chartW = 280
                  const chartH = 100
                  const padL = 0
                  const padR = 0
                  const padT = 8
                  const padB = 20
                  const plotW = chartW - padL - padR
                  const plotH = chartH - padT - padB
                  const points = igMetrics.map((m, i) => {
                    const x = padL + (i / (igMetrics.length - 1)) * plotW
                    const y = padT + plotH - ((m.followers - minF) / range) * plotH
                    return { x, y, ...m }
                  })
                  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
                  const areaPath = `M${points[0].x},${padT + plotH} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padT + plotH} Z`
                  const first = igMetrics[0].followers
                  const last = igMetrics[igMetrics.length - 1].followers
                  const growth = last - first
                  const growthPct = first > 0 ? ((growth / first) * 100).toFixed(1) : 0

                  return (
                    <div className="ig-growth-chart">
                      <div className="ig-growth-summary">
                        <span className="ig-growth-current">{last.toLocaleString()}</span>
                        <span className={`ig-growth-delta ${growth >= 0 ? 'positive' : 'negative'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toLocaleString()} ({growthPct}%)
                        </span>
                      </div>
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="ig-growth-svg">
                        <defs>
                          <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E1306C" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#E1306C" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#igGrad)" />
                        <polyline points={polyline} fill="none" stroke="#E1306C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#E1306C" stroke="#fff" strokeWidth="1.5" />
                        ))}
                        {/* X-axis labels */}
                        {points.filter((_, i) => i === 0 || i === points.length - 1 || igMetrics.length <= 6).map((p, i) => (
                          <text key={i} x={p.x} y={chartH - 2} textAnchor="middle" fontSize="7" fill="var(--text-muted)">{new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
                        ))}
                      </svg>
                    </div>
                  )
                  } catch (e) { console.error('Chart render error:', e); return null }
                })()}

                {igMetrics.length === 1 && (
                  <div className="ig-growth-single">
                    <span className="ig-growth-current">{igMetrics[0].followers.toLocaleString()}</span>
                    <span className="ig-growth-date">as of {new Date(igMetrics[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {igMetrics.length === 0 && (
                  <p className="detail-empty" style={{ marginBottom: 8 }}>No follower data recorded yet.</p>
                )}

                {/* Snapshot history */}
                {igMetrics.length > 0 && (
                  <div className="ig-history">
                    {igMetrics.slice().reverse().slice(0, 5).map(m => (
                      <div key={m.id} className="ig-history-row">
                        <span className="ig-history-date">{new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="ig-history-count">{m.followers.toLocaleString()}</span>
                        {isUserAllowed && (
                          <button className="ig-history-delete" onClick={() => handleDeleteMetric(m.id)}>&times;</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add snapshot form */}
                {isUserAllowed && (
                  <form className="ig-snapshot-form" onSubmit={handleAddMetric}>
                    <input
                      type="number"
                      value={newFollowerCount}
                      onChange={e => setNewFollowerCount(e.target.value)}
                      placeholder="Current follower count"
                      min="0"
                      className="ig-snapshot-input"
                    />
                    <button type="submit" disabled={metricLoading || !newFollowerCount} className="ig-snapshot-btn">
                      {metricLoading ? '...' : 'Log'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'schedule' && (
          <div className="detail-schedule-tab">
            {program.maxprepsUrl ? (
              <a href={program.maxprepsUrl} target="_blank" rel="noopener noreferrer" className="maxpreps-banner">
                View full schedule & results on MaxPreps &rarr;
              </a>
            ) : (
              <p className="detail-empty">No MaxPreps link added yet.</p>
            )}

            {/* Linked Events Section */}
            {linkedEvents.length > 0 && (
              <div className="linked-events-section">
                <h4 className="detail-section-heading">Linked Events</h4>
                <div className="linked-events-list">
                  {linkedEvents.map(event => (
                    <div key={event.id} className="linked-event-item">
                      <span className="linked-event-date">
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="linked-event-name">{event.name}</span>
                      <span className="linked-event-location">{event.city}, {event.state}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'notes' && (
          <div className="detail-notes-tab">
            {!isUserAllowed ? (
              <p className="detail-empty">Sign in to view internal notes.</p>
            ) : (
              <>
                <form className="add-note-form" onSubmit={handleAddNote}>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={3}
                  />
                  <button type="submit" disabled={noteLoading || !newNote.trim()}>
                    {noteLoading ? 'Adding...' : 'Add Note'}
                  </button>
                </form>

                {notes.length === 0 ? (
                  <p className="detail-empty">No notes yet.</p>
                ) : (
                  <div className="notes-list">
                    {notes.map(note => (
                      <div key={note.id} className="note-item">
                        <div className="note-header">
                          <span className="note-author">{note.author}</span>
                          <span className="note-time">{new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <p className="note-text">{note.text}</p>
                        <button className="note-delete" onClick={() => handleDeleteNote(note.id)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailPanelWithBoundary(props) {
  return (
    <DetailPanelErrorBoundary programId={props.program?.id} onClose={props.onClose}>
      <DetailPanel {...props} />
    </DetailPanelErrorBoundary>
  )
}

export default DetailPanelWithBoundary
