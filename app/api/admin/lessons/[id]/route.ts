// app/api/admin/lessons/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const body = await request.json()
  const data: any = {}
  if (body.title !== undefined) data.title = body.title
  if (body.order !== undefined) data.order = body.order

  const lesson = await prisma.lesson.update({ where: { id: params.id }, data })
  return NextResponse.json(lesson)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  await prisma.lesson.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
