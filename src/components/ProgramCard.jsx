import React, { useState, useRef, useCallback } from 'react'

/**
 * ProgramCard - ADI SEL3CT Program Snapshot Card
 *
 * A flippable card that displays program information in a visual,
 * exportable format. Replaces the traditional "Team Report" with
 * a more engaging card-based design.
 *
 * Front: Logo, sport badge, program name, 4 metric bars, historicals highlight
 * Back: Details grid, full historicals, program highlights
 */

// Mock data for testing - will be replaced with actual program data
const MOCK_CORONADO = {
  id: 'coronado-football',
  name: 'Coronado High School',
  city: 'El Paso',
  state: 'TX',
  region: 'South',
  level: 'Gold',
  gender: 'Boys',
  conference: 'District 1-5A',
  headCoach: 'TBD',
  logo: null, // Would be Firebase URL
  primaryColor: 'Team Royal Blue',
  secondaryColor: 'Team Gold',
  historicals: {
    '2024': '5A State Champions',
    '2025': 'Regional Finals',
    '2026': 'Season in progress'
  },
  // Mock metrics (0-100 scale)
  metrics: {
    rosterDepth: 85,
    coaching: 92,
    pipeline: 78,
    facilities: 70
  }
}

// Metric definitions with icons
const METRICS = [
  { key: 'rosterDepth', label: 'ROSTER DEPTH', icon: '👥' },
  { key: 'coaching', label: 'COACHING', icon: '📋' },
  { key: 'pipeline', label: 'PIPELINE', icon: '📈' },
  { key: 'facilities', label: 'FACILITIES', icon: '🏟️' }
]

function MetricBar({ label, value, icon }) {
  return (
    <div className="program-card-metric">
      <div className="program-card-metric-header">
        <span className="program-card-metric-icon">{icon}</span>
        <span className="program-card-metric-label">{label}</span>
        <span className="program-card-metric-value">{value}</span>
      </div>
      <div className="program-card-metric-bar">
        <div
          className="program-card-metric-fill"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function ProgramCard({ program = MOCK_CORONADO, sport = 'football', onClose }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef(null)

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  // Get the best/most recent achievement for front card highlight
  const getBestAchievement = () => {
    if (!program.historicals) return null
    const years = Object.keys(program.historicals).sort().reverse()
    for (const year of years) {
      const achievement = program.historicals[year]
      if (achievement && achievement.toLowerCase().includes('champion')) {
        return { year, achievement }
      }
    }
    // Return most recent if no championship
    const mostRecent = years[0]
    return mostRecent ? { year: mostRecent, achievement: program.historicals[mostRecent] } : null
  }

  const highlight = getBestAchievement()
  const sportLabel = sport === 'football' ? 'FOOTBALL' : 'BASKETBALL'

  // Generate mock metrics if not present
  const metrics = program.metrics || {
    rosterDepth: 75,
    coaching: 80,
    pipeline: 70,
    facilities: 65
  }

  return (
    <div className="program-card-container">
      <div className={`program-card ${isFlipped ? 'flipped' : ''}`} ref={cardRef}>
        {/* FRONT OF CARD */}
        <div className="program-card-face program-card-front">
          {/* Header with sport badge */}
          <div className="program-card-header">
            <div className="program-card-logo-area">
              {program.logo ? (
                <img src={program.logo} alt={program.name} className="program-card-logo" />
              ) : (
                <div className="program-card-logo-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="program-card-sport-badge">
              {sportLabel}
            </div>
          </div>

          {/* Program Name */}
          <div className="program-card-name-section">
            <h2 className="program-card-name">{program.name}</h2>
            <p className="program-card-location">{program.city}, {program.state}</p>
          </div>

          {/* Achievement Highlight */}
          {highlight && (
            <div className="program-card-highlight">
              <span className="program-card-highlight-icon">🏆</span>
              <span className="program-card-highlight-text">
                {highlight.year} {highlight.achievement}
              </span>
            </div>
          )}

          {/* Metrics Section */}
          <div className="program-card-metrics">
            <div className="program-card-metrics-header">PROGRAM METRICS</div>
            {METRICS.map(({ key, label, icon }) => (
              <MetricBar
                key={key}
                label={label}
                value={metrics[key]}
                icon={icon}
              />
            ))}
          </div>

          {/* Footer with actions */}
          <div className="program-card-footer">
            <button className="program-card-action" onClick={() => {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              SHARE
            </button>
            <button className="program-card-action" onClick={() => {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              EXPORT
            </button>
            <button className="program-card-flip-btn" onClick={handleFlip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/>
                <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/>
              </svg>
              FLIP CARD
            </button>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div className="program-card-face program-card-back">
          {/* Header */}
          <div className="program-card-back-header">
            <h2 className="program-card-name">{program.name}</h2>
          </div>

          {/* Info Grid */}
          <div className="program-card-info-grid">
            <div className="program-card-info-item">
              <span className="program-card-info-label">LEVEL</span>
              <span className="program-card-info-value">{program.level || 'High School'}</span>
            </div>
            <div className="program-card-info-item">
              <span className="program-card-info-label">REGION</span>
              <span className="program-card-info-value">{program.region}</span>
            </div>
            <div className="program-card-info-item">
              <span className="program-card-info-label">CONFERENCE</span>
              <span className="program-card-info-value">{program.conference || '—'}</span>
            </div>
            <div className="program-card-info-item">
              <span className="program-card-info-label">HEAD COACH</span>
              <span className="program-card-info-value">{program.headCoach || '—'}</span>
            </div>
          </div>

          {/* Full Historicals */}
          <div className="program-card-historicals">
            <div className="program-card-section-header">
              <span className="program-card-section-icon">📜</span>
              PROGRAM HISTORY
            </div>
            <div className="program-card-historicals-list">
              {program.historicals ? (
                Object.entries(program.historicals)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([year, achievement]) => (
                    <div key={year} className="program-card-historical-row">
                      <span className="program-card-historical-year">{year}</span>
                      <span className="program-card-historical-achievement">{achievement}</span>
                    </div>
                  ))
              ) : (
                <p className="program-card-empty">No historical data recorded</p>
              )}
            </div>
          </div>

          {/* ADI SEL3CT Branding Bar */}
          <div className="program-card-branding-bar">
            <div className="program-card-branding-left">
              <img
                src="/logos/adi-select-logo.svg"
                alt="ADI SEL3CT"
                className="program-card-branding-logo"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
            <div className="program-card-branding-sport">{sportLabel}</div>
            <div className="program-card-branding-right">
              {program.city}, {program.state}
            </div>
          </div>

          {/* Footer */}
          <div className="program-card-footer">
            <button className="program-card-flip-btn" onClick={handleFlip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/>
                <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/>
              </svg>
              FLIP CARD
            </button>
          </div>
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button className="program-card-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default ProgramCard
