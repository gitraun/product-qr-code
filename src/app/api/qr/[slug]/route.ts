import QRCode from 'qrcode'
import { auth } from '@/auth'

const baseUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

// Returns a print-ready QR image encoding `${baseUrl}/p/${slug}`.
// ?format=svg (default) or png, ?download=1 to force a file download.
export async function GET(
  request: Request,
  ctx: RouteContext<'/api/qr/[slug]'>,
) {
  // QR generation is only exposed to signed-in admins.
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { slug } = await ctx.params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') === 'png' ? 'png' : 'svg'
  const download = searchParams.get('download') === '1'

  const target = `${baseUrl}/p/${slug}`

  const headers = new Headers()
  if (download) {
    headers.set(
      'Content-Disposition',
      `attachment; filename="qr-${slug}.${format}"`,
    )
  }

  if (format === 'png') {
    const buf = await QRCode.toBuffer(target, {
      type: 'png',
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
    headers.set('Content-Type', 'image/png')
    return new Response(new Uint8Array(buf), { headers })
  }

  const svg = await QRCode.toString(target, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
  })
  headers.set('Content-Type', 'image/svg+xml')
  return new Response(svg, { headers })
}
