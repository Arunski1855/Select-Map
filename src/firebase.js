import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, onValue, remove, set } from 'firebase/database'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_PDWSGaGLKIsjrCSdP0T0A3TUJqGQcuc",
  authDomain: "adidas-select-map.firebaseapp.com",
  databaseURL: "https://adidas-select-map-default-rtdb.firebaseio.com",
  projectId: "adidas-select-map",
  storageBucket: "adidas-select-map.firebasestorage.app",
  messagingSenderId: "689658240398",
  appId: "1:689658240398:web:8965ca228ae357187a98df",
  measurementId: "G-MY9R7R3KK1"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Default allowed users (always have access)
const DEFAULT_ALLOWED_USERS = [
  'dashiell.sperling@gmail.com',
  'derek.stucker@adidas.com',
  'thomas.bauman@adidas.com',
  'spencer.pickering@adidas.com',
  'bo.rodriguez@adidas.com'
]

// Initialize default allowed users on app start
const initializeAllowedUsers = async () => {
  const allowedRef = ref(database, 'allowedUsers')
  onValue(allowedRef, async (snapshot) => {
    const data = snapshot.val()
    const existingEmails = data ? Object.values(data).map(u => u.email.toLowerCase()) : []

    // Add default users if they don't exist
    for (const email of DEFAULT_ALLOWED_USERS) {
      if (!existingEmails.includes(email.toLowerCase())) {
        const newRef = push(allowedRef)
        await set(newRef, { email: email.toLowerCase(), addedAt: Date.now() })
      }
    }
  }, { onlyOnce: true })
}

// Run initialization
initializeAllowedUsers()

// Add a program to Firebase
export const addProgram = async (sport, program) => {
  const sportRef = ref(database, `programs/${sport}`)
  const newRef = push(sportRef)
  await set(newRef, { ...program, id: newRef.key })
  return newRef.key
}

// Delete a program from Firebase
export const deleteProgram = async (sport, programId) => {
  const programRef = ref(database, `programs/${sport}/${programId}`)
  await remove(programRef)
}

// Edit/Update a program in Firebase
export const editProgram = async (sport, program) => {
  const programRef = ref(database, `programs/${sport}/${program.id}`)
  await set(programRef, program)
}

// Subscribe to programs (real-time updates)
export const subscribeToPrograms = (sport, callback) => {
  const sportRef = ref(database, `programs/${sport}`)
  const unsubscribe = onValue(sportRef, (snapshot) => {
    const data = snapshot.val()
    const programs = data ? Object.values(data) : []
    callback(programs)
  }, (error) => {
    console.error('Firebase error:', error)
    callback([])
  })
  return unsubscribe
}

// Authentication functions
export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider)
}

export const logOut = () => {
  return signOut(auth)
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Allowed users functions
export const subscribeToAllowedUsers = (callback) => {
  const allowedRef = ref(database, 'allowedUsers')
  return onValue(allowedRef, (snapshot) => {
    const data = snapshot.val()
    const emails = data ? Object.values(data).map(u => u.email.toLowerCase()) : []
    callback(emails)
  })
}

export const addAllowedUser = async (email) => {
  const allowedRef = ref(database, 'allowedUsers')
  const newRef = push(allowedRef)
  await set(newRef, { email: email.toLowerCase(), addedAt: Date.now() })
}

export const removeAllowedUser = async (email) => {
  const allowedRef = ref(database, 'allowedUsers')
  return new Promise((resolve) => {
    onValue(allowedRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value.email.toLowerCase() === email.toLowerCase()) {
            remove(ref(database, `allowedUsers/${key}`))
          }
        })
      }
      resolve()
    }, { onlyOnce: true })
  })
}

// Add program history entry
export const addProgramHistory = async (sport, programId, action, userEmail, details = {}) => {
  const historyRef = ref(database, `history/${sport}/${programId}`)
  const newRef = push(historyRef)
  await set(newRef, {
    id: newRef.key,
    action,
    userEmail,
    timestamp: Date.now(),
    details
  })
}

// Get program history
export const subscribeToProgramHistory = (sport, programId, callback) => {
  const historyRef = ref(database, `history/${sport}/${programId}`)
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val()
    const history = data ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp) : []
    callback(history)
  })
}

// Event CRUD functions
export const addEvent = async (eventData) => {
  const eventsRef = ref(database, 'events')
  const newRef = push(eventsRef)
  await set(newRef, { ...eventData, id: newRef.key })
  return newRef.key
}

export const deleteEvent = async (eventId) => {
  const eventRef = ref(database, `events/${eventId}`)
  await remove(eventRef)
}

export const editEvent = async (eventData) => {
  const eventRef = ref(database, `events/${eventData.id}`)
  await set(eventRef, eventData)
}

export const subscribeToEvents = (callback) => {
  const eventsRef = ref(database, 'events')
  const unsubscribe = onValue(eventsRef, (snapshot) => {
    const data = snapshot.val()
    const events = data ? Object.values(data) : []
    callback(events)
  }, (error) => {
    console.error('Firebase events error:', error)
    callback([])
  })
  return unsubscribe
}

