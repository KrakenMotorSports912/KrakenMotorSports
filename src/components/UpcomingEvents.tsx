'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Trophy, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import ImageCarousel from './ImageCarousel'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  description: string | null
  event_type: string
  game: string
  track: string
  start_date: string
  end_date: string
  prize: string | null
  max_participants: number | null
  current_participants: number
  images: string[] | null
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(3)

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament: 'bg-kraken-pink',
      race: 'bg-k raken-cyan',
      time_trial: 'bg-blue-500',
      special: 'bg-purple-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <section id="events" className="py-24 bg-kraken-dark">
      <div className="container mx-auto px-4">
        <h2 className="section-title">🦑 UPCOMING EVENTS 🦑</h2>
        <p className="text-center text-xl text-gray-300 mb-12">
          Join competitions, win prizes, and prove you're the fastest 🦑
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="card max-w-2xl mx-auto text-center py-12">
            <p className="text-2xl font-display text-gray-400">NO EVENTS SCHEDULED YET</p>
            <p className="text-gray-500 mt-4">Check back soon for upcoming races and tournaments!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {events.map((event) => (
              <div key={event.id} className="card flex flex-col">
                {/* Event Images Carousel */}
                {event.images && event.images.length > 0 && (
                  <div className="-mx-6 -mt-6 mb-4">
                    <ImageCarousel images={event.images} alt={event.title} autoPlay={true} interval={4000} />
                  </div>
                )}

                <div className={`${getEventTypeColor(event.event_type)} text-white px-4 py-2 -mx-6 ${event.images && event.images.length > 0 ? '' : '-mt-6'} mb-4`}>
                  <p className="font-display text-lg tracking-wide uppercase">{event.event_type}</p>
                </div>

                <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-3">
                  {event.title}
                </h3>

                <p className="text-gray-400 mb-4 flex-grow">
                  {event.description || `${event.game} - ${event.track}`}
                </p>

                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-kraken-cyan" />
                    <span>{format(new Date(event.start_date), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-kraken-cyan" />
                    <span>{format(new Date(event.start_date), 'h:mm a')}</span>
                  </div>

                  {event.prize && (
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-kraken-cyan" />
                      <span>{event.prize}</span>
                    </div>
                  )}

                  {event.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-kraken-cyan" />
                      <span>{event.current_participants} / {event.max_participants} participants</span>
                    </div>
                  )}
                </div>

                <Link href={`/bookings?from=home&event_id=${event.id}`} className="btn-primary mt-6 w-full text-center">
                  REGISTER
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
