'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const registered = searchParams.get('registered')

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Неверный email или пароль')
    } else {
      window.location.href = '/'
    }
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="auth-page">
        <div style={{ color: '#aaa', fontSize: 14 }}>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" />
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" />
          </svg>
          техноград
        </div>

        <h1 className="auth-title">Вход в аккаунт</h1>
        <p className="auth-subtitle">Войдите, чтобы продолжить обучение</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {registered && (
            <div className="auth-success">
              ✅ Регистрация прошла успешно! Войдите в аккаунт.
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input id="email" type="email" className="auth-input"
              placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email" />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Пароль</label>
            <input id="password" type="password" className="auth-input"
              placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Вхожу...' : 'Войти'}
          </button>
        </form>

        <p className="auth-footer">
          Нет аккаунта?{' '}
          <Link href="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div style={{ color: '#aaa', fontSize: 14 }}>Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
