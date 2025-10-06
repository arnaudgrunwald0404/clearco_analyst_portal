// Server-side helpers to propagate vendor context into SSR fetch calls
// Ensures same-origin requests include the x-vendor-slug header if available

import { headers as nextHeaders, cookies as nextCookies } from 'next/headers'

function getIncomingHost(): string | null {
  try {
    // Some environments type headers() as Promise; cast to any to avoid TS issues
    const h = nextHeaders() as any
    const host = h.get('x-forwarded-host') || h.get('host')
    return host || null
  } catch {
    return null
  }
}

function getIncomingProto(): string {
  try {
    const h = nextHeaders() as any
    const proto = h.get('x-forwarded-proto') || h.get('x-forwarded-protocol') || h.get('protocol')
    if (proto === 'http' || proto === 'https') return proto
  } catch {}
  // Prefer env if explicitly provided
  if (process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')) return 'https'
  return process.env.NODE_ENV === 'production' ? 'https' : 'http'
}

function absoluteUrl(input: string): string {
  // Already absolute
  if (/^https?:\/\//i.test(input)) return input
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) return new URL(input, site).toString()
  const host = getIncomingHost() || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'
  const proto = getIncomingProto()
  // If VERCEL_URL is present, it usually lacks protocol
  const base = /^https?:\/\//i.test(host) ? host : `${proto}://${host}`
  return new URL(input, base).toString()
}

export function getVendorSlugFromContext(): string | null {
  try {
    const h = nextHeaders() as any
    const fromHeader = h.get('x-vendor-slug')
    if (fromHeader) return fromHeader
  } catch {}
  try {
    const c = nextCookies() as any
    const cookie = c.get('vendor_slug')?.value
    if (cookie) return decodeURIComponent(cookie)
  } catch {}
  return null
}

export function withVendorHeaders(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers || {})
  if (!headers.has('x-vendor-slug') && !headers.has('x-vendor-domain-id')) {
    const slug = getVendorSlugFromContext()
    if (slug) headers.set('x-vendor-slug', slug)
  }
  return { ...(init || {}), headers }
}

function isSameOriginUrl(url: string | URL): boolean {
  try {
    if (typeof url === 'string') {
      if (url.startsWith('/') || url.startsWith('.')) return true // relative
      if (!url.startsWith('http://') && !url.startsWith('https://')) return true
      const u = new URL(url)
      const host = getIncomingHost()
      return host ? (u.host === host) : false
    } else {
      const u = new URL(url)
      const host = getIncomingHost()
      return host ? (u.host === host) : false
    }
  } catch {
    return false
  }
}

export async function vendorFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    // Normalize to absolute URL when a relative path is provided
    if (typeof input === 'string') {
      const abs = absoluteUrl(input)
      if (isSameOriginUrl(abs)) {
        return fetch(abs, withVendorHeaders(init))
      }
      return fetch(abs, init as any)
    } else {
      // URL or Request
      const urlLike = (input as any)?.url ? (input as any).url : input
      const abs = typeof urlLike === 'string' ? absoluteUrl(urlLike) : urlLike
      if (typeof abs === 'string') {
        if (isSameOriginUrl(abs)) {
          return fetch(abs, withVendorHeaders(init))
        }
        return fetch(abs, init as any)
      }
      // If it's a URL object, ensure host is absolute; Next/Node URL will be absolute already
      if (isSameOriginUrl(abs)) {
        return fetch(input, withVendorHeaders(init))
      }
      return fetch(input, init as any)
    }
  } catch (e) {
    // fall back to default fetch with original input
    return fetch(input as any, init as any)
  }
}
