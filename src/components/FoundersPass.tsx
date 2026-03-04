export default function FoundersPass() {
  const perks = [
    { icon: '🎟️', title: 'Early Access', description: 'First to ride when we launch' },
    { icon: '💰', title: 'Discounted Sessions', description: '50% off all racing sessions for life' },
    { icon: '⭐', title: 'Your Name on the Rig', description: 'Permanent founder plaque on the Kraken' },
    { icon: '👑', title: 'VIP Queue Access', description: 'Skip the line, always' },
    { icon: '🎁', title: 'Exclusive Merch Pack', description: 'Kraken sticker bomb kit & founder tee' },
    { icon: '🔔', title: 'Discord Founder Role', description: 'Special status & behind-the-scenes updates' },
  ]

  return (
    <section id="founders" className="py-24 bg-gradient-to-b from-kraken-deep to-kraken-dark">
      <div className="container mx-auto px-4">
        <h2 className="section-title">🦑 FOUNDERS PASS 🦑</h2>
        <p className="text-center text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Be part of the legend. 🦑 Limited founding memberships available.
        </p>

        <div className="max-w-4xl mx-auto card box-glow-strong">
          {/* Header */}
          <div className="text-center pb-8 border-b-2 border-kraken-cyan-dark">
            <h3 className="text-5xl font-display tracking-wider text-kraken-cyan text-glow mb-3">
              KRAKEN FOUNDER
            </h3>
            <p className="text-xl text-gray-300">Exclusive Early Access Program</p>
          </div>

          {/* Perks Grid */}
          <div className="grid md:grid-cols-2 gap-6 my-8">
            {perks.map((perk, index) => (
              <div 
                key={index} 
                className="flex gap-4 items-start p-4 bg-kraken-cyan/5 border-l-4 border-kraken-cyan hover:bg-kraken-cyan/10 transition-all"
              >
                <div className="text-3xl flex-shrink-0">{perk.icon}</div>
                <div>
                  <h4 className="text-xl font-display tracking-wide text-white mb-1">
                    {perk.title}
                  </h4>
                  <p className="text-gray-400 text-sm">{perk.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t-2 border-kraken-cyan-dark">
            <p className="text-2xl font-display tracking-wide text-kraken-pink mb-6">
              ⚠️ LIMITED TO 50 PASSES
            </p>
            <a href="/founders-pass" className="btn-primary inline-block text-xl px-12 py-4">
              RESERVE YOUR PASS
            </a>
            <p className="text-gray-500 mt-4 italic">Interest list open now</p>
          </div>
        </div>
      </div>
    </section>
  )
}
