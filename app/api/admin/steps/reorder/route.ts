// app/api/admin/steps/reorder/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// POST — swap order of two steps
// body: { stepId: string, direction: 'up' | 'down' }
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { stepId, direction } = await request.json()
  if (!stepId || !direction) {
    return NextResponse.json({ error: 'stepId and direction required' }, { status: 400 })
  }

  const step = await prisma.step.findUnique({ where: { id: stepId } })
  if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

  // Get all steps in this lesson sorted by order
  const steps = await prisma.step.findMany({
    where: { lessonId: step.lessonId },
    orderBy: { order: 'asc' },
  })

  const idx = steps.findIndex(s => s.id === stepId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1

  if (swapIdx < 0 || swapIdx >= steps.length) {
    return NextResponse.json({ error: 'Cannot move further' }, { status: 400 })
  }

  const other = steps[swapIdx]

  // Swap orders
  await prisma.$transaction([
    prisma.step.update({ where: { id: step.id }, data: { order: other.order } }),
    prisma.step.update({ where: { id: other.id }, data: { order: step.order } }),
  ])

  return NextResponse.json({ ok: true })
}
