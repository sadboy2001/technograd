import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const email = searchParams.get('email')

  // Защита — только с секретным словом
  if (secret !== 'setup2024' || !email) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
    select: { email: true, role: true }
  })

  return NextResponse.json({ ok: true, user })
}
