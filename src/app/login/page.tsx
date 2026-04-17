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
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupDiscord, setSignupDiscord] = useState('')
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
    const checkSessionAndMaybeLinkDiscord = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        const linked = hasDiscordIdentity(user as AuthUser)
        setIsDiscordLinked(linked)

        // If ?link_discord=1 and not linked, trigger Discord linking
        if (searchParams.get('link_discord') === '1' && !linked) {
          setLoading(true)
          setMessage('Redirecting to link your Discord account...')
          const redirectTo = `${window.location.origin}/login?linked=1`
          const authApi = supabase.auth as unknown as {
            linkIdentity?: (params: { provider: 'discord'; options?: { redirectTo?: string } }) => Promise<{ error: { message: string } | null }>
            signInWithOAuth: (params: { provider: 'discord'; options?: { redirectTo?: string } }) => Promise<{ error: { message: string } | null }>
          }
          if (typeof authApi.linkIdentity === 'function') {
            await authApi.linkIdentity({ provider: 'discord', options: { redirectTo } })
          } else {
            await authApi.signInWithOAuth({ provider: 'discord', options: { redirectTo } })
          }
          // The user will be redirected, so no need to do anything else
          return
        }

        if (searchParams.get('linked') === '1') {
          setMessage(linked ? 'Discord linked successfully.' : 'Discord sign-in completed.')
        }
      } else {
        setIsAuthenticated(false)
        setIsDiscordLinked(false)
      }

      setAuthChecking(false)
    }

    checkSessionAndMaybeLinkDiscord()
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

  const handleGoogleAuth = async () => {
    setLoading(true)
    setMessage('')

    const redirectTo = `${window.location.origin}/login`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const normalizedIdentifier = identifier.trim()
    const isPhoneIdentifier = /^\+?[0-9][0-9\s()\-]{6,}$/.test(normalizedIdentifier)

    if (!normalizedIdentifier) {
      setMessage('Please enter an email or phone number.')
      setLoading(false)
      return
    }

    if (isSignup) {
      const trimmedFirst = firstName.trim()
      const trimmedLast = lastName.trim()
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim()

      if (!trimmedFirst || !trimmedLast) {
        setMessage('Please enter first and last name.')
        setLoading(false)
        return
      }

      const signupPayload = {
        password,
        options: {
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: fullName,
            discord_username: signupDiscord.trim() || null,
          },
        },
      }

      const { error } = await supabase.auth.signUp(
        isPhoneIdentifier
          ? { phone: normalizedIdentifier, ...signupPayload }
          : { email: normalizedIdentifier, ...signupPayload }
      )
      if (error) {
        setMessage(error.message)
      } else {
        try {
          window.localStorage.setItem(
            'kraken_profile_prefill_v1',
            JSON.stringify({
              firstName: trimmedFirst,
              lastName: trimmedLast,
              fullName,
              discord: signupDiscord.trim(),
              contact: normalizedIdentifier,
            })
          )
        } catch {
        }

        setMessage(
          isPhoneIdentifier
            ? 'Account created. Check your phone for verification steps, then log in.'
            : 'Account created. Check your email to confirm your account, then log in.'
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword(
        isPhoneIdentifier
          ? { phone: normalizedIdentifier, password }
          : { email: normalizedIdentifier, password }
      )
      if (error) {
        setMessage(error.message)
      } else {
        // If user was trying to link Discord, redirect back to trigger linking
        if (searchParams.get('link_discord') === '1') {
          router.push('/login?link_discord=1')
        } else {
          router.push('/admin')
        }
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-kraken-dark flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-xl">
        <h1 className="section-title mb-8">{isSignup ? 'CREATE ACCOUNT' : 'LOGIN'}</h1>

        {/* Show a message if user is not authenticated and trying to link Discord */}
        {searchParams.get('link_discord') === '1' && !isAuthenticated && (
          <div className="text-center text-yellow-300 text-sm mb-4">
            Please log in to link your Discord account.
          </div>
        )}

        <div className="text-center text-sm text-gray-400">or use email or phone/password below</div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-kraken-cyan font-display tracking-wide mb-2">FIRST NAME</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="input-field"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-kraken-cyan font-display tracking-wide mb-2">LAST NAME</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="input-field"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-kraken-cyan font-display tracking-wide mb-2">DISCORD (OPTIONAL)</label>
                <input
                  type="text"
                  value={signupDiscord}
                  onChange={(event) => setSignupDiscord(event.target.value)}
                  className="input-field"
                  placeholder="yourname#1234 or @username"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">EMAIL OR PHONE</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="input-field"
              placeholder="you@example.com or +1 555 123 4567"
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

        <button
          type="button"
          onClick={handleDiscordAuth}
          disabled={loading || authChecking || (isAuthenticated && isDiscordLinked)}
          className="btn-secondary w-full justify-center inline-flex mt-6"
        >
          {isAuthenticated && isDiscordLinked
            ? 'DISCORD CONNECTED'
            : isAuthenticated
            ? 'CONNECT DISCORD'
            : 'CONTINUE WITH DISCORD'}
        </button>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading || authChecking}
          className="btn-secondary w-full justify-center inline-flex mt-3"
        >
          CONTINUE WITH GOOGLE
        </button>

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
            <h1 className="section-title mb-8">LOGIN</h1>
            <p className="text-center text-sm text-gray-400">Loading login...</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
