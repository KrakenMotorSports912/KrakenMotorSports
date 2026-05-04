'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Award } from 'lucide-react'
import {
  FALLBACK_CARS,
  FALLBACK_GAMES,
  FALLBACK_TRACKS,
  GameDefaultsNode,
  buildCatalogFromFlatDefaults,
  flattenGameCatalog,
  parseDefaultGameCatalog,
  parseOptionsInput,
  readLocalDefaultGameCatalog,
  readLocalDefaultOptions,
} from '@/lib/adminDefaults'

type ViewMode = 'overall' | 'game' | 'track' | 'car' | 'combination' | 'event'

type LeaderboardEntry = {
  rank: number
  id: string
  driver_name: string
  game: string
  track: string
  car: string
  lap_time_display: string
  lap_time_ms: number
  created_at: string
}

type LeaderboardEvent = {
  id: string
  title: string
  game: string
  track: string
  start_date: string
  end_date: string
}

type FilterRow = {
  game: string
  track: string
  car: string
}

type SiteSettingRow = {
  key: string
  value_text: string | null
}

type HighlightedPreset = {
  id: string
  label: string
  game?: string
  track?: string
  car?: string
}

const DEFAULT_HIGHLIGHTED_PRESETS: HighlightedPreset[] = [
  {
    id: 'acc-monza',
    label: 'ACC • Monza',
    game: 'assetto_corsa_competizione',
    track: 'Monza',
  },
  {
    id: 'f1-silverstone',
    label: 'F1 2025 • Silverstone',
    game: 'f1_2025',
    track: 'Silverstone',
  },
  {
    id: 'forza-laguna',
    label: 'Forza • Laguna Seca',
    game: 'forza_motorsport_2023',
    track: 'Laguna Seca',
  },
]

const normalizeGameKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const GAME_KEY_ALIASES: Record<string, string> = {
  forza_motorsport: 'forza_motorsport_2023',
  forza_horizon: 'forza_horizon_5',
  mario_kart: 'mario_kart_wii',
  mariokart: 'mario_kart_wii',
  mkwii: 'mario_kart_wii',
}

const resolveGameKey = (value: string) => {
  const normalized = normalizeGameKey(value)
  return GAME_KEY_ALIASES[normalized] || normalized
}

const parseHighlightedPresets = (value: string | null | undefined): HighlightedPreset[] => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item, index) => {
        const label = typeof item?.label === 'string' ? item.label.trim() : ''
        const game = typeof item?.game === 'string' ? resolveGameKey(item.game) : ''
        const track = typeof item?.track === 'string' ? item.track.trim() : ''
        const car = typeof item?.car === 'string' ? item.car.trim() : ''
        const id = typeof item?.id === 'string' && item.id.trim() ? item.id.trim() : `highlight-${index + 1}`

        if (!label || (!game && !track && !car)) {
          return null
        }

        return {
          id,
          label,
          game: game || undefined,
          track: track || undefined,
          car: car || undefined,
        } as HighlightedPreset
      })
      .filter((item): item is HighlightedPreset => Boolean(item))
  } catch {
    return []
  }
}

type LiveLeaderboardProps = {
  mode?: 'home' | 'full'
}

