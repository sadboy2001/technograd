// app/api/admin/steps/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// POST — create new step
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const body = await request.json()
  const { lessonId, type, title, order, ...rest } = body

  if (!lessonId || !type || !title) {
    return NextResponse.json({ error: 'lessonId, type, title required' }, { status: 400 })
  }

  // If no order given, append to end
  let stepOrder = order
  if (stepOrder === undefined) {
    const last = await prisma.step.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' }
    })
    stepOrder = (last?.order ?? -1) + 1
  }

  const step = await prisma.step.create({
    data: {
      lessonId,
      type,
      title,
      order: stepOrder,
      content:        rest.content || null,
      question:       rest.question || null,
      instruction:    rest.instruction || null,
      options:        rest.options ? JSON.stringify(rest.options) : null,
      correctAnswers: rest.correctAnswers ? JSON.stringify(rest.correctAnswers) : null,
      multiple:       rest.multiple || false,
      explanation:    rest.explanation || null,
      points:         rest.points || 1,
      statsSolved:    rest.statsSolved || 0,
      statsAccuracy:  rest.statsAccuracy || 0,
      practiceType:   rest.practiceType || null,
      description:    rest.description || null,
    }
  })

  return NextResponse.json(step)
}
