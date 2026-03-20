import { createPortal } from 'react-dom'

const TYPE_STYLES = {
  success: { borderColor: '#fff',     iconColor: '#fff',     icon: '✓' },
  error:   { borderColor: '#E500A4',  iconColor: '#E500A4',  icon: '✕' },
  info:    { borderColor: '#555',     iconColor: '#999',     icon: 'i' },
}

function Toast({ toast, onDismiss }) {
  const { borderColor, iconColor, icon } = TYPE_STYLES[toast.type] || TYPE_STYLES.info
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: '#111',
        border: `1px solid ${borderColor}`,
        color: '#fff',
        padding: '12px 14px',
        fontFamily: 'adidasFG, Arial, sans-serif',
        fontSize: '0.78rem',
        letterSpacing: '0.08em',
        maxWidth: '340px',
        width: '100%',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        animation: 'toast-in 200ms ease',
        cursor: 'default',
      }}
    >
      <span style={{ color: iconColor, fontWeight: 700, flexShrink: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
        {icon}
      </span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '0.9rem',
          padding: '0 0 0 6px',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return createPortal(
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  )
}
