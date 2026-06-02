'use server'

import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
}

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function upsertRedirect(formData: FormData) {
  await requireAdmin()

  const slug = normalizeSlug(String(formData.get('slug') ?? ''))
  const destination = String(formData.get('destination') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim() || null

  if (!slug) throw new Error('Slug is required')
  if (!/^https?:\/\//.test(destination)) {
    throw new Error('Destination must be an http(s) URL')
  }

  await db
    .insert(redirects)
    .values({ slug, destination, label })
    .onConflictDoUpdate({
      target: redirects.slug,
      set: { destination, label, updatedAt: new Date() },
    })

  revalidatePath('/admin')
}

export async function deleteRedirect(formData: FormData) {
  await requireAdmin()
  const slug = String(formData.get('slug') ?? '')
  if (slug) {
    await db.delete(redirects).where(eq(redirects.slug, slug))
    revalidatePath('/admin')
  }
}
