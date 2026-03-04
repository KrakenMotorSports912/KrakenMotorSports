'use client'

import { FormEvent, useState } from 'react'

export default function FoundersPassPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <main className="min-h-screen bg-kraken-dark px-4 py-20">
      <div className="container mx-auto max-w-3xl">
        <h1 className="section-title">FOUNDERS PASS</h1>
        <p className="text-center text-gray-300 mb-10">Join the limited founders list (50 total) and lock your perks.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <input className="input-field" placeholder="Full Name" required />
          <input className="input-field" type="email" placeholder="Email" required />
          <input className="input-field" placeholder="Discord (optional)" />
          <textarea className="input-field" placeholder="Why you want to be a founder" rows={4}></textarea>

          <button type="submit" className="btn-primary">JOIN FOUNDERS LIST</button>

          {sent && <p className="text-kraken-cyan">You are on the interest list. We will contact you next.</p>}
        </form>
      </div>
    </main>
  )
}
