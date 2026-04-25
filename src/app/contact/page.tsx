import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Mail } from 'lucide-react'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-kraken-dark">
      <Navigation />
      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="section-title">GET IN TOUCH</h1>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Contact Form */}
            <div className="card">
              <h2 className="text-2xl font-display tracking-wide text-kraken-cyan mb-6">SEND US A MESSAGE</h2>
              <form className="space-y-4" action="mailto:KrakenMotorSports912@gmail.com" method="POST" encType="text/plain">
                <input type="text" placeholder="Your Name" className="input-field" required />
                <input type="email" placeholder="Your Email" className="input-field" required />
                <input type="text" placeholder="Subject" className="input-field" required />
                <textarea placeholder="Your Message" rows={5} className="input-field" required></textarea>
                <button type="submit" className="btn-primary w-full text-center">SEND MESSAGE</button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* Email */}
              <div className="card">
                <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">EMAIL</h3>
                <p className="text-kraken-gray mb-4">Questions about the Kraken Rig, Founders Pass, or partnerships?</p>
                <a
                  href="mailto:KrakenMotorSports912@gmail.com"
                  className="btn-secondary flex items-center justify-center gap-2 w-full"
                >
                  <Mail size={20} />
                  KRAKENMOTORSPORTS912@GMAIL.COM
                </a>
              </div>

              {/* Discord */}
              <div className="card">
                <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">DISCORD</h3>
                <p className="text-kraken-gray mb-4">Join our community for live updates and racing events.</p>
                <a
                  href={process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/5DJtSRfaZZ'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center justify-center gap-2 w-full"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  JOIN DISCORD
                </a>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Instagram */}
            <div className="card">
              <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">FOLLOW ON INSTAGRAM</h3>
              <p className="text-kraken-gray mb-6">Watch the Kraken Rig come to life. Follow our journey on social media.</p>
              <a
                href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 w-full"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                FOLLOW INSTAGRAM
              </a>
            </div>

            {/* TikTok */}
            <div className="card">
              <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-4">FOLLOW ON TIKTOK</h3>
              <p className="text-kraken-gray mb-6">Behind-the-scenes content and epic racing moments.</p>
              <a
                href={process.env.NEXT_PUBLIC_TIKTOK_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 w-full"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
                FOLLOW TIKTOK
              </a>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
