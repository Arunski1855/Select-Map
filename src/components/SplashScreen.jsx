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
        {/* adidas Performance Logo */}
        <div className="splash-logo">
          <img
            src="/logos/adidas-logo.png"
            alt="adidas"
            className="splash-logo-img"
          />
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
