import QRCode from 'qrcode'
import { writeFileSync, mkdirSync } from 'node:fs'

const url =
  'https://wonderful-scabiosa-e45.notion.site/Manufacturer-Details-373c8079916d800c8f0deb0049c34ad3'

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

// The three finder patterns (position-detection eyes), each 7x7.
const finders = [
  [0, 0],
  [0, size - 7],
  [size - 7, 0],
]
const inFinder = (r, c) =>
  finders.some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7)

// Clear a circular zone in the middle for the logo.
// Size the circle from the text's bounding box + explicit padding, so there is a
// real gap between the glyphs and the nearest dots (a bare circle ≈ text size
// leaves the wide "TGB" corners touching the dots).
const fontSize = size * 0.15
const halfW = fontSize * 1.05 // approx half-width of "TGB" (Helvetica bold)
const halfH = fontSize * 0.37 // approx half cap-height
const pad = 2.2 // clear space (module units) around the glyphs
const clearR = Math.hypot(halfW, halfH) + pad
const inClearZone = (r, c) => {
  const dx = off + c + 0.5 - center
  const dy = off + r + 0.5 - center
  return Math.hypot(dx, dy) <= clearR
}

// --- Body: round dots ------------------------------------------------------
let dots = ''
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (!isDark(r, c) || inFinder(r, c) || inClearZone(r, c)) continue
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

// --- Center logo (TGB wordmark, borderless, sitting on the clear zone) -----
const logo = `
  <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central"
        font-family="Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${fontSize.toFixed(3)}" fill="${FG}"
        letter-spacing="${(clearR * 0.02).toFixed(3)}">TGB</text>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">
  <rect width="${total}" height="${total}" fill="${BG}"/>
  <g fill="${FG}">${dots}</g>
  ${eyes}
  ${logo}
</svg>`

mkdirSync('public', { recursive: true })
writeFileSync('public/qr-manufacturer.svg', svg)
console.log(`Wrote public/qr-manufacturer.svg (grid ${size}, viewBox ${total})`)
