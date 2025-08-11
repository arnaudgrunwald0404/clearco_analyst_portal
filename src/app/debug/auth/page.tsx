'use client'

import React, { useEffect, useState } from 'react'

interface DebugAuthResponse {
  requestId: string
  cookies: {
    present: string[]
    hasAccess: boolean
    hasRefresh: boolean
    hasEmail: boolean
  }
  auth: {
    userId: string | null
    userEmail: string | null
    error: string | null
  }
  timestamp: string
}

export default function DebugAuthPage() {
  const [apiData, setApiData] = useState<DebugAuthResponse | null>(null)
  const [client, setClient] = useState<any>(null)
  const [localUser, setLocalUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/debug/auth', { cache: 'no-store' })
        const data: DebugAuthResponse = await res.json()
        setApiData(data)
      } catch (e: any) {
        setError(e?.message || 'failed to load')
      }

      try {
        // Client-side inspection
        const cookies = document.cookie
          .split(';')
          .map(c => c.trim().split('=')[0])
          .filter(Boolean)
        const sessionUserEmail = (window as any).__SB_EMAIL || null
        const local = localStorage.getItem('user')
        setLocalUser(local ? JSON.parse(local) : null)
        setClient({
          cookies,
          sessionUserEmail,
          location: {
            href: window.location.href,
            origin: window.location.origin,
            pathname: window.location.pathname,
          },
          time: new Date().toISOString(),
        })
      } catch (e: any) {
        // ignore client inspection errors
      }
    }

    run()
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1>Auth Debug</h1>
      <p>Use this page to inspect client and server auth state. Compare requestId with server logs.</p>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>Server (/api/debug/auth)</h2>
        <pre style={{ background: '#111', color: '#0f0', padding: 12, overflowX: 'auto' }}>
{JSON.stringify(apiData, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Client</h2>
        <pre style={{ background: '#111', color: '#0ff', padding: 12, overflowX: 'auto' }}>
{JSON.stringify(client, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Local Storage user (analyst guest)</h2>
        <pre style={{ background: '#111', color: '#ff0', padding: 12, overflowX: 'auto' }}>
{JSON.stringify(localUser, null, 2)}
        </pre>
      </section>

      <p style={{ marginTop: 24, opacity: 0.7 }}>
        Tip: Open DevTools Network tab and look for the X-Request-Id response header to match with server logs.
      </p>
    </div>
  )
}

