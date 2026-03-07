'use client'
// components/SignOutButton.tsx
// Needs to be a client component because signOut() is a client-side function

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      className="profile-btn-secondary"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      Выйти из аккаунта
    </button>
  )
}
