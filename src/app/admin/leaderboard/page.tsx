'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Eye, Clock, Trophy, Plus, Trash2 } from 'lucide-react'
import { FALLBACK_GAMES, FALLBACK_TRACKS, parseOptionsInput, readLocalDefaultOptions } from '@/lib/adminDefaults'

type Entry = {
  id: string
  driver_name: string
  game: string
  track: string
  car: string
  lap_time_ms: number
  lap_time_display: string
  screenshot_url: string | null
  video_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
}

type SiteSettingRow = {
  key: string
  value_text: string | null
}

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [gameFilter, setGameFilter] = useState('all')
  const [trackFilter, setTrackFilter] = useState('all')
  const [carFilter, setCarFilter] = useState('all')
  const [gameSearch, setGameSearch] = useState('')
  const [trackSearch, setTrackSearch] = useState('')
  const [carSearch, setCarSearch] = useState('')
  const [availableGames, setAvailableGames] = useState<string[]>([])
  const [availableTracks, setAvailableTracks] = useState<string[]>([])
  const [availableCars, setAvailableCars] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'created_at' | 'lap_time_ms' | 'driver_name' | 'track' | 'game'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [defaultGames, setDefaultGames] = useState<string[]>(FALLBACK_GAMES)
  const [defaultTracks, setDefaultTracks] = useState<string[]>(FALLBACK_TRACKS)
  const [newEntry, setNewEntry] = useState({
    driver_name: '',
    game: FALLBACK_GAMES[0],
    track: '',
    car: '',
    lap_time_display: '',
    screenshot_url: '',
    video_url: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchDropdownDefaults()
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [filter, gameFilter, trackFilter, carFilter, sortBy, sortDirection])

  useEffect(() => {
    setAvailableGames((previous) => Array.from(new Set([...previous, ...defaultGames, ...FALLBACK_GAMES])).sort())
    setAvailableTracks((previous) => Array.from(new Set([...previous, ...defaultTracks, ...FALLBACK_TRACKS])).sort())
  }, [defaultGames, defaultTracks])

  const fetchDropdownDefaults = async () => {
    const localDefaults = readLocalDefaultOptions()
    if (localDefaults.games.length > 0) {
      setDefaultGames(localDefaults.games)
      setNewEntry((previous) => ({
        ...previous,
        game: localDefaults.games.includes(previous.game) ? previous.game : localDefaults.games[0],
      }))
    }
    if (localDefaults.tracks.length > 0) {
      setDefaultTracks(localDefaults.tracks)
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value_text')
      .in('key', ['default_games', 'default_tracks'])

    if (!data || error) {
      return
    }

    const settings = data as SiteSettingRow[]
    const gamesSetting = settings.find((item) => item.key === 'default_games')
    const tracksSetting = settings.find((item) => item.key === 'default_tracks')

    const games = gamesSetting?.value_text ? parseOptionsInput(gamesSetting.value_text) : []
    const tracks = tracksSetting?.value_text ? parseOptionsInput(tracksSetting.value_text) : []

    if (games.length > 0) {
      setDefaultGames(games)
      setNewEntry((previous) => ({
        ...previous,
        game: games.includes(previous.game) ? previous.game : games[0],
      }))
    }

    if (tracks.length > 0) {
      setDefaultTracks(tracks)
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    let query = supabase
      .from('leaderboard_entries')
      .select('*')
      .order(sortBy, { ascending: sortDirection === 'asc' })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    if (gameFilter !== 'all') {
      query = query.eq('game', gameFilter)
    }

    if (trackFilter !== 'all') {
      query = query.eq('track', trackFilter)
    }

    if (carFilter !== 'all') {
      query = query.eq('car', carFilter)
    }

    const { data, error } = await query
    if (!error && data) {
      setEntries(data)
    }
    setLoading(false)
  }

  const fetchFilterOptions = async () => {
    const localDefaults = readLocalDefaultOptions()

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('game, track, car')

    if (error || !data) {
      setAvailableGames(Array.from(new Set([...defaultGames, ...localDefaults.games, ...FALLBACK_GAMES])).sort())
      setAvailableTracks(Array.from(new Set([...defaultTracks, ...localDefaults.tracks, ...FALLBACK_TRACKS])).sort())
      setAvailableCars([])
      return
    }

    type FilterRow = { game: string; track: string; car: string }
    const rows = data as FilterRow[]

    const gamesFromData = rows.map((row) => row.game).filter(Boolean)
    const tracksFromData = rows.map((row) => row.track).filter(Boolean)
    const carsFromData = rows.map((row) => row.car).filter(Boolean)

    const games = Array.from(new Set([...gamesFromData, ...defaultGames, ...localDefaults.games, ...FALLBACK_GAMES])).sort()
    const tracks = Array.from(new Set([...tracksFromData, ...defaultTracks, ...localDefaults.tracks, ...FALLBACK_TRACKS])).sort()
    const cars = Array.from(new Set(carsFromData)).sort()

    setAvailableGames(games)
    setAvailableTracks(tracks)
    setAvailableCars(cars)
  }

  const handleApprove = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('leaderboard_entries')
      .update({
        status: 'approved',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      fetchEntries()
      setSelectedEntry(null)
    }
  }

  const handleReject = async (id: string, reason: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('leaderboard_entries')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      fetchEntries()
      setSelectedEntry(null)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    const confirmed = confirm('Delete this leaderboard entry permanently? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    if (!accessToken) {
      alert('You must be logged in to delete entries.')
      return
    }

    const response = await fetch(`/api/admin/leaderboard/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (response.ok) {
      if (selectedEntry?.id === id) {
        setSelectedEntry(null)
      }
      fetchEntries()
    } else {
      alert('Error deleting entry: ' + (payload.error || 'Unknown error'))
    }
  }

  const handleCreateEntry = async () => {
    const parseTime = (timeStr: string): { milliseconds: number; formatted: string } | null => {
      const normalized = timeStr.trim()
      const match = normalized.match(/^(\d{1,3}):([0-5]?\d)(?:\.(\d{1,3}))?$/)
      if (!match) return null

      const [, minutesRaw, secondsRaw, millisRaw = '0'] = match
      const minutes = parseInt(minutesRaw, 10)
      const seconds = parseInt(secondsRaw, 10)
      const milliseconds = parseInt(millisRaw.padEnd(3, '0'), 10)

      const totalMilliseconds = minutes * 60000 + seconds * 1000 + milliseconds
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`

      return {
        milliseconds: totalMilliseconds,
        formatted,
      }
    }

    const parsedTime = parseTime(newEntry.lap_time_display)
    if (!parsedTime) {
      alert('Invalid lap time format. Use M:SS, M:SS.m, M:SS.mm, or M:SS.mmm (e.g., 1:23.45 or 01:23.456).')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      alert('You must be logged in to create leaderboard entries.')
      return
    }

    const { data: insertedEntry, error } = await supabase
      .from('leaderboard_entries')
      .insert({
        user_id: user.id,
        driver_name: newEntry.driver_name,
        game: newEntry.game,
        track: newEntry.track,
        car: newEntry.car,
        lap_time_ms: parsedTime.milliseconds,
        lap_time_display: parsedTime.formatted,
        screenshot_url: newEntry.screenshot_url || null,
        video_url: newEntry.video_url || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (!error) {
      await supabase
        .from('leaderboard_entries')
        .update({
          status: 'approved',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', insertedEntry.id)

      setShowCreateModal(false)
      setNewEntry({
        driver_name: '',
        game: defaultGames[0] || FALLBACK_GAMES[0],
        track: '',
        car: '',
        lap_time_display: '',
        screenshot_url: '',
        video_url: ''
      })
      fetchEntries()
    } else {
      alert('Error creating entry: ' + error.message)
    }
  }

  const FilterButton = ({ value, label }: { value: typeof filter; label: string }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 font-display tracking-wide transition-all ${
        filter === value
          ? 'bg-kraken-cyan text-kraken-dark'
          : 'bg-kraken-card text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )

  const filteredGames = availableGames.filter((game) => game.toLowerCase().includes(gameSearch.toLowerCase().trim()))
  const filteredTracks = availableTracks.filter((track) => track.toLowerCase().includes(trackSearch.toLowerCase().trim()))
  const filteredCars = availableCars.filter((car) => car.toLowerCase().includes(carSearch.toLowerCase().trim()))

  return (
    <section>
      <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-display tracking-wider text-kraken-cyan mb-2">
            LEADERBOARD MANAGEMENT
          </h2>
          <p className="text-gray-300">Review and moderate lap time submissions</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-6 py-2 flex items-center justify-center gap-2 sm:mr-2"
          >
            <Plus size={20} />
            ADD MANUAL ENTRY
          </button>
          <div className="flex flex-wrap gap-2">
            <FilterButton value="pending" label="PENDING" />
            <FilterButton value="approved" label="APPROVED" />
            <FilterButton value="rejected" label="REJECTED" />
            <FilterButton value="all" label="ALL" />
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-xl font-display tracking-wide text-kraken-cyan mb-4">ORGANIZE LEADERBOARD</h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="space-y-2">
            <input
              value={gameSearch}
              onChange={(event) => setGameSearch(event.target.value)}
              className="input-field"
              placeholder="Search games..."
            />
            <select
              value={gameFilter}
              onChange={(event) => setGameFilter(event.target.value)}
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

          <div className="space-y-2">
            <input
              value={trackSearch}
              onChange={(event) => setTrackSearch(event.target.value)}
              className="input-field"
              placeholder="Search tracks..."
            />
            <select
              value={trackFilter}
              onChange={(event) => setTrackFilter(event.target.value)}
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

          <div className="space-y-2">
            <input
              value={carSearch}
              onChange={(event) => setCarSearch(event.target.value)}
              className="input-field"
              placeholder="Search cars..."
            />
            <select
              value={carFilter}
              onChange={(event) => setCarFilter(event.target.value)}
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

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="input-field"
          >
            <option value="created_at">Sort: Submitted Date</option>
            <option value="lap_time_ms">Sort: Lap Time</option>
            <option value="driver_name">Sort: Driver</option>
            <option value="track">Sort: Track</option>
            <option value="game">Sort: Game</option>
          </select>

          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as typeof sortDirection)}
            className="input-field"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            onClick={() => {
              setGameFilter('all')
              setTrackFilter('all')
              setCarFilter('all')
              setSortBy('created_at')
              setSortDirection('desc')
              setGameSearch('')
              setTrackSearch('')
              setCarSearch('')
            }}
            className="btn-secondary"
          >
            RESET
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">No {filter === 'all' ? '' : filter} entries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="card hover:border-kraken-cyan transition-all">
              <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl font-display text-white">{entry.driver_name}</h3>
                    <span className={`px-3 py-1 text-xs font-display ${
                      entry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {entry.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                    <div>
                      <p><span className="text-kraken-cyan">Game:</span> {entry.game.replace('_', ' ').toUpperCase()}</p>
                      <p><span className="text-kraken-cyan">Track:</span> {entry.track}</p>
                      <p><span className="text-kraken-cyan">Car:</span> {entry.car}</p>
                    </div>
                    <div>
                      <p className="text-3xl font-mono text-kraken-cyan">{entry.lap_time_display}</p>
                      <p className="text-sm text-gray-400">
                        Submitted: {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {entry.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-red-400 text-sm">
                        <strong>Rejection Reason:</strong> {entry.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="btn-secondary text-sm py-2 px-4 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    VIEW
                  </button>
                  
                  {entry.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(entry.id)}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 text-sm font-display flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check size={16} />
                        APPROVE
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:')
                          if (reason) handleReject(entry.id, reason)
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 text-sm font-display flex items-center justify-center gap-2 transition-colors"
                      >
                        <X size={16} />
                        REJECT
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-sm font-display flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    REMOVE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-display text-kraken-cyan">SUBMISSION DETAILS</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-1">Driver</p>
                  <p className="text-xl font-display text-white">{selectedEntry.driver_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Lap Time</p>
                  <p className="text-3xl font-mono text-kraken-cyan">{selectedEntry.lap_time_display}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Game</p>
                  <p className="text-white">{selectedEntry.game.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Track</p>
                  <p className="text-white">{selectedEntry.track}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Car</p>
                  <p className="text-white">{selectedEntry.car}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <span className={`px-3 py-1 text-xs font-display inline-block ${
                    selectedEntry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedEntry.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedEntry.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedEntry.screenshot_url && (
                <div>
                  <p className="text-gray-400 mb-2">Screenshot</p>
                  <img
                    src={selectedEntry.screenshot_url}
                    alt="Lap time screenshot"
                    className="w-full rounded border-2 border-kraken-cyan/30"
                  />
                </div>
              )}

              {selectedEntry.video_url && (
                <div>
                  <p className="text-gray-400 mb-2">Video</p>
                  <a
                    href={selectedEntry.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kraken-cyan hover:underline"
                  >
                    {selectedEntry.video_url}
                  </a>
                </div>
              )}

              {selectedEntry.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    onClick={() => handleApprove(selectedEntry.id)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    APPROVE ENTRY
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:')
                      if (reason) handleReject(selectedEntry.id, reason)
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 flex-1 font-display flex items-center justify-center gap-2 transition-colors"
                  >
                    <X size={20} />
                    REJECT ENTRY
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 font-display flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={20} />
                  REMOVE ENTRY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Manual Entry Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-display text-kraken-cyan">ADD MANUAL ENTRY</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Driver Name *</label>
                <input
                  type="text"
                  value={newEntry.driver_name}
                  onChange={(e) => setNewEntry({ ...newEntry, driver_name: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                  placeholder="Enter driver name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Game *</label>
                <select
                  value={newEntry.game}
                  onChange={(e) => setNewEntry({ ...newEntry, game: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                >
                  {defaultGames.map((game) => (
                    <option key={game} value={game}>
                      {game.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Track *</label>
                <input
                  type="text"
                  list="leaderboard-track-defaults"
                  value={newEntry.track}
                  onChange={(e) => setNewEntry({ ...newEntry, track: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                  placeholder="e.g., Nürburgring Nordschleife"
                  required
                />
                <datalist id="leaderboard-track-defaults">
                  {defaultTracks.map((track) => (
                    <option key={track} value={track} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Car *</label>
                <input
                  type="text"
                  value={newEntry.car}
                  onChange={(e) => setNewEntry({ ...newEntry, car: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                  placeholder="e.g., Porsche 911 GT3"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Lap Time *</label>
                <input
                  type="text"
                  value={newEntry.lap_time_display}
                  onChange={(e) => setNewEntry({ ...newEntry, lap_time_display: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none font-mono"
                  placeholder="M:SS(.mmm) (e.g., 1:23.45 or 01:23.456)"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">Formats accepted: M:SS, M:SS.m, M:SS.mm, M:SS.mmm</p>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Screenshot URL (optional)</label>
                <input
                  type="url"
                  value={newEntry.screenshot_url}
                  onChange={(e) => setNewEntry({ ...newEntry, screenshot_url: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Video URL (optional)</label>
                <input
                  type="url"
                  value={newEntry.video_url}
                  onChange={(e) => setNewEntry({ ...newEntry, video_url: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  onClick={handleCreateEntry}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!newEntry.driver_name || !newEntry.track || !newEntry.car || !newEntry.lap_time_display}
                >
                  <Plus size={20} />
                  CREATE ENTRY
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