// Internal notes for programs
export const addNote = async (sport, programId, noteData) => {
  const notesRef = ref(database, `notes/${sport}/${programId}`)
  const newRef = push(notesRef)
  await set(newRef, { ...noteData, id: newRef.key })
  return newRef.key
}

export const deleteNote = async (sport, programId, noteId) => {
  const noteRef = ref(database, `notes/${sport}/${programId}/${noteId}`)
  await remove(noteRef)
}

export const subscribeToNotes = (sport, programId, callback) => {
  const notesRef = ref(database, `notes/${sport}/${programId}`)
  return onValue(notesRef, (snapshot) => {
    const data = snapshot.val()
    const notes = data ? Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : []
    callback(notes)
  }, (error) => {
    console.error('Firebase notes error:', error)
    callback([])
  })
}

// Schedule/results for programs
export const addScheduleEntry = async (sport, programId, entry) => {
  const schedRef = ref(database, `schedule/${sport}/${programId}`)
  const newRef = push(schedRef)
  await set(newRef, { ...entry, id: newRef.key })
  return newRef.key
}

export const deleteScheduleEntry = async (sport, programId, entryId) => {
  const entryRef = ref(database, `schedule/${sport}/${programId}/${entryId}`)
  await remove(entryRef)
}

export const subscribeToSchedule = (sport, programId, callback) => {
  const schedRef = ref(database, `schedule/${sport}/${programId}`)
  return onValue(schedRef, (snapshot) => {
    const data = snapshot.val()
    const entries = data ? Object.values(data).sort((a, b) => (a.date || '').localeCompare(b.date || '')) : []
    callback(entries)
  }, (error) => {
    console.error('Firebase schedule error:', error)
    callback([])
  })
}

// Social metrics tracking (Instagram follower snapshots)
export const addSocialMetric = async (sport, programId, metricData) => {
  const metricsRef = ref(database, `socialMetrics/${sport}/${programId}`)
  const newRef = push(metricsRef)
  await set(newRef, { ...metricData, id: newRef.key })
  return newRef.key
}

export const subscribeToSocialMetrics = (sport, programId, callback) => {
  const metricsRef = ref(database, `socialMetrics/${sport}/${programId}`)
  return onValue(metricsRef, (snapshot) => {
    const data = snapshot.val()
    const metrics = data ? Object.values(data).sort((a, b) => (a.date || '').localeCompare(b.date || '')) : []
    callback(metrics)
  }, (error) => {
    console.error('Firebase social metrics error:', error)
    callback([])
  })
}

export const deleteSocialMetric = async (sport, programId, metricId) => {
  const metricRef = ref(database, `socialMetrics/${sport}/${programId}/${metricId}`)
  await remove(metricRef)
}

// Soft delete (archive) a program instead of permanent deletion
export const archiveProgram = async (sport, programId) => {
  const programRef = ref(database, `programs/${sport}/${programId}`)
  return new Promise((resolve, reject) => {
    onValue(programRef, async (snapshot) => {
      const data = snapshot.val()
      if (data) {
        await set(programRef, { ...data, isArchived: true, archivedAt: Date.now() })
        resolve()
      } else {
        reject(new Error('Program not found'))
      }
    }, { onlyOnce: true })
  })
}

// Restore an archived program
export const restoreProgram = async (sport, programId) => {
  const programRef = ref(database, `programs/${sport}/${programId}`)
  return new Promise((resolve, reject) => {
    onValue(programRef, async (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const { isArchived, archivedAt, ...rest } = data
        await set(programRef, rest)
        resolve()
      } else {
        reject(new Error('Program not found'))
      }
    }, { onlyOnce: true })
  })
}

// Subscribe to archived programs
export const subscribeToArchivedPrograms = (sport, callback) => {
  const sportRef = ref(database, `programs/${sport}`)
  const unsubscribe = onValue(sportRef, (snapshot) => {
    const data = snapshot.val()
    const programs = data ? Object.values(data).filter(p => p.isArchived) : []
    callback(programs)
  }, (error) => {
    console.error('Firebase archived programs error:', error)
    callback([])
  })
  return unsubscribe
}

// Mentions tracking for programs
export const addMention = async (sport, programId, mentionData) => {
  const mentionsRef = ref(database, `mentions/${sport}/${programId}`)
  const newRef = push(mentionsRef)
  await set(newRef, { ...mentionData, id: newRef.key })
  return newRef.key
}

export const subscribeToMentions = (sport, programId, callback) => {
  const mentionsRef = ref(database, `mentions/${sport}/${programId}`)
  return onValue(mentionsRef, (snapshot) => {
    const data = snapshot.val()
    const mentions = data ? Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : []
    callback(mentions)
  }, (error) => {
    console.error('Firebase mentions error:', error)
    callback([])
  })
}

