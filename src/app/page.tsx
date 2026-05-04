import Hero from '@/components/Hero'
import About from '@/components/About'
import LiveLeaderboard from '@/components/LiveLeaderboard'
import FoundersPass from '@/components/FoundersPass'
import UpcomingEvents from '@/components/UpcomingEvents'
import Testimonials from '@/components/Testimonials'
import Countdown from '@/components/Countdown'
import Contact from '@/components/Contact'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const revalidate = 30 // Revalidate every 30 seconds for live data

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <section className="py-20 bg-gradient-to-b from-kraken-deep via-[#05070c] to-kraken-dark">
        <div className="container mx-auto px-4">
          <div className="card max-w-5xl mx-auto overflow-hidden border-kraken-pink/40 bg-gradient-to-r from-[#090b12] via-kraken-card to-[#0b1019]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.45em] text-kraken-pink">Fast lane access</p>
                <h2 className="text-3xl md:text-5xl font-display tracking-wide text-white">
                  Book a session. Pick your lane. Chase the board.
                </h2>
                <p className="max-w-2xl text-gray-300">
                  Session pricing and reservations live on the bookings page so the homepage stays focused on the ride, the leaderboard, and the community.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/bookings?from=home" className="btn-primary text-center">
                  BOOK YOUR SESSION
                </a>
                <a href="/founders-pass?from=home" className="btn-secondary text-center">
                  FOUNDERS PASS
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LiveLeaderboard mode="home" />
      <UpcomingEvents />
      <FoundersPass />
      <Testimonials />
      <Countdown />
      <Contact />
      <Footer />
    </main>
  )
}
