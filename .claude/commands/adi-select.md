# ADI SEL3CT Brand Guidelines

Use these guidelines when building UI, creating assets, or making design decisions for the Adidas Select Map application.

---

## Visual Identity Structure

The ADI SEL3CT identity has two layers:

### Design Constants (Always Present)
- **Logo**: ADI SEL3CT wordmark (note: "3" replaces "E")
- **Graphic Elements & Layouts**: Consistent structural patterns
- **Color Foundation**: Black & White (Adidas Master Brand)

### Design Variables (Context-Dependent)

**Path 1: Brand-Led Moments**
- Use for: Adidas-owned content, splash screens, general UI, brand marketing
- Accent Color: Neon Magenta (`#E500A4`)
- Texture: Magenta blur backdrops
- Imagery: Brand photography and artwork

**Path 2: School-Led Moments**
- Use for: Individual program pages, school-specific content, promotional materials
- Primary Color: School's primary color (replaces magenta)
- Accent Color: School's secondary color
- Logo: School logo integration alongside ADI SEL3CT
- Image Treatment: Athlete in colored circle cutout on black background
- Branding Bar: Bottom strip with ADI SEL3CT wordmark + school name + sport tag

---

## Logo System

### Global Brand Design Requirements
- **Retain "ADI"** in the program name and wordmark (ADI SEL3CT, not just SEL3CT)
- **Detach BOS** (Badge of Sport / adidas logo) from the wordmark
- **BOS Hierarchy**: BOS must be at top of visual hierarchy
- **Clear Space**: Proper spacing between BOS and wordmark

### Wordmark Variants
1. **Primary (Horizontal)**: BOS + "ADI SEL3CT" side by side (with clear space between)
2. **Stacked**: BOS centered above "ADI SEL3CT" wordmark
3. **Simplified**: "ADI SEL3CT" wordmark only (no BOS) - for tight spaces

### Color Applications
- **On Light**: Black logo on white/light backgrounds
- **On Dark**: White logo on black/dark backgrounds
- Never use other colors for the logo itself

### Clear Space
- Maintain minimum clear space equal to the height of the "A" in ADI SEL3CT around all sides
- BOS and wordmark must have visible separation (not touching)

---

## Shield Symbol / Badge

### Primary Symbol Structure
The shield badge is a key graphic element that can be used as a micro-expression or expanded into larger layouts.

```
    ┌─────────────────┐
    │       BOS       │  ← adidas Performance logo at top
    │    ADI SEL3CT   │  ← Wordmark below BOS
    │   ┌─────────┐   │
    │   │  2026   │   │  ← Year OR Sport in bottom section
    │   └─────────┘   │
    └─────────────────┘
```

### Shield Variants
| Type | Bottom Content | Use Case |
|------|----------------|----------|
| **Year Badge** | "2026" (or current year) | General branding, event materials |
| **Sport Badge** | "BASKETBALL", "FOOTBALL", etc. | Sport-specific content |
| **School Badge** | School name | School-led moments |

### Shield Rules
- Shield shape is **approved**
- **Do NOT** use three-stripes as decorative element inside shield
- BOS must serve as top/primary branding element
- Bottom tag area can be filled with magenta (brand-led) or school color (school-led)

### Badge Applications
- Helmet decals (small, micro-expression)
- Jersey patches
- Backpack/equipment labels
- Social media profile images
- Pennants and banners
- Event signage

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Black | `#000000` | Primary backgrounds, text, UI elements |
| White | `#FFFFFF` | Primary backgrounds, text, UI elements |

### Secondary / Accent
| Name | Hex | Usage |
|------|-----|-------|
| Neon Magenta | `#E500A4` | Accent color, highlights, CTAs, blur textures |
| Magenta Light | `#FF2EC4` | Hover states, gradients |
| Magenta Dark | `#B8007F` | Active states, shadows |

### Rationale
Neon Magenta was chosen specifically because it won't conflict with any school's primary colors, allowing brand-led moments to stand apart from school-led content.

---

## Typography

### Primary Typefaces

**Headlines & Display**
- Font: `adidas FG Compressed Bold Italic`
- Use for: Main headlines, hero text, impact statements
- Style: ALL CAPS, tight letter-spacing

**Subheadlines & Labels**
- Font: `adidas FG Compressed`
- Use for: Secondary headlines, navigation, labels
- Style: ALL CAPS or Title Case

**Body Text**
- Font: `Denton Light` or system sans-serif fallback
- Use for: Paragraphs, descriptions, form content
- Style: Sentence case

