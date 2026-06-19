import { useState, useEffect } from 'react'

function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter') // enter -> hold -> exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 100)
    const exitTimer = setTimeout(() => setPhase('exit'), 2000)
    const doneTimer = setTimeout(() => onComplete(), 2600)
    return () => {
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div className={`splash-screen splash-${phase}`}>
      {/* Magenta blur texture corners */}
      <div className="splash-blur splash-blur--tl" />
      <div className="splash-blur splash-blur--br" />

      <div className="splash-content">
        {/* ADI SEL3CT Horizontal Logo (BOS + Wordmark) */}
        <div className="splash-logo">
          <img
            src="/logos/Adiselect_Horizontal_Logo_White.png"
            alt="ADI SEL3CT"
            className="splash-logo-img"
          />
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
