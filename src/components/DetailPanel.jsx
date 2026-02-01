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

function DetailPanel({ program, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete }) {
  const [activeDetailTab, setActiveDetailTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [schedule, setSchedule] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newGame, setNewGame] = useState({ date: '', opponent: '', result: '', score: '' })
  const [noteLoading, setNoteLoading] = useState(false)

  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(null) // null = use CSS default
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
    setSheetHeight(null) // Reset height when program changes
  }, [program?.id])

  // Reset sheet height when panel closes
  useEffect(() => {
    if (!isOpen) setSheetHeight(null)
  }, [isOpen])

  // Touch drag handlers for mobile bottom sheet
  const handleDragStart = useCallback((e) => {
    // Only enable drag on mobile
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

    // Snap points: close if < 15%, small (40%), expanded (75%)
    if (currentHeight < viewHeight * 0.15) {
      onClose()
    } else if (currentHeight < viewHeight * 0.55) {
      setSheetHeight(viewHeight * 0.4)
    } else {
      setSheetHeight(viewHeight * 0.75)
    }
  }, [isDragging, onClose])

  // Attach move/end listeners to window during drag
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

  const sheetStyle = sheetHeight ? {
    height: `${sheetHeight}px`,
    maxHeight: `${sheetHeight}px`,
    transition: isDragging ? 'none' : undefined
  } : {}

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
          <span className="detail-region-badge" style={{ background: regionColor }}>{program.region}</span>
        </div>
        <button className="detail-panel-close" onClick={onClose}>&times;</button>
      </div>

      <div className="detail-panel-tabs">
        {['info', 'schedule', 'notes'].map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeDetailTab === tab ? 'active' : ''}`}
            onClick={() => setActiveDetailTab(tab)}
          >
            {tab === 'info' ? 'Details' : tab === 'schedule' ? 'Schedule' : `Notes (${notes.length})`}
          </button>
        ))}
      </div>

      <div className="detail-panel-content">
        {activeDetailTab === 'info' && (
          <div className="detail-info-tab">
            {(program.conference || program.headCoach || program.ranking) && (
              <div className="detail-section">
                {program.conference && (
                  <div className="detail-row"><span className="detail-label">Conference</span><span>{program.conference}</span></div>
                )}
                {program.headCoach && (
                  <div className="detail-row"><span className="detail-label">Head Coach</span><span>{program.headCoach}</span></div>
                )}
                {program.ranking && (
                  <div className="detail-row"><span className="detail-label">Ranking</span><span>{program.ranking}</span></div>
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
