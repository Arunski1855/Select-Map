import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const WIDTH = 2560
const HEIGHT = 1440

// ADI SEL3CT Magenta: #E500A4
const MAGENTA = { r: 229, g: 0, b: 164 }

/**
 * Creates a radial gradient blob as raw pixel data
 */
function createGradientBlob(width, height, centerX, centerY, radius, color, intensity = 1.0) {
  const pixels = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Smooth falloff
      let alpha = Math.max(0, 1 - (distance / radius))
      alpha = Math.pow(alpha, 2) * intensity * 255

      const idx = (y * width + x) * 4
      pixels[idx] = color.r
      pixels[idx + 1] = color.g
      pixels[idx + 2] = color.b
      pixels[idx + 3] = Math.min(255, Math.round(alpha))
    }
  }

  return pixels
}

/**
 * Creates streak/wave pattern
 */
function createStreakPattern(width, height, color, intensity = 1.0) {
  const pixels = Buffer.alloc(width * height * 4)

  // Create multiple angled streaks
  const streaks = [
    { x: width * 0.3, y: height * 0.2, angle: -25, length: width * 0.8, thickness: 200 },
    { x: width * 0.5, y: height * 0.5, angle: -20, length: width * 0.9, thickness: 300 },
    { x: width * 0.7, y: height * 0.8, angle: -30, length: width * 0.7, thickness: 150 },
    { x: width * 0.2, y: height * 0.6, angle: -15, length: width * 0.6, thickness: 180 },
    { x: width * 0.8, y: height * 0.3, angle: -35, length: width * 0.5, thickness: 120 },
  ]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let totalAlpha = 0

      for (const streak of streaks) {
        const rad = streak.angle * Math.PI / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        // Transform point relative to streak origin
        const dx = x - streak.x
        const dy = y - streak.y

        // Rotate to streak coordinate system
        const along = dx * cos + dy * sin
        const perp = Math.abs(-dx * sin + dy * cos)

        // Check if within streak bounds
        if (along >= 0 && along <= streak.length && perp < streak.thickness) {
          // Soft edge falloff
          const edgeFade = 1 - (perp / streak.thickness)
          const lengthFade = Math.sin((along / streak.length) * Math.PI) // Fade at ends
          const alpha = Math.pow(edgeFade, 1.5) * lengthFade
          totalAlpha += alpha * 0.4
        }
      }

      const idx = (y * width + x) * 4
      pixels[idx] = color.r
      pixels[idx + 1] = color.g
      pixels[idx + 2] = color.b
      pixels[idx + 3] = Math.min(255, Math.round(totalAlpha * intensity * 255))
    }
  }

  return pixels
}

/**
 * Generate backdrop-intense.jpg
 * Dramatic magenta waves/streaks on black with high saturation
 */
async function generateIntense() {
  console.log('Generating backdrop-intense.jpg...')

  // Create base black image
  const base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })

  // Create streak layer
  const streakPixels = createStreakPattern(WIDTH, HEIGHT, MAGENTA, 1.2)
  const streakLayer = await sharp(streakPixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(60)
    .png()
    .toBuffer()

  // Create central glow blob
  const blob1Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.5, HEIGHT * 0.45, 800, MAGENTA, 0.9)
  const blob1Layer = await sharp(blob1Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(100)
    .png()
    .toBuffer()

  // Create secondary blob
  const blob2Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.3, HEIGHT * 0.6, 500, MAGENTA, 0.6)
  const blob2Layer = await sharp(blob2Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(80)
    .png()
    .toBuffer()

  // Create accent blob
  const blob3Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.75, HEIGHT * 0.35, 400, { r: 255, g: 46, b: 196 }, 0.5)
  const blob3Layer = await sharp(blob3Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(70)
    .png()
    .toBuffer()

  // Composite all layers
  await base
    .composite([
      { input: streakLayer, blend: 'screen' },
      { input: blob1Layer, blend: 'screen' },
      { input: blob2Layer, blend: 'screen' },
      { input: blob3Layer, blend: 'screen' }
    ])
    .jpeg({ quality: 85 })
    .toFile(join(__dirname, '../public/textures/backdrop-intense.jpg'))

  console.log('  ✓ backdrop-intense.jpg created')
}

/**
 * Generate backdrop-soft.jpg
 * Diffused magenta glow with smoky gradients
 */
async function generateSoft() {
  console.log('Generating backdrop-soft.jpg...')

  // Create base black image
  const base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })

  // Create soft diffuse blob - center
  const blob1Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.5, HEIGHT * 0.5, 900, MAGENTA, 0.5)
  const blob1Layer = await sharp(blob1Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(150)
    .png()
    .toBuffer()

  // Create softer secondary blob - offset
  const blob2Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.35, HEIGHT * 0.4, 700, MAGENTA, 0.35)
  const blob2Layer = await sharp(blob2Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(180)
    .png()
    .toBuffer()

  // Create ambient glow
  const blob3Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.65, HEIGHT * 0.6, 600, { r: 200, g: 0, b: 140 }, 0.3)
  const blob3Layer = await sharp(blob3Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(200)
    .png()
    .toBuffer()

  // Composite all layers
  await base
    .composite([
      { input: blob1Layer, blend: 'screen' },
      { input: blob2Layer, blend: 'screen' },
      { input: blob3Layer, blend: 'screen' }
    ])
    .jpeg({ quality: 85 })
    .toFile(join(__dirname, '../public/textures/backdrop-soft.jpg'))

  console.log('  ✓ backdrop-soft.jpg created')
}

/**
 * Generate backdrop-subtle.jpg
 * Very dark with minimal magenta accent
 */
async function generateSubtle() {
  console.log('Generating backdrop-subtle.jpg...')

  // Create base very dark image
  const base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 5, g: 5, b: 5, alpha: 1 }
    }
  })

  // Create very subtle center glow
  const blob1Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.5, HEIGHT * 0.5, 1000, MAGENTA, 0.15)
  const blob1Layer = await sharp(blob1Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(250)
    .png()
    .toBuffer()

  // Create hint of corner accent
  const blob2Pixels = createGradientBlob(WIDTH, HEIGHT, WIDTH * 0.2, HEIGHT * 0.8, 500, MAGENTA, 0.08)
  const blob2Layer = await sharp(blob2Pixels, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .blur(200)
    .png()
    .toBuffer()

  // Composite all layers
  await base
    .composite([
      { input: blob1Layer, blend: 'screen' },
      { input: blob2Layer, blend: 'screen' }
    ])
    .jpeg({ quality: 85 })
    .toFile(join(__dirname, '../public/textures/backdrop-subtle.jpg'))

  console.log('  ✓ backdrop-subtle.jpg created')
}

// Run all generators
async function main() {
  console.log('Generating ADI SEL3CT backdrop textures...\n')
  console.log(`Resolution: ${WIDTH}x${HEIGHT}`)
  console.log(`Magenta: #${MAGENTA.r.toString(16).toUpperCase()}${MAGENTA.g.toString(16).padStart(2, '0').toUpperCase()}${MAGENTA.b.toString(16).toUpperCase()}\n`)

  try {
    await generateIntense()
    await generateSoft()
    await generateSubtle()
    console.log('\n✅ All backdrop textures generated successfully!')
  } catch (error) {
    console.error('\n❌ Error generating textures:', error)
    process.exit(1)
  }
}

main()
