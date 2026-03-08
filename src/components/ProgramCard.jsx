import React, { useState, useRef, useCallback } from 'react'

/**
 * ProgramCard - ADI SEL3CT Program Snapshot Card
 *
 * A flippable card that displays program information in a visual,
 * exportable format. Uses ADI SEL3CT brand guidelines with backdrop
 * textures and proper typography.
 *
 * Front: Logo, sport badge, program name, key facts, historicals
 * Back: Details grid, full historicals, branding bar
 */

function ProgramCard({ program, sport = 'football', onClose }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const cardRef = useRef(null)

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  // Export card as PNG
  const handleExport = useCallback(async () => {
    if (!cardRef.current || isExporting) return
    setIsExporting(true)

    try {
      // Dynamically import html-to-image
      const { toPng } = await import('html-to-image')

      // Get the current face of the card
      const cardElement = cardRef.current

      const dataUrl = await toPng(cardElement, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#000000'
      })

      // Create download link
      const link = document.createElement('a')
      const filename = `${program.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-card-${new Date().toISOString().split('T')[0]}.png`
      link.download = filename
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export error:', err)
      alert('Could not export card. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [program, isExporting])

  // Get the best/most recent achievement for front card highlight
  const getBestAchievement = () => {
    if (!program?.historicals) return null
    const years = Object.keys(program.historicals).sort().reverse()
    for (const year of years) {
      const achievement = program.historicals[year]
      if (achievement && achievement.toLowerCase().includes('champion')) {
        return { year, achievement }
      }
    }
    // Return most recent non-empty if no championship
    for (const year of years) {
      if (program.historicals[year]) {
        return { year, achievement: program.historicals[year] }
      }
    }
    return null
  }

  const highlight = getBestAchievement()
  const sportLabel = sport === 'football' ? 'FOOTBALL' : 'BASKETBALL'

  if (!program) return null

  return (
    <div className="program-card-container" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`program-card ${isFlipped ? 'flipped' : ''}`} ref={cardRef}>
        {/* FRONT OF CARD */}
        <div className="program-card-face program-card-front">
          {/* Header with logo and sport badge */}
          <div className="program-card-header">
            <div className="program-card-logo-area">
              {program.logo ? (
                <img src={program.logo} alt={program.name} className="program-card-logo" />
              ) : (
                <div className="program-card-logo-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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

          {/* Key Facts - replaces metric bars */}
          <div className="program-card-facts">
            <div className="program-card-facts-grid">
              <div className="program-card-fact">
                <span className="program-card-fact-label">LEVEL</span>
                <span className="program-card-fact-value">{program.level || '—'}</span>
              </div>
              <div className="program-card-fact">
                <span className="program-card-fact-label">REGION</span>
                <span className="program-card-fact-value">{program.region || '—'}</span>
              </div>
              <div className="program-card-fact">
                <span className="program-card-fact-label">CONFERENCE</span>
                <span className="program-card-fact-value">{program.conference || '—'}</span>
              </div>
              <div className="program-card-fact">
                <span className="program-card-fact-label">HEAD COACH</span>
                <span className="program-card-fact-value">{program.headCoach || '—'}</span>
              </div>
            </div>
          </div>

          {/* Achievement Highlight / Historicals */}
          <div className="program-card-historicals-section">
            <div className="program-card-section-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="6"/>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
              PROGRAM HISTORY
            </div>
            {program.historicals ? (
              <div className="program-card-historicals-list">
                {Object.entries(program.historicals)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .filter(([, achievement]) => achievement)
                  .map(([year, achievement]) => {
                    const isChampion = achievement.toLowerCase().includes('champion')
                    return (
                      <div key={year} className={`program-card-historical-row ${isChampion ? 'champion' : ''}`}>
                        <span className="program-card-historical-year">{year}</span>
                        <span className="program-card-historical-achievement">
                          {isChampion && <span className="program-card-trophy">&#127942;</span>}
                          {achievement}
                        </span>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="program-card-empty">No historical data recorded</p>
            )}
          </div>

          {/* Footer with actions */}
          <div className="program-card-footer">
            <button className="program-card-action" onClick={handleExport} disabled={isExporting}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {isExporting ? 'EXPORTING...' : 'EXPORT PNG'}
            </button>
            <button className="program-card-flip-btn" onClick={handleFlip}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <p className="program-card-location">{program.city}, {program.state}</p>
          </div>

          {/* Extended Info */}
          <div className="program-card-extended-info">
            {program.ranking && (
              <div className="program-card-info-row">
                <span className="program-card-info-label">NATIONAL RANKING</span>
                <span className="program-card-info-value">{program.ranking}</span>
              </div>
            )}
            {program.stateRanking && (
              <div className="program-card-info-row">
                <span className="program-card-info-label">STATE RANKING</span>
                <span className="program-card-info-value">{program.stateRanking}</span>
              </div>
            )}
            {program.gender && (
              <div className="program-card-info-row">
                <span className="program-card-info-label">GENDER</span>
                <span className="program-card-info-value">{program.gender}</span>
              </div>
            )}
            {program.teamType && (
              <div className="program-card-info-row">
                <span className="program-card-info-label">TEAM TYPE</span>
                <span className="program-card-info-value">{program.teamType}</span>
              </div>
            )}
            {(program.primaryColor || program.secondaryColor) && (
              <div className="program-card-info-row">
                <span className="program-card-info-label">TEAM COLORS</span>
                <span className="program-card-info-value">
                  {[program.primaryColor, program.secondaryColor].filter(Boolean).join(' / ')}
                </span>
              </div>
            )}
          </div>

          {/* Social Links if available */}
          {(program.twitter || program.instagram) && (
            <div className="program-card-social">
              {program.twitter && (
                <span className="program-card-social-item">@{program.twitter.replace('@', '')}</span>
              )}
              {program.instagram && (
                <span className="program-card-social-item">@{program.instagram.replace('@', '')}</span>
              )}
            </div>
          )}

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
              {program.region}
            </div>
          </div>

          {/* Footer */}
          <div className="program-card-footer">
            <button className="program-card-action" onClick={handleExport} disabled={isExporting}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {isExporting ? 'EXPORTING...' : 'EXPORT PNG'}
            </button>
            <button className="program-card-flip-btn" onClick={handleFlip}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <button className="program-card-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default ProgramCard
