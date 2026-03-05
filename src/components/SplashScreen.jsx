import { useState, useEffect } from 'react'

function SplashScreen({ onComplete, isDataReady = false }) {
  const [phase, setPhase] = useState('enter') // enter -> hold -> exit
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 100)
    // Minimum splash time reduced to 1s for faster perceived load
    const minTimer = setTimeout(() => setMinTimeElapsed(true), 1000)
    return () => {
      clearTimeout(holdTimer)
      clearTimeout(minTimer)
    }
  }, [])

  // Exit when both minimum time elapsed AND data is ready (or after max 2.5s fallback)
  useEffect(() => {
    if (minTimeElapsed && (isDataReady || phase === 'hold')) {
      setPhase('exit')
      const doneTimer = setTimeout(() => onComplete(), 400)
      return () => clearTimeout(doneTimer)
    }
    // Fallback max time of 2.5s regardless of data
    const maxTimer = setTimeout(() => {
      setPhase('exit')
      setTimeout(() => onComplete(), 400)
    }, 2500)
    return () => clearTimeout(maxTimer)
  }, [minTimeElapsed, isDataReady, onComplete, phase])

  return (
    <div className={`splash-screen splash-${phase}`}>
      {/* Magenta blur texture corners */}
      <div className="splash-blur splash-blur--tl" />
      <div className="splash-blur splash-blur--br" />

      <div className="splash-content">
        {/* BOS (Badge of Sport) - adidas Performance Logo */}
        <div className="splash-logo">
          <img
            src="/logos/adidas-logo.png"
            alt="adidas"
            className="splash-logo-img"
          />
        </div>
        {/* ADI SEL3CT Wordmark - detached from BOS per brand guidelines */}
        <div className="splash-wordmark">
          <span className="splash-wordmark-text">ADI SEL3CT</span>
        </div>
        {/* Magenta loader bar */}
        <div className="splash-loader">
          <div className="splash-loader-track">
            <div className="splash-loader-fill" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
