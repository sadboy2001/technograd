// app/api/admin/courses/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const courses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              steps: { orderBy: { order: 'asc' } }
            }
          }
        }
      }
    }
  })

  return NextResponse.json(courses)
}
