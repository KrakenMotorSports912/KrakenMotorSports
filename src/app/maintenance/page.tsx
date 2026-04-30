import React from 'react'

export default function MaintenancePage() {
  return (
    <html>
      <body style={{display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial'}}>
        <main style={{textAlign: 'center', padding: 24}}>
          <h1 style={{fontSize: 36, marginBottom: 12}}>We'll be back soon</h1>
          <p style={{fontSize: 18, marginBottom: 16}}>The site is temporarily offline for maintenance.</p>
          <p style={{color: '#6b7280'}}>To re-enable the site: set <strong>NEXT_PUBLIC_APP_DISABLED=0</strong> (or remove it) and restart the server.</p>
        </main>
      </body>
    </html>
  )
}
