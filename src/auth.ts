import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const allowed = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    // Only let allow-listed emails into the admin panel.
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase()
      if (!email) return false
      // If no allow-list is configured, deny by default.
      return allowed.length > 0 && allowed.includes(email)
    },
  },
})
