// app/api/progress/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const course = searchParams.get('course') || 'basic'

  const record = await prisma.userProgress.findUnique({
    where: { userId_course: { userId: user.id, course } },
  })

  return NextResponse.json({
    completedSteps:  record ? JSON.parse(record.completedSteps) : [],
    lastLessonId:    record?.lastLessonId  ?? null,
    lastStepIndex:   record?.lastStepIndex ?? null,
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  let body: any
  try {
    const ct = request.headers.get('content-type') || ''
    // sendBeacon sends text/plain — parse the raw text as JSON
    if (ct.includes('text/plain')) {
      const text = await request.text()
      body = JSON.parse(text)
    } else {
      body = await request.json()
    }
  } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { course, completedSteps, lastLessonId, lastStepIndex } = body
  if (!course || !Array.isArray(completedSteps)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  try {
    await prisma.userProgress.upsert({
      where:  { userId_course: { userId: user.id, course } },
      update: {
        completedSteps: JSON.stringify(completedSteps),
        lastLessonId:   lastLessonId  ?? null,
        lastStepIndex:  lastStepIndex ?? null,
      },
      create: {
        userId: user.id,
        course,
        completedSteps: JSON.stringify(completedSteps),
        lastLessonId:   lastLessonId  ?? null,
        lastStepIndex:  lastStepIndex ?? null,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[/api/progress] DB error:', e?.message)
    return NextResponse.json({ error: 'DB error', detail: e?.message }, { status: 500 })
  }
}
