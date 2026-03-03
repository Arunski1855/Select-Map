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
  South: '#f39c12',
  North: '#1a9fc9'
}

/**
 * adidas Zone Graphic Primary Colors
 */
export const primaryColors = {
  A000: { name: 'Black', hex: '#000000' },
  A001: { name: 'White', hex: '#FFFFFF' },
  A38: { name: 'Team Maroon', hex: '#5C1F35' },
  A39: { name: 'Team Burgundy', hex: '#6D2C3B' },
  A46: { name: 'Team Power Red', hex: '#BF0D3E' },
  A68: { name: 'Team Orange', hex: '#E35205' },
  A86: { name: 'Team Collegiate Gold', hex: '#CC8A00' },
  A89: { name: 'Team Gold', hex: '#FFB81C' },
  A104: { name: 'Bright Yellow', hex: '#FFFF00' },
  A106: { name: 'Solar Yellow', hex: '#FFF200' },
  A116: { name: 'Team Solar Green', hex: '#C4D600' },
  A167: { name: 'Team Kelly Green', hex: '#009639' },
  A186: { name: 'Team Dark Green', hex: '#00573F' },
  A205: { name: 'Team Forest Green', hex: '#0D381E' }
}

/**
 * adidas Zone Graphic Secondary Colors
 */
export const secondaryColors = {
  A211: { name: 'Teal', hex: '#00857D' },
  A217: { name: 'Team Shock Blue', hex: '#009FDF' },
  A237: { name: 'Team Royal Blue', hex: '#0065BD' },
  A263: { name: 'Team Collegiate Royal', hex: '#002F87' },
  A268: { name: 'Team Navy Blue', hex: '#001F5B' },
  A292: { name: 'Team College Purple', hex: '#512D6D' },
  A296: { name: 'Team Purple', hex: '#6D2077' },
  A318: { name: 'Team Pink', hex: '#E31C79' },
  A348: { name: 'Team Light Grey', hex: '#A2AAAD' },
  A350: { name: 'Team Sand', hex: '#C5B9A0' },
  A355: { name: 'Dark Grey Heather', hex: '#5C6670' },
  A432: { name: 'Orange Rush', hex: '#FF6720' },
  A466: { name: 'Red Rush', hex: '#ED174C' },
  A469: { name: 'Blue Rush', hex: '#0033A0' }
}

/**
 * All adidas colors combined
 */
export const adidasColors = {
  ...primaryColors,
  ...secondaryColors
}
