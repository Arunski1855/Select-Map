/**
 * Shared constants for ADI SEL3CT Map
 * Single source of truth for regions, colors, states, and configuration
 */

// Region definitions with colors
export const REGIONS = {
  'Canada': { color: '#d4002a', states: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'] },
  'Mid Atlantic': { color: '#005eb8', states: ['NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV'] },
  'South': { color: '#ff6b00', states: ['FL', 'GA', 'SC', 'NC', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'TX', 'OK'] },
  'Midwest': { color: '#7d2d8e', states: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'] },
  'North': { color: '#1a9fc9', states: ['ME', 'NH', 'VT', 'MA', 'CT', 'RI'] },
  'West': { color: '#00a550', states: ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'CO', 'NM', 'ID', 'MT', 'WY', 'AK', 'HI'] }
}

// Simple region list for dropdowns
export const REGION_LIST = ['Canada', 'Mid Atlantic', 'North', 'South', 'Midwest', 'West']

// US States for dropdown
export const US_STATES = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
]

// Canadian Provinces for dropdown
export const CA_PROVINCES = [
  { abbr: 'AB', name: 'Alberta' }, { abbr: 'BC', name: 'British Columbia' },
  { abbr: 'MB', name: 'Manitoba' }, { abbr: 'NB', name: 'New Brunswick' },
  { abbr: 'NL', name: 'Newfoundland and Labrador' }, { abbr: 'NS', name: 'Nova Scotia' },
  { abbr: 'ON', name: 'Ontario' }, { abbr: 'PE', name: 'Prince Edward Island' },
  { abbr: 'QC', name: 'Quebec' }, { abbr: 'SK', name: 'Saskatchewan' }
]

// Bahamas Islands for dropdown
export const BS_ISLANDS = [
  { abbr: 'BS-NP', name: 'Nassau / New Providence' }, { abbr: 'BS-GBI', name: 'Grand Bahama' },
  { abbr: 'BS-AB', name: 'Abaco' }, { abbr: 'BS-EL', name: 'Eleuthera' },
  { abbr: 'BS-EX', name: 'Exuma' }, { abbr: 'BS-AN', name: 'Andros' },
  { abbr: 'BS-BI', name: 'Bimini' }, { abbr: 'BS-LI', name: 'Long Island' }
]

// Program level colors
export const LEVEL_COLORS = {
  'Mahomes': '#e31837',
  'Gold': '#c9a84c',
  'Silver': '#8a8d8f',
  'Bronze': '#a0714f',
  'Regional': '#005eb8'
}

// Program levels by sport
export const PROGRAM_LEVELS = ['Gold', 'Silver', 'Bronze', 'Regional']
export const FOOTBALL_PROGRAM_LEVELS = ['Mahomes', 'Gold', 'Silver', 'Bronze', 'Regional']

// Pipeline status configuration (for target programs)
export const PIPELINE_STATUSES = [
  { id: 'identified', label: 'Identified', description: 'On our radar', color: '#6b7280' },
  { id: 'contacted', label: 'Contacted', description: 'Initial outreach made', color: '#3b82f6' },
  { id: 'in_discussion', label: 'In Discussion', description: 'Active conversations', color: '#8b5cf6' },
  { id: 'proposal_sent', label: 'Proposal Sent', description: 'Offer extended', color: '#f59e0b' },
  { id: 'negotiating', label: 'Negotiating', description: 'Working terms', color: '#ec4899' },
  { id: 'signed', label: 'Signed', description: 'Won', color: '#10b981' },
  { id: 'lost', label: 'Lost', description: 'Went elsewhere', color: '#ef4444' }
]

// Priority configuration
export const PRIORITIES = [
  { id: 'high', label: 'High', description: 'Must-have programs', color: '#ef4444' },
  { id: 'medium', label: 'Medium', description: 'Strong targets', color: '#f59e0b' },
  { id: 'low', label: 'Low', description: 'Nice to have', color: '#6b7280' }
]

