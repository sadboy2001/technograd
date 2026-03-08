// app/api/admin/steps/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const body = await request.json()

  const data: any = {}
  if (body.title       !== undefined) data.title       = body.title
  if (body.content     !== undefined) data.content     = body.content
  if (body.question    !== undefined) data.question    = body.question
  if (body.instruction !== undefined) data.instruction = body.instruction
  if (body.explanation !== undefined) data.explanation = body.explanation
  if (body.multiple    !== undefined) data.multiple    = body.multiple
  if (body.points      !== undefined) data.points      = body.points
  if (body.order       !== undefined) data.order       = body.order
  if (body.options       !== undefined) data.options       = JSON.stringify(body.options)
  if (body.correctAnswers !== undefined) data.correctAnswers = JSON.stringify(body.correctAnswers)

  const step = await prisma.step.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(step)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  await prisma.step.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
