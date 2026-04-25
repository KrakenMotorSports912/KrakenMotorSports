import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function AboutPage() {
  const team = [
    {
      name: 'Founder & Vision',
      role: 'Head of Kraken Motor Sports',
      description: 'Passionate about sim racing and creating immersive experiences for Rexburg\'s racing community.',
    },
  ]

  return (
    <main className="min-h-screen bg-kraken-dark">
      <Navigation />
      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <h1 className="section-title">OUR STORY: THE KRAKEN MOTOR SPORTS JOURNEY</h1>

          {/* Mission */}
          <section className="mb-16">
            <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-6">OUR MISSION</h2>
            <p className="text-lg text-kraken-gray leading-relaxed mb-4">
              To deliver the most immersive and accessible VR racing experience, fostering a community of passionate drivers
              who push the limits of competitive simulation racing.
            </p>
            <p className="text-lg text-kraken-gray leading-relaxed">
              Kraken Motor Sports exists to make premium racing simulation available to students and enthusiasts in Rexburg,
              providing a platform for competition, skill development, and pure adrenaline.
            </p>
          </section>

          {/* Vision */}
          <section className="mb-16">
            <h2 className="text-4xl font-display tracking-wider text-kraken-pink mb-6">THE VISION</h2>
            <p className="text-lg text-kraken-gray leading-relaxed mb-4">
              The Kraken Rig represents a commitment to high-end hardware and realistic simulation. We didn't build just another
              racing simulator—we engineered an experience that rivals dedicated esports facilities.
            </p>
            <p className="text-lg text-kraken-gray leading-relaxed">
              Our vision is to establish Kraken Motor Sports as Rexburg's premier destination for competitive VR racing,
              hosting events, leagues, and fostering a thriving community of drivers who embrace the challenge and the glory.
            </p>
          </section>

          {/* The Rig Philosophy */}
          <section className="mb-16">
            <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-6">THE RIG PHILOSOPHY</h2>
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-2xl font-display tracking-wide text-kraken-pink mb-2">PRECISION</h3>
                <p className="text-kraken-gray">
                  Every component of the Kraken Rig is engineered for accuracy and realism. From the direct drive force feedback
                  wheel to the 6DoF VR tracking, no detail is compromised.
                </p>
              </div>
              <div className="card">
                <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-2">IMMERSION</h3>
                <p className="text-kraken-gray">
                  Full sensory engagement. VR immersion, motion platform feedback, and force feedback come together to blur
                  the line between simulation and reality.
                </p>
              </div>
              <div className="card">
                <h3 className="text-2xl font-display tracking-wide text-kraken-pink mb-2">COMMUNITY</h3>
                <p className="text-kraken-gray">
                  Kraken Motor Sports is about the people. Founders, regular racers, and competitors—we're building a community
                  where passion for sim racing drives everything.
                </p>
              </div>
            </div>
          </section>

          {/* The Team */}
          <section>
            <h2 className="text-4xl font-display tracking-wider text-kraken-cyan mb-12">THE TEAM</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {team.map((member, index) => (
                <div key={index} className="card">
                  <h3 className="text-2xl font-display tracking-wide text-kraken-cyan mb-2">{member.name}</h3>
                  <p className="text-kraken-pink font-accent text-sm mb-4">{member.role}</p>
                  <p className="text-kraken-gray">{member.description}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-kraken-gray mt-12">
              Kraken Motor Sports is built by passionate racers and sim enthusiasts dedicated to bringing the ultimate
              VR racing experience to Rexburg.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
