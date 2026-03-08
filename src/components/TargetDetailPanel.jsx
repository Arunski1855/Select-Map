import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  addTargetNote,
  subscribeToTargetNotes,
  deleteTargetNote,
  addTargetRankingMetric,
  subscribeToTargetRankingMetrics,
  deleteTargetRankingMetric
} from '../firebase'
import './TargetDetailPanel.css'

const PIPELINE_STATUSES = [
  { id: 'identified',    label: 'Identified',    color: '#6b7280' },
  { id: 'contacted',     label: 'Contacted',     color: '#3b82f6' },
  { id: 'in_discussion', label: 'In Discussion', color: '#8b5cf6' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: '#f59e0b' },
  { id: 'negotiating',   label: 'Negotiating',   color: '#ec4899' },
  { id: 'signed',        label: 'Signed',        color: '#10b981' },
  { id: 'lost',          label: 'Lost',          color: '#ef4444' },
]

const PRIORITIES = [
  { id: 'high',   label: 'High Priority', color: '#ef4444' },
  { id: 'medium', label: 'Medium',        color: '#f59e0b' },
  { id: 'low',    label: 'Low',           color: '#6b7280' },
]

const REGIONS = {
  'Canada':      '#d4002a',
  'Mid Atlantic':'#005eb8',
  'South':       '#ff6b00',
  'Midwest':     '#7d2d8e',
  'North':       '#1a9fc9',
  'West':        '#00a550',
}

function formatPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === '1') return `${digits.slice(1,4)}-${digits.slice(4,7)}-${digits.slice(7)}`
  return phone
}