export const deleteMention = async (sport, programId, mentionId) => {
  const mentionRef = ref(database, `mentions/${sport}/${programId}/${mentionId}`)
  await remove(mentionRef)
}

// Event to program linking
export const linkEventToPrograms = async (eventId, programIds) => {
  const eventRef = ref(database, `events/${eventId}`)
  return new Promise((resolve, reject) => {
    onValue(eventRef, async (snapshot) => {
      const data = snapshot.val()
      if (data) {
        await set(eventRef, { ...data, linkedPrograms: programIds })
        resolve()
      } else {
        reject(new Error('Event not found'))
      }
    }, { onlyOnce: true })
  })
}

// Get events linked to a specific program
export const subscribeToLinkedEvents = (programId, callback) => {
  const eventsRef = ref(database, 'events')
  return onValue(eventsRef, (snapshot) => {
    const data = snapshot.val()
    const events = data ? Object.values(data).filter(e =>
      e.linkedPrograms && e.linkedPrograms.includes(programId)
    ) : []
    callback(events)
  }, (error) => {
    console.error('Firebase linked events error:', error)
    callback([])
  })
}

// Target Programs (recruitment pipeline)
export const addTargetProgram = async (sport, targetData) => {
  const targetsRef = ref(database, `targetPrograms/${sport}`)
  const newRef = push(targetsRef)
  await set(newRef, { ...targetData, id: newRef.key })
  return newRef.key
}

export const subscribeToTargetPrograms = (sport, callback) => {
  const targetsRef = ref(database, `targetPrograms/${sport}`)
  return onValue(targetsRef, (snapshot) => {
    const data = snapshot.val()
    const targets = data ? Object.values(data).sort((a, b) => {
      // Sort by status order (active pipeline stages first)
      const statusOrder = {
        negotiating: 0,
        proposal_sent: 1,
        in_discussion: 2,
        contacted: 3,
        identified: 4,
        signed: 5,
        lost: 6
      }
      const statusDiff = (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4)
      if (statusDiff !== 0) return statusDiff
      // Then by priority (high first)
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
      if (priorityDiff !== 0) return priorityDiff
      // Then by timestamp (newest first)
      return (b.timestamp || 0) - (a.timestamp || 0)
    }) : []
    callback(targets)
  }, (error) => {
    console.error('Firebase target programs error:', error)
    callback([])
  })
}

export const editTargetProgram = async (sport, targetData) => {
  const targetRef = ref(database, `targetPrograms/${sport}/${targetData.id}`)
  await set(targetRef, { ...targetData, updatedAt: Date.now() })
}

export const deleteTargetProgram = async (sport, targetId) => {
  const targetRef = ref(database, `targetPrograms/${sport}/${targetId}`)
  await remove(targetRef)
}

// Target program notes (activity tracking)
export const addTargetNote = async (sport, targetId, noteData) => {
  const notesRef = ref(database, `targetNotes/${sport}/${targetId}`)
  const newRef = push(notesRef)
  await set(newRef, { ...noteData, id: newRef.key })
  return newRef.key
}

export const subscribeToTargetNotes = (sport, targetId, callback) => {
  const notesRef = ref(database, `targetNotes/${sport}/${targetId}`)
  return onValue(notesRef, (snapshot) => {
    const data = snapshot.val()
    const notes = data ? Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : []
    callback(notes)
  }, (error) => {
    console.error('Firebase target notes error:', error)
    callback([])
  })
}

export const deleteTargetNote = async (sport, targetId, noteId) => {
  const noteRef = ref(database, `targetNotes/${sport}/${targetId}/${noteId}`)
  await remove(noteRef)
}

// Contract details (private, auth-gated)
export const subscribeToContractDetails = (sport, programId, callback) => {
  const contractRef = ref(database, `contractDetails/${sport}/${programId}`)
  return onValue(contractRef, (snapshot) => {
    const data = snapshot.val()
    callback(data || null)
  }, (error) => {
    console.error('Firebase contract details error:', error)
    callback(null)
  })
}

export const updateContractDetails = async (sport, programId, details, userEmail) => {
  const contractRef = ref(database, `contractDetails/${sport}/${programId}`)
  await set(contractRef, {
    ...details,
    lastUpdated: Date.now(),
    updatedBy: userEmail
  })
}

// Contract audit history
export const addContractHistory = async (sport, programId, action, userEmail, details = {}) => {
  const historyRef = ref(database, `contractHistory/${sport}/${programId}`)
  const newRef = push(historyRef)
  await set(newRef, {
    id: newRef.key,
    action,
    userEmail,
    timestamp: Date.now(),
    details
  })
}

export const subscribeToContractHistory = (sport, programId, callback) => {
  const historyRef = ref(database, `contractHistory/${sport}/${programId}`)
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val()
    const history = data ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp) : []
    callback(history)
  }, (error) => {
    console.error('Firebase contract history error:', error)
    callback([])
  })
}

export { database, auth }
