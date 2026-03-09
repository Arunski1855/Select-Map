import { getDatabase, ref, get, set, push, onValue } from 'firebase/database'

// Backup interval in milliseconds (default: 24 hours)
const DEFAULT_BACKUP_INTERVAL = 24 * 60 * 60 * 1000

// Storage keys
const LAST_BACKUP_CHECK_KEY = 'adi-select-last-backup-check'
const AUTO_BACKUP_ENABLED_KEY = 'adi-select-auto-backup-enabled'

/**
 * Check if automatic backup is enabled
 */
export const isAutoBackupEnabled = () => {
  const stored = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY)
  return stored === null ? true : stored === 'true'
}

/**
 * Set automatic backup preference
 */
export const setAutoBackupEnabled = (enabled) => {
  localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, String(enabled))
}

/**
 * Get the timestamp of the last backup
 */
export const getLastBackupTime = async () => {
  const database = getDatabase()
  const snapshot = await get(ref(database, 'backupMetadata'))

  if (!snapshot.exists()) return null

  const backups = Object.values(snapshot.val())
  if (backups.length === 0) return null

  // Find the most recent backup
  const sorted = backups.sort((a, b) => b.timestamp - a.timestamp)
  return sorted[0].timestamp
}

/**
 * Check if a backup is needed based on interval
 */
export const isBackupNeeded = async (intervalMs = DEFAULT_BACKUP_INTERVAL) => {
  const lastBackup = await getLastBackupTime()

  if (!lastBackup) {
    // No backups exist, definitely need one
    return { needed: true, reason: 'no_backups', daysSinceBackup: null }
  }

  const now = Date.now()
  const timeSinceBackup = now - lastBackup
  const daysSinceBackup = Math.floor(timeSinceBackup / (24 * 60 * 60 * 1000))

  if (timeSinceBackup >= intervalMs) {
    return { needed: true, reason: 'interval_exceeded', daysSinceBackup }
  }

  return { needed: false, reason: 'recent_backup', daysSinceBackup }
}

/**
 * Create an automatic backup
 */
export const createAutoBackup = async (userEmail) => {
  const database = getDatabase()

  // First, get all data to backup
  const paths = [
    'programs',
    'events',
    'targetPrograms',
    'targetNotes',
    'targetRankingMetrics',
    'notes',
    'schedule',
    'history',
    'socialMetrics',
    'rankingMetrics',
    'mentions',
    'contractDetails',
    'contractHistory',
    'competitorEvents',
    'allowedUsers',
    'allowedEmailLookup'
  ]

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    type: 'auto',
    data: {}
  }

  for (const path of paths) {
    try {
      const snapshot = await get(ref(database, path))
      if (snapshot.exists()) {
        exportData.data[path] = snapshot.val()
      }
    } catch (error) {
      console.error(`Auto-backup error for ${path}:`, error)
    }
  }

  // Create backup metadata
  const backupMetaRef = ref(database, 'backupMetadata')
  const newMetaRef = push(backupMetaRef)
  const backupId = newMetaRef.key

  const metadata = {
    id: backupId,
    timestamp: Date.now(),
    createdBy: userEmail || 'system-auto',
    type: 'scheduled',
    dataSize: JSON.stringify(exportData).length,
    pathsIncluded: Object.keys(exportData.data)
  }

  // Save metadata
  await set(newMetaRef, metadata)

  // Save backup data
  const backupDataRef = ref(database, `backups/${backupId}`)
  await set(backupDataRef, exportData)

  // Update last check time
  localStorage.setItem(LAST_BACKUP_CHECK_KEY, Date.now().toString())

  return backupId
}

/**
 * Initialize auto-backup system
 * Call this when the app loads and user is authenticated
 */
export const initAutoBackup = async (userEmail, options = {}) => {
  const {
    intervalMs = DEFAULT_BACKUP_INTERVAL,
    onBackupNeeded = null,
    onBackupCreated = null,
    autoCreate = false
  } = options

  if (!isAutoBackupEnabled()) {
    return { status: 'disabled' }
  }

  // Check when we last checked
  const lastCheck = localStorage.getItem(LAST_BACKUP_CHECK_KEY)
  const now = Date.now()

  // Don't check more than once per hour
  if (lastCheck && (now - parseInt(lastCheck)) < 60 * 60 * 1000) {
    return { status: 'recently_checked' }
  }

  try {
    const backupStatus = await isBackupNeeded(intervalMs)

    if (backupStatus.needed) {
      if (onBackupNeeded) {
        onBackupNeeded(backupStatus)
      }

      if (autoCreate) {
        const backupId = await createAutoBackup(userEmail)
        if (onBackupCreated) {
          onBackupCreated(backupId)
        }
        return { status: 'backup_created', backupId }
      }

      return { status: 'backup_needed', ...backupStatus }
    }

    // Update check time even if no backup needed
    localStorage.setItem(LAST_BACKUP_CHECK_KEY, now.toString())
    return { status: 'up_to_date', ...backupStatus }

  } catch (error) {
    console.error('Auto-backup check error:', error)
    return { status: 'error', error: error.message }
  }
}

/**
 * Subscribe to backup status changes
 */
export const subscribeToBackupStatus = (callback) => {
  const database = getDatabase()
  const metaRef = ref(database, 'backupMetadata')

  return onValue(metaRef, async (snapshot) => {
    if (!snapshot.exists()) {
      callback({
        hasBackups: false,
        lastBackup: null,
        totalBackups: 0,
        needsBackup: true
      })
      return
    }

    const backups = Object.values(snapshot.val())
    const sorted = backups.sort((a, b) => b.timestamp - a.timestamp)

    const status = {
      hasBackups: true,
      lastBackup: sorted[0],
      totalBackups: backups.length,
      needsBackup: (Date.now() - sorted[0].timestamp) > DEFAULT_BACKUP_INTERVAL
    }

    callback(status)
  })
}

/**
 * Clean up old backups (keep only last N backups)
 */
export const cleanupOldBackups = async (keepCount = 10) => {
  const database = getDatabase()
  const snapshot = await get(ref(database, 'backupMetadata'))

  if (!snapshot.exists()) return { deleted: 0 }

  const backups = Object.entries(snapshot.val())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.timestamp - a.timestamp)

  if (backups.length <= keepCount) {
    return { deleted: 0, kept: backups.length }
  }

  const toDelete = backups.slice(keepCount)
  let deleted = 0

  for (const backup of toDelete) {
    try {
      const { remove } = await import('firebase/database')
      await remove(ref(database, `backupMetadata/${backup.key}`))
      await remove(ref(database, `backups/${backup.id}`))
      deleted++
    } catch (error) {
      console.error(`Error deleting backup ${backup.id}:`, error)
    }
  }

  return { deleted, kept: keepCount }
}
