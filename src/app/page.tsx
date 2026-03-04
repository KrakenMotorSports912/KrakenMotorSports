import Hero from '@/components/Hero'
import About from '@/components/About'
import LiveLeaderboard from '@/components/LiveLeaderboard'
import FoundersPass from '@/components/FoundersPass'
import UpcomingEvents from '@/components/UpcomingEvents'
import Branding from '@/components/Branding'
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
      <LiveLeaderboard />
      <UpcomingEvents />
      <FoundersPass />
      <Branding />
      <Countdown />
      <Contact />
      <Footer />
    </main>
  )
}
