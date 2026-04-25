export default function About() {
  const features = [
    { icon: '🎮', title: 'Full VR Immersion', description: 'State-of-the-art VR headset with 6DoF tracking' },
    { icon: '🏎️', title: 'Direct Drive Wheel', description: 'Professional-grade force feedback system' },
    { icon: '⚡', title: 'Motion Platform', description: 'Feel every bump, turn, and acceleration' },
    { icon: '🏆', title: 'Global Leaderboard', description: 'Compete against the best drivers worldwide' },
  ]

  return (
    <section id="about" className="py-24 bg-kraken-dark">
      <div className="container mx-auto px-4">
        <h2 className="section-title">THE KRAKEN RIG</h2>
        
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div>
            <h3 className="text-3xl font-display tracking-wider text-white mb-6">
              🦑 DIVE INTO THE DEEP END 🦑
            </h3>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              The Kraken Rig is not just another racing simulator. It's a high-octane VR experience 
              that drops you into the driver's seat of the world's most intense racing machines.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="card">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h4 className="text-xl font-display tracking-wide text-kraken-cyan mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Focus */}
          <div className="grid gap-4">
            <div className="card min-h-[190px] flex items-end box-glow-strong bg-gradient-to-br from-kraken-cyan/20 via-kraken-card to-kraken-dark">
              <div>
                <p className="text-xs tracking-widest text-kraken-cyan uppercase">Cockpit Precision</p>
                <p className="text-2xl font-display tracking-wide text-white">Direct Drive + VR Stack</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card min-h-[170px] flex items-end bg-gradient-to-b from-kraken-pink/15 to-kraken-card">
                <div>
                  <p className="text-xs tracking-widest text-kraken-cyan uppercase">Motion</p>
                  <p className="text-xl font-display tracking-wide text-white">Real Chassis Feedback</p>
                </div>
              </div>
              <div className="card min-h-[170px] flex items-end bg-gradient-to-b from-kraken-cyan/15 to-kraken-card">
                <div>
                  <p className="text-xs tracking-widest text-kraken-cyan uppercase">Competition</p>
                  <p className="text-xl font-display tracking-wide text-white">Live Time Ranking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
