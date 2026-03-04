'use client'

import { useEffect, useState } from 'react'
import { useLaunchSettings } from '@/lib/useLaunchSettings'
import { getLaunchPhase } from '@/lib/launchPhase'

export default function Countdown() {
  const { launchDate } = useLaunchSettings()
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const targetDate = new Date(launchDate).getTime()

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
  }, [launchDate])

  const phase = getLaunchPhase(launchDate)
  const launchDateDisplay = new Date(launchDate).toLocaleDateString()

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
        <h2 className="section-title">
          {phase === 'prelaunch' ? 'LAUNCH COUNTDOWN' : phase === 'active' ? 'NOW OPEN' : 'LIVE STATUS'}
        </h2>
        <p className="text-center text-2xl font-display tracking-wide text-white mb-12">
          {phase === 'prelaunch'
            ? 'THE KRAKEN SURFACES IN...'
            : phase === 'active'
              ? 'KRAKEN MOTORSPORTS IS OFFICIALLY ACTIVE'
              : 'KRAKEN MOTORSPORTS HAS BEEN LIVE FOR A WHILE'}
        </p>

        {phase === 'prelaunch' ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto mb-8">
            <TimeUnit value={timeLeft.days} label="DAYS" />
            <TimeUnit value={timeLeft.hours} label="HOURS" />
            <TimeUnit value={timeLeft.minutes} label="MINUTES" />
            <TimeUnit value={timeLeft.seconds} label="SECONDS" />
          </div>
        ) : (
          <div className="card max-w-3xl mx-auto text-center box-glow mb-8">
            <p className="text-3xl md:text-4xl font-display text-kraken-cyan mb-2">
              {phase === 'active' ? 'WELCOME TO RACE MODE' : 'ESTABLISHED COMMUNITY MODE'}
            </p>
            <p className="text-gray-400">
              {phase === 'active'
                ? 'Focus on onboarding racers, launching events, and growing the leaderboard.'
                : 'Focus on retention, recurring competitions, and premium offerings.'}
            </p>
          </div>
        )}

        <p className="text-center text-gray-500 italic">
          Launch date set to: {launchDateDisplay}
        </p>
      </div>
    </section>
  )
}
