import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { KonamiCodeListener } from '@/components/KonamiCodeListener'

export const metadata: Metadata = {
  title: 'Kraken Motorsports | VR Racing Rig Experience',
  description: 'The ultimate VR racing experience - Coming Soon. Join the Founders Pass program for exclusive early access.',
  keywords: 'VR racing, sim racing, Assetto Corsa, F1, Forza, leaderboard, esports',
  verification: {
    google: 'H8zoPyqhEukzp8vByPMLQasZK5n8V5KA5FwiczODI9U',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Kraken Motorsports',
    description: 'Unleash the Beast - VR Racing Rig Experience',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <KonamiCodeListener />
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#00ffff',
              border: '2px solid #0088aa',
            },
          }}
        />
      </body>
    </html>
  )
}