export default function LiveLeaderboard({ mode = 'home' }: LiveLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<LeaderboardEvent[]>([])
  const [availableGames, setAvailableGames] = useState<string[]>([])
  const [availableTracks, setAvailableTracks] = useState<string[]>([])
  const [availableCars, setAvailableCars] = useState<string[]>([])
  const [defaultCatalog, setDefaultCatalog] = useState<GameDefaultsNode[]>([])
  const [gameSearch, setGameSearch] = useState('')
  const [trackSearch, setTrackSearch] = useState('')
  const [carSearch, setCarSearch] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('overall')
  const [selectedGame, setSelectedGame] = useState('all')
  const [selectedTrack, setSelectedTrack] = useState('all')
  const [selectedCar, setSelectedCar] = useState('all')
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [highlightedPresets, setHighlightedPresets] = useState<HighlightedPreset[]>(DEFAULT_HIGHLIGHTED_PRESETS)
  const [highlightedPresetIndex, setHighlightedPresetIndex] = useState(0)
  const [realtimeRefreshTick, setRealtimeRefreshTick] = useState(0)
  const selectedCatalogNode = selectedGame !== 'all' ? defaultCatalog.find((item) => item.game === selectedGame) : null

  const games = [
    { value: 'all', label: 'All Games' },
    { value: 'assetto_corsa', label: 'Assetto Corsa' },
    { value: 'assetto_corsa_competizione', label: 'ACC' },
    { value: 'f1_2025', label: 'F1 2025' },
    { value: 'forza_motorsport', label: 'Forza Motorsport' },
  ]

  const applyHighlightedPreset = (preset: HighlightedPreset) => {
    const nextGame = preset.game || 'all'
    const nextTrack = preset.track || 'all'
    const nextCar = preset.car || 'all'

    setViewMode('combination')
    setSelectedEventId('all')
    setSelectedGame(nextGame)
    setSelectedTrack(nextTrack)
    setSelectedCar(nextCar)
  }

  const isHighlightedPresetActive = (preset: HighlightedPreset) => {
    const matchesGame = (preset.game || 'all') === selectedGame
    const matchesTrack = (preset.track || 'all') === selectedTrack
    const matchesCar = (preset.car || 'all') === selectedCar
    return viewMode === 'combination' && selectedEventId === 'all' && matchesGame && matchesTrack && matchesCar
  }

  useEffect(() => {
    fetchEvents()
    fetchFilterOptions()

    // Keep a single realtime subscription for this component instance.
    const supabase = createClient()
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_entries',
          filter: 'status=eq.approved',
        },
        () => {
          setRealtimeRefreshTick((previous) => previous + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedGame, selectedTrack, selectedCar, selectedEventId, viewMode, realtimeRefreshTick])

  useEffect(() => {
    if (viewMode === 'overall') {
      setSelectedEventId('all')
      setSelectedGame('all')
      setSelectedTrack('all')
      setSelectedCar('all')
    }
    if (viewMode === 'event') {
      setSelectedGame('all')
      setSelectedTrack('all')
      setSelectedCar('all')
    }
    if (viewMode === 'game') {
      setSelectedEventId('all')
      setSelectedTrack('all')
      setSelectedCar('all')
    }
    if (viewMode === 'track') {
      setSelectedEventId('all')
      setSelectedGame('all')
      setSelectedCar('all')
    }
    if (viewMode === 'car') {
      setSelectedEventId('all')
      setSelectedGame('all')
      setSelectedTrack('all')
    }
    if (viewMode === 'combination') {
      setSelectedEventId('all')
    }
  }, [viewMode])

  useEffect(() => {
    if (selectedGame === 'all') {
      return
    }

    if (selectedCatalogNode?.tracks?.length && selectedTrack !== 'all' && !selectedCatalogNode.tracks.includes(selectedTrack)) {
      setSelectedTrack('all')
    }

    if (selectedCatalogNode?.cars?.length && selectedCar !== 'all' && !selectedCatalogNode.cars.includes(selectedCar)) {
      setSelectedCar('all')
    }
  }, [selectedGame, selectedCatalogNode, selectedTrack, selectedCar])

  const fetchFilterOptions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('game,track,car')
      .eq('status', 'approved')
      .limit(500)

    const localDefaults = readLocalDefaultOptions()
    const localCatalog = readLocalDefaultGameCatalog()

    if (localCatalog.length > 0) {
      setDefaultCatalog(localCatalog)
    }

    const { data: defaultsData } = await supabase
      .from('site_settings')
      .select('key, value_text')
      .in('key', ['default_games', 'default_tracks', 'default_cars', 'default_game_catalog', 'highlighted_leaderboards'])

    const settings = (defaultsData || []) as SiteSettingRow[]
    const gamesDefaults = parseOptionsInput(settings.find((item) => item.key === 'default_games')?.value_text || '')
    const tracksDefaults = parseOptionsInput(settings.find((item) => item.key === 'default_tracks')?.value_text || '')
    const carsDefaults = parseOptionsInput(settings.find((item) => item.key === 'default_cars')?.value_text || '')
    const parsedCatalog = parseDefaultGameCatalog(settings.find((item) => item.key === 'default_game_catalog')?.value_text || '')
    const parsedHighlights = parseHighlightedPresets(settings.find((item) => item.key === 'highlighted_leaderboards')?.value_text || '')
    const catalog = parsedCatalog.length > 0 ? parsedCatalog : buildCatalogFromFlatDefaults(gamesDefaults, tracksDefaults, carsDefaults)
    const flattenedCatalog = flattenGameCatalog(catalog)

    if (parsedHighlights.length > 0) {
      setHighlightedPresets(parsedHighlights)
    }

    if (catalog.length > 0) {
      setDefaultCatalog(catalog)
    }

    if (!data) {
      const fallbackGames = Array.from(
        new Set([
          ...games.filter((item) => item.value !== 'all').map((item) => item.value),
          ...FALLBACK_GAMES,
          ...flattenedCatalog.games,
          ...localDefaults.games,
        ])
      )

      const fallbackTracks = Array.from(new Set([...FALLBACK_TRACKS, ...flattenedCatalog.tracks, ...localDefaults.tracks]))
      const fallbackCars = Array.from(new Set([...FALLBACK_CARS, ...flattenedCatalog.cars, ...localDefaults.cars]))

      setAvailableGames(fallbackGames)
      setAvailableTracks(fallbackTracks)
      setAvailableCars(fallbackCars)
      return
    }

    const rows = data as FilterRow[]
    const gamesFromData = Array.from(new Set(rows.map((row) => row.game).filter(Boolean))).sort()
    const tracksFromData = Array.from(new Set(rows.map((row) => row.track).filter(Boolean))).sort()
    const carsFromData = Array.from(new Set(rows.map((row) => row.car).filter(Boolean))).sort()

    const mergedGames = Array.from(new Set([...gamesFromData, ...FALLBACK_GAMES, ...flattenedCatalog.games, ...localDefaults.games])).sort()
    const mergedTracks = Array.from(new Set([...tracksFromData, ...FALLBACK_TRACKS, ...flattenedCatalog.tracks, ...localDefaults.tracks])).sort()
    const mergedCars = Array.from(new Set([...carsFromData, ...FALLBACK_CARS, ...flattenedCatalog.cars, ...localDefaults.cars])).sort()

    setAvailableGames(mergedGames)
    setAvailableTracks(mergedTracks)
    setAvailableCars(mergedCars)
  }

  const fetchEvents = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('id,title,game,track,start_date,end_date')
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .limit(20)

    if (data) {
      setEvents(data)
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)

    const params = new URLSearchParams()
    params.set('limit', '25')

    if (viewMode === 'event' && selectedEventId !== 'all') {
      params.set('event_id', selectedEventId)
    } else {
      if (selectedGame !== 'all' && (viewMode === 'game' || viewMode === 'combination')) {
        params.set('game', selectedGame)
      }

      if (selectedTrack !== 'all' && (viewMode === 'track' || viewMode === 'combination')) {
        params.set('track', selectedTrack)
      }
    }

    if (selectedCar !== 'all' && (viewMode === 'car' || viewMode === 'combination')) {
      params.set('car', selectedCar)
    }

    const response = await fetch(`/api/public/leaderboard?${params.toString()}`)

    if (response.ok) {
      const payload = await response.json()
      setEntries(payload.leaderboard || [])
    }

    setLoading(false)
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400" size={24} />
    if (index === 1) return <Medal className="text-gray-400" size={24} />
    if (index === 2) return <Award className="text-orange-600" size={24} />
    return <span className="text-lg font-display">{index + 1}</span>
  }

  const tracksSource =
    selectedGame !== 'all' && selectedCatalogNode?.tracks?.length
      ? Array.from(new Set([...selectedCatalogNode.tracks, ...availableTracks]))
      : availableTracks
  const carsSource =
    selectedGame !== 'all' && selectedCatalogNode?.cars?.length
      ? Array.from(new Set([...selectedCatalogNode.cars, ...availableCars]))
      : availableCars
  const filteredGames = availableGames.filter((game) => game.toLowerCase().includes(gameSearch.toLowerCase().trim()))
  const filteredTracks = tracksSource.filter((track) => track.toLowerCase().includes(trackSearch.toLowerCase().trim()))
  const filteredCars = carsSource.filter((car) => car.toLowerCase().includes(carSearch.toLowerCase().trim()))
  const filteredEvents = events.filter((eventItem) => {
    const term = eventSearch.toLowerCase().trim()
    if (!term) return true
    return `${eventItem.title} ${eventItem.game} ${eventItem.track}`.toLowerCase().includes(term)
  })

  // Leaderboard auto-switch interval and interaction logic
  useEffect(() => {
    if (mode !== 'home' || highlightedPresets.length === 0) {
      return
    }

    applyHighlightedPreset(highlightedPresets[highlightedPresetIndex % highlightedPresets.length])

    let paused = false;
    const intervalMs = 15000; // 15 seconds for slower switching
    let timer: NodeJS.Timeout;

    const startTimer = () => {
      timer = setInterval(() => {
        if (!paused) {
          setHighlightedPresetIndex((previous) => {
            const next = (previous + 1) % highlightedPresets.length
            applyHighlightedPreset(highlightedPresets[next])
            return next
          })
        }
      }, intervalMs)
    };
    startTimer();

    // Pause on interaction
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    window.addEventListener('mousedown', pause);
    window.addEventListener('touchstart', pause);
    window.addEventListener('keydown', pause);
    window.addEventListener('mouseleave', resume);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousedown', pause);
      window.removeEventListener('touchstart', pause);
      window.removeEventListener('keydown', pause);
      window.removeEventListener('mouseleave', resume);
    }
  }, [mode, highlightedPresets, highlightedPresetIndex])

  return (
    <section id="leaderboard" className="py-24 bg-gradient-to-b from-kraken-dark to-kraken-deep">
      <div className="container mx-auto px-4">
        <h2 className="section-title">🦑 LIVE LEADERBOARD 🦑</h2>
        <p className="text-center text-xl text-gray-300 mb-8">
          Top times updated in real-time. Organize by game, track, car, combos, or events.
        </p>

        {mode === 'home' && (
          <div className="max-w-5xl mx-auto mb-6">
            <p className="text-center text-sm text-gray-400 mb-3">HIGHLIGHTED LEADERBOARDS</p>
            <div className="flex flex-wrap justify-center gap-2 items-center relative">
              {/* Left Arrow */}
              <button
                aria-label="Previous Highlight"
                onClick={() => {
                  setHighlightedPresetIndex((prev) => {
                    const next = (prev - 1 + highlightedPresets.length) % highlightedPresets.length;
                    applyHighlightedPreset(highlightedPresets[next]);
                    return next;
                  });
                }}
                className="rounded-full p-2 bg-kraken-cyan/20 hover:bg-kraken-cyan/40 text-kraken-cyan transition-all"
                style={{ position: 'absolute', left: '-48px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {/* Highlighted Presets */}
              {highlightedPresets.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setHighlightedPresetIndex(idx);
                    applyHighlightedPreset(preset);
                  }}
                  className={`px-4 py-2 text-sm font-display tracking-wide border-2 transition-all ${
                    isHighlightedPresetActive(preset)
                      ? 'border-kraken-cyan bg-kraken-cyan text-kraken-dark animate-pulse'
                      : 'border-kraken-cyan text-kraken-cyan hover:bg-kraken-cyan hover:text-kraken-dark'
                  }`}
                  style={{ transition: 'all 0.3s', boxShadow: idx === highlightedPresetIndex ? '0 0 12px #00fff7' : undefined }}
                >
                  {preset.label}
                </button>
              ))}
              {/* Right Arrow */}
              <button
                aria-label="Next Highlight"
                onClick={() => {
                  setHighlightedPresetIndex((prev) => {
                    const next = (prev + 1) % highlightedPresets.length;
                    applyHighlightedPreset(highlightedPresets[next]);
                    return next;
                  });
                }}
                className="rounded-full p-2 bg-kraken-cyan/20 hover:bg-kraken-cyan/40 text-kraken-cyan transition-all"
                style={{ position: 'absolute', right: '-48px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {/* Event Buttons */}
              {events.slice(0, 2).map((eventItem) => (
                <button
                  key={eventItem.id}
                  onClick={() => {
                    setViewMode('event')
                    setSelectedEventId(eventItem.id)
                  }}
                  className="px-4 py-2 text-sm font-display tracking-wide border-2 border-kraken-pink text-kraken-pink hover:bg-kraken-pink hover:text-kraken-dark transition-all"
                >
                  Event: {eventItem.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 max-w-5xl mx-auto space-y-3">
          {/* Filter Dropdown */}
          <details className="w-full mb-4">
            <summary className="btn-secondary w-full text-center cursor-pointer">Filter Leaderboard</summary>
            <div className="flex flex-wrap justify-center items-start gap-3 mt-4">
              <div className="w-full sm:w-[260px]">
                <select
                  value={viewMode}
                  onChange={(event) => setViewMode(event.target.value as ViewMode)}
                  className="input-field"
                >
                  <option value="overall">Overall Leaderboard</option>
                  <option value="game">Sort By Game</option>
                  <option value="track">Sort By Track</option>
                  <option value="car">Sort By Car</option>
                  <option value="combination">Sort By Combination</option>
                  <option value="event">Sort By Event</option>
                </select>
              </div>

              {(viewMode === 'game' || viewMode === 'combination') && (
                <div className="space-y-2 w-full sm:w-[260px]">
                  <input
                    value={gameSearch}
                    onChange={(event) => setGameSearch(event.target.value)}
                    className="input-field"
                    placeholder="Search games..."
                  />
                  <select
                    value={selectedGame}
                    onChange={(event) => setSelectedGame(event.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Games</option>
                    {filteredGames.map((game) => (
                      <option key={game} value={game}>
                        {game.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(viewMode === 'track' || viewMode === 'combination') && (
                <div className="space-y-2 w-full sm:w-[260px]">
                  <input
                    value={trackSearch}
                    onChange={(event) => setTrackSearch(event.target.value)}
                    className="input-field"
                    placeholder="Search tracks..."
                  />
                  <select
                    value={selectedTrack}
                    onChange={(event) => setSelectedTrack(event.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Tracks</option>
                    {filteredTracks.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(viewMode === 'car' || viewMode === 'combination') && (
                <div className="space-y-2 w-full sm:w-[260px]">
                  <input
                    value={carSearch}
                    onChange={(event) => setCarSearch(event.target.value)}
                    className="input-field"
                    placeholder="Search cars..."
                  />
                  <select
                    value={selectedCar}
                    onChange={(event) => setSelectedCar(event.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Cars</option>
                    {filteredCars.map((car) => (
                      <option key={car} value={car}>
                        {car}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedGame('all')
                  setSelectedTrack('all')
                  setSelectedCar('all')
                  setSelectedEventId('all')
                  setViewMode('overall')
                  setGameSearch('')
                  setTrackSearch('')
                  setCarSearch('')
                  setEventSearch('')
                }}
                className="btn-secondary w-full sm:w-[260px]"
              >
                CLEAR FILTERS
              </button>
            </div>

            {viewMode === 'event' && (
              <div className="flex justify-center mt-4">
                <div className="space-y-2 w-full sm:w-[420px]">
                  <input
                    value={eventSearch}
                    onChange={(event) => setEventSearch(event.target.value)}
                    className="input-field"
                    placeholder="Search events..."
                  />
                  <select
                    value={selectedEventId}
                    onChange={(event) => setSelectedEventId(event.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Events</option>
                    {filteredEvents.map((eventItem) => (
                      <option key={eventItem.id} value={eventItem.id}>
                        {eventItem.title} ({eventItem.game.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </details>
        </div>

        {/* Leaderboard Table */}
        <div className="max-w-5xl mx-auto card overflow-hidden">
          <div className="hidden md:grid grid-cols-[88px_minmax(0,2fr)_minmax(0,1.5fr)_140px_minmax(0,1.8fr)] gap-4 px-5 py-4 bg-gradient-to-r from-kraken-cyan/20 to-transparent text-[11px] uppercase tracking-[0.35em] text-kraken-cyan/90 border-b border-white/10">
            <div>Rank</div>
            <div>Driver</div>
            <div>Track</div>
            <div>Time</div>
            <div>Car</div>
          </div>

          <div className="space-y-3 p-4 md:p-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="loading-spinner mx-auto"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-white/10 bg-black/20">
                No entries yet. Be the first to submit a time!
              </div>
            ) : (
              entries.slice(0, 10).map((entry) => {
                const rankIndex = Math.max(entry.rank - 1, 0)

                return (
                  <div
                    key={entry.id}
                    className="grid gap-4 md:grid-cols-[88px_minmax(0,2fr)_minmax(0,1.5fr)_140px_minmax(0,1.8fr)] items-center border border-white/10 bg-kraken-dark/75 px-4 py-4 transition-all duration-300 hover:border-kraken-cyan/50 hover:bg-kraken-cyan/5 hud-row"
                  >
                    <div className="flex items-center justify-start md:justify-center">
                      <div className="flex items-center justify-center min-w-12 h-12 rounded-full border border-white/10 bg-black/30 text-center">
                        {getRankIcon(rankIndex)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="font-display text-lg tracking-wide text-white break-words">{entry.driver_name}</p>
                      <p className="md:hidden text-xs uppercase tracking-[0.25em] text-kraken-cyan/70 mt-1">{entry.track}</p>
                    </div>

                    <p className="hidden md:block text-gray-300 break-words">{entry.track}</p>

                    <div className="font-mono text-kraken-cyan font-bold text-lg md:text-xl whitespace-nowrap">
                      {entry.lap_time_display}
                    </div>

                    <p className="hidden lg:block text-gray-400 text-sm break-words">{entry.car}</p>
                  </div>
                )
              })
            )}
          </div>

          {/* Submit Time CTA */}
          <div className="p-6 border-t-2 border-kraken-cyan-dark text-center">
            <p className="text-gray-300 mb-4">Got a hot lap? Submit your time to compete!</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a href={mode === 'home' ? '/submit?from=home' : '/submit?from=leaderboards'} className="btn-primary inline-block">
                SUBMIT YOUR TIME
              </a>
              {mode === 'home' && (
                <Link href="/leaderboards" className="btn-secondary inline-block">
                  SEE MORE LEADERBOARDS
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
