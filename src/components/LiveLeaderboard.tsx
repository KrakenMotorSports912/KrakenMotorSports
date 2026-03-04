'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Award } from 'lucide-react'

type LeaderboardEntry = {
  id: string
  driver_name: string
  game: string
  track: string
  car: string
  lap_time_display: string
  lap_time_ms: number
  created_at: string
}

export default function LiveLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState('all')

  const games = [
    { value: 'all', label: 'All Games' },
    { value: 'assetto_corsa', label: 'Assetto Corsa' },
    { value: 'assetto_corsa_competizione', label: 'ACC' },
    { value: 'f1_2025', label: 'F1 2025' },
    { value: 'forza_motorsport', label: 'Forza Motorsport' },
  ]

  useEffect(() => {
    fetchLeaderboard()
    
    // Set up real-time subscription
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
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedGame])

  const fetchLeaderboard = async () => {
    const supabase = createClient()
    let query = supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('status', 'approved')
      .order('lap_time_ms', { ascending: true })
      .limit(10)

    if (selectedGame !== 'all') {
      query = query.eq('game', selectedGame)
    }

    const { data, error } = await query

    if (!error && data) {
      setEntries(data)
    }
    setLoading(false)
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400" size={24} />
    if (index === 1) return <Medal className="text-gray-400" size={24} />
    if (index === 2) return <Award className="text-orange-600" size={24} />
    return <span className="text-lg font-display">{index + 1}</span>
  }

  return (
    <section id="leaderboard" className="py-24 bg-gradient-to-b from-kraken-dark to-kraken-deep">
      <div className="container mx-auto px-4">
        <h2 className="section-title">🦑 LIVE LEADERBOARD 🦑</h2>
        <p className="text-center text-xl text-gray-300 mb-8">
          Top times updated in real-time. 🦑 Think you can beat them?
        </p>

        {/* Game Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {games.map((game) => (
            <button
              key={game.value}
              onClick={() => setSelectedGame(game.value)}
              className={`px-6 py-2 font-display tracking-wide transition-all ${
                selectedGame === game.value
                  ? 'bg-kraken-cyan text-kraken-dark'
                  : 'bg-transparent text-kraken-cyan border-2 border-kraken-cyan hover:bg-kraken-cyan hover:text-kraken-dark'
              }`}
            >
              {game.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="max-w-5xl mx-auto card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="py-4 px-4 text-left">RANK</th>
                  <th className="py-4 px-4 text-left">DRIVER</th>
                  <th className="py-4 px-4 text-left hidden md:table-cell">TRACK</th>
                  <th className="py-4 px-4 text-left">TIME</th>
                  <th className="py-4 px-4 text-left hidden lg:table-cell">CAR</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="loading-spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      No entries yet. Be the first to submit a time!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={entry.id} className="table-row">
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(index)}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-display text-lg tracking-wide">
                        {entry.driver_name}
                      </td>
                      <td className="py-4 px-4 text-gray-400 hidden md:table-cell">
                        {entry.track}
                      </td>
                      <td className="py-4 px-4 font-mono text-kraken-cyan font-bold text-lg">
                        {entry.lap_time_display}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm hidden lg:table-cell">
                        {entry.car}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Submit Time CTA */}
          <div className="p-6 border-t-2 border-kraken-cyan-dark text-center">
            <p className="text-gray-300 mb-4">Got a hot lap? Submit your time to compete!</p>
            <a href="/submit" className="btn-primary inline-block">
              SUBMIT YOUR TIME
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
