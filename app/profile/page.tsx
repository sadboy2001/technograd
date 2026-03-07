// app/profile/page.tsx
// Server Component — reads session on the server side
// Protected by middleware.ts (unauthenticated users are redirected to /login)

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  // Session is guaranteed by middleware, but TypeScript doesn't know that
  if (!session?.user) {
    return null
  }

  // Load all progress records for this user
  const progressRecords = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
  })

  const totalCompleted = progressRecords.reduce((sum, r) => {
    try {
      return sum + (JSON.parse(r.completedSteps) as string[]).length
    } catch {
      return sum
    }
  }, 0)

  const initials = session.user.name
    ? session.user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : (session.user.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-name">{session.user.name || 'Без имени'}</div>
        <div className="profile-email">{session.user.email}</div>

        <div className="profile-stat-row">
          <div className="profile-stat">
            <div className="profile-stat-value">{totalCompleted}</div>
            <div className="profile-stat-label">Шагов пройдено</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{progressRecords.length}</div>
            <div className="profile-stat-label">Активных курсов</div>
          </div>
        </div>

        <div className="profile-actions">
          <Link href="/" className="profile-btn-primary">
            ← Вернуться к курсу
          </Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
