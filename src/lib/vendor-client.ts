// Client-side helper to automatically attach vendor headers to same-origin fetches
// Installs a fetch interceptor that reads vendor_slug from a cookie and adds x-vendor-slug
// If x-vendor-slug or x-vendor-domain-id are already present, it does nothing.
export function installVendorHeaderInterceptor() {
  if (typeof window === 'undefined' || (window as any).__vendorFetchPatched) return
  const originalFetch = window.fetch.bind(window)
  ;(window as any).__vendorFetchPatched = true

  function getCookie(name: string): string | null {
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
      return m ? decodeURIComponent(m[1]) : null
    } catch { return null }
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      let url: string
      let baseInit: RequestInit = {}

      if (typeof input === 'string') {
        url = input
      } else if (input instanceof Request) {
        url = input.url
        // Preserve method/body from Request if caller passed a Request object
        baseInit.method = input.method
        // Only attach body for non-GET/HEAD
        if (input.bodyUsed === false && input.method && input.method !== 'GET' && input.method !== 'HEAD') {
          baseInit.body = (input as any).body || undefined
        }
        baseInit.headers = input.headers
        baseInit.credentials = input.credentials
        baseInit.mode = input.mode
        baseInit.cache = input.cache
        baseInit.redirect = input.redirect
        baseInit.referrer = input.referrer
        baseInit.integrity = (input as any).integrity
        baseInit.keepalive = (input as any).keepalive
        baseInit.signal = (input as any).signal
      } else if (input instanceof URL) {
        url = input.toString()
      } else {
        url = String(input)
      }

      const isRelative = url.startsWith('/') || url.startsWith('.')
      const isSameOrigin = isRelative || url.startsWith(window.location.origin)

      if (isSameOrigin) {
        const headers = new Headers(
          (init && init.headers) ||
          (baseInit.headers as HeadersInit | undefined) ||
          undefined
        )
        if (!headers.has('x-vendor-slug') && !headers.has('x-vendor-domain-id')) {
          const slug = getCookie('vendor_slug')
          if (slug) headers.set('x-vendor-slug', slug)
        }
        const patchedInit: RequestInit = {
          ...baseInit,
          ...(init || {}),
          headers,
          // Ensure cookies are sent on same-origin even if caller didn't set it
          credentials: (init && init.credentials) || (baseInit.credentials as RequestCredentials) || 'same-origin'
        }
        return originalFetch(url as any, patchedInit)
      }
    } catch (e) {
      // fall through to original fetch in case of any issues
      // console.warn('vendor fetch interceptor fell back to original fetch:', e)
    }
    return originalFetch(input as any, init as any)
  }
}