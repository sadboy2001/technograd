// app/api/hint/route.ts
// Proxies hint requests to Anthropic Claude API.
// This keeps ANTHROPIC_API_KEY server-side and never exposed to the browser.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  // Only authenticated users can get hints
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { question, options, correctAnswers, selectedAnswers } = await request.json()

  if (!question || !options || !correctAnswers) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY не настроен в .env' },
      { status: 500 }
    )
  }

  const correctOptions = correctAnswers.map((i: number) => options[i])
  const wrongOptions = (selectedAnswers || [])
    .filter((i: number) => !correctAnswers.includes(i))
    .map((i: number) => options[i])

  const prompt = `Ты — преподаватель курса "Тестирование ПО". Студент ответил неверно на вопрос теста.

Вопрос: "${question}"

Варианты ответа: ${options.map((o: string, i: number) => `${i + 1}. ${o}`).join('; ')}

Студент выбрал: ${wrongOptions.length > 0 ? wrongOptions.join('; ') : 'нет выбора'}
Правильный ответ: ${correctOptions.join('; ')}

Напиши короткую подсказку (3-5 предложений):
1. Объясни ПОЧЕМУ правильный ответ верный — через суть понятия, определение или логику.
2. Объясни ПОЧЕМУ выбранный студентом вариант неверен (если есть выбор).
3. Дай краткую выдержку из теории, которая помогает запомнить правильный ответ.

Не называй прямо правильный ответ в первом предложении. Отвечай на русском языке. Без заголовков и маркеров — просто текст абзацами.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // fast and cheap for hints
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[/api/hint] Anthropic error:', err)
      return NextResponse.json({ error: 'Ошибка AI сервиса' }, { status: 502 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    return NextResponse.json({ hint: text })
  } catch (err) {
    console.error('[/api/hint]', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
