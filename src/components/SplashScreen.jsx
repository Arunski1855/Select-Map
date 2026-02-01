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
            {/* Three parallel slanted stripes – adidas Performance logo */}
            <polygon className="splash-bar splash-bar-1" points="0,92 14,92 34,56 20,56" />
            <polygon className="splash-bar splash-bar-2" points="18,92 32,92 62,32 48,32" />
            <polygon className="splash-bar splash-bar-3" points="36,92 50,92 90,10 76,10" />
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
