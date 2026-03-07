'use client'
// components/Header.tsx
// The top navigation bar — identical markup to the original header.html
// Shows Login/Register when logged out, Profile/Logout when logged in

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

interface HeaderProps {
  onToggleCourseDropdown: () => void
  currentCourseName: string
}

export function Header({ onToggleCourseDropdown, currentCourseName }: HeaderProps) {
  const { data: session, status } = useSession()

  return (
    <header>
      <div className="logo">
        {/* Logo SVG */}
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" />
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" />
        </svg>
        техноград
        {/* Course switcher button */}
        <span
          className="course-switcher-btn"
          id="course-switcher-btn"
          onClick={onToggleCourseDropdown}
          title="Переключить курс"
        >
          {currentCourseName}
          <span className="switcher-arrow" id="switcher-arrow">▾</span>
        </span>
      </div>

      {/* Auth section — right side of header */}
      <div className="header-auth">
        {status === 'loading' ? null : session ? (
          <>
            <span className="header-user-name">{session.user.name || session.user.email}</span>
            <Link href="/profile" className="header-auth-link">Профиль</Link>
            <button
              className="header-auth-btn"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="header-auth-link">Войти</Link>
            <Link href="/register" className="header-auth-btn">Регистрация</Link>
          </>
        )}
      </div>
    </header>
  )
}
