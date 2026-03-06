'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Calendar, Users, Trophy } from 'lucide-react'
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

type Event = {
  id: string
  title: string
  description: string | null
  event_type: 'race' | 'tournament' | 'time_trial' | 'special' | 'maintenance'
  game: string
  track: string
  car_class: string | null
  start_date: string
  end_date: string
  prize: string | null
  entry_fee: number
  max_participants: number | null
  current_participants: number
  is_active: boolean
  images: string[] | null
  created_at: string
}

type EventFormData = {
  title: string
  description: string
  event_type: Event['event_type']
  game: string
  track: string
  car_class: string
  start_date: string
  end_date: string
  prize: string
  entry_fee: number
  max_participants: number | null
  is_active: boolean
}

type SiteSettingRow = {
  key: string
  value_text: string | null
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [defaultGames, setDefaultGames] = useState<string[]>(FALLBACK_GAMES)
  const [defaultTracks, setDefaultTracks] = useState<string[]>(FALLBACK_TRACKS)
  const [defaultCatalog, setDefaultCatalog] = useState<GameDefaultsNode[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hiddenEventSections, setHiddenEventSections] = useState({
    current: false,
    upcoming: false,
    past: false,
  })
  const supabase = createClient()

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'race',
    game: '',
    track: '',
    car_class: '',
    start_date: '',
    end_date: '',
    prize: '',
    entry_fee: 0,
    max_participants: 20,
    is_active: true,
  })

  const selectedGameDefaults = formData.game ? defaultCatalog.find((item) => item.game === formData.game) : null
  const trackOptionsForSelectedGame = selectedGameDefaults?.tracks?.length ? selectedGameDefaults.tracks : defaultTracks
  const carOptionsForSelectedGame = selectedGameDefaults?.cars?.length ? selectedGameDefaults.cars : FALLBACK_CARS

  useEffect(() => {
    fetchEvents()
    fetchDropdownDefaults()
  }, [])

  const fetchDropdownDefaults = async () => {
    const localDefaults = readLocalDefaultOptions()
    const localCatalog = readLocalDefaultGameCatalog()

    if (localCatalog.length > 0) {
      setDefaultCatalog(localCatalog)
      const localFlattened = flattenGameCatalog(localCatalog)
      setDefaultGames(localFlattened.games.length > 0 ? localFlattened.games : FALLBACK_GAMES)
      setDefaultTracks(localFlattened.tracks.length > 0 ? localFlattened.tracks : FALLBACK_TRACKS)
    }

    if (localDefaults.games.length > 0) {
      setDefaultGames(localDefaults.games)
    }
    if (localDefaults.tracks.length > 0) {
      setDefaultTracks(localDefaults.tracks)
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value_text')
      .in('key', ['default_games', 'default_tracks', 'default_cars', 'default_game_catalog'])

    if (!data || error) {
      return
    }

    const settings = data as SiteSettingRow[]

    const gamesSetting = settings.find((item) => item.key === 'default_games')
    const tracksSetting = settings.find((item) => item.key === 'default_tracks')
    const carsSetting = settings.find((item) => item.key === 'default_cars')
    const catalogSetting = settings.find((item) => item.key === 'default_game_catalog')

    const games = gamesSetting?.value_text ? parseOptionsInput(gamesSetting.value_text) : []
    const tracks = tracksSetting?.value_text ? parseOptionsInput(tracksSetting.value_text) : []
    const cars = carsSetting?.value_text ? parseOptionsInput(carsSetting.value_text) : []
    const parsedCatalog = parseDefaultGameCatalog(catalogSetting?.value_text || '')
    const catalog = parsedCatalog.length > 0 ? parsedCatalog : buildCatalogFromFlatDefaults(games, tracks, cars)
    const flattenedCatalog = flattenGameCatalog(catalog)

    if (catalog.length > 0) {
      setDefaultCatalog(catalog)
    }

    setDefaultGames(Array.from(new Set([...FALLBACK_GAMES, ...flattenedCatalog.games, ...localDefaults.games])).sort())
    setDefaultTracks(Array.from(new Set([...FALLBACK_TRACKS, ...flattenedCatalog.tracks, ...localDefaults.tracks])).sort())
  }

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false })

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormError('Please provide valid start and end dates.')
      setIsSubmitting(false)
      return
    }

    if (startDate > endDate) {
      setFormError('Start date must be before end date.')
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      setFormError('You must be logged in as an admin to create events.')
      setIsSubmitting(false)
      return
    }

    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      event_type: formData.event_type,
      game: formData.game,
      track: formData.track.trim(),
      car_class: formData.car_class.trim() || null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      prize: formData.prize.trim() || null,
      entry_fee: Number.isFinite(formData.entry_fee) ? formData.entry_fee : 0,
      max_participants: formData.max_participants == null
        ? null
        : Number.isFinite(formData.max_participants)
          ? formData.max_participants
          : null,
      is_active: formData.is_active,
      images: imageUrls.length > 0 ? imageUrls : null,
    }

    const submitDataWithoutImages = {
      title: submitData.title,
      description: submitData.description,
      event_type: submitData.event_type,
      game: submitData.game,
      track: submitData.track,
      car_class: submitData.car_class,
      start_date: submitData.start_date,
      end_date: submitData.end_date,
      prize: submitData.prize,
      entry_fee: submitData.entry_fee,
      max_participants: submitData.max_participants,
      is_active: submitData.is_active,
    }

    if (editingEvent) {
      // Update existing event
      let { error } = await supabase
        .from('events')
        .update(submitData)
        .eq('id', editingEvent.id)

      if (error?.message.includes("Could not find the 'images' column")) {
        const retry = await supabase
          .from('events')
          .update(submitDataWithoutImages)
          .eq('id', editingEvent.id)
        error = retry.error
      }

      if (!error) {
        fetchEvents()
        resetForm()
      } else {
        setFormError(error.message)
      }
    } else {
      // Create new event
      let { error } = await supabase
        .from('events')
        .insert({
          ...submitData,
          created_by: user?.id,
        })

      if (error?.message.includes("Could not find the 'images' column")) {
        const retry = await supabase
          .from('events')
          .insert({
            ...submitDataWithoutImages,
            created_by: user?.id,
          })
        error = retry.error
      }

      if (!error) {
        fetchEvents()
        resetForm()
      } else {
        setFormError(error.message)
      }
    }

    setIsSubmitting(false)
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      game: event.game,
      track: event.track,
      car_class: event.car_class || '',
      start_date: event.start_date.slice(0, 16),
      end_date: event.end_date.slice(0, 16),
      prize: event.prize || '',
      entry_fee: event.entry_fee,
      max_participants: event.max_participants || 20,
      is_active: event.is_active,
    })
    setImageUrls(event.images || [])
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchEvents()
      }
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      fetchEvents()
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'race',
      game: '',
      track: '',
      car_class: '',
      start_date: '',
      end_date: '',
      prize: '',
      entry_fee: 0,
      max_participants: 20,
      is_active: true,
    })
    setImageUrls([])
    setNewImageUrl('')
    setFormError('')
    setIsSubmitting(false)
    setEditingEvent(null)
    setShowForm(false)
  }

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const moveImageUp = (index: number) => {
    if (index > 0) {
      const newUrls = [...imageUrls]
      ;[newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]]
      setImageUrls(newUrls)
    }
  }

  const moveImageDown = (index: number) => {
    if (index < imageUrls.length - 1) {
      const newUrls = [...imageUrls]
      ;[newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]]
      setImageUrls(newUrls)
    }
  }

  const now = new Date()
  const currentEvents = events.filter((event) => {
    const start = new Date(event.start_date)
    const end = new Date(event.end_date)
    return start <= now && end >= now
  })
  const upcomingEvents = events.filter((event) => new Date(event.start_date) > now)
  const pastEvents = events.filter((event) => new Date(event.end_date) < now)

  const toggleEventSection = (key: 'current' | 'upcoming' | 'past') => {
    setHiddenEventSections((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  const renderEventCard = (event: Event) => (
    <div key={event.id} className="card">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-2xl font-display text-white break-words">{event.title}</h3>
            <span className={`px-3 py-1 text-xs font-display ${
              event.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {event.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <span className="px-3 py-1 text-xs font-display bg-purple-500/20 text-purple-400">
              {event.event_type.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          {event.description && (
            <p className="text-gray-300 mb-3 break-words">{event.description}</p>
          )}

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Game</p>
              <p className="text-white break-words">{event.game.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div>
              <p className="text-gray-400">Track</p>
              <p className="text-white break-words">{event.track}</p>
            </div>
            <div>
              <p className="text-gray-400">Date</p>
              <p className="text-white">
                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
              </p>
            </div>
            {event.prize && (
              <div>
                <p className="text-gray-400">Prize</p>
                <p className="text-kraken-pink break-words">{event.prize}</p>
              </div>
            )}
            {event.max_participants && (
              <div>
                <p className="text-gray-400">Participants</p>
                <p className="text-white">{event.current_participants} / {event.max_participants}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={() => handleEdit(event)}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Edit size={16} />
            EDIT
          </button>
          <button
            onClick={() => toggleActive(event.id, event.is_active)}
            className={`text-sm py-2 px-4 font-display transition-colors ${
              event.is_active
                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {event.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
          </button>
          <button
            onClick={() => handleDelete(event.id)}
            className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-4 font-display flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} />
            DELETE
          </button>
        </div>
      </div>
    </div>
  )

  const renderEventSection = (title: string, key: 'current' | 'upcoming' | 'past', items: Event[]) => (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-display text-kraken-cyan">{title} EVENTS</h3>
        <button
          type="button"
          className="btn-secondary px-4 py-2 text-sm"
          onClick={() => toggleEventSection(key)}
        >
          {hiddenEventSections[key] ? 'SHOW' : 'HIDE'}
        </button>
      </div>
      {!hiddenEventSections[key] && (
        items.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">No {title.toLowerCase()} events.</div>
        ) : (
          <div className="space-y-4">
            {items.map((event) => renderEventCard(event))}
          </div>
        )
      )}
    </div>
  )

  return (
    <section>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-2">
            EVENT MANAGEMENT
          </h2>
          <p className="text-gray-300">Create and manage racing events</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {showForm ? 'CANCEL' : 'NEW EVENT'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-2xl font-display text-kraken-cyan mb-4">
            {editingEvent ? 'EDIT EVENT' : 'CREATE NEW EVENT'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-kraken-cyan mb-2 font-display">TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Night Apex Sprint"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">EVENT TYPE *</label>
                <select
                  required
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="race">Race</option>
                  <option value="tournament">Tournament</option>
                  <option value="time_trial">Time Trial</option>
                  <option value="special">Special Event</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">GAME</label>
                <select
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="input-field"
                >
                  <option value="">Optional</option>
                  {defaultGames.map((game) => (
                    <option key={game} value={game}>
                      {game.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">TRACK</label>
                <input
                  type="text"
                  list="event-track-defaults"
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  className="input-field"
                  placeholder="Optional"
                />
                <datalist id="event-track-defaults">
                  {trackOptionsForSelectedGame.map((track) => (
                    <option key={track} value={track} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">CAR CLASS</label>
                <input
                  type="text"
                  value={formData.car_class}
                  list="event-car-defaults"
                  onChange={(e) => setFormData({ ...formData, car_class: e.target.value })}
                  className="input-field"
                  placeholder="GT3, LMP1, etc."
                />
                <datalist id="event-car-defaults">
                  {carOptionsForSelectedGame.map((car) => (
                    <option key={car} value={car} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">PRIZE</label>
                <input
                  type="text"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  className="input-field"
                  placeholder="$100 cash + trophy"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">START DATE *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">END DATE *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">ENTRY FEE ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">MAX PARTICIPANTS</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_participants ?? ''}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-kraken-cyan mb-2 font-display">DESCRIPTION</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="Event description, rules, etc."
              />
            </div>

            {/* Event Images */}
            <div>
              <label className="block text-kraken-cyan mb-2 font-display">EVENT IMAGES (CAROUSEL)</label>
              <div className="space-y-3">
                {/* Add new image */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    className="input-field flex-1"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="btn-secondary px-6"
                  >
                    ADD
                  </button>
                </div>

                {/* Image list */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 bg-kraken-card p-3 rounded">
                        <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                          <Image
                            src={url}
                            alt={`Event image ${index + 1}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-gray-400 text-sm flex-1 truncate">{url}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveImageUp(index)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-kraken-cyan disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImageDown(index)}
                            disabled={index === imageUrls.length - 1}
                            className="p-1 text-gray-400 hover:text-kraken-cyan disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="p-1 px-3 text-red-400 hover:text-red-300"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-sm text-gray-400">
                      {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} • Will auto-rotate every 5 seconds on site
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="is_active" className="text-white">Active (visible to public)</label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'SAVING...' : editingEvent ? 'UPDATE EVENT' : 'CREATE EVENT'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                CANCEL
              </button>
            </div>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
          </form>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">No events created yet</p>
        </div>
      ) : (
        <>
          {renderEventSection('Current', 'current', currentEvents)}
          {renderEventSection('Upcoming', 'upcoming', upcomingEvents)}
          {renderEventSection('Past', 'past', pastEvents)}
        </>
      )}
    </section>
  )
}
