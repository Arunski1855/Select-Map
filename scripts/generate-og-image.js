import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const svgPath = join(__dirname, '../public/og-image.svg')
const pngPath = join(__dirname, '../public/og-image.png')

const svgBuffer = readFileSync(svgPath)

sharp(svgBuffer)
  .resize(1200, 630)
  .png()
  .toFile(pngPath)
  .then(() => console.log('Generated og-image.png successfully!'))
  .catch(err => console.error('Error generating image:', err))
