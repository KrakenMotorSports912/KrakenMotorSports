'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Calendar, Users, Trophy } from 'lucide-react'

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'race',
    game: 'assetto_corsa',
    track: '',
    car_class: '',
    start_date: '',
    end_date: '',
    prize: '',
    entry_fee: 0,
    max_participants: 20,
    is_active: true,
  })

  useEffect(() => {
    fetchEvents()
  }, [])

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

    if (editingEvent) {
      // Update existing event
      const { error } = await supabase
        .from('events')
        .update(submitData)
        .eq('id', editingEvent.id)

      if (!error) {
        fetchEvents()
        resetForm()
      } else {
        setFormError(error.message)
      }
    } else {
      // Create new event
      const { error } = await supabase
        .from('events')
        .insert({
          ...submitData,
          created_by: user?.id,
        })

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
      game: 'assetto_corsa',
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
                <label className="block text-kraken-cyan mb-2 font-display">GAME *</label>
                <select
                  required
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="input-field"
                >
                  <option value="assetto_corsa">Assetto Corsa</option>
                  <option value="assetto_corsa_competizione">Assetto Corsa Competizione</option>
                  <option value="f1_2025">F1 2025</option>
                  <option value="forza_motorsport">Forza Motorsport</option>
                  <option value="forza_horizon">Forza Horizon</option>
                </select>
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">TRACK *</label>
                <input
                  type="text"
                  required
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  className="input-field"
                  placeholder="Spa-Francorchamps"
                />
              </div>

              <div>
                <label className="block text-kraken-cyan mb-2 font-display">CAR CLASS</label>
                <input
                  type="text"
                  value={formData.car_class}
                  onChange={(e) => setFormData({ ...formData, car_class: e.target.value })}
                  className="input-field"
                  placeholder="GT3, LMP1, etc."
                />
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
                        <img src={url} alt={`Event image ${index + 1}`} className="w-16 h-16 object-cover rounded" />
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
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-display text-white">{event.title}</h3>
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
                    <p className="text-gray-300 mb-3">{event.description}</p>
                  )}

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Game</p>
                      <p className="text-white">{event.game.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Track</p>
                      <p className="text-white">{event.track}</p>
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
                        <p className="text-kraken-pink">{event.prize}</p>
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
          ))}
        </div>
      )}
    </section>
  )
}
