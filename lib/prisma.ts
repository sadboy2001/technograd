// lib/prisma.ts
// Neon serverless PostgreSQL + Prisma singleton
// Works on Vercel Edge/Serverless without connection pool exhaustion

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // In production use Neon serverless adapter (HTTP-based, no persistent TCP connections)
  if (process.env.NODE_ENV === 'production' || process.env.NEON_DATABASE_URL) {
    const connectionString = process.env.DATABASE_URL!
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({
      adapter,
      log: ['error'],
    })
  }

  // In development: standard PrismaClient (works with local PostgreSQL or Neon direct)
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
