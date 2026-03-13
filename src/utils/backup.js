import { getDatabase, ref, get, set, push } from 'firebase/database'

// All data paths that need to be backed up
const DATA_PATHS = [
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

// Sensitive paths that should be included in full backups only
const SENSITIVE_PATHS = [
  'contractDetails',
  'contractHistory',
  'targetPrograms',
  'targetNotes'
]

/**
 * Export all data from Firebase Realtime Database
 * @param {Object} options - Export options
 * @param {boolean} options.includeSensitive - Include sensitive data (contracts, targets)
 * @returns {Promise<Object>} All exported data
 */
export const exportAllData = async (options = { includeSensitive: true }) => {
  const database = getDatabase()
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: {}
  }

  const pathsToExport = options.includeSensitive
    ? DATA_PATHS
    : DATA_PATHS.filter(p => !SENSITIVE_PATHS.includes(p))

  for (const path of pathsToExport) {
    try {
      const snapshot = await get(ref(database, path))
      if (snapshot.exists()) {
        exportData.data[path] = snapshot.val()
      }
    } catch (error) {
      console.error(`Error exporting ${path}:`, error)
      exportData.data[path] = { error: error.message }
    }
  }

  return exportData
}

/**
 * Export data for a specific sport
 * @param {string} sport - Sport to export (basketball, football, baseball, soccer)
 * @returns {Promise<Object>} Sport-specific data
 */
export const exportSportData = async (sport) => {
  const database = getDatabase()
  const sportPaths = [
    `programs/${sport}`,
    `targetPrograms/${sport}`,
    `targetNotes/${sport}`,
    `targetRankingMetrics/${sport}`,
    `notes/${sport}`,
    `schedule/${sport}`,
    `history/${sport}`,
    `socialMetrics/${sport}`,
    `rankingMetrics/${sport}`,
    `mentions/${sport}`,
    `contractDetails/${sport}`,
    `contractHistory/${sport}`
  ]

  const exportData = {
    exportedAt: new Date().toISOString(),
    sport,
    version: '1.0',
    data: {}
  }

  for (const path of sportPaths) {
    try {
      const snapshot = await get(ref(database, path))
      if (snapshot.exists()) {
        const key = path.split('/')[0]
        exportData.data[key] = snapshot.val()
      }
    } catch (error) {
      console.error(`Error exporting ${path}:`, error)
    }
  }

  return exportData
}

/**
 * Create a backup snapshot in Firebase
 * @param {string} userEmail - Email of user creating backup
 * @param {string} type - Type of backup (manual, scheduled, pre-delete)
 * @returns {Promise<string>} Backup ID
 */
export const createCloudBackup = async (userEmail, type = 'manual') => {
  const database = getDatabase()

  // Export all data
  const allData = await exportAllData({ includeSensitive: true })

  // Create backup metadata
  const backupMetaRef = ref(database, 'backupMetadata')
  const newMetaRef = push(backupMetaRef)
  const backupId = newMetaRef.key

  const metadata = {
    id: backupId,
    timestamp: Date.now(),
    createdBy: userEmail,
    type,
    dataSize: JSON.stringify(allData).length,
    pathsIncluded: Object.keys(allData.data)
  }

  // Save metadata
  await set(newMetaRef, metadata)

  // Save backup data
  const backupDataRef = ref(database, `backups/${backupId}`)
  await set(backupDataRef, allData)

  return backupId
}

/**
 * Get list of available backups
 * @returns {Promise<Array>} List of backup metadata
 */
export const getBackupList = async () => {
  const database = getDatabase()
  const snapshot = await get(ref(database, 'backupMetadata'))

  if (!snapshot.exists()) return []

  const data = snapshot.val()
  return Object.values(data).sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Download a backup as JSON file
 * @param {string} backupId - ID of backup to download
 */
export const downloadBackup = async (backupId) => {
  const database = getDatabase()
  const snapshot = await get(ref(database, `backups/${backupId}`))

  if (!snapshot.exists()) {
    throw new Error('Backup not found')
  }

  const data = snapshot.val()
  downloadAsJson(data, `adi-select-backup-${backupId}`)
}

/**
 * Download current data immediately (no cloud storage)
 * @param {Object} options - Export options
 */
export const downloadCurrentData = async (options = { includeSensitive: true }) => {
  const data = await exportAllData(options)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadAsJson(data, `adi-select-export-${timestamp}`)
}

/**
 * Download sport-specific data
 * @param {string} sport - Sport to export
 */
export const downloadSportData = async (sport) => {
  const data = await exportSportData(sport)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadAsJson(data, `adi-select-${sport}-${timestamp}`)
}

/**
 * Helper to download data as JSON file
 */
const downloadAsJson = (data, filename) => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Validate backup data structure
 * @param {Object} backupData - Data to validate
 * @returns {Object} Validation result
 */
export const validateBackupData = (backupData) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {}
  }

  if (!backupData || !backupData.data) {
    result.isValid = false
    result.errors.push('Invalid backup structure: missing data property')
    return result
  }

  // Check each expected path
  for (const path of DATA_PATHS) {
    if (backupData.data[path]) {
      const count = Object.keys(backupData.data[path]).length
      result.summary[path] = count
    } else {
      result.warnings.push(`Path "${path}" not found in backup`)
    }
  }

  // Check programs structure
  if (backupData.data.programs) {
    const sports = Object.keys(backupData.data.programs)
    result.summary.sports = sports
    let totalPrograms = 0
    sports.forEach(sport => {
      totalPrograms += Object.keys(backupData.data.programs[sport] || {}).length
    })
    result.summary.totalPrograms = totalPrograms
  }

  return result
}

/**
 * Get backup statistics
 * @returns {Promise<Object>} Backup statistics
 */
export const getBackupStats = async () => {
  const database = getDatabase()
  const stats = {
    lastBackup: null,
    totalBackups: 0,
    backupsByType: {},
    totalDataSize: 0
  }

  const snapshot = await get(ref(database, 'backupMetadata'))
  if (!snapshot.exists()) return stats

  const backups = Object.values(snapshot.val())
  stats.totalBackups = backups.length

  // Find most recent
  const sorted = backups.sort((a, b) => b.timestamp - a.timestamp)
  if (sorted.length > 0) {
    stats.lastBackup = sorted[0]
  }

  // Count by type
  backups.forEach(backup => {
    stats.backupsByType[backup.type] = (stats.backupsByType[backup.type] || 0) + 1
    stats.totalDataSize += backup.dataSize || 0
  })

  return stats
}

/**
 * Schedule automatic backup (stores schedule config)
 * @param {Object} config - Schedule configuration
 */
export const setBackupSchedule = async (config) => {
  const database = getDatabase()
  await set(ref(database, 'backupSchedule'), {
    ...config,
    updatedAt: Date.now()
  })
}

/**
 * Get backup schedule configuration
 * @returns {Promise<Object|null>} Schedule config
 */
export const getBackupSchedule = async () => {
  const database = getDatabase()
  const snapshot = await get(ref(database, 'backupSchedule'))
  return snapshot.exists() ? snapshot.val() : null
}
