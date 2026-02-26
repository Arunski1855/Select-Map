/**
 * Script to remove duplicate Layton Christian entries from Firebase
 * Keeps only the one with Casey Stanley as HC
 *
 * Usage: node scripts/cleanup-layton-christian.js
 *
 * Run this locally (not in restricted environments)
 */

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, remove } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyA_PDWSGaGLKIsjrCSdP0T0A3TUJqGQcuc",
  authDomain: "adidas-select-map.firebaseapp.com",
  databaseURL: "https://adidas-select-map-default-rtdb.firebaseio.com",
  projectId: "adidas-select-map",
  storageBucket: "adidas-select-map.firebasestorage.app",
  messagingSenderId: "689658240398",
  appId: "1:689658240398:web:8965ca228ae357187a98df"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

async function findAndCleanLaytonChristian() {
  console.log('Searching for Layton Christian entries in basketball...\n')

  const sportRef = ref(database, 'programs/basketball')
  const snapshot = await get(sportRef)
  const data = snapshot.val()

  if (!data) {
    console.log('No basketball programs found')
    process.exit(0)
  }

  const programs = Object.entries(data)
  const laytonChristianEntries = programs.filter(([id, program]) =>
    program.name && program.name.toLowerCase().includes('layton christian')
  )

  if (laytonChristianEntries.length === 0) {
    console.log('No Layton Christian entries found')
    process.exit(0)
  }

  console.log(`Found ${laytonChristianEntries.length} Layton Christian entries:\n`)

  laytonChristianEntries.forEach(([id, program]) => {
    console.log(`ID: ${id}`)
    console.log(`Name: ${program.name}`)
    console.log(`HC: ${program.hc || 'Not specified'}`)
    console.log(`City: ${program.city}, ${program.state}`)
    console.log('---')
  })

  // Find the one with Casey Stanley
  const caseyStanleyEntry = laytonChristianEntries.find(([id, program]) => {
    const hc = (program.hc || '').toLowerCase()
    return hc.includes('casey') && hc.includes('stanley')
  })

  if (caseyStanleyEntry) {
    console.log(`\n✓ Keeping entry with Casey Stanley as HC: ${caseyStanleyEntry[0]}`)

    // Delete all others
    const toDelete = laytonChristianEntries.filter(([id]) => id !== caseyStanleyEntry[0])

    for (const [id, program] of toDelete) {
      console.log(`\n🗑️  Deleting duplicate: ${id} (HC: ${program.hc || 'Not specified'})`)
      const programRef = ref(database, `programs/basketball/${id}`)
      await remove(programRef)
      console.log(`   Deleted successfully!`)
    }

    console.log(`\n=== Cleanup complete. Deleted ${toDelete.length} duplicates. ===`)
  } else {
    console.log('\n⚠️  No entry found with Casey Stanley as HC!')
    console.log('Please check the HC field values above and delete manually.')
  }

  process.exit(0)
}

findAndCleanLaytonChristian().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
