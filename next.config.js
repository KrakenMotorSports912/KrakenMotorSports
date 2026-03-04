/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['supabase.co'], // Add your Supabase storage domain
  },
}

module.exports = nextConfig
