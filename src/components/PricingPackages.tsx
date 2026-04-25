import Link from 'next/link'

type PackageCard = {
  name: string
  duration: string
  price: string
  description: string
  highlights: string[]
  featured?: boolean
}

const packages: PackageCard[] = [
  {
    name: 'Sprint Session',
    duration: '15 minutes',
    price: '$12',
    description: 'A quick adrenaline hit between classes.',
    highlights: ['Fast onboarding', 'One featured track', 'Instant leaderboard eligibility'],
  },
  {
    name: 'Grand Prix Session',
    duration: '30 minutes',
    price: '$22',
    description: 'Most popular package for full race immersion.',
    highlights: ['Track + car options', 'Practice + race pace run', 'Priority score review'],
    featured: true,
  },
  {
    name: 'Endurance Session',
    duration: '60 minutes',
    price: '$38',
    description: 'Deep focus setup for serious competitors.',
    highlights: ['Extended setup time', 'Multiple track attempts', 'Coaching notes included'],
  },
  {
    name: 'Founders Pass',
    duration: 'Limited Membership',
    price: 'From $99',
    description: 'Lock in long-term perks and VIP access.',
    highlights: ['Lifetime discount', 'Name on rig plaque', 'Founder-only Discord role'],
  },
]

export default function PricingPackages() {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-kraken-dark to-kraken-deep">
      <div className="container mx-auto px-4">
        <h2 className="section-title">YOUR RACE, YOUR WAY</h2>
        <p className="text-center text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Flexible sessions built for first-time drivers and leaderboard hunters alike.
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {packages.map((pkg) => (
            <article
              key={pkg.name}
              className={`card flex flex-col h-full ${pkg.featured ? 'border-kraken-pink box-glow-strong' : ''}`}
            >
              <p className="text-sm tracking-wider text-kraken-cyan uppercase mb-2">{pkg.duration}</p>
              <h3 className="text-3xl font-display tracking-wide text-white">{pkg.name}</h3>
              <p className="text-5xl font-display text-kraken-pink mt-4 mb-3">{pkg.price}</p>
              <p className="text-gray-300 mb-5">{pkg.description}</p>

              <ul className="space-y-2 text-sm text-gray-400 mb-6 flex-grow">
                {pkg.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-kraken-cyan mt-0.5">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={pkg.name === 'Founders Pass' ? '/founders-pass?from=home' : '/bookings?from=home'}
                className={pkg.featured ? 'btn-primary text-center w-full' : 'btn-secondary text-center w-full'}
              >
                {pkg.name === 'Founders Pass' ? 'RESERVE FOUNDERS PASS' : 'BOOK THIS SESSION'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}