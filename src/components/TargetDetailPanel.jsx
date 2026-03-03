import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  addTargetNote,
  subscribeToTargetNotes,
  deleteTargetNote,
  addTargetRankingMetric,
  subscribeToTargetRankingMetrics,
  deleteTargetRankingMetric
} from '../firebase'

// Region definitions with colors
const REGIONS = {
  'Canada': { color: '#d4002a' },
  'Mid Atlantic': { color: '#005eb8' },
  'South': { color: '#ff6b00' },
  'Midwest': { color: '#7d2d8e' },
  'North': { color: '#1a9fc9' },
  'West': { color: '#00a550' }
}

const PIPELINE_STATUSES = {
  'identified': { label: 'Identified', description: 'On our radar', color: '#6b7280' },
  'contacted': { label: 'Contacted', description: 'Initial outreach made', color: '#3b82f6' },
  'in_discussion': { label: 'In Discussion', description: 'Active conversations', color: '#8b5cf6' },
  'proposal_sent': { label: 'Proposal Sent', description: 'Offer extended', color: '#f59e0b' },
  'negotiating': { label: 'Negotiating', description: 'Working terms', color: '#ec4899' },
  'signed': { label: 'Signed', description: 'Won', color: '#10b981' },
  'lost': { label: 'Lost', description: 'Went elsewhere', color: '#ef4444' }
}

