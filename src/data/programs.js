/**
 * adidas Select Programs Data
 *
 * Each program has:
 * - id: Unique identifier
 * - name: Program name
 * - state: State abbreviation (e.g., "CA", "TX")
 * - city: City name
 * - region: Geographic region (East, West, Midwest, South)
 * - logo: Path to logo image (place logos in /public/logos/)
 * - coordinates: [latitude, longitude] for map positioning
 * - website: Optional website URL
 *
 * To add a new program:
 * 1. Add the logo image to /public/logos/ (recommended size: 50x50px)
 * 2. Add a new entry to this array with the program details
 * 3. Use Google Maps to find the lat/lng coordinates for the city
 */

export const programs = [
  // West Region
  {
    id: 'california-huskies',
    name: 'California Huskies',
    city: 'Los Angeles',
    state: 'CA',
    region: 'West',
    logo: '/logos/california-huskies.png',
    coordinates: [34.0522, -118.2437],
    website: ''
  },
  {
    id: 'arizona-program',
    name: 'Arizona Select',
    city: 'Phoenix',
    state: 'AZ',
    region: 'West',
    logo: '/logos/arizona-select.png',
    coordinates: [33.4484, -111.9490],
    website: ''
  },

  // Midwest Region
  {
    id: 'south-central-prep',
    name: 'South Central Prep',
    city: 'Bixby',
    state: 'OK',
    region: 'Midwest',
    logo: '/logos/south-central-prep.png',
    coordinates: [35.9420, -95.8833],
    website: ''
  },
  {
    id: 'fort-international',
    name: 'Fort International',
    city: 'Minneapolis',
    state: 'MN',
    region: 'Midwest',
    logo: '/logos/fort-international.png',
    coordinates: [44.9778, -93.2650],
    website: ''
  },
  {
    id: 'express-elite',
    name: 'Express Elite',
    city: 'Indianapolis',
    state: 'IN',
    region: 'Midwest',
    logo: '/logos/express-elite.png',
    coordinates: [39.7684, -86.1581],
    website: ''
  },
  {
    id: 'vr-basketball',
    name: 'VR Basketball',
    city: 'Columbus',
    state: 'OH',
    region: 'Midwest',
    logo: '/logos/vr-basketball.png',
    coordinates: [39.9612, -82.9988],
    website: ''
  },

  // East Region
  {
    id: 'tms-basketball',
    name: 'TMS Basketball',
    city: 'Boston',
    state: 'MA',
    region: 'East',
    logo: '/logos/tms-basketball.png',
    coordinates: [42.3601, -71.0589],
    website: ''
  },
  {
    id: 'ss-elite',
    name: 'SS Elite',
    city: 'Providence',
    state: 'RI',
    region: 'East',
    logo: '/logos/ss-elite.png',
    coordinates: [41.8240, -71.4128],
    website: ''
  },
  {
    id: 'virginia-prep',
    name: 'Virginia Prep',
    city: 'Richmond',
    state: 'VA',
    region: 'East',
    logo: '/logos/virginia-prep.png',
    coordinates: [37.5407, -77.4360],
    website: ''
  },

  // South Region
  {
    id: 'combine-academy-goats',
    name: 'Combine Academy Goats',
    city: 'Charlotte',
    state: 'NC',
    region: 'South',
    logo: '/logos/combine-academy-goats.png',
    coordinates: [35.2271, -80.8431],
    website: ''
  },
  {
    id: 'academy-central-florida',
    name: 'The Academy of Central Florida',
    city: 'Orlando',
    state: 'FL',
    region: 'South',
    logo: '/logos/academy-central-florida.png',
    coordinates: [28.5383, -81.3792],
    website: ''
  }
]

/**
 * Region colors for potential filtering/display
 */
export const regionColors = {
  West: '#e74c3c',
  Midwest: '#3498db',
  East: '#2ecc71',
  South: '#f39c12'
}
