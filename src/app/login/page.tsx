'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

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
