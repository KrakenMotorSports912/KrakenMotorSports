'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FALLBACK_CARS,
  FALLBACK_GAMES,
  FALLBACK_TRACKS,
  flattenGameCatalog,
  readLocalDefaultGameCatalog,
  readLocalDefaultOptions,
} from '@/lib/adminDefaults'

type EventOption = {
  id: string
  title: string
  game: string
  track: string
  car_class: string | null
}

type PublicOption = {
  value: string
  name: string
}

const CAR_CLASS_SUGGESTIONS: Record<string, string[]> = {
  gt3: ['Porsche 911 GT3', 'Mercedes-AMG GT3', 'Ferrari 296 GT3', 'Lamborghini Huracán GT3'],
  gt4: ['Porsche Cayman GT4', 'BMW M4 GT4', 'Aston Martin Vantage GT4'],
  formula: ['F1 2025 Car', 'Formula Regional Car', 'Formula 3 Car'],
  hypercar: ['Porsche 963', 'Ferrari 499P', 'Toyota GR010 Hybrid'],
  touring: ['Honda Civic TCR', 'Hyundai Elantra TCR', 'Audi RS3 LMS'],
}

const getCarSuggestions = (carClass: string | null) => {
  if (!carClass) {
    return [] as string[]
  }

  const normalized = carClass.toLowerCase()
  const key = Object.keys(CAR_CLASS_SUGGESTIONS).find((item) => normalized.includes(item))
  return key ? CAR_CLASS_SUGGESTIONS[key] : [carClass]
}

