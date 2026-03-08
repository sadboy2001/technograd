// app/api/admin/lessons/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { chapterId, title, id } = await request.json()
  if (!chapterId || !title) {
    return NextResponse.json({ error: 'chapterId and title required' }, { status: 400 })
  }

  const last = await prisma.lesson.findFirst({
    where: { chapterId },
    orderBy: { order: 'desc' }
  })
  const order = (last?.order ?? -1) + 1

  // Generate id if not provided
  const lessonId = id || `lesson_${Date.now()}`

  const lesson = await prisma.lesson.create({
    data: { id: lessonId, chapterId, title, order }
  })

  return NextResponse.json(lesson)
}
