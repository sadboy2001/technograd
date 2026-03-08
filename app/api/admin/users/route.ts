// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      progress: {
        select: {
          course: true,
          completedSteps: true,
          updatedAt: true,
        }
      }
    }
  })

  return NextResponse.json(users)
}

// PATCH — change user role
export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { userId, role } = await request.json()
  if (!userId || !['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true }
  })

  return NextResponse.json(user)
}
