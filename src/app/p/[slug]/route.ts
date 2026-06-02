import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Look up the slug and redirect to its destination. 307 keeps the method and
// signals the redirect is temporary, so the destination can change anytime.
export async function GET(
  _request: Request,
  ctx: RouteContext<'/p/[slug]'>,
) {
  const { slug } = await ctx.params

  const [row] = await db
    .select({ destination: redirects.destination })
    .from(redirects)
    .where(eq(redirects.slug, slug))
    .limit(1)

  if (!row) {
    return new Response('Not found', { status: 404 })
  }

  return Response.redirect(row.destination, 307)
}
