'use client'

import { FormEvent, useState } from 'react'

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <main className="min-h-screen bg-kraken-dark px-4 py-20">
      <div className="container mx-auto max-w-3xl">
        <h1 className="section-title">SUBMIT YOUR TIME</h1>
        <p className="text-center text-gray-300 mb-10">Submit your lap and screenshot proof for leaderboard review.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <input className="input-field" placeholder="Driver Name" required />
          <select className="input-field" required>
            <option value="">Select Game</option>
            <option>Assetto Corsa</option>
            <option>Assetto Corsa Competizione</option>
            <option>F1 2025</option>
            <option>Forza Motorsport</option>
            <option>Forza Horizon</option>
          </select>
          <input className="input-field" placeholder="Track" required />
          <input className="input-field" placeholder="Car" required />
          <input className="input-field" placeholder="Lap Time (e.g. 1:42.358)" required />
          <input className="input-field" type="url" placeholder="Screenshot URL (optional)" />

          <button type="submit" className="btn-primary">SUBMIT ENTRY</button>

          {submitted && (
            <p className="text-kraken-cyan">Submission received. An admin will review and approve it soon.</p>
          )}
        </form>
      </div>
    </main>
  )
}
