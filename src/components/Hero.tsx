'use client'

import Link from 'next/link'

export default function Hero() {
  // Blueprint: Always show the premium headline, subheadline, and video/photo background
  return (
    <section id="home" className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden pt-20 pb-24">
      {/* Video Background (blueprint: 3-5s loop, fallback to image) */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/kraken-rig-hero.jpg"
          className="w-full h-full object-cover object-center opacity-60"
          style={{ minHeight: '100%', minWidth: '100%' }}
        >
          <source src="/videos/kraken-hero-loop.mp4" type="video/mp4" />
        </video>
        {/* fallback gradient overlays for extra mood */}
        <div className="absolute inset-0 bg-gradient-to-br from-kraken-dark via-kraken-deep to-kraken-cyan-dark opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,255,255,0.10),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,0,255,0.10),transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 text-center relative z-20">
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-wider text-kraken-cyan animate-glow mb-4">
          UNLEASH THE BEAST. <span className="block text-3xl md:text-4xl mt-2 text-white">Experience VR Racing Like Never Before.</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-body text-white mb-8">
          Rexburg's Premier VR Racing Simulator. <span className="accent-cyan">Feel Every Turn, Conquer Every Track.</span>
        </h2>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 items-center w-full max-w-md mx-auto">
          <Link href="/bookings?from=home" className="btn-primary text-lg px-10 py-4 w-full hover:scale-105 transition-transform animate-glow">
            BOOK YOUR SESSION
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 w-full justify-center"
            style={{ background: 'linear-gradient(90deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)', color: 'white' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25 1.25a1 1 0 1 1 0 2a1 1 0 0 1 0-2z" />
            </svg>
            FOLLOW ON INSTAGRAM
          </a>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-stretch">
            <a 
              href={process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/5DJtSRfaZZ'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2 w-full justify-center flex-1 h-full min-h-[56px] !p-0 text-center"
              style={{maxWidth: '100%'}}
            >
              <span className="w-full flex items-center justify-center h-full min-h-[56px] text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                JOIN DISCORD
              </span>
            </a>
            <Link
              href="#events"
              className="btn-secondary w-full text-center flex-1 h-full min-h-[56px] flex items-center justify-center !p-0"
              style={{maxWidth: '100%'}}
            >
              <span className="w-full flex items-center justify-center h-full min-h-[56px] text-center">
                VIEW EVENTS
              </span>
            </Link>
            <Link href="#leaderboard" className="btn-secondary w-full text-center flex-1 h-full min-h-[56px] flex items-center justify-center !p-0" style={{maxWidth: '100%'}}>
              <span className="w-full flex items-center justify-center h-full min-h-[56px] text-center">
                LEADERBOARDS
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

