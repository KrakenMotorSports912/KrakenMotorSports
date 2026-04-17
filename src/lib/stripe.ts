import Stripe from 'stripe'

export const isStripeConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)

let stripeClient: Stripe | null = null

export const getStripeClient = () => {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  stripeClient = new Stripe(secretKey)
  return stripeClient
}

export const getAppBaseUrl = (requestOrigin?: string) => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL
  if (configured) return configured.replace(/\/$/, '')
  if (requestOrigin) return requestOrigin.replace(/\/$/, '')
  return 'http://localhost:3000'
}
