'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Calendar, Tag, Users, Clock, TrendingUp, SlidersHorizontal } from 'lucide-react'
import { getDefaultLaunchDate, getLaunchPhase } from '@/lib/launchPhase'
import { buildCatalogFromFlatDefaults, parseDefaultGameCatalog, parseOptionsInput } from '@/lib/adminDefaults'

type HighlightRow = {
  id: string
  label: string
  game: string
  track: string
}

type GameDefaultsNode = {
  game: string
  tracks: string[]
  cars: string[]
}

type SiteSettingRow = {
  key: string
  value_text: string | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingEntries: 0,
    totalEntries: 0,
    activeEvents: 0,
    foundersCount: 0,
    activeDiscounts: 0,
    recentEntries: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const [launchDate, setLaunchDate] = useState(getDefaultLaunchDate().slice(0, 16))
  const [savingLaunchDate, setSavingLaunchDate] = useState(false)
  const [launchMessage, setLaunchMessage] = useState('')
  const [highlightedRows, setHighlightedRows] = useState<HighlightRow[]>([])
  const [draggingHighlightId, setDraggingHighlightId] = useState<string | null>(null)
  const [gameCatalog, setGameCatalog] = useState<GameDefaultsNode[]>([])
  const [availableGames, setAvailableGames] = useState<string[]>([])
  const [savingHighlightedLeaderboards, setSavingHighlightedLeaderboards] = useState(false)
  const [highlightedLeaderboardMessage, setHighlightedLeaderboardMessage] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    const supabase = createClient()

    // Fetch stats in parallel
    const [
      { count: pendingCount },
      { count: totalCount },
      { count: eventsCount },
      { count: foundersCount },
      { count: discountsCount },
      { data: recentData },
    ] = await Promise.all([
      supabase.from('leaderboard_entries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('leaderboard_entries').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('founders_passes').select('*', { count: 'exact', head: true }),
      supabase.from('discounts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('leaderboard_entries').select('*').order('created_at', { ascending: false }).limit(5),
    ])

    setStats({
      pendingEntries: pendingCount || 0,
      totalEntries: totalCount || 0,
      activeEvents: eventsCount || 0,
      foundersCount: foundersCount || 0,
      activeDiscounts: discountsCount || 0,
      recentEntries: recentData || [],
    })

    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('key, value_text')
      .in('key', ['launch_date', 'highlighted_leaderboards', 'default_game_catalog', 'default_games', 'default_tracks', 'default_cars'])

    const settings = (settingsData || []) as SiteSettingRow[]
    const launchData = settings.find((item) => item.key === 'launch_date')
    const highlightedData = settings.find((item) => item.key === 'highlighted_leaderboards')
    const parsedCatalog = parseDefaultGameCatalog(settings.find((item) => item.key === 'default_game_catalog')?.value_text || '')
    const games = parseOptionsInput(settings.find((item) => item.key === 'default_games')?.value_text || '')
    const tracks = parseOptionsInput(settings.find((item) => item.key === 'default_tracks')?.value_text || '')
    const cars = parseOptionsInput(settings.find((item) => item.key === 'default_cars')?.value_text || '')
    const catalog = parsedCatalog.length > 0 ? parsedCatalog : buildCatalogFromFlatDefaults(games, tracks, cars)
    setGameCatalog(catalog)
    setAvailableGames(catalog.map((item) => item.game))

    if (launchData?.value_text) {
      setLaunchDate(launchData.value_text.slice(0, 16))
    }

    if (highlightedData?.value_text) {
      try {
        const parsed = JSON.parse(highlightedData.value_text)
        if (Array.isArray(parsed)) {
          const rows = parsed
            .map((item) => {
              const label = typeof item?.label === 'string' ? item.label.trim() : ''
              const game = typeof item?.game === 'string' ? item.game.trim() : ''
              const track = typeof item?.track === 'string' ? item.track.trim() : ''
              if (!label || !game || !track) return null
              return {
                id: typeof item?.id === 'string' ? item.id : `admin-highlight-${Math.random().toString(36).slice(2, 8)}`,
                label,
                game,
                track,
              }
            })
            .filter(Boolean) as HighlightRow[]
          setHighlightedRows(rows)
        }
      } catch {
        setHighlightedRows([])
      }
    } else {
      setHighlightedRows([
        { id: 'admin-highlight-1', label: 'ACC • Monza', game: 'assetto_corsa_competizione', track: 'Monza' },
        { id: 'admin-highlight-2', label: 'F1 2025 • Silverstone', game: 'f1_2025', track: 'Silverstone' },
        { id: 'admin-highlight-3', label: 'Forza • Laguna Seca', game: 'forza_motorsport_2023', track: 'Laguna Seca' },
      ])
    }

    setLoading(false)
  }

  const saveLaunchDate = async () => {
    setSavingLaunchDate(true)
    setLaunchMessage('')
    const supabase = createClient()

    const parsedDate = new Date(launchDate)
    if (Number.isNaN(parsedDate.getTime())) {
      setLaunchMessage('Please enter a valid opening date.')
      setSavingLaunchDate(false)
      return
    }

    const nextLaunchDate = parsedDate.toISOString()

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'launch_date',
          value_text: nextLaunchDate,
        },
        { onConflict: 'key' }
      )

    if (error) {
      setLaunchMessage(`Could not save launch date: ${error.message}`)
    } else {
      setLaunchMessage('Launch date saved successfully.')
    }

    setSavingLaunchDate(false)
  }

  const saveHighlightedLeaderboards = async () => {
    setSavingHighlightedLeaderboards(true)
    setHighlightedLeaderboardMessage('')

    const presets = highlightedRows
      .map((row, index) => ({
        id: row.id || `admin-highlight-${index + 1}`,
        label: row.label.trim(),
        game: row.game.trim(),
        track: row.track.trim(),
      }))
      .filter((row) => row.label && row.game && row.track)

    if (presets.length === 0) {
      setHighlightedLeaderboardMessage('Add at least one highlight row with label, game, and track.')
      setSavingHighlightedLeaderboards(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'highlighted_leaderboards',
          value_text: JSON.stringify(presets),
        },
        { onConflict: 'key' }
      )

    if (error) {
      setHighlightedLeaderboardMessage(`Could not save highlights: ${error.message}`)
    } else {
      setHighlightedLeaderboardMessage('Highlighted leaderboards saved successfully.')
    }

    setSavingHighlightedLeaderboards(false)
  }

  const updateHighlightRow = (id: string, updates: Partial<HighlightRow>) => {
    setHighlightedRows((previous) =>
      previous.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...updates }
        if (updates.game && updates.game !== row.game) {
          next.track = ''
        }
        return next
      })
    )
  }

  const addHighlightRow = () => {
    const defaultGame = availableGames[0] || ''
    const defaultTrack = gameCatalog.find((item) => item.game === defaultGame)?.tracks?.[0] || ''
    setHighlightedRows((previous) => [
      ...previous,
      {
        id: `admin-highlight-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: '',
        game: defaultGame,
        track: defaultTrack,
      },
    ])
  }

  const removeHighlightRow = (id: string) => {
    setHighlightedRows((previous) => previous.filter((row) => row.id !== id))
  }

  const moveHighlightRow = (id: string, direction: -1 | 1) => {
    setHighlightedRows((previous) => {
      const currentIndex = previous.findIndex((row) => row.id === id)
      if (currentIndex < 0) return previous

      const nextIndex = currentIndex + direction
      if (nextIndex < 0 || nextIndex >= previous.length) return previous

      const next = [...previous]
      ;[next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]]
      return next
    })
  }

  const moveHighlightRowTo = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return
    }

    setHighlightedRows((previous) => {
      const sourceIndex = previous.findIndex((row) => row.id === sourceId)
      const targetIndex = previous.findIndex((row) => row.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) {
        return previous
      }

      const next = [...previous]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const StatCard = ({ icon: Icon, label, value, color, href }: any) => (
    <a href={href} className="card hover:scale-105 transition-transform cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <Icon className={color} size={32} />
        <span className="text-3xl sm:text-4xl font-display text-kraken-cyan">{value}</span>
      </div>
      <p className="text-gray-400 font-display tracking-wide">{label}</p>
    </a>
  )

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const sitePhase = getLaunchPhase(new Date(launchDate).toISOString())

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-3xl sm:text-4xl font-display tracking-wider text-kraken-cyan mb-2">
          DASHBOARD OVERVIEW
        </h2>
        <p className="text-gray-400">Welcome to the Kraken Motorsports admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={Clock}
          label="PENDING APPROVALS"
          value={stats.pendingEntries}
          color="text-yellow-400"
          href="/admin/leaderboard"
        />
        <StatCard
          icon={Trophy}
          label="TOTAL ENTRIES"
          value={stats.totalEntries}
          color="text-kraken-cyan"
          href="/admin/leaderboard"
        />
        <StatCard
          icon={Calendar}
          label="ACTIVE EVENTS"
          value={stats.activeEvents}
          color="text-purple-400"
          href="/admin/events"
        />
        <StatCard
          icon={Users}
          label="FOUNDERS PASSES"
          value={`${stats.foundersCount}/50`}
          color="text-kraken-pink"
          href="/admin/founders"
        />
        <StatCard
          icon={Tag}
          label="ACTIVE DISCOUNTS"
          value={stats.activeDiscounts}
          color="text-green-400"
          href="/admin/discounts"
        />
        <StatCard
          icon={TrendingUp}
          label="SITE STATUS"
          value="LIVE"
          color="text-green-400"
          href="/"
        />
      </div>

      {/* Recent Entries */}
      <div className="card">
        <h3 className="text-xl sm:text-2xl font-display tracking-wide text-kraken-cyan mb-6">
          RECENT SUBMISSIONS
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="table-header">
                <th className="py-3 px-4 text-left">DRIVER</th>
                <th className="py-3 px-4 text-left">GAME</th>
                <th className="py-3 px-4 text-left">TIME</th>
                <th className="py-3 px-4 text-left">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    No recent submissions
                  </td>
                </tr>
              ) : (
                stats.recentEntries.map((entry) => (
                  <tr key={entry.id} className="table-row">
                    <td className="py-3 px-4 font-display whitespace-normal break-words max-w-[220px] align-top">{entry.driver_name}</td>
                    <td className="py-3 px-4 text-gray-400 whitespace-normal break-words max-w-[220px] align-top">{entry.game.replace('_', ' ').toUpperCase()}</td>
                    <td className="py-3 px-4 font-mono text-kraken-cyan">{entry.lap_time_display}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 text-xs font-display ${
                        entry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        entry.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {entry.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {stats.pendingEntries > 0 && (
          <div className="mt-6 text-center">
            <a href="/admin/leaderboard" className="btn-primary inline-block">
              REVIEW PENDING ENTRIES
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <a href="/admin/events" className="card text-center hover:scale-105 transition-transform">
          <Calendar className="mx-auto mb-4 text-kraken-cyan" size={48} />
          <h4 className="font-display text-xl text-white mb-2">CREATE EVENT</h4>
          <p className="text-gray-400 text-sm">Schedule a new race or tournament</p>
        </a>
        <a href="/admin/discounts" className="card text-center hover:scale-105 transition-transform">
          <Tag className="mx-auto mb-4 text-kraken-cyan" size={48} />
          <h4 className="font-display text-xl text-white mb-2">NEW DISCOUNT</h4>
          <p className="text-gray-400 text-sm">Create a discount code</p>
        </a>
        <a href="/admin/leaderboard" className="card text-center hover:scale-105 transition-transform">
          <Trophy className="mx-auto mb-4 text-kraken-cyan" size={48} />
          <h4 className="font-display text-xl text-white mb-2">REVIEW TIMES</h4>
          <p className="text-gray-400 text-sm">Approve or reject submissions</p>
        </a>
        <a href="/admin/defaults" className="card text-center hover:scale-105 transition-transform">
          <SlidersHorizontal className="mx-auto mb-4 text-kraken-cyan" size={48} />
          <h4 className="font-display text-xl text-white mb-2">DEFAULTS HIERARCHY</h4>
          <p className="text-gray-400 text-sm">Manage games, tracks, and cars by game</p>
        </a>
      </div>

      <div className="card">
        <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">
          HIGHLIGHTED LEADERBOARDS
        </h3>
        <p className="text-sm text-gray-400 mb-3">Configure rotating highlights using dropdowns.</p>
        <div className="space-y-3">
          {highlightedRows.map((row, index) => {
            const tracksForGame = gameCatalog.find((item) => item.game === row.game)?.tracks || []
            return (
              <div
                key={row.id}
                draggable
                onDragStart={() => setDraggingHighlightId(row.id)}
                onDragEnd={() => setDraggingHighlightId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingHighlightId) {
                    moveHighlightRowTo(draggingHighlightId, row.id)
                  }
                  setDraggingHighlightId(null)
                }}
                className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-end cursor-move"
              >
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Label</label>
                  <input
                    className="input-field"
                    value={row.label}
                    onChange={(event) => updateHighlightRow(row.id, { label: event.target.value })}
                    placeholder="ACC • Monza"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Game</label>
                  <select
                    className="input-field"
                    value={row.game}
                    onChange={(event) => updateHighlightRow(row.id, { game: event.target.value })}
                  >
                    <option value="">Select game</option>
                    {availableGames.map((game) => (
                      <option key={game} value={game}>
                        {game.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Track</label>
                  <select
                    className="input-field"
                    value={row.track}
                    onChange={(event) => updateHighlightRow(row.id, { track: event.target.value })}
                  >
                    <option value="">Select track</option>
                    {tracksForGame.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => moveHighlightRow(row.id, -1)}
                    disabled={index === 0}
                  >
                    UP
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => moveHighlightRow(row.id, 1)}
                    disabled={index === highlightedRows.length - 1}
                  >
                    DOWN
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeHighlightRow(row.id)}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4">
          <button type="button" onClick={addHighlightRow} className="btn-secondary w-full sm:w-auto">
            ADD HIGHLIGHT
          </button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="button"
            onClick={saveHighlightedLeaderboards}
            disabled={savingHighlightedLeaderboards}
            className="btn-primary w-full sm:w-auto"
          >
            {savingHighlightedLeaderboards ? 'SAVING...' : 'SAVE HIGHLIGHTS'}
          </button>
          {highlightedLeaderboardMessage && <p className="text-sm text-gray-300">{highlightedLeaderboardMessage}</p>}
        </div>
      </div>

      <div className="card">
        <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">
          SITE LAUNCH SETTINGS
        </h3>
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-kraken-cyan mb-2 font-display">OFFICIAL OPENING DATE</label>
            <input
              type="datetime-local"
              value={launchDate}
              onChange={(event) => setLaunchDate(event.target.value)}
              className="input-field"
            />
            <p className="text-gray-400 text-sm mt-2">
              Current phase preview: <span className="text-white uppercase">{sitePhase}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={saveLaunchDate}
            disabled={savingLaunchDate}
            className="btn-primary w-full md:w-auto"
          >
            {savingLaunchDate ? 'SAVING...' : 'SAVE OPENING DATE'}
          </button>
        </div>
        {launchMessage && <p className="text-sm text-gray-300 mt-3">{launchMessage}</p>}
        <p className="text-xs text-gray-500 mt-4">
          Requires Supabase table: site_settings(key text primary key, value_text text).
        </p>
      </div>

    </div>
  )
}
