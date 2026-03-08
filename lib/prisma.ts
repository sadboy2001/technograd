// lib/prisma.ts
// Neon works with standard PrismaClient via connection pooling URL (pgbouncer=true).
// No custom adapter needed — Neon's pooler handles serverless connections.

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
