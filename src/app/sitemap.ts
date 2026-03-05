import type { MetadataRoute } from 'next'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kraken-motor-sports.vercel.app')

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes = [
    '/',
    '/bookings',
    '/founders-pass',
    '/leaderboards',
    '/submit',
    '/login',
  ]

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}
