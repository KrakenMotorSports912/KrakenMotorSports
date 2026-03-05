import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LiveLeaderboard from '@/components/LiveLeaderboard'

export const revalidate = 30

export default function LeaderboardsPage() {
  return (
    <main className="min-h-screen bg-kraken-dark">
      <Navigation />
      <div className="pt-28">
        <LiveLeaderboard mode="full" />
      </div>
      <Footer />
    </main>
  )
}
