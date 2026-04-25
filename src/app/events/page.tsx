import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import UpcomingEvents from '@/components/UpcomingEvents'

export const revalidate = 30

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-kraken-dark">
      <Navigation />
      <div className="pt-28">
        <section className="py-12 bg-kraken-dark">
          <div className="container mx-auto px-4">
            <h1 className="section-title">UPCOMING KRAKEN EVENTS</h1>
            <p className="text-center text-lg text-kraken-gray mb-8 max-w-3xl mx-auto">
              Join competitive leagues, time trials, and special racing events. Compete for glory on the global leaderboard.
            </p>
          </div>
        </section>
        
        <UpcomingEvents />
      </div>
      <Footer />
    </main>
  )
}
