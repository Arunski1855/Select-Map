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
  'dashiell.sperling@gmail.com'
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

export { database, auth }
