import { auth, signIn, signOut } from '@/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-gray-500">
          Only allow-listed Google accounts can access this panel.
        </p>
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/admin' })
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Sign in with Google
          </button>
        </form>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">QR Redirects</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{session.user?.email}</span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin' })
            }}
          >
            <button type="submit" className="text-gray-600 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  )
}