// adidas Zone Graphic color palette (team colors)
export const TEAM_COLORS = [
  // Primary Colors
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Team Maroon', hex: '#5C1F35' },
  { name: 'Team Burgundy', hex: '#6D2C3B' },
  { name: 'Team Power Red', hex: '#BF0D3E' },
  { name: 'Team Orange', hex: '#E35205' },
  { name: 'Team Collegiate Gold', hex: '#CC8A00' },
  { name: 'Team Gold', hex: '#FFB81C' },
  { name: 'Bright Yellow', hex: '#FFFF00' },
  { name: 'Solar Yellow', hex: '#FFF200' },
  { name: 'Team Solar Green', hex: '#C4D600' },
  { name: 'Team Kelly Green', hex: '#009639' },
  { name: 'Team Dark Green', hex: '#00573F' },
  { name: 'Team Forest Green', hex: '#0D381E' },
  // Secondary Colors
  { name: 'Teal', hex: '#00857D' },
  { name: 'Team Shock Blue', hex: '#009FDF' },
  { name: 'Team Royal Blue', hex: '#0065BD' },
  { name: 'Team Collegiate Royal', hex: '#002F87' },
  { name: 'Team Navy Blue', hex: '#001F5B' },
  { name: 'Team College Purple', hex: '#512D6D' },
  { name: 'Team Purple', hex: '#6D2077' },
  { name: 'Team Pink', hex: '#E31C79' },
  { name: 'Team Light Grey', hex: '#A2AAAD' },
  { name: 'Team Sand', hex: '#C5B9A0' },
  { name: 'Dark Grey Heather', hex: '#5C6670' },
  { name: 'Orange Rush', hex: '#FF6720' },
  { name: 'Red Rush', hex: '#ED174C' },
  { name: 'Blue Rush', hex: '#0033A0' }
]

// Team colors as hex lookup map
export const TEAM_COLORS_HEX = TEAM_COLORS.reduce((acc, color) => {
  acc[color.name] = color.hex
  return acc
}, {})

// Gender options
export const GENDER_OPTIONS = ['Boys', 'Girls']

// Team type options (for Mt. Zion)
export const TEAM_TYPE_OPTIONS = ['Prep', 'National']

// Tab configuration
export const TABS = [
  { id: 'basketball', name: 'Select Basketball', icon: '/logos/adidas-select-basketball.png' },
  { id: 'football', name: 'Select Football (Mahomes)', icon: '/logos/mahomes-logo.png' },
  { id: 'events', name: 'Select Events', icon: '/logos/adidas-logo.png' },
  { id: 'targets', name: 'Target Programs', icon: '/logos/adidas-logo.png' }
]

// State centers for map labels
export const STATE_CENTERS = {
  AL:[32.8,-86.8],AK:[64.2,-152.5],AZ:[34.3,-111.7],AR:[34.8,-92.2],CA:[37.2,-119.5],
  CO:[39.0,-105.5],CT:[41.6,-72.7],DE:[39.0,-75.5],FL:[28.6,-82.4],GA:[32.7,-83.5],
  HI:[20.5,-157.5],ID:[44.4,-114.6],IL:[40.0,-89.2],IN:[39.9,-86.3],IA:[42.0,-93.5],
  KS:[38.5,-98.3],KY:[37.8,-85.7],LA:[31.0,-92.0],ME:[45.4,-69.2],MD:[39.0,-76.8],
  MA:[42.3,-71.8],MI:[44.3,-85.6],MN:[46.3,-94.3],MS:[32.7,-89.7],MO:[38.4,-92.5],
  MT:[47.0,-109.6],NE:[41.5,-99.8],NV:[39.3,-116.6],NH:[43.7,-71.6],NJ:[40.1,-74.7],
  NM:[34.4,-106.1],NY:[42.9,-75.5],NC:[35.5,-79.8],ND:[47.4,-100.5],OH:[40.4,-82.7],
  OK:[35.6,-97.5],OR:[44.0,-120.5],PA:[40.9,-77.8],RI:[41.7,-71.5],SC:[33.9,-80.9],
  SD:[44.4,-100.2],TN:[35.9,-86.4],TX:[31.5,-99.3],UT:[39.3,-111.7],VT:[44.1,-72.6],
  VA:[37.5,-78.8],WA:[47.4,-120.5],WV:[38.6,-80.6],WI:[44.6,-89.8],WY:[43.0,-107.5],
  DC:[38.9,-77.0]
}

/**
 * Auto-detect region from state/province abbreviation
 * @param {string} state - State abbreviation (e.g., 'CA', 'ON')
 * @returns {string} Region name or empty string
 */
export const determineRegion = (state) => {
  if (!state) return ''
  // Bahamas goes to South region
  if (state.startsWith('BS-')) return 'South'

  for (const [region, data] of Object.entries(REGIONS)) {
    if (data.states.includes(state)) return region
  }
  return ''
}
