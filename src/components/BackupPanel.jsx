import { useState, useEffect } from 'react'
import {
  downloadCurrentData,
  downloadSportData,
  createCloudBackup,
  getBackupList,
  downloadBackup,
  getBackupStats,
  validateBackupData
} from '../utils/backup'

const SPORTS = ['basketball', 'football', 'baseball', 'soccer']

export default function BackupPanel({ isOpen, onClose, userEmail }) {
  const [activeTab, setActiveTab] = useState('download')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [backups, setBackups] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingBackups, setLoadingBackups] = useState(false)

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadBackups()
    }
  }, [isOpen, activeTab])

  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen])

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const list = await getBackupList()
      setBackups(list)
    } catch (error) {
      console.error('Error loading backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const loadStats = async () => {
    try {
      const s = await getBackupStats()
      setStats(s)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleDownloadAll = async (includeSensitive = true) => {
    setLoading(true)
    setMessage(null)
    try {
      await downloadCurrentData({ includeSensitive })
      setMessage({ type: 'success', text: 'Full backup downloaded successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: `Download failed: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSport = async (sport) => {
    setLoading(true)
    setMessage(null)
    try {
      await downloadSportData(sport)
      setMessage({ type: 'success', text: `${sport} data downloaded` })
    } catch (error) {
      setMessage({ type: 'error', text: `Download failed: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleCloudBackup = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const backupId = await createCloudBackup(userEmail, 'manual')
      setMessage({ type: 'success', text: `Cloud backup created: ${backupId.slice(0, 8)}...` })
      await loadBackups()
      await loadStats()
    } catch (error) {
      setMessage({ type: 'error', text: `Cloud backup failed: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('Download this backup? You can then manually restore by importing the data.')) {
      return
    }
    setLoading(true)
    try {
      await downloadBackup(backupId)
      setMessage({ type: 'success', text: 'Backup downloaded' })
    } catch (error) {
      setMessage({ type: 'error', text: `Download failed: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="backup-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Data Backup & Protection</h2>

        {stats && stats.lastBackup && (
          <div className="backup-stats">
            <span className="stat-item">
              <strong>Last backup:</strong> {formatDate(stats.lastBackup.timestamp)}
            </span>
            <span className="stat-item">
              <strong>Total backups:</strong> {stats.totalBackups}
            </span>
          </div>
        )}

        <div className="backup-tabs">
          <button
            className={`backup-tab ${activeTab === 'download' ? 'active' : ''}`}
            onClick={() => setActiveTab('download')}
          >
            Download Data
          </button>
          <button
            className={`backup-tab ${activeTab === 'cloud' ? 'active' : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            Cloud Backup
          </button>
          <button
            className={`backup-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Backup History
          </button>
        </div>

        {message && (
          <div className={`backup-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'download' && (
          <div className="backup-section">
            <h3>Download to Your Device</h3>
            <p className="backup-description">
              Export your data as JSON files for local backup or migration.
            </p>

            <div className="backup-actions">
              <button
                className="backup-btn primary"
                onClick={() => handleDownloadAll(true)}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Full Backup
              </button>

              <button
                className="backup-btn secondary"
                onClick={() => handleDownloadAll(false)}
                disabled={loading}
              >
                Download (Without Contracts)
              </button>
            </div>

            <h4>Download by Sport</h4>
            <div className="sport-backup-grid">
              {SPORTS.map(sport => (
                <button
                  key={sport}
                  className="backup-btn sport-btn"
                  onClick={() => handleDownloadSport(sport)}
                  disabled={loading}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="backup-section">
            <h3>Cloud Backup</h3>
            <p className="backup-description">
              Create a snapshot in Firebase that can be restored later. Cloud backups are stored securely with your data.
            </p>

            <div className="backup-actions">
              <button
                className="backup-btn primary"
                onClick={handleCloudBackup}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
                </svg>
                {loading ? 'Creating Backup...' : 'Create Cloud Backup Now'}
              </button>
            </div>

            <div className="backup-info">
              <h4>What gets backed up:</h4>
              <ul>
                <li>All program data (basketball, football, etc.)</li>
                <li>Target pipeline programs</li>
                <li>Contract details</li>
                <li>Events and schedule</li>
                <li>Notes, metrics, and history</li>
                <li>Allowed users list</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="backup-section">
            <h3>Backup History</h3>

            {loadingBackups ? (
              <p className="loading-text">Loading backups...</p>
            ) : backups.length === 0 ? (
              <p className="no-backups">No cloud backups found. Create one to get started.</p>
            ) : (
              <div className="backup-list">
                {backups.map(backup => (
                  <div key={backup.id} className="backup-item">
                    <div className="backup-item-info">
                      <span className="backup-date">{formatDate(backup.timestamp)}</span>
                      <span className={`backup-type ${backup.type}`}>{backup.type}</span>
                      <span className="backup-size">{formatSize(backup.dataSize)}</span>
                      <span className="backup-user">{backup.createdBy}</span>
                    </div>
                    <button
                      className="backup-btn small"
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={loading}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="backup-footer">
          <p className="backup-tip">
            Tip: Create regular backups before making major changes. Download a local copy for extra safety.
          </p>
        </div>
      </div>
    </div>
  )
}
