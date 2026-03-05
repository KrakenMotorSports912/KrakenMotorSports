'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Calendar, Tag, Users, Clock, TrendingUp } from 'lucide-react'
import { getDefaultLaunchDate, getLaunchPhase } from '@/lib/launchPhase'
import {
  FALLBACK_GAMES,
  FALLBACK_TRACKS,
  isMissingSiteSettingsTableError,
  parseOptionsInput,
  readLocalDefaultOptions,
  saveLocalDefaultOptions,
} from '@/lib/adminDefaults'

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
  const [defaultGamesText, setDefaultGamesText] = useState(FALLBACK_GAMES.join('\n'))
  const [defaultTracksText, setDefaultTracksText] = useState(FALLBACK_TRACKS.join('\n'))
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [defaultsMessage, setDefaultsMessage] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    const supabase = createClient()
    const localDefaults = readLocalDefaultOptions()
    if (localDefaults.games.length > 0) {
      setDefaultGamesText(localDefaults.games.join('\n'))
    }
    if (localDefaults.tracks.length > 0) {
      setDefaultTracksText(localDefaults.tracks.join('\n'))
    }

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

    const { data: launchData } = await supabase
      .from('site_settings')
      .select('value_text')
      .eq('key', 'launch_date')
      .single()

    if (launchData?.value_text) {
      setLaunchDate(launchData.value_text.slice(0, 16))
    }

    const { data: dropdownDefaults, error: defaultsError } = await supabase
      .from('site_settings')
      .select('key, value_text')
      .in('key', ['default_games', 'default_tracks'])

    if (!defaultsError && dropdownDefaults) {
      const settings = dropdownDefaults as SiteSettingRow[]
      const gameSetting = settings.find((setting) => setting.key === 'default_games')
      const trackSetting = settings.find((setting) => setting.key === 'default_tracks')

      if (gameSetting?.value_text) {
        const games = parseOptionsInput(gameSetting.value_text)
        if (games.length > 0) {
          setDefaultGamesText(games.join('\n'))
        }
      }

      if (trackSetting?.value_text) {
        const tracks = parseOptionsInput(trackSetting.value_text)
        if (tracks.length > 0) {
          setDefaultTracksText(tracks.join('\n'))
        }
      }
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

  const saveDropdownDefaults = async () => {
    setSavingDefaults(true)
    setDefaultsMessage('')
    const supabase = createClient()

    const games = parseOptionsInput(defaultGamesText)
    const tracks = parseOptionsInput(defaultTracksText)

    if (games.length === 0) {
      setDefaultsMessage('Add at least one default game.')
      setSavingDefaults(false)
      return
    }

    if (tracks.length === 0) {
      setDefaultsMessage('Add at least one default track.')
      setSavingDefaults(false)
      return
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        [
          { key: 'default_games', value_text: games.join('\n') },
          { key: 'default_tracks', value_text: tracks.join('\n') },
        ],
        { onConflict: 'key' }
      )

    if (error) {
      if (isMissingSiteSettingsTableError(error.message)) {
        saveLocalDefaultOptions(games, tracks)
        setDefaultsMessage('Saved defaults locally in this browser. To sync across devices, create the site_settings table in Supabase.')
      } else {
        setDefaultsMessage(`Could not save defaults: ${error.message}`)
      }
    } else {
      saveLocalDefaultOptions(games, tracks)
      setDefaultsMessage('Default dropdown options saved successfully.')
      setDefaultGamesText(games.join('\n'))
      setDefaultTracksText(tracks.join('\n'))
    }

    setSavingDefaults(false)
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
                    <td className="py-3 px-4 font-display">{entry.driver_name}</td>
                    <td className="py-3 px-4 text-gray-400">{entry.game.replace('_', ' ').toUpperCase()}</td>
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

      <div className="card">
        <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">
          DEFAULT DROPDOWN OPTIONS
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          Manage default Games and Tracks used in admin forms. Use one value per line (or commas).
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-kraken-cyan mb-2 font-display">DEFAULT GAMES</label>
            <textarea
              value={defaultGamesText}
              onChange={(event) => setDefaultGamesText(event.target.value)}
              className="input-field min-h-[180px]"
              placeholder="assetto_corsa\nassetto_corsa_competizione\nf1_2025"
            />
          </div>
          <div>
            <label className="block text-kraken-cyan mb-2 font-display">DEFAULT TRACKS</label>
            <textarea
              value={defaultTracksText}
              onChange={(event) => setDefaultTracksText(event.target.value)}
              className="input-field min-h-[180px]"
              placeholder="Monza\nSpa-Francorchamps\nSilverstone"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={saveDropdownDefaults}
            disabled={savingDefaults}
            className="btn-primary w-full md:w-auto"
          >
            {savingDefaults ? 'SAVING...' : 'SAVE DEFAULT OPTIONS'}
          </button>
        </div>
        {defaultsMessage && <p className="text-sm text-gray-300 mt-3">{defaultsMessage}</p>}
      </div>
    </div>
  )
}
