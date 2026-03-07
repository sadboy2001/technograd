// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { SessionProviderWrapper } from '@/components/SessionProviderWrapper'

export const metadata: Metadata = {
  title: 'Тестирование ПО',
  description: 'Курс по тестированию программного обеспечения — техноград',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
