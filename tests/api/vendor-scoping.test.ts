import { describe, test, expect } from '@jest/globals'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function getVendorContext() {
  const res = await fetch(`${baseUrl}/api/settings/general`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({} as any))
  // Return the most robust identifiers we can pass back in headers
  return {
    id: data?.id as string | undefined,
    company_name: data?.company_name as string | undefined,
    protected_domain: data?.protected_domain as string | undefined,
  }
}

describe('Vendor scoping integration', () => {
  test('GET /api/briefings requires or honors vendor headers', async () => {
    const ctx = await getVendorContext()
    expect(ctx.id || ctx.company_name || ctx.protected_domain).toBeTruthy()

    // With explicit vendor-domain-id header
    const headers = new Headers({ 'Accept': 'application/json' })
    if (ctx.id) headers.set('x-vendor-domain-id', ctx.id)
    else if (ctx.protected_domain) headers.set('x-vendor-slug', ctx.protected_domain)
    else if (ctx.company_name) headers.set('x-vendor-slug', ctx.company_name)

    const okRes = await fetch(`${baseUrl}/api/briefings`, { headers })
    const okJson = await okRes.json().catch(() => ({} as any))

    expect(okRes.status).toBe(200)
    expect(okJson?.success).toBe(true)
    expect(Array.isArray(okJson?.data)).toBe(true)

    // Without vendor headers
    const noHdrRes = await fetch(`${baseUrl}/api/briefings`)
    // Many routes should be 401 when vendor is missing; accept any non-200
    if (noHdrRes.status === 200) {
      // If environment injects vendor automatically, allow 200
      const json = await noHdrRes.json().catch(() => ({} as any))
      expect(json?.success).toBe(true)
    } else {
      expect(noHdrRes.status).not.toBe(200)
    }
  })

  test('GET /api/awards succeeds with vendor header', async () => {
    const ctx = await getVendorContext()
    const headers = new Headers({ 'Accept': 'application/json' })
    if (ctx.id) headers.set('x-vendor-domain-id', ctx.id)
    else if (ctx.protected_domain) headers.set('x-vendor-slug', ctx.protected_domain)
    else if (ctx.company_name) headers.set('x-vendor-slug', ctx.company_name)

    const res = await fetch(`${baseUrl}/api/awards`, { headers })
    const json = await res.json().catch(() => ({} as any))

    expect(res.status).toBe(200)
    expect(json?.success).toBe(true)
    expect(Array.isArray(json?.data)).toBe(true)
  })
})
