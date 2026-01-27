import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, onValue, remove, set } from 'firebase/database'

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

export { database }
