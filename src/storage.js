/**
 * Storage utility for programs
 * Uses localStorage for persistence
 * Each sport (basketball, football) has its own program list
 */

const STORAGE_KEY_PREFIX = 'adidas-select-programs-'

// Get programs from localStorage
export const getPrograms = (sport) => {
  const key = STORAGE_KEY_PREFIX + sport
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

// Save programs to localStorage
const savePrograms = (sport, programs) => {
  const key = STORAGE_KEY_PREFIX + sport
  localStorage.setItem(key, JSON.stringify(programs))
}

// Add a program
export const addProgram = (sport, program) => {
  const programs = getPrograms(sport)
  const newProgram = { ...program, id: `program-${Date.now()}` }
  programs.push(newProgram)
  savePrograms(sport, programs)
  return newProgram.id
}

// Delete a program
export const deleteProgram = (sport, programId) => {
  const programs = getPrograms(sport)
  const filtered = programs.filter(p => p.id !== programId)
  savePrograms(sport, filtered)
}

// Subscribe to programs (returns current data, no real-time sync)
export const subscribeToPrograms = (sport, callback) => {
  const programs = getPrograms(sport)
  callback(programs)

  // Return unsubscribe function (no-op for localStorage)
  return () => {}
}
