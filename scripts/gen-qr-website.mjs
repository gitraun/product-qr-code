// The Good Bug shop QR code (all collections) — same design language as the
// protein QR (round dots, rounded finder eyes, cleared center zone, TGB logo).
// Run with: node scripts/gen-qr-website.mjs   (npm run qr:website)

import QRCode from 'qrcode'
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const url = 'https://thegoodbug.com/collections/all'

const FG = '#000000'
const BG = '#ffffff'

// Level H = ~30% error correction, so the center clear-zone + logo stay scannable.
const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
const size = qr.modules.size
const data = qr.modules.data // row-major, 1 = dark

const margin = 4 // quiet zone, in modules
const total = size + margin * 2
const off = margin
const center = off + size / 2

const isDark = (r, c) =>
  r >= 0 && c >= 0 && r < size && c < size && data[r * size + c] === 1

// The three finder patterns (position-detection eyes), each 7x7. Only these are
// redrawn by hand — everything else (separators, timing, format info) must stay
// exactly where the encoder put it.
const finders = [
  [0, 0],
  [0, size - 7],
  [size - 7, 0],
]
const inFinder = (r, c) =>
  finders.some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7)

// --- Logo box --------------------------------------------------------------
// Logo_TGB.svg declares a 292.9 x 273 viewBox, but its ink only occupies the
// band below (measured by trimming a raster of the logo). Crop the nested svg
// to that ink box so the glyphs fill the clear zone instead of floating in it.
const LOGO_VIEWBOX = '40.4 87 200.3 105.9'
const LOGO_ASPECT = 105.9 / 200.3
const logoW = size * 0.26
const logoH = logoW * LOGO_ASPECT
const pad = 1.6 // clear space (module units) around the logo box
const clearR = Math.hypot(logoW / 2, logoH / 2) + pad
const inClearZone = (r, c) => {
  const dx = off + c + 0.5 - center
  const dy = off + r + 0.5 - center
  return Math.hypot(dx, dy) <= clearR
}

// --- Body: round dots ------------------------------------------------------
let dots = ''
let dark = 0
let cleared = 0
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (inClearZone(r, c)) cleared++
    if (!isDark(r, c)) continue
    dark++
    if (inFinder(r, c) || inClearZone(r, c)) continue
    dots += `<circle cx="${(off + c + 0.5).toFixed(3)}" cy="${(off + r + 0.5).toFixed(3)}" r="0.42"/>`
  }
}

// --- Finder eyes: rounded square ring + rounded center dot -----------------
let eyes = ''
for (const [fr, fc] of finders) {
  const x = off + fc
  const y = off + fr
  eyes += `
    <rect x="${x}" y="${y}" width="7" height="7" rx="2.1" ry="2.1" fill="${FG}"/>
    <rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1.5" ry="1.5" fill="${BG}"/>
    <rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="1" ry="1" fill="${FG}"/>`
}

// --- Center logo (TGB mark, borderless, sitting on the clear zone) ---------
const logoRaw = readFileSync('Logo_TGB.svg', 'utf8').replace(/<\?xml[^?]*\?>/g, '')
const logoMatch = logoRaw.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
const logoInner = (logoMatch ? logoMatch[1] : logoRaw).trim()

const logo = `
  <svg x="${(center - logoW / 2).toFixed(3)}" y="${(center - logoH / 2).toFixed(3)}"
       width="${logoW.toFixed(3)}" height="${logoH.toFixed(3)}"
       viewBox="${LOGO_VIEWBOX}" overflow="visible">
    <g fill="${FG}">${logoInner}</g>
  </svg>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">
  <title>The Good Bug Shop QR Code</title>
  <desc>Scan to browse all products at thegoodbug.com</desc>
  <rect width="${total}" height="${total}" fill="${BG}"/>
  <g fill="${FG}">${dots}</g>
  ${eyes}
  ${logo}
</svg>`

mkdirSync('public', { recursive: true })
writeFileSync('public/qr-website.svg', svg)

const PNG_SIZE = 2048
await sharp(Buffer.from(svg), { density: 600 })
  .resize(PNG_SIZE, PNG_SIZE)
  .png()
  .toFile('public/qr-website.png')

const clearedPct = ((cleared / (size * size)) * 100).toFixed(1)
console.log(`Wrote public/qr-website.svg + public/qr-website.png (${PNG_SIZE}px)`)
console.log(`  URL encoded: ${url}`)
console.log(`  Grid: ${size}x${size} modules, viewBox ${total}`)
console.log(`  Clear zone: r=${clearR.toFixed(2)} modules, ${clearedPct}% of symbol area (${dark} dark modules total)`)