function TargetDetailPanel({ target, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete, onStatusChange }) {
  const [activeTab, setActiveTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [rankingMetrics, setRankingMetrics] = useState([])
  const [newRanking, setNewRanking] = useState('')
  const [rankingLoading, setRankingLoading] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!target?.id || !sport) return
    const unsub = subscribeToTargetNotes(sport, target.id, setNotes)
    return () => unsub()
  }, [target?.id, sport])

  useEffect(() => {
    if (!target?.id || !sport) return
    const unsub = subscribeToTargetRankingMetrics(sport, target.id, setRankingMetrics)
    return () => unsub()
  }, [target?.id, sport])

  useEffect(() => {
    setActiveTab('info')
    setSheetHeight(null)
    setNotes([])
    setNewNote('')
    setRankingMetrics([])
    setNewRanking('')
  }, [target?.id])

  useEffect(() => {
    if (!isOpen) setSheetHeight(null)
  }, [isOpen])

  const handleDragStart = useCallback((e) => {
    if (window.innerWidth > 768) return
    const touch = e.touches?.[0] || e
    dragStartY.current = touch.clientY
    dragStartHeight.current = panelRef.current?.offsetHeight || window.innerHeight * 0.45
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    const touch = e.touches?.[0] || e
    const deltaY = dragStartY.current - touch.clientY
    const newHeight = Math.min(Math.max(dragStartHeight.current + deltaY, 120), window.innerHeight * 0.9)
    setSheetHeight(newHeight)
  }, [isDragging])

  const handleDragEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove)
      document.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const handleAddNote = async () => {
    if (!newNote.trim() || !target?.id || !user) return
    setNoteLoading(true)
    try {
      await addTargetNote(sport, target.id, { text: newNote.trim(), author: user.email, timestamp: Date.now() })
      setNewNote('')
    } catch (err) { console.error(err) }
    setNoteLoading(false)
  }

  const handleDeleteNote = async (noteId) => {
    if (!target?.id || !window.confirm('Delete this note?')) return
    try { await deleteTargetNote(sport, target.id, noteId) } catch (err) { console.error(err) }
  }

  const handleAddRanking = async () => {
    if (!newRanking.trim() || !target?.id || !user) return
    setRankingLoading(true)
    try {
      await addTargetRankingMetric(sport, target.id, {
        ranking: newRanking.trim(),
        date: new Date().toISOString().split('T')[0],
        addedBy: user.email,
        timestamp: Date.now()
      })
      setNewRanking('')
    } catch (err) { console.error(err) }
    setRankingLoading(false)
  }

  const handleDeleteRanking = async (metricId) => {
    if (!target?.id || !window.confirm('Delete this ranking entry?')) return
    try { await deleteTargetRankingMetric(sport, target.id, metricId) } catch (err) { console.error(err) }
  }

  const rankingHistory = useMemo(
    () => [...rankingMetrics].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [rankingMetrics]
  )
  const latestRanking = rankingHistory.length > 0 ? rankingHistory[0].ranking : target?.ranking

  if (!target) return null

  const statusInfo = PIPELINE_STATUSES.find(s => s.id === target.status) || PIPELINE_STATUSES[0]
  const priorityInfo = PRIORITIES.find(p => p.id === target.priority) || PRIORITIES[1]
  const regionColor = REGIONS[target.region] || '#666666'

  const panelStyle = sheetHeight ? { height: sheetHeight } : {}

  return (
    <div
      className={`target-detail-panel ${isOpen ? 'open' : ''}`}
      ref={panelRef}
      style={panelStyle}
    >
      {/* Mobile drag handle */}
      <div className="tdp-drag-handle" onTouchStart={handleDragStart} onMouseDown={handleDragStart}>
        <div className="tdp-drag-indicator" />
      </div>

      {/* Header */}
      <div className="tdp-header" style={{ borderLeftColor: statusInfo.color }}>
        <div className="tdp-header-top">
          {/* Logo */}
          {target.logo ? (
            <div className="tdp-logo">
              <img src={target.logo} alt="" />
            </div>
          ) : null}

          {/* Name + location */}
          <div className="tdp-header-info">
            <h3 className="tdp-name">{target.name}</h3>
            {(target.city || target.state) && (
              <p className="tdp-location">{[target.city, target.state].filter(Boolean).join(', ')}</p>
            )}
          </div>

          {/* Close button */}
          <button className="tdp-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* Badges */}
        <div className="tdp-badges">
          <span className="tdp-badge" style={{ backgroundColor: statusInfo.color }}>
            {statusInfo.label}
          </span>
          <span className="tdp-badge" style={{ backgroundColor: priorityInfo.color }}>
            {priorityInfo.label}
          </span>
          {target.region && (
            <span className="tdp-badge" style={{ backgroundColor: regionColor }}>
              {target.region}
            </span>
          )}
        </div>

        {/* Quick status select */}
        {isUserAllowed && onStatusChange && (
          <div className="tdp-status-row">
            <select
              className="tdp-status-select"
              value={target.status}
              onChange={(e) => onStatusChange(target.id, e.target.value)}
            >
              {PIPELINE_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tdp-tabs">
        {['info', 'vitals', 'intel', 'activity'].map(tab => (
          <button
            key={tab}
            className={`tdp-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'info' ? 'Details' : tab === 'vitals' ? 'Vitals' : tab === 'intel' ? 'Intel' : 'Activity'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tdp-content">

        {/* ── Details Tab ── */}
        {activeTab === 'info' && (
          <div className="tdp-tab-pane">
            {target.gender && <Row label="Gender" value={target.gender} />}
            {target.conference && <Row label="Conference" value={target.conference} />}
            {target.ranking && <Row label="Ranking" value={target.ranking} />}
            {target.level && <Row label="Target Level" value={target.level} />}
            {target.targetSignDate && (
              <Row label="Target Sign Date" value={
                new Date(target.targetSignDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              } />
            )}
            {target.topProspects && <Row label="Top Prospects" value={target.topProspects} multiline />}
            {target.website && (
              <div className="tdp-row">
                <span className="tdp-label">Website</span>
                <a href={target.website} target="_blank" rel="noopener noreferrer" className="tdp-link">Visit Site</a>
              </div>
            )}
            {isUserAllowed && (
              <div className="tdp-actions">
                <button className="tdp-edit-btn" onClick={() => onEdit(target)}>Edit</button>
                <button className="tdp-delete-btn" onClick={() => onDelete(target.id)}>Delete</button>
              </div>
            )}
          </div>
        )}

        {/* ── Vitals Tab ── */}
        {activeTab === 'vitals' && (
          <div className="tdp-tab-pane">
            {target.headCoach && <Row label="Head Coach" value={target.headCoach} />}
            {target.contactEmail && (
              <div className="tdp-row">
                <span className="tdp-label">Email</span>
                <a href={`mailto:${target.contactEmail}`} className="tdp-link">{target.contactEmail}</a>
              </div>
            )}
            {target.contactPhone && (
              <div className="tdp-row">
                <span className="tdp-label">Phone</span>
                <a href={`tel:${target.contactPhone}`} className="tdp-link">{formatPhone(target.contactPhone)}</a>
              </div>
            )}
            {target.twitter && (
              <div className="tdp-row">
                <span className="tdp-label">Twitter/X</span>
                <a href={`https://twitter.com/${target.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="tdp-link">{target.twitter}</a>
              </div>
            )}
            {target.instagram && (
              <div className="tdp-row">
                <span className="tdp-label">Instagram</span>
                <a href={`https://instagram.com/${target.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="tdp-link">{target.instagram}</a>
              </div>
            )}
            {!target.headCoach && !target.contactEmail && !target.contactPhone && !target.twitter && !target.instagram && (
              <p className="tdp-empty">No contact information available.</p>
            )}

            {/* Ranking History */}
            {isUserAllowed && (
              <div className="tdp-ranking-section">
                <h4 className="tdp-ranking-title">Ranking History</h4>
                <div className="tdp-ranking-current">
                  <span className="tdp-ranking-current-label">Current:</span>
                  <span className="tdp-ranking-current-value">{latestRanking || '—'}</span>
                </div>
                <div className="tdp-ranking-form">
                  <input
                    type="text"
                    className="tdp-ranking-input"
                    value={newRanking}
                    onChange={(e) => setNewRanking(e.target.value)}
                    placeholder="e.g. #5 National"
                  />
                  <button
                    className="tdp-ranking-add-btn"
                    onClick={handleAddRanking}
                    disabled={rankingLoading || !newRanking.trim()}
                  >
                    {rankingLoading ? '...' : 'Add'}
                  </button>
                </div>
                {rankingHistory.length > 0 ? (
                  <div className="tdp-ranking-list">
                    {rankingHistory.slice(0, 10).map(m => (
                      <div key={m.id} className="tdp-ranking-item">
                        <div className="tdp-ranking-info">
                          <span className="tdp-ranking-value">{m.ranking}</span>
                          <span className="tdp-ranking-date">
                            {new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <button className="tdp-ranking-delete" onClick={() => handleDeleteRanking(m.id)}>&times;</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tdp-empty">No ranking history yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Intel Tab ── */}
        {activeTab === 'intel' && (
          <div className="tdp-tab-pane">
            {target.competition && <Row label="Current Competition" value={target.competition} />}
            {target.competitionDetails && <Row label="Competition Details" value={target.competitionDetails} multiline />}
            {target.strengths && <Row label="Strengths / Why Target" value={target.strengths} multiline />}
            {target.notes && <Row label="Notes" value={target.notes} multiline />}
            {!target.competition && !target.competitionDetails && !target.strengths && !target.notes && (
              <p className="tdp-empty">No intel available.</p>
            )}
            {target.addedBy && (
              <div className="tdp-meta">
                <p className="tdp-meta-text">
                  Added by {target.addedBy}
                  {target.timestamp && <> on {new Date(target.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
          <div className="tdp-tab-pane">
            {isUserAllowed && (
              <div className="tdp-note-form">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add activity note..."
                  rows={3}
                />
                <button
                  className="tdp-note-add-btn"
                  onClick={handleAddNote}
                  disabled={noteLoading || !newNote.trim()}
                >
                  {noteLoading ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            )}
            <div className="tdp-notes-list">
              {notes.length === 0 ? (
                <p className="tdp-empty">No activity notes yet.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="tdp-note-item">
                    <div className="tdp-note-header">
                      <span className="tdp-note-author">{note.author}</span>
                      <span className="tdp-note-time">
                        {note.timestamp && new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {isUserAllowed && (
                        <button className="tdp-note-delete" onClick={() => handleDeleteNote(note.id)}>&times;</button>
                      )}
                    </div>
                    <p className="tdp-note-text">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Helper component for simple label/value rows
function Row({ label, value, multiline }) {
  return (
    <div className="tdp-row" style={multiline ? { flexDirection: 'column', alignItems: 'flex-start' } : {}}>
      <span className="tdp-label">{label}</span>
      <span className={multiline ? 'tdp-value tdp-value-multiline' : 'tdp-value'}>{value}</span>
    </div>
  )
}

export default TargetDetailPanel
