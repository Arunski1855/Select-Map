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
        {/* adidas Performance Logo (Three Slanted Stripes) */}
        <div className="splash-logo">
          <svg
            viewBox="0 0 100 100"
            className="splash-logo-svg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Three slanted stripes forming the adidas performance mountain */}
            <polygon className="splash-bar splash-bar-1" points="14,90 26,90 42,58 30,58" />
            <polygon className="splash-bar splash-bar-2" points="30,90 42,90 66,38 54,38" />
            <polygon className="splash-bar splash-bar-3" points="46,90 58,90 90,18 78,18" />
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