### CSS Font Stacks
```css
--font-heading: 'adidas FG Compressed', 'Barlow Condensed', 'Arial Narrow', sans-serif;
--font-body: 'Denton', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

---

## Texture: Blur Backdrops

### Usage
- Apply magenta blur textures as background elements for brand-led moments
- Use behind splash screens, modals, hero sections
- Creates depth and energy while maintaining legibility

### Implementation
```css
/* Blur backdrop overlay */
.brand-backdrop {
  background: linear-gradient(
    135deg,
    rgba(229, 0, 164, 0.3) 0%,
    rgba(229, 0, 164, 0.1) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  backdrop-filter: blur(40px);
}

/* Alternative: Image-based blur texture */
.brand-texture {
  background-image: url('/textures/magenta-blur.jpg');
  background-size: cover;
  background-position: center;
}
```

### Do's
- Layer blur over dark backgrounds for best contrast
- Use blur at 30-60% opacity for overlays
- Combine with black/white typography

### Don'ts
- Don't use blur textures on school-led content
- Don't place blur behind small text (legibility)
- Don't oversaturate - keep it subtle

---

## Graphic Elements

### Line Work
- Use bold, angular lines
- Diagonal cuts at 45° or steeper angles
- Thick stroke weights (3-6px at screen resolution)

### Shapes
- Rectangular containers with sharp corners (no border-radius on brand elements)
- Diagonal slice overlays
- Geometric patterns derived from the trefoil

### Motion Principles
- Fast, energetic transitions (200-300ms)
- Slide-in from angles, not just horizontal/vertical
- Scale with slight rotation for impact

---

## Layout: Ticker Tape

A horizontal strip that combines logos, graphic elements, and messaging at the same height. Used across physical and digital applications.

### Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ WELCOME TO │ [BOS] │ ADI SEL3CT │ [BADGE] │ THE S-TIER │ [BOS] │   │
│ THE S-TIER │       │            │  2026   │            │       │   │
└─────────────────────────────────────────────────────────────────────┘
```

### Ticker Tape Elements
- **BOS (Badge of Sport)**: adidas Performance logo
- **Wordmark**: "ADI SEL3CT" in FG Compressed Bold Italic
- **Shield Badge**: Year badge or sport badge
- **Messaging**: Taglines like "WELCOME TO THE S-TIER"
- **Separator**: Vertical lines or spacing between elements

### Ticker Tape Applications
| Context | Background | Text Color |
|---------|------------|------------|
| Brand-Led | Magenta `#E500A4` | White |
| School-Led | School Primary Color | White or Black (contrast) |
| Neutral | Black | White |

### Use Cases
- Event banners and signage
- Social media headers
- Website hero sections
- Broadcast graphics lower thirds
- Physical venue branding (field wraps, court sides)

### CSS Implementation
```css
.ticker-tape {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--adi-magenta);
  color: var(--adi-white);
  font-family: var(--font-display);
  font-weight: 700;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
}

.ticker-tape__separator {
  width: 2px;
  height: 1.5rem;
  background: currentColor;
  opacity: 0.5;
}

.ticker-tape--school {
  background: var(--school-accent);
}
```

---

## School-Led Moments (Detailed)

When creating graphics in the context of a specific school, the ADI SEL3CT system flexes to accommodate each program while maintaining brand consistency.

### Color Swap Principle
- Replace signature magenta with school's primary color
- Black and white remain constant
- Any school color can take the place of magenta

### School Adaptation Components

| Element | Treatment |
|---------|-----------|
| **Logo** | ADI SEL3CT wordmark (horizontal or stacked) |
| **Graphic Elements** | Shield/badge format with school name and sport |
| **Typography** | ADIDAS FG COMP BOLD ITALIC (headlines), ADIDAS FG COMP (body) |
| **Color** | Black + White + School Primary Color |
| **School Logo** | Prominently featured, maintains original form |
| **Image Treatment** | Athlete in colored circle cutout on black background |

### Image Treatment Options

There are **three approved image treatments** for athlete/action photography:

#### 1. Clipping (Cutout)
Athlete is cut out from background and placed on solid color or black.

```
┌─────────────────────────────────────┐
│         BLACK BACKGROUND            │
│                                     │
│           [ATHLETE]                 │
│          (cut out, no              │
│           background)               │
│                                     │
│ ═══════════════════════════════════ │
│ ADI SEL3CT | SPORT | SCHOOL NAME   │
└─────────────────────────────────────┘
```

- Use for: Hero images, posters, social cards
- Athlete fully removed from original background
- Place on black or school color
- Add branding bar below

#### 2. Container Shape (Circle Cutout)
Athlete image contained within a geometric shape (usually circle).

```
┌─────────────────────────────────────┐
│             BLACK BG                │
│                                     │
│         ┌───────────┐               │
│        /  SCHOOL    \              │
│       │   COLOR     │              │
│       │   CIRCLE    │              │
│       │  [ATHLETE]  │              │
│        \            /              │
│         └───────────┘               │
│                                     │
│ ═══════════════════════════════════ │
│ ADI SEL3CT | SPORT | SCHOOL NAME   │
└─────────────────────────────────────┘
```

- Use for: Cards, grids, multi-athlete layouts
- Circle filled with school color
- Athlete image clips to circle bounds
- Strong visual consistency across different photos

#### 3. Color Overlay
Full-bleed image with school color overlay and text treatment.

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓   FULL IMAGE WITH SCHOOL     ▓▓ │
│ ▓▓    COLOR OVERLAY (30-50%)    ▓▓ │
│ ▓▓                              ▓▓ │
│ ▓▓      [ LARGE HEADLINE ]      ▓▓ │
│ ▓▓        [ SUBTEXT ]           ▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ADI SEL3CT BRANDING BAR             │
└─────────────────────────────────────┘
```

- Use for: Event promos, announcements, editorial
- Original image remains mostly visible
- School color overlaid at 30-50% opacity
- Large typography placed over image
- Creates dramatic, editorial feel

### CSS for Image Treatments

```css
/* Treatment 1: Clipping */
.athlete-cutout {
  background: var(--adi-black);
  padding: 2rem;
}

.athlete-cutout img {
  /* Image should already be PNG with transparent background */
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

/* Treatment 2: Container Shape */
.athlete-circle {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: var(--school-accent, var(--adi-magenta));
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.athlete-circle img {
  width: 100%;
  height: 120%;
  object-fit: cover;
  object-position: top center;
}

/* Treatment 3: Color Overlay */
.color-overlay {
  position: relative;
  background-size: cover;
  background-position: center;
}

.color-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--school-accent, var(--adi-magenta));
  opacity: 0.4;
  mix-blend-mode: multiply;
}

.color-overlay__content {
  position: relative;
  z-index: 1;
  color: var(--adi-white);
}
```

### Branding Bar Structure
The bottom branding bar appears on all school-led content:
- Left: Adidas Performance logo + "ADI SEL3CT" wordmark
- Center: Sport tag (e.g., "FOOTBALL", "VOLLEYBALL", "BASKETBALL")
- Right: School name + School logo
- Background: Can be black or incorporate school color

### Example School Colors

| School | Location | Primary Color | Hex |
|--------|----------|---------------|-----|
| South Oak Cliff | Dallas, TX | Gold | `#E5A822` |
| Baylor School | Chattanooga, TN | Red | `#C8102E` |
| Prolific Prep | Fort Lauderdale, FL | Lime | `#CCFF00` |

### Consistency Across Sports
The same template structure works for:
- Football
- Basketball
- Volleyball
- Any other sport

Only the athlete imagery, sport tag, and potentially school-specific elements change.

---

## Application Examples

### Splash Screen (Brand-Led)
- Black background
- Centered white Adidas logo
- "ADISEL3CT" wordmark below in white
- Subtle magenta blur in corners
- Animated loader bar in magenta

### Program Card (School-Led)
- School logo prominent
- School primary color replaces magenta entirely
- Black/white typography (ADIDAS FG COMP)
- Circle cutout image treatment for hero images
- Bottom branding bar with: ADI SEL3CT | Sport | School Name

### School Detail Page (School-Led)
- Hero: Athlete in school-colored circle on black
- Header: School name + logo
- Accent color: School primary (not magenta)
- Typography: ADIDAS FG COMP BOLD ITALIC for headlines
- Layout: Consistent grid with branding bar

### Map Markers
- Default: Black/white with school logo
- Selected/Hover: School color highlight
- Contract status: Use functional colors (green=active, orange=expiring)

---

## CSS Variables Reference

```css
:root {
  /* ADI SEL3CT Brand Colors */
  --adi-black: #000000;
  --adi-white: #FFFFFF;
  --adi-magenta: #E500A4;
  --adi-magenta-light: #FF2EC4;
  --adi-magenta-dark: #B8007F;

  /* Typography */
  --font-display: 'adidas FG Compressed', sans-serif;
  --font-body: 'Denton', sans-serif;

  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 400ms ease-out;
}

/* School-Led: Override accent with school color */
[data-school-color] {
  --school-accent: var(--school-primary, var(--adi-magenta));
}

/* Circle Cutout Image Treatment */
.athlete-circle {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: var(--school-accent, var(--adi-magenta));
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.athlete-circle img {
  width: 100%;
  height: auto;
  object-fit: cover;
  object-position: top center;
}

/* Branding Bar */
.branding-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--adi-black);
  padding: 0.75rem 1.5rem;
  gap: 1rem;
}

.branding-bar__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.branding-bar__sport-tag {
  font-family: var(--font-display);
  font-weight: 700;
  font-style: italic;
  text-transform: uppercase;
  color: var(--school-accent, var(--adi-magenta));
  background: var(--adi-white);
  padding: 0.25rem 0.75rem;
}

.branding-bar__school {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--adi-white);
  font-family: var(--font-display);
  text-transform: uppercase;
}
```

---

## Quick Reference

| Element | Font | Color | Notes |
|---------|------|-------|-------|
| App Title | FG Compressed Bold Italic | White on black | ALL CAPS |
| Tab Labels | FG Compressed | White/Black | Uppercase |
| Buttons (Primary) | FG Compressed Bold | White on magenta | Uppercase, no radius |
| Buttons (Secondary) | FG Compressed | Black on white | 2px black border |
| Body Text | Denton Light | Text primary | Sentence case |
| Stats/Numbers | FG Compressed Bold | Magenta accent | Tabular figures |
