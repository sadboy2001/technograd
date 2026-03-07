// app/page.tsx
// Redirects to /login if not authenticated, else shows the course app

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CourseApp } from '@/components/CourseApp'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return <CourseApp />
}
