'use client'

import { useEffect, useState } from 'react'

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const targetDate = new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE || '2026-07-01').getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="card text-center min-w-[120px] box-glow">
      <div className="text-5xl md:text-7xl font-display text-kraken-cyan mb-2">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-sm md:text-lg font-display tracking-wider text-gray-400">
        {label}
      </div>
    </div>
  )

  return (
    <section id="countdown" className="py-24 bg-gradient-to-b from-kraken-dark to-kraken-deep">
      <div className="container mx-auto px-4">
        <h2 className="section-title">LAUNCH COUNTDOWN</h2>
        <p className="text-center text-2xl font-display tracking-wide text-white mb-12">
          THE KRAKEN SURFACES IN...
        </p>

        <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto mb-8">
          <TimeUnit value={timeLeft.days} label="DAYS" />
          <TimeUnit value={timeLeft.hours} label="HOURS" />
          <TimeUnit value={timeLeft.minutes} label="MINUTES" />
          <TimeUnit value={timeLeft.seconds} label="SECONDS" />
        </div>

        <p className="text-center text-gray-500 italic">
          Estimated launch: Summer 2026
        </p>
      </div>
    </section>
  )
}
