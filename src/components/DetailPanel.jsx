import { useState, useEffect, useRef, useCallback } from 'react'
import {
  addNote,
  deleteNote,
  subscribeToNotes,
  addScheduleEntry,
  deleteScheduleEntry,
  subscribeToSchedule
} from '../firebase'

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

function DetailPanel({ program, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete }) {
  const [activeDetailTab, setActiveDetailTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [schedule, setSchedule] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newGame, setNewGame] = useState({ date: '', opponent: '', result: '', score: '' })
  const [noteLoading, setNoteLoading] = useState(false)

  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!program || !sport) return
    const unsub1 = subscribeToNotes(sport, program.id, setNotes)
    const unsub2 = subscribeToSchedule(sport, program.id, setSchedule)
    return () => { unsub1(); unsub2() }
  }, [program, sport])

  useEffect(() => {
    setActiveDetailTab('info')
    setSheetHeight(null)
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

  const regionColor = REGIONS[program.region]?.color || '#333'
  const levelColor = LEVEL_COLORS[program.level] || null

  const sheetStyle = sheetHeight ? {
    height: `${sheetHeight}px`,
    maxHeight: `${sheetHeight}px`,
    transition: isDragging ? 'none' : undefined
  } : {}

  const tabs = ['info', 'contact', 'schedule', 'notes']

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
          </div>
        </div>
        <button className="detail-panel-close" onClick={onClose}>&times;</button>
      </div>

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

            {program.gallery && program.gallery.length > 0 && (
              <div className="detail-gallery">
                <h4>Gallery</h4>
                <div className="detail-gallery-grid">
                  {program.gallery.map((img, idx) => (
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

            {isUserAllowed && (
              <div className="detail-actions">
                <button className="detail-edit-btn" onClick={() => onEdit(program)}>Edit Program</button>
                <button className="detail-delete-btn" onClick={() => onDelete(program.id)}>Remove</button>
              </div>
            )}
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

export default DetailPanel
