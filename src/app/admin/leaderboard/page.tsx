'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Eye, Clock, Trophy, Plus } from 'lucide-react'

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

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEntry, setNewEntry] = useState({
    driver_name: '',
    game: 'assetto_corsa',
    track: '',
    car: '',
    lap_time_display: '',
    screenshot_url: '',
    video_url: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchEntries()
  }, [filter])

  const fetchEntries = async () => {
    setLoading(true)
    let query = supabase
      .from('leaderboard_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query
    if (!error && data) {
      setEntries(data)
    }
    setLoading(false)
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

  const handleCreateEntry = async () => {
    // Parse lap time in format MM:SS.mmm to milliseconds
    const parseTimeToMs = (timeStr: string): number | null => {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\.(\d{3})$/)
      if (!match) return null
      const [, minutes, seconds, milliseconds] = match
      return parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds)
    }

    const lap_time_ms = parseTimeToMs(newEntry.lap_time_display)
    if (!lap_time_ms) {
      alert('Invalid lap time format. Use MM:SS.mmm (e.g., 01:23.456)')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('leaderboard_entries')
      .insert({
        driver_name: newEntry.driver_name,
        game: newEntry.game,
        track: newEntry.track,
        car: newEntry.car,
        lap_time_ms,
        lap_time_display: newEntry.lap_time_display,
        screenshot_url: newEntry.screenshot_url || null,
        video_url: newEntry.video_url || null,
        status: 'approved',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      })

    if (!error) {
      setShowCreateModal(false)
      setNewEntry({
        driver_name: '',
        game: 'assetto_corsa',
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

  return (
    <section>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-2">
            LEADERBOARD MANAGEMENT
          </h2>
          <p className="text-gray-300">Review and moderate lap time submissions</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-6 py-2 flex items-center gap-2 mr-4"
          >
            <Plus size={20} />
            ADD MANUAL ENTRY
          </button>
          <FilterButton value="pending" label="PENDING" />
          <FilterButton value="approved" label="APPROVED" />
          <FilterButton value="rejected" label="REJECTED" />
          <FilterButton value="all" label="ALL" />
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
              <div className="flex justify-between items-start">
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

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                  >
                    <Eye size={16} />
                    VIEW
                  </button>
                  
                  {entry.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(entry.id)}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 text-sm font-display flex items-center gap-2 transition-colors"
                      >
                        <Check size={16} />
                        APPROVE
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:')
                          if (reason) handleReject(entry.id, reason)
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 text-sm font-display flex items-center gap-2 transition-colors"
                      >
                        <X size={16} />
                        REJECT
                      </button>
                    </>
                  )}
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
                <div className="flex gap-4 pt-4">
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
                  <option value="assetto_corsa">Assetto Corsa</option>
                  <option value="assetto_corsa_competizione">Assetto Corsa Competizione</option>
                  <option value="gran_turismo_7">Gran Turismo 7</option>
                  <option value="forza_motorsport">Forza Motorsport</option>
                  <option value="iracing">iRacing</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Track *</label>
                <input
                  type="text"
                  value={newEntry.track}
                  onChange={(e) => setNewEntry({ ...newEntry, track: e.target.value })}
                  className="w-full px-4 py-3 bg-kraken-card border border-gray-700 text-white focus:border-kraken-cyan focus:outline-none"
                  placeholder="e.g., Nürburgring Nordschleife"
                  required
                />
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
                  placeholder="MM:SS.mmm (e.g., 01:23.456)"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">Format: MM:SS.mmm (minutes:seconds.milliseconds)</p>
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

              <div className="flex gap-4 pt-4">
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
