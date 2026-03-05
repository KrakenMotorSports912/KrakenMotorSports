'use client'

import { FormEvent, useState } from 'react'

export default function FoundersPassPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [discord, setDiscord] = useState('')
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSent(false)

    const response = await fetch('/api/founders-pass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        discord,
        reason,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (response.ok) {
      setSent(true)
      setFullName('')
      setEmail('')
      setDiscord('')
      setReason('')
    } else {
      setError(payload.error || 'Unable to submit founders pass request right now.')
    }

    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-kraken-dark px-4 py-20">
      <div className="container mx-auto max-w-3xl">
        <h1 className="section-title">FOUNDERS PASS</h1>
        <p className="text-center text-gray-300 mb-10">Join the limited founders list (50 total) and lock your perks.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <input
            className="input-field"
            placeholder="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="input-field"
            placeholder="Discord (optional)"
            value={discord}
            onChange={(event) => setDiscord(event.target.value)}
          />
          <textarea
            className="input-field"
            placeholder="Why you want to be a founder"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          ></textarea>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'SUBMITTING...' : 'JOIN FOUNDERS LIST'}
          </button>

          {sent && <p className="text-kraken-cyan">You are on the interest list. We will contact you next.</p>}
          {error && <p className="text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  )
}