const toGameLabel = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function SubmitPage() {
  const router = useRouter()
  const [driverName, setDriverName] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [game, setGame] = useState('')
  const [customGame, setCustomGame] = useState('')
  const [track, setTrack] = useState('')
  const [car, setCar] = useState('')
  const [lapTime, setLapTime] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [events, setEvents] = useState<EventOption[]>([])
  const [defaultGames, setDefaultGames] = useState<string[]>(FALLBACK_GAMES)
  const [defaultTracks, setDefaultTracks] = useState<string[]>(FALLBACK_TRACKS)
  const [defaultCars, setDefaultCars] = useState<string[]>(FALLBACK_CARS)
  const [gameScopedTracks, setGameScopedTracks] = useState<string[]>([])
  const [gameScopedCars, setGameScopedCars] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedEvent = events.find((item) => item.id === selectedEventId)
  const eventCarClass = selectedEvent?.car_class || null
  const eventCarSuggestions = getCarSuggestions(eventCarClass)
  const eventTracksForSelectedGame = events
    .filter((item) => !game || item.game === game)
    .map((item) => item.track)
    .filter(Boolean)
  const catalogTracksForSelectedGame = game ? gameScopedTracks : defaultTracks
  const catalogCarsForSelectedGame = game ? gameScopedCars : defaultCars
  const gameOptions = Array.from(new Set([...defaultGames, ...events.map((item) => item.game).filter(Boolean)])).sort()
  const trackSuggestions = Array.from(new Set([...catalogTracksForSelectedGame, ...eventTracksForSelectedGame])).sort()
  const carSuggestions = Array.from(new Set([...catalogCarsForSelectedGame, ...eventCarSuggestions])).sort()

  useEffect(() => {
    const fetchOptions = async () => {
      const localDefaults = readLocalDefaultOptions()
      const localCatalog = readLocalDefaultGameCatalog()

      if (localCatalog.length > 0) {
        const localFlattened = flattenGameCatalog(localCatalog)
        setDefaultGames(Array.from(new Set([...FALLBACK_GAMES, ...localFlattened.games])).sort())
        setDefaultTracks(Array.from(new Set([...FALLBACK_TRACKS, ...localFlattened.tracks])).sort())
        setDefaultCars(Array.from(new Set([...FALLBACK_CARS, ...localFlattened.cars])).sort())
      }

      if (localDefaults.games.length > 0) {
        setDefaultGames(Array.from(new Set([...FALLBACK_GAMES, ...localDefaults.games])).sort())
      }
      if (localDefaults.tracks.length > 0) {
        setDefaultTracks(Array.from(new Set([...FALLBACK_TRACKS, ...localDefaults.tracks])).sort())
      }
      if (localDefaults.cars.length > 0) {
        setDefaultCars(Array.from(new Set([...FALLBACK_CARS, ...localDefaults.cars])).sort())
      }

      try {
        const [eventsRes, gamesRes, tracksRes, carsRes] = await Promise.all([
          fetch('/api/public/events?limit=25'),
          fetch('/api/public/leaderboard/options?type=games&limit=100'),
          fetch('/api/public/leaderboard/options?type=tracks&limit=100'),
          fetch('/api/public/leaderboard/options?type=cars&limit=100'),
        ])

        const [eventsPayload, gamesPayload, tracksPayload, carsPayload] = await Promise.all([
          eventsRes.ok ? eventsRes.json() : Promise.resolve({ events: [] }),
          gamesRes.ok ? gamesRes.json() : Promise.resolve({ options: [] }),
          tracksRes.ok ? tracksRes.json() : Promise.resolve({ options: [] }),
          carsRes.ok ? carsRes.json() : Promise.resolve({ options: [] }),
        ])

        const nextEvents = (eventsPayload.events || []) as EventOption[]
        const gamesFromApi = ((gamesPayload.options || []) as PublicOption[]).map((option) => option.value).filter(Boolean)
        const tracksFromApi = ((tracksPayload.options || []) as PublicOption[]).map((option) => option.value).filter(Boolean)
        const carsFromApi = ((carsPayload.options || []) as PublicOption[]).map((option) => option.value).filter(Boolean)

        setEvents(nextEvents)
        setDefaultGames(Array.from(new Set([...FALLBACK_GAMES, ...gamesFromApi, ...localDefaults.games])).sort())
        setDefaultTracks(Array.from(new Set([...FALLBACK_TRACKS, ...tracksFromApi, ...localDefaults.tracks])).sort())
        setDefaultCars(Array.from(new Set([...FALLBACK_CARS, ...carsFromApi, ...localDefaults.cars])).sort())

        if (!game && gamesFromApi.length > 0) {
          setGame(gamesFromApi[0])
        }
      } catch {
        // Keep local fallback options if public API call fails.
      }
    }

    fetchOptions()
  }, [])

  useEffect(() => {
    const fetchGameScopedOptions = async () => {
      if (!game) {
        setGameScopedTracks(defaultTracks)
        setGameScopedCars(defaultCars)
        return
      }

      try {
        const [tracksRes, carsRes] = await Promise.all([
          fetch(`/api/public/leaderboard/options?type=tracks&limit=100&game=${encodeURIComponent(game)}`),
          fetch(`/api/public/leaderboard/options?type=cars&limit=100&game=${encodeURIComponent(game)}`),
        ])

        const [tracksPayload, carsPayload] = await Promise.all([
          tracksRes.ok ? tracksRes.json() : Promise.resolve({ options: [] }),
          carsRes.ok ? carsRes.json() : Promise.resolve({ options: [] }),
        ])

        const tracks = ((tracksPayload.options || []) as PublicOption[]).map((option) => option.value).filter(Boolean)
        const cars = ((carsPayload.options || []) as PublicOption[]).map((option) => option.value).filter(Boolean)

        setGameScopedTracks(tracks.length > 0 ? tracks : defaultTracks)
        setGameScopedCars(cars.length > 0 ? cars : defaultCars)
      } catch {
        setGameScopedTracks(defaultTracks)
        setGameScopedCars(defaultCars)
      }
    }

    fetchGameScopedOptions()
  }, [game, defaultTracks, defaultCars])

  const resetForm = (options?: { clearSubmitted?: boolean }) => {
    setDriverName('')
    setSelectedEventId('')
    setGame('')
    setCustomGame('')
    setTrack('')
    setCar('')
    setLapTime('')
    setScreenshotUrl('')
    setErrorMessage(null)
    if (options?.clearSubmitted) {
      setSubmitted(false)
      setSubmissionId(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitting(true)
    setErrorMessage(null)
    setSubmitted(false)

    if (game === 'other' && !customGame.trim()) {
      setErrorMessage('Please enter your game name when selecting Other.')
      setSubmitting(false)
      return
    }

    const gameValue = game === 'other' ? `other (${customGame.trim()})` : game

    const response = await fetch('/api/submit-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driverName,
        selectedEventId,
        game: gameValue,
        track,
        car,
        lapTime,
        screenshotUrl,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setErrorMessage(payload.error || 'Unable to submit time right now. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmissionId(payload.id || null)
    setSubmitted(true)
    resetForm()
    setSubmitting(false)

    const from = new URLSearchParams(window.location.search).get('from')
    if (from === 'home') {
      router.push('/#leaderboard')
      return
    }

    if (from === 'leaderboards') {
      router.push('/leaderboards')
      return
    }

    router.push('/leaderboards')
  }

  const handleCancel = () => {
    resetForm({ clearSubmitted: true })

    const from = new URLSearchParams(window.location.search).get('from')
    if (from === 'home') {
      router.push('/#leaderboard')
      return
    }

    if (from === 'leaderboards') {
      router.push('/leaderboards')
      return
    }
  }

  return (
    <main className="min-h-screen bg-kraken-dark px-4 py-20">
      <div className="container mx-auto max-w-3xl">
        <h1 className="section-title">SUBMIT YOUR TIME</h1>
        <p className="text-center text-gray-300 mb-10">Submit your lap and screenshot proof for leaderboard review.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <input
            className="input-field"
            placeholder="Driver Name"
            value={driverName}
            onChange={(event) => setDriverName(event.target.value)}
            required
          />

          <select
            className="input-field"
            value={selectedEventId}
            onChange={(event) => {
              const nextEventId = event.target.value
              setSelectedEventId(nextEventId)

              const selectedEvent = events.find((item) => item.id === nextEventId)
              if (selectedEvent) {
                setGame(selectedEvent.game)
                setTrack(selectedEvent.track)
                if (!car.trim() && selectedEvent.car_class) {
                  setCar(selectedEvent.car_class)
                }
              }
            }}
          >
            <option value="">Event (optional)</option>
            {events.map((eventItem) => (
              <option key={eventItem.id} value={eventItem.id}>
                {eventItem.title} ({eventItem.game.replace(/_/g, ' ')} • {eventItem.track}{eventItem.car_class ? ` • ${eventItem.car_class}` : ''})
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={game}
            onChange={(event) => {
              const nextGame = event.target.value
              setGame(nextGame)
              if (nextGame !== 'other') {
                setCustomGame('')
              }
            }}
            required
          >
            <option value="">Select Game</option>
            {gameOptions.map((gameOption) => (
              <option key={gameOption} value={gameOption}>
                {toGameLabel(gameOption)}
              </option>
            ))}
            <option value="other">Other</option>
          </select>

          {game === 'other' && (
            <input
              className="input-field"
              placeholder="Enter your game (example: mario_kart_wii)"
              value={customGame}
              onChange={(event) => setCustomGame(event.target.value)}
              required
            />
          )}

          <input
            className="input-field"
            placeholder="Track"
            value={track}
            onChange={(event) => setTrack(event.target.value)}
            list="submit-track-suggestions"
            required
          />
          <datalist id="submit-track-suggestions">
            {trackSuggestions.map((trackOption) => (
              <option key={trackOption} value={trackOption} />
            ))}
          </datalist>
          <input
            className="input-field"
            placeholder="Car"
            value={car}
            onChange={(event) => setCar(event.target.value)}
            list="submit-car-suggestions"
            required
          />
          <datalist id="submit-car-suggestions">
            {carSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          {eventCarClass && (
            <p className="text-xs text-gray-400 -mt-3">Event car class: {eventCarClass}. Suggested cars are shown in the car field.</p>
          )}
          <input
            className="input-field"
            placeholder="Lap Time (e.g. 1:42.358 or 42.358)"
            value={lapTime}
            onChange={(event) => setLapTime(event.target.value)}
            required
          />
          <p className="text-xs text-gray-400 -mt-3">Accepted: M:SS(.mmm), M:SS:mmm, SS(.mmm), and comma decimals (example 1:42,358).</p>
          <input
            className="input-field"
            type="url"
            placeholder="Screenshot URL (optional)"
            value={screenshotUrl}
            onChange={(event) => setScreenshotUrl(event.target.value)}
          />

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? 'SUBMITTING...' : 'SUBMIT ENTRY'}
            </button>
            <button type="button" onClick={handleCancel} className="btn-secondary flex-1" disabled={submitting}>
              CANCEL
            </button>
          </div>

          {submitted && (
            <div className="text-kraken-cyan space-y-1">
              <p>Submission received and saved as <strong>pending</strong>.</p>
              <p>It appears in Admin → Leaderboard under pending and goes live after approval.</p>
              {submissionId && <p className="text-xs text-gray-400">Submission ID: {submissionId}</p>}
            </div>
          )}
          {errorMessage && <p className="text-red-400">{errorMessage}</p>}
        </form>
      </div>
    </main>
  )
}
