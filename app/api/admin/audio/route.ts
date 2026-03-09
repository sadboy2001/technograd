// app/api/admin/audio/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

const MAP_PATH = join(process.cwd(), 'public', 'audio', 'map.json')

async function readMap(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(MAP_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeMap(map: Record<string, string>) {
  await writeFile(MAP_PATH, JSON.stringify(map, null, 2), 'utf-8')
}

// GET /api/admin/audio — get current map
export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const map = await readMap()
  return NextResponse.json(map)
}

// POST /api/admin/audio — upload audio file and update map
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const formData = await request.formData()
  const file = formData.get('file') as File
  const lessonId = formData.get('lessonId') as string

  if (!file || !lessonId) {
    return NextResponse.json({ error: 'file and lessonId required' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'mp3'
  const filename = `${lessonId}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await writeFile(join(process.cwd(), 'public', 'audio', filename), buffer)

  const map = await readMap()
  map[lessonId] = filename
  await writeMap(map)

  return NextResponse.json({ ok: true, filename })
}

// DELETE /api/admin/audio — remove audio for a lesson
export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { lessonId } = await request.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  const map = await readMap()
  delete map[lessonId]
  await writeMap(map)

  return NextResponse.json({ ok: true })
}
