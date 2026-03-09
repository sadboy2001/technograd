// app/api/course/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courseId = params.id // 'basic' | 'advanced' | 'final'

  const course = await prisma.course.findUnique({
    where: { id: courseId },
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

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Transform DB format → format expected by main.js
  const chapters = course.chapters.map(ch => ({
    id: ch.id,
    title: ch.title,
    lessons: ch.lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      steps: lesson.steps.map(step => {
        const base = {
          id: step.id,
          type: step.type,
          title: step.title,
        }

        if (step.type === 'theory') {
          return { ...base, content: step.content || '' }
        }

        if (step.type === 'quiz') {
          return {
            ...base,
            question: step.question || '',
            instruction: step.instruction || 'Выберите один вариант из списка',
            options: step.options ? JSON.parse(step.options) : [],
            correctAnswers: step.correctAnswers ? JSON.parse(step.correctAnswers) : [],
            multiple: step.multiple,
            explanation: step.explanation || '',
            points: step.points,
            stats: { solved: step.statsSolved, accuracy: step.statsAccuracy },
          }
        }

        if (step.type === 'practice') {
          return {
            ...base,
            practiceType: step.practiceType || '',
            description: step.description || '',
            taskId: step.taskId || '',
            diagramType: step.diagramType || '',
            mmType: step.mmType || '',
          }
        }

        return base
      })
    }))
  }))

  return NextResponse.json(chapters)
}
