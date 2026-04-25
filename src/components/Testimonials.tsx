const testimonials = [
  {
    quote: 'The most intense VR racing setup I have touched in Rexburg. The force feedback is wild.',
    name: 'Alex K.',
    detail: 'BYU-I Student',
  },
  {
    quote: 'I came for one session and stayed for three. This feels like a real motorsport event.',
    name: 'Mia R.',
    detail: 'Campus Creator',
  },
  {
    quote: 'Leaderboard nights are addictive. You can feel the competition every lap.',
    name: 'Jordan P.',
    detail: 'Esports Club Member',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-kraken-dark">
      <div className="container mx-auto px-4">
        <h2 className="section-title">HEAR IT FROM THE DRIVERS</h2>
        <p className="text-center text-gray-300 text-xl mb-12 max-w-3xl mx-auto">
          Real reactions from students testing the Kraken rig experience.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((item) => (
            <article key={item.name} className="card h-full">
              <p className="text-kraken-cyan text-3xl mb-2">&ldquo;</p>
              <p className="text-gray-200 leading-relaxed mb-6">{item.quote}</p>
              <p className="font-display tracking-wide text-white text-xl">{item.name}</p>
              <p className="text-sm text-gray-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}