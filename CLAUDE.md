# ADI SEL3CT Map - Project Instructions

## Brand Hierarchy (Permanent)

**This is an adidas Select property.** The following brand hierarchy must be respected in all design and development decisions:

1. **ADI SEL3CT Brand Guidelines** (Primary/Superior) - The `/adi-select` skill defines the specific visual identity for this application
2. **adidas Master Brand Guidelines** (Foundation) - All ADI SEL3CT decisions tie back to the broader adidas brand system

### Key Principles
- ADI SEL3CT guidelines take precedence for this application
- When ADI SEL3CT is silent on a topic, defer to adidas master brand guidelines
- Never deviate from either without explicit approval
- Always invoke the `adi-select` skill when making design/styling decisions

## Live Deployment (CRITICAL)
- **Live site: https://select-map.vercel.app** — this is the site used by the entire team
- Vercel production branch is `claude/edit-targets-tab-DgahN` — every push to this branch deploys automatically
- No user action required — pushing to the branch IS the deployment
- Never consider a task complete until the push is confirmed and changes are live at select-map.vercel.app

## Technical Stack
- React + Vite frontend
- Firebase Realtime Database (not Firestore)
- Leaflet for mapping
- No backend server - all client-side

## Design System (ADI SEL3CT)

### Typography
- **Only adidasFG** - No other typefaces permitted
- 10% letter-spacing (`0.1em`) on all type
- Headlines: adidas FG Compressed Bold Italic, ALL CAPS
- Body: adidas FG Compressed, sentence case

### Colors
- Primary: Black (`#000000`), White (`#FFFFFF`)
- Accent: Neon Magenta (`#E500A4`) - brand-led moments only
- School-led moments: Replace magenta with school's primary color

### Shapes & Elements
- Sharp corners only - NO border-radius on brand elements
- Angular line work, 45° or steeper cuts
- Fast transitions (200-300ms)

## Firebase Structure
- Programs: `programs/{sport}/{programId}`
- Contracts: `contractDetails/{sport}/{programId}`
- Target pipeline: `targetPrograms/{sport}/{targetId}`
- Events: `events/{eventId}`
- Allowed users: `allowedUsers/{pushId}`

## Authorization
- `allowedUsers` whitelist controls edit access
- All whitelisted users have equal permissions
- `isUserAllowed` boolean gates UI features
