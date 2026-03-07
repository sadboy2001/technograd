// types/next-auth.d.ts
// Extend the built-in NextAuth types to include `id` on session.user

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}
