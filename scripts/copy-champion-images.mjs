/**
 * Copy champion images to public/vu-dai-loan-the-champions/flat/ with ASCII filenames
 * so URLs work reliably (no Unicode encoding issues).
 * Run: node scripts/copy-champion-images.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  CHAMPION_IMAGE_FILES,
  CHAMPION_IMAGE_SLUGS,
  CHAMPION_TRIBE_FOLDER,
  BY_TRIBE
} from '../src/components/VuDaiLoanThe/constants/championImages.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const baseDir = path.join(projectRoot, 'public', 'vu-dai-loan-the-champions')
const flatDir = path.join(baseDir, 'flat')

if (!fs.existsSync(baseDir)) {
  console.error('Not found:', baseDir)
  process.exit(1)
}
fs.mkdirSync(flatDir, { recursive: true })

let copied = 0
let failed = 0
for (const [championKey, slug] of Object.entries(CHAMPION_IMAGE_SLUGS)) {
  const tribeKey = CHAMPION_TRIBE_FOLDER[championKey]
  const fileName = CHAMPION_IMAGE_FILES[championKey]
  if (!tribeKey || !fileName) continue
  const dirName = BY_TRIBE[tribeKey]
  if (!dirName) continue
  const dirNorm = dirName.normalize('NFD')
  const fileNorm = fileName.normalize('NFD')
  const src = path.join(baseDir, dirNorm, fileNorm)
  const dest = path.join(flatDir, `${slug}.png`)
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      copied++
    } else {
          const alt = path.join(baseDir, dirName, fileName)
      if (fs.existsSync(alt)) {
        fs.copyFileSync(alt, dest)
        copied++
      } else {
        console.warn('Missing:', src)
        failed++
      }
    }
  } catch (err) {
    console.warn('Copy failed', championKey, err.message)
    failed++
  }
}
console.log(`Copied ${copied} images to flat/, ${failed} failed.`)
