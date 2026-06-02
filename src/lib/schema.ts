import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const redirects = pgTable('redirects', {
  slug: text('slug').primaryKey(),
  destination: text('destination').notNull(),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Redirect = typeof redirects.$inferSelect
export type NewRedirect = typeof redirects.$inferInsert
