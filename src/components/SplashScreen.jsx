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
      <div className="splash-content">
        {/* adidas Performance Logo (Three Stripes / Mountain) */}
        <div className="splash-logo">
          <svg
            viewBox="0 0 120 80"
            className="splash-logo-svg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Three ascending bars forming the adidas performance mountain */}
            <rect className="splash-bar splash-bar-1" x="10" y="50" width="24" height="30" rx="1" />
            <rect className="splash-bar splash-bar-2" x="40" y="30" width="24" height="50" rx="1" />
            <rect className="splash-bar splash-bar-3" x="70" y="10" width="24" height="70" rx="1" />
          </svg>
        </div>
        <div className="splash-wordmark">
          <span className="splash-brand">adidas</span>
          <span className="splash-sub">SELECT MAP</span>
        </div>
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
