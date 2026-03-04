export default function Branding() {
  const stickers = [
    'KRAKEN', 'UNLEASH', '🦑', 'VR RACING',
    'DEEP END', 'MOTORSPORTS', 'TENTACLES', 'APEX'
  ]

  return (
    <section id="branding" className="py-24 bg-kraken-dark">
      <div className="container mx-auto px-4">
        <h2 className="section-title">BRANDING & IDENTITY</h2>
        <p className="text-center text-xl text-gray-300 mb-12">
          The aesthetic is evolving. Chaos, precision, and tentacles.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Logo Variations */}
          <div className="card">
            <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-6 text-center">
              LOGO VARIATIONS
            </h3>
            <div className="space-y-4">
              <div className="p-4 border-2 border-kraken-cyan text-center font-display text-2xl text-kraken-cyan">
                KRAKEN<br/>MOTORSPORTS
              </div>
              <div className="p-4 border-2 border-kraken-cyan border-dashed text-center font-display text-2xl text-white">
                K M S
              </div>
              <div className="p-4 border-2 border-kraken-cyan text-center font-display text-3xl text-kraken-cyan">
                🦑 KMS
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="card">
            <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-6 text-center">
              COLOR PALETTE
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-kraken-cyan flex items-end p-2 border-2 border-white/30">
                <span className="text-xs font-display text-black drop-shadow-lg">CYAN</span>
              </div>
              <div className="h-20 bg-kraken-cyan-dark flex items-end p-2 border-2 border-white/30">
                <span className="text-xs font-display text-white drop-shadow-lg">DEEP TEAL</span>
              </div>
              <div className="h-20 bg-kraken-deep flex items-end p-2 border-2 border-white/30">
                <span className="text-xs font-display text-white drop-shadow-lg">DARK DEEP</span>
              </div>
              <div className="h-20 bg-kraken-pink flex items-end p-2 border-2 border-white/30">
                <span className="text-xs font-display text-white drop-shadow-lg">NEON PINK</span>
              </div>
            </div>
          </div>

          {/* Sticker Bomb */}
          <div className="card">
            <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-6 text-center">
              STICKER BOMB
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {stickers.map((sticker, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-kraken-cyan text-kraken-dark font-display border-2 border-white shadow-lg"
                  style={{ transform: `rotate(${(index % 2 === 0 ? -2 : 2) * (index + 1)}deg)` }}
                >
                  {sticker}
                </span>
              ))}
            </div>
          </div>

          {/* UI Elements */}
          <div className="card">
            <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-6 text-center">
              UI ELEMENTS
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-kraken-dark border-2 border-kraken-cyan text-center">
                <p className="text-xs text-gray-400 font-display tracking-wider">SPEED</p>
                <p className="text-5xl font-display text-kraken-cyan">248</p>
                <p className="text-xs text-gray-500">KM/H</p>
              </div>
              <div className="p-4 bg-kraken-dark border-2 border-kraken-cyan flex justify-between items-center">
                <span className="text-3xl font-display text-kraken-cyan">P1</span>
                <span className="text-lg font-display text-gray-400">LAP 3/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
