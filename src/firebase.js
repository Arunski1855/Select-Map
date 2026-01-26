import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, onValue, remove, set } from 'firebase/database'

// Firebase configuration
// To set up your own Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project
// 3. Go to Project Settings > General > Your apps > Add app (web)
// 4. Copy the config values below
// 5. Go to Realtime Database > Create Database > Start in test mode

const firebaseConfig = {
  apiKey: "AIzaSyDemo-placeholder-key",
  authDomain: "adidas-select-map.firebaseapp.com",
  databaseURL: "https://adidas-select-map-default-rtdb.firebaseio.com",
  projectId: "adidas-select-map",
  storageBucket: "adidas-select-map.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

// Database references for each sport
export const footballRef = ref(database, 'programs/football')
export const basketballRef = ref(database, 'programs/basketball')

// Add a program
export const addProgram = async (sport, program) => {
  const sportRef = ref(database, `programs/${sport}`)
  const newRef = push(sportRef)
  await set(newRef, { ...program, id: newRef.key })
  return newRef.key
}

// Delete a program
export const deleteProgram = async (sport, programId) => {
  const programRef = ref(database, `programs/${sport}/${programId}`)
  await remove(programRef)
}

// Subscribe to programs (real-time updates)
export const subscribeToPrograms = (sport, callback) => {
  const sportRef = ref(database, `programs/${sport}`)
  return onValue(sportRef, (snapshot) => {
    const data = snapshot.val()
    const programs = data ? Object.values(data) : []
    callback(programs)
  })
}

export { database }
