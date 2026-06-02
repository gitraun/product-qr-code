import QRCode from 'qrcode'
import { writeFileSync, mkdirSync } from 'node:fs'

const url =
  'https://wonderful-scabiosa-e45.notion.site/Manufacturer-Details-373c8079916d800c8f0deb0049c34ad3'

// Level H = ~30% error correction, leaving room for the center logo.
const svg = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' },
})

// Pull the module-grid size from the generated viewBox (e.g. "0 0 33 33").
const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/)
const size = Number(vb[1])
const c = size / 2

// Badge sized to sit safely within the H-level error-correction budget.
const badge = size * 0.26
const r = badge / 2
const radius = badge * 0.22
const fontSize = badge * 0.42

const overlay = `
  <rect x="${c - r}" y="${c - r}" width="${badge}" height="${badge}" rx="${radius}" ry="${radius}" fill="#ffffff"/>
  <rect x="${c - r}" y="${c - r}" width="${badge}" height="${badge}" rx="${radius}" ry="${radius}" fill="none" stroke="#000000" stroke-width="${badge * 0.06}"/>
  <text x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#000000" letter-spacing="${badge * 0.01}">TGB</text>
`

const out = svg.replace('</svg>', `${overlay}</svg>`)

mkdirSync('public', { recursive: true })
writeFileSync('public/qr-manufacturer.svg', out)
console.log(`Wrote public/qr-manufacturer.svg (grid ${size}x${size})`)
