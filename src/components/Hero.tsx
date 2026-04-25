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
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-lg mx-auto justify-center mb-8">
          <Link href="/bookings?from=home" className="btn-primary text-lg px-10 py-4 w-full sm:w-auto animate-glow" style={{ background: '#ff00ff', color: '#fff' }}>
            BOOK YOUR SESSION
          </Link>
          <Link href="#kraken-rig" className="btn-secondary border-2 border-kraken-cyan text-kraken-cyan text-lg px-10 py-4 w-full sm:w-auto" style={{ background: 'transparent' }}>
            EXPLORE THE RIG
          </Link>
        </div>

        {/* Social CTA row */}
        <div className="flex flex-row gap-4 justify-center items-center mt-4">
          <a
            href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)', color: 'white' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25 1.25a1 1 0 1 1 0 2a1 1 0 0 1 0-2z" />
            </svg>
            FOLLOW ON INSTAGRAM
          </a>
          <a 
            href={process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/5DJtSRfaZZ'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.369a19.791 19.791 0 0 0-16.634 0A4.014 4.014 0 0 0 2 7.634v8.732a4.014 4.014 0 0 0 1.683 3.265a19.791 19.791 0 0 0 16.634 0A4.014 4.014 0 0 0 22 16.366V7.634a4.014 4.014 0 0 0-1.683-3.265zM8.07 15.583l-2.5-2.5l1.414-1.414l1.086 1.086l3.086-3.086l1.414 1.414l-4.5 4.5zm7.86-2.5l-2.5 2.5l-1.414-1.414l1.086-1.086l-3.086-3.086l1.414-1.414l4.5 4.5z" />
            </svg>
            JOIN DISCORD
          </a>
        </div>
      </div>
    </section>
  )
}

