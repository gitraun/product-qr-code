import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { upsertRedirect, deleteRedirect } from './actions'

const baseUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const rows = await db
    .select()
    .from(redirects)
    .orderBy(desc(redirects.updatedAt))

  return (
    <div className="space-y-8">
      {/* Create / update form */}
      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Add or update a redirect
        </h2>
        <form action={upsertRedirect} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Slug</span>
            <input
              name="slug"
              required
              placeholder="my-product"
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Label (optional)</span>
            <input
              name="label"
              placeholder="Summer bottle batch"
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-gray-600">Destination URL</span>
            <input
              name="destination"
              required
              type="url"
              placeholder="https://example.com/page"
              className="rounded-md border px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      {/* Existing redirects */}
      <section className="rounded-lg border bg-white">
        <h2 className="border-b px-5 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Redirects ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            No redirects yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.slug} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">
                      /p/{r.slug}
                    </code>
                    {r.label && (
                      <span className="text-xs text-gray-400">{r.label}</span>
                    )}
                  </div>
                  <a
                    href={r.destination}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm text-blue-600 hover:underline"
                  >
                    {r.destination}
                  </a>
                  <span className="text-xs text-gray-400">
                    {baseUrl}/p/{r.slug}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <a
                    href={`/api/qr/${r.slug}?format=svg&download=1`}
                    className="text-gray-600 hover:underline"
                  >
                    SVG
                  </a>
                  <a
                    href={`/api/qr/${r.slug}?format=png&download=1`}
                    className="text-gray-600 hover:underline"
                  >
                    PNG
                  </a>
                  <form action={deleteRedirect}>
                    <input type="hidden" name="slug" value={r.slug} />
                    <button
                      type="submit"
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
