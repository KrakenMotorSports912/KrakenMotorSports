'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthUser = {
  app_metadata?: { provider?: string }
  user_metadata?: { provider?: string }
  identities?: Array<{ provider?: string }>
}

const hasDiscordIdentity = (user: AuthUser | null) => {
  if (!user) return false
  if (user.app_metadata?.provider === 'discord') return true
  if (user.user_metadata?.provider === 'discord') return true
  return (user.identities || []).some((identity) => identity.provider === 'discord')
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDiscordLinked, setIsDiscordLinked] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        const linked = hasDiscordIdentity(user as AuthUser)
        setIsDiscordLinked(linked)

        if (searchParams.get('linked') === '1') {
          setMessage(linked ? 'Discord linked successfully.' : 'Discord sign-in completed.')
        }
      } else {
        setIsAuthenticated(false)
        setIsDiscordLinked(false)
      }

      setAuthChecking(false)
    }

    checkSession()
  }, [searchParams, supabase.auth])

  const handleDiscordAuth = async () => {
    setLoading(true)
    setMessage('')

    const redirectTo = `${window.location.origin}/login?linked=1`

    const authApi = supabase.auth as unknown as {
      linkIdentity?: (params: { provider: 'discord'; options?: { redirectTo?: string } }) => Promise<{ error: { message: string } | null }>
      signInWithOAuth: (params: { provider: 'discord'; options?: { redirectTo?: string } }) => Promise<{ error: { message: string } | null }>
    }

    const result =
      isAuthenticated && !isDiscordLinked && typeof authApi.linkIdentity === 'function'
        ? await authApi.linkIdentity({ provider: 'discord', options: { redirectTo } })
        : await authApi.signInWithOAuth({ provider: 'discord', options: { redirectTo } })

    if (result.error) {
      setMessage(result.error.message)
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Account created. Check your email to confirm your account, then log in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/admin')
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-kraken-dark flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-xl">
        <h1 className="section-title mb-8">{isSignup ? 'CREATE ACCOUNT' : 'ADMIN LOGIN'}</h1>

        <button
          type="button"
          onClick={handleDiscordAuth}
          disabled={loading || authChecking || (isAuthenticated && isDiscordLinked)}
          className="btn-secondary w-full justify-center inline-flex"
        >
          {isAuthenticated
            ? isDiscordLinked
              ? 'DISCORD LINKED'
              : 'ADD DISCORD'
            : 'CONTINUE WITH DISCORD'}
        </button>

        <p className="text-center text-sm text-gray-300">
          {authChecking
            ? 'Checking account status...'
            : isAuthenticated
            ? isDiscordLinked
              ? 'Linked: Discord account connected.'
              : 'Not linked yet: add Discord to connect your racing profile.'
            : 'Optional: link Discord now or continue with email/password.'}
        </p>

        <div className="text-center text-sm text-gray-400">or use email/password below</div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">PASSWORD</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {message && <p className="text-sm text-gray-300">{message}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center inline-flex">
            {loading ? 'PLEASE WAIT...' : isSignup ? 'CREATE ACCOUNT' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button onClick={() => setIsSignup((value) => !value)} className="btn-secondary">
            {isSignup ? 'HAVE AN ACCOUNT? LOGIN' : 'NEED AN ACCOUNT? SIGN UP'}
          </button>
          <a href="/" className="text-kraken-cyan hover:text-white transition-colors">← Back to site</a>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-kraken-dark flex items-center justify-center px-4 py-16">
          <div className="card w-full max-w-xl">
            <h1 className="section-title mb-8">ADMIN LOGIN</h1>
            <p className="text-center text-sm text-gray-400">Loading login...</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