const PRIORITIES = {
  'high': { label: 'High', color: '#ef4444' },
  'medium': { label: 'Medium', color: '#f59e0b' },
  'low': { label: 'Low', color: '#6b7280' }
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

function TargetDetailPanel({ target, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete, onStatusChange }) {
  const [activeDetailTab, setActiveDetailTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  // Ranking history state
  const [rankingMetrics, setRankingMetrics] = useState([])
  const [newRanking, setNewRanking] = useState('')
  const [rankingLoading, setRankingLoading] = useState(false)

  // Bottom sheet drag state for mobile
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

  // Subscribe to ranking metrics
  useEffect(() => {
    if (!target?.id || !sport) return
    const unsub = subscribeToTargetRankingMetrics(sport, target.id, setRankingMetrics)
    return () => unsub()
  }, [target?.id, sport])

  useEffect(() => {
    setActiveDetailTab('info')
    setSheetHeight(null)
    setNotes([])
    setNewNote('')
    setRankingMetrics([])
    setNewRanking('')
  }, [target?.id])

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
      window.innerHeight * 0.9
    )
    setSheetHeight(newHeight)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

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
      await addTargetNote(sport, target.id, {
        text: newNote.trim(),
        author: user.email,
        timestamp: Date.now()
      })
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
    }
    setNoteLoading(false)
  }

  const handleDeleteNote = async (noteId) => {
    if (!target?.id || !window.confirm('Delete this note?')) return
    try {
      await deleteTargetNote(sport, target.id, noteId)
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  // Handle adding ranking snapshot
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
    } catch (err) {
      console.error('Error adding ranking:', err)
    }
    setRankingLoading(false)
  }

  // Handle deleting ranking snapshot
  const handleDeleteRanking = async (metricId) => {
    if (!target?.id || !window.confirm('Delete this ranking entry?')) return
    try {
      await deleteTargetRankingMetric(sport, target.id, metricId)
    } catch (err) {
      console.error('Error deleting ranking:', err)
    }
  }

  // Compute ranking history for display
  const rankingHistory = useMemo(() => {
    return [...rankingMetrics].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [rankingMetrics])

  // Get latest ranking for display
  const latestRanking = rankingHistory.length > 0 ? rankingHistory[0].ranking : target.ranking

  if (!target) return null

  const statusInfo = PIPELINE_STATUSES[target.status] || PIPELINE_STATUSES['identified']
  const priorityInfo = PRIORITIES[target.priority] || PRIORITIES['medium']
  const regionColor = REGIONS[target.region]?.color || '#666'

  const tabs = ['info', 'vitals', 'intel', 'activity']

  const panelStyle = sheetHeight ? { height: sheetHeight } : {}

  return (
    <div
      className={`detail-panel target-detail-panel ${isOpen ? 'open' : ''}`}
      ref={panelRef}
      style={panelStyle}
    >
      {/* Mobile drag handle */}
      <div
        className="detail-drag-handle"
        onTouchStart={handleDragStart}
        onMouseDown={handleDragStart}
      >
        <div className="drag-indicator" />
      </div>

      {/* Header */}
      <div className="detail-header" style={{ borderLeftColor: statusInfo.color }}>
        <div className="detail-header-top">
          <button className="detail-close" onClick={onClose}>&times;</button>
          {target.logo && <img src={target.logo} alt="" className="detail-logo" />}
          <div className="detail-header-info">
            <h3 className="detail-name">{target.name}</h3>
            <p className="detail-location">{target.city}, {target.state}</p>
          </div>
        </div>

        {/* Status and Priority badges */}
        <div className="target-badges">
          <span
            className="target-status-badge"
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
          <span
            className="target-priority-badge"
            style={{ backgroundColor: priorityInfo.color }}
          >
            {priorityInfo.label} Priority
          </span>
          {target.region && (
            <span
              className="target-region-badge"
              style={{ backgroundColor: regionColor }}
            >
              {target.region}
            </span>
          )}
        </div>

        {/* Quick status change */}
        {isUserAllowed && onStatusChange && (
          <div className="target-status-quick">
            <select
              value={target.status}
              onChange={(e) => onStatusChange(target.id, e.target.value)}
              className="target-status-select"
            >
              {Object.entries(PIPELINE_STATUSES).map(([id, info]) => (
                <option key={id} value={id}>{info.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="detail-panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeDetailTab === tab ? 'active' : ''}`}
            onClick={() => setActiveDetailTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="detail-content">
        {activeDetailTab === 'info' && (
          <div className="detail-info-tab">
            {target.gender && (
              <div className="detail-row">
                <span className="detail-label">Gender</span>
                <span className="detail-value">{target.gender}</span>
              </div>
            )}
            {target.conference && (
              <div className="detail-row">
                <span className="detail-label">Conference</span>
                <span className="detail-value">{target.conference}</span>
              </div>
            )}
            {target.ranking && (
              <div className="detail-row">
                <span className="detail-label">Ranking</span>
                <span className="detail-value">{target.ranking}</span>
              </div>
            )}
            {target.level && (
              <div className="detail-row">
                <span className="detail-label">Target Level</span>
                <span className="detail-value">{target.level}</span>
              </div>
            )}
            {target.targetSignDate && (
              <div className="detail-row">
                <span className="detail-label">Target Sign Date</span>
                <span className="detail-value">
                  {new Date(target.targetSignDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
            {target.topProspects && (
              <div className="detail-row">
                <span className="detail-label">Top Prospects</span>
                <span className="detail-value detail-value-multiline">{target.topProspects}</span>
              </div>
            )}
            {target.website && (
              <div className="detail-row">
                <span className="detail-label">Website</span>
                <a href={target.website} target="_blank" rel="noopener noreferrer" className="detail-link">
                  Visit Site
                </a>
              </div>
            )}

            {/* Actions */}
            {isUserAllowed && (
              <div className="detail-actions">
                <button className="detail-edit-btn" onClick={() => onEdit(target)}>
                  Edit
                </button>
                <button className="detail-delete-btn" onClick={() => onDelete(target.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'vitals' && (
          <div className="detail-vitals-tab">
            {target.headCoach && (
              <div className="detail-row">
                <span className="detail-label">Head Coach</span>
                <span className="detail-value">{target.headCoach}</span>
              </div>
            )}
            {target.contactEmail && (
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <a href={`mailto:${target.contactEmail}`} className="detail-link">
                  {target.contactEmail}
                </a>
              </div>
            )}
            {target.contactPhone && (
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <a href={`tel:${target.contactPhone}`} className="detail-link">
                  {formatPhone(target.contactPhone)}
                </a>
              </div>
            )}
            {target.twitter && (
              <div className="detail-row">
                <span className="detail-label">Twitter/X</span>
                <a
                  href={`https://twitter.com/${target.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  {target.twitter}
                </a>
              </div>
            )}
            {target.instagram && (
              <div className="detail-row">
                <span className="detail-label">Instagram</span>
                <a
                  href={`https://instagram.com/${target.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  {target.instagram}
                </a>
              </div>
            )}
            {!target.headCoach && !target.contactEmail && !target.contactPhone && !target.twitter && !target.instagram && (
              <p className="detail-empty">No contact information available.</p>
            )}

            {/* Ranking History Section */}
            {isUserAllowed && (
              <div className="target-ranking-history">
                <h4 className="ranking-history-title">Ranking History</h4>

                {/* Current Ranking Display */}
                <div className="ranking-current">
                  <span className="ranking-current-label">Current Ranking:</span>
                  <span className="ranking-current-value">{latestRanking || 'Not set'}</span>
                </div>

                {/* Add Ranking Form */}
                <div className="ranking-snapshot-form">
                  <input
                    type="text"
                    value={newRanking}
                    onChange={(e) => setNewRanking(e.target.value)}
                    placeholder="Enter ranking (e.g., #5 National)"
                    className="ranking-input"
                  />
                  <button
                    onClick={handleAddRanking}
                    disabled={rankingLoading || !newRanking.trim()}
                    className="ranking-add-btn"
                  >
                    {rankingLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>

                {/* Ranking History List */}
                {rankingHistory.length > 0 ? (
                  <div className="ranking-history-list">
                    {rankingHistory.slice(0, 10).map((metric) => (
                      <div key={metric.id} className="ranking-history-item">
                        <div className="ranking-history-info">
                          <span className="ranking-history-value">{metric.ranking}</span>
                          <span className="ranking-history-date">
                            {new Date(metric.date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                        </div>
                        <button
                          className="ranking-delete-btn"
                          onClick={() => handleDeleteRanking(metric.id)}
                          title="Delete entry"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="detail-empty">No ranking history yet. Add a ranking above to start tracking.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'intel' && (
          <div className="detail-intel-tab">
            {target.competition && (
              <div className="detail-row">
                <span className="detail-label">Current Competition</span>
                <span className="detail-value">{target.competition}</span>
              </div>
            )}
            {target.competitionDetails && (
              <div className="detail-row">
                <span className="detail-label">Competition Details</span>
                <span className="detail-value detail-value-multiline">{target.competitionDetails}</span>
              </div>
            )}
            {target.strengths && (
              <div className="detail-row">
                <span className="detail-label">Strengths / Why Target</span>
                <span className="detail-value detail-value-multiline">{target.strengths}</span>
              </div>
            )}
            {target.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes</span>
                <span className="detail-value detail-value-multiline">{target.notes}</span>
              </div>
            )}
            {!target.competition && !target.competitionDetails && !target.strengths && !target.notes && (
              <p className="detail-empty">No intel information available.</p>
            )}

            {/* Added by info */}
            {target.addedBy && (
              <div className="detail-meta">
                <p className="detail-meta-text">
                  Added by {target.addedBy}
                  {target.timestamp && (
                    <> on {new Date(target.timestamp).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}</>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'activity' && (
          <div className="detail-activity-tab">
            {/* Add note form */}
            {isUserAllowed && (
              <div className="detail-note-form">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add activity note..."
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={noteLoading || !newNote.trim()}
                  className="detail-note-add-btn"
                >
                  {noteLoading ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            )}

            {/* Notes list */}
            <div className="detail-notes-list">
              {notes.length === 0 ? (
                <p className="detail-empty">No activity notes yet.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="detail-note-item">
                    <div className="detail-note-header">
                      <span className="detail-note-author">{note.author}</span>
                      <span className="detail-note-time">
                        {note.timestamp && new Date(note.timestamp).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                      {isUserAllowed && (
                        <button
                          className="detail-note-delete"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    <p className="detail-note-text">{note.text}</p>
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

export default TargetDetailPanel
