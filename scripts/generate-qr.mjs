// Generate a styled SVG QR code with TGB logo embedded in the center
// Run with: node scripts/generate-qr.mjs

import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NOTION_URL = 'https://wonderful-scabiosa-e45.notion.site/Manufacturer-Details-38ec8079916d8068bd53c9e7e608f875';
const OUTPUT_PATH = path.join(__dirname, '..', 'metlean-manufacturer-qr.svg');
const LOGO_PATH = path.join(__dirname, '..', 'Logo_TGB.svg');

// QR code settings
const QR_SIZE = 600;          // total SVG canvas size in px
const QUIET_ZONE = 2;         // modules of quiet zone
const DOT_RADIUS_RATIO = 0.45; // dots as circles (< 0.5 = gap between dots)

async function main() {
  // 1. Generate raw QR matrix
  const qrData = await QRCode.create(NOTION_URL, {
    errorCorrectionLevel: 'H', // High – allows logo to cover ~30% of QR
    version: undefined,        // auto
    maskPattern: undefined,
  });

  const matrix = qrData.modules;
  const moduleCount = matrix.size;

  // 2. Calculate module pixel size
  const totalModules = moduleCount + QUIET_ZONE * 2;
  const moduleSize = QR_SIZE / totalModules;
  const dotR = moduleSize * DOT_RADIUS_RATIO;

  // 3. Logo overlay dimensions (center square, ~22% of QR size)
  const logoAreaSize = QR_SIZE * 0.22;
  const logoPad = logoAreaSize * 0.12;        // inner padding
  const logoX = (QR_SIZE - logoAreaSize) / 2;
  const logoY = (QR_SIZE - logoAreaSize) / 2;
  const logoInnerW = logoAreaSize - logoPad * 2;
  const logoInnerH = logoAreaSize - logoPad * 2;

  // Modules that fall inside the logo area – we skip drawing those dots
  function moduleInLogoArea(row, col) {
    const cx = (col + QUIET_ZONE + 0.5) * moduleSize;
    const cy = (row + QUIET_ZONE + 0.5) * moduleSize;
    return (
      cx > logoX - moduleSize &&
      cx < logoX + logoAreaSize + moduleSize &&
      cy > logoY - moduleSize &&
      cy < logoY + logoAreaSize + moduleSize
    );
  }

  // 4. Finder pattern detection helpers
  // Standard finder patterns: top-left, top-right, bottom-left corners
  function isFinderPattern(row, col) {
    const n = moduleCount;
    return (
      (row < 9 && col < 9) ||                     // top-left
      (row < 9 && col >= n - 8) ||                 // top-right
      (row >= n - 8 && col < 9)                    // bottom-left
    );
  }

  // 5. Build SVG elements
  let dots = '';
  let finderPaths = '';

  // We'll draw finder patterns separately as rounded rects
  // top-left (row 0..6, col 0..6), top-right, bottom-left
  function drawFinder(startRow, startCol) {
    const x = (startCol + QUIET_ZONE) * moduleSize;
    const y = (startRow + QUIET_ZONE) * moduleSize;
    const outerSize = 7 * moduleSize;
    const r = moduleSize * 1.2; // corner radius for outer square

    // Outer black ring
    const outer = `<rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" rx="${r}" ry="${r}" fill="black"/>`;
    // White ring (inset 1 module)
    const wInset = moduleSize;
    const wSize = 5 * moduleSize;
    const white = `<rect x="${x + wInset}" y="${y + wInset}" width="${wSize}" height="${wSize}" rx="${r * 0.6}" ry="${r * 0.6}" fill="white"/>`;
    // Inner black dot (inset 2 modules)
    const dInset = 2 * moduleSize;
    const dSize = 3 * moduleSize;
    const inner = `<rect x="${x + dInset}" y="${y + dInset}" width="${dSize}" height="${dSize}" rx="${r * 0.5}" ry="${r * 0.5}" fill="black"/>`;

    return outer + white + inner;
  }

  finderPaths += drawFinder(0, 0);                          // top-left
  finderPaths += drawFinder(0, moduleCount - 7);            // top-right
  finderPaths += drawFinder(moduleCount - 7, 0);            // bottom-left

  // 6. Draw data dots (circles)
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!matrix.get(row, col)) continue;     // light module → skip
      if (isFinderPattern(row, col)) continue; // handled separately
      if (moduleInLogoArea(row, col)) continue;// covered by logo → skip

      const cx = (col + QUIET_ZONE + 0.5) * moduleSize;
      const cy = (row + QUIET_ZONE + 0.5) * moduleSize;
      dots += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${dotR.toFixed(2)}" fill="black"/>`;
    }
  }

  // 7. Read and embed TGB logo SVG inline
  const logoRaw = fs.readFileSync(LOGO_PATH, 'utf8');
  // Strip XML declaration so we can embed it
  const logoSvgContent = logoRaw
    .replace(/<\?xml[^?]*\?>/g, '')
    .trim();

  // Extract inner content from the logo SVG and re-wrap with our positioning
  // We embed it as a <g> with transform inside a <svg> foreignObject-style approach
  // Better: use nested <svg> with explicit position and size
  const logoSvgMatch = logoSvgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const logoInnerContent = logoSvgMatch ? logoSvgMatch[1] : logoSvgContent;

  // Logo original viewBox: 0 0 292.9 273
  const logoViewBox = '0 0 292.9 273';

  // White background rect behind logo
  const logoBg = `<rect x="${logoX.toFixed(2)}" y="${logoY.toFixed(2)}" width="${logoAreaSize.toFixed(2)}" height="${logoAreaSize.toFixed(2)}" rx="${(logoAreaSize * 0.15).toFixed(2)}" fill="white"/>`;

  // Nested SVG for logo with proper scaling
  const logoEmbed = `
  <svg x="${(logoX + logoPad).toFixed(2)}" y="${(logoY + logoPad).toFixed(2)}" 
       width="${logoInnerW.toFixed(2)}" height="${logoInnerH.toFixed(2)}" 
       viewBox="${logoViewBox}" 
       xmlns="http://www.w3.org/2000/svg">
    ${logoInnerContent}
  </svg>`;

  // 8. Compose final SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${QR_SIZE}" height="${QR_SIZE}" 
     viewBox="0 0 ${QR_SIZE} ${QR_SIZE}">
  <title>TGB Manufacturer Details QR Code</title>
  <desc>Scan to view TGB Manufacturer Details on Notion</desc>

  <!-- White background -->
  <rect width="${QR_SIZE}" height="${QR_SIZE}" fill="white"/>

  <!-- Data dots -->
  ${dots}

  <!-- Finder patterns (rounded corners) -->
  ${finderPaths}

  <!-- Logo area white background -->
  ${logoBg}

  <!-- TGB Logo -->
  ${logoEmbed}
</svg>`;

  fs.writeFileSync(OUTPUT_PATH, svg, 'utf8');
  console.log(`✅ QR code saved to: ${OUTPUT_PATH}`);
  console.log(`   URL encoded: ${NOTION_URL}`);
  console.log(`   Modules: ${moduleCount}×${moduleCount}`);
  console.log(`   Module size: ${moduleSize.toFixed(2)}px`);
}

main().catch(console.error);
