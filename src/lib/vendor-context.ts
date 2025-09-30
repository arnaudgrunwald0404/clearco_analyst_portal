import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type VendorContext = {
  id: string
  slug?: string
  protectedDomain?: string
  companyName?: string
  logoUrl?: string
  industryName?: string
  from: 'header' | 'path' | 'subdomain' | 'lookup' | 'unknown'
}

function inferSlugFromUrl(req: NextRequest | Request): string | null {
  try {
    const url = new URL(req.url)
    const pathname = url.pathname
    const host = url.host

    // /v/{slug}/...
    const pathMatch = pathname.match(/^\/v\/([^\/]+)(?:\/|$)/)
    if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1])

    // {slug}.domain.tld
    const hostNoPort = host.split(':')[0]
    const parts = hostNoPort.split('.')
    if (parts.length >= 3) {
      const first = parts[0].toLowerCase()
      if (first && first !== 'www' && first !== 'app') return first
    }
  } catch {}
  return null
}

export async function getVendorContext(req: NextRequest | Request): Promise<VendorContext | null> {
  // 1) Prefer explicit headers (set by middleware/edge or upstream proxies)
  const headers = (req as any).headers as Headers | undefined
  const headerId = headers?.get('x-vendor-domain-id') || undefined
  const headerSlug = headers?.get('x-vendor-slug') || headers?.get('x-vendor-domain') || undefined

  if (headerId) {
    return {
      id: headerId,
      slug: headerSlug,
      from: 'header',
    }
  }

  // 2) Try to infer slug from URL path or subdomain
  const inferredSlug = headerSlug || inferSlugFromUrl(req)

  // 3) If we have a slug, look up vendor_domains
  if (inferredSlug) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Can't resolve without service credentials
      return {
        id: '',
        slug: inferredSlug,
        from: 'subdomain',
      }
    }

    try {
      const supabase = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Try matching by id OR protected_domain OR company_name ilike
      const { data, error } = await supabase
        .from('vendor_domains')
        .select('id, company_name, protected_domain, logo_url, industry_name')
        .or(`id.eq.${inferredSlug},protected_domain.eq.${inferredSlug},company_name.ilike.%${inferredSlug}%`)
        .limit(1)
        .maybeSingle()

      if (!error && data?.id) {
        return {
          id: data.id,
          slug: inferredSlug,
          protectedDomain: data.protected_domain,
          companyName: data.company_name,
          logoUrl: data.logo_url,
          industryName: data.industry_name,
          from: 'lookup',
        }
      }

      // Fallback: if slug looks like a protected domain (has a dot), try protected_domain like
      if (inferredSlug.includes('.')) {
        const { data: data2 } = await supabase
          .from('vendor_domains')
          .select('id, company_name, protected_domain, logo_url, industry_name')
          .ilike('protected_domain', `%${inferredSlug}%`)
          .limit(1)
          .maybeSingle()

        if (data2?.id) {
          return {
            id: data2.id,
            slug: inferredSlug,
            protectedDomain: data2.protected_domain,
            companyName: data2.company_name,
            logoUrl: data2.logo_url,
            industryName: data2.industry_name,
            from: 'lookup',
          }
        }
      }

      // Could not resolve
      return {
        id: '',
        slug: inferredSlug,
        from: 'subdomain',
      }
    } catch (e) {
      // Non-fatal; return partial context
      return {
        id: '',
        slug: inferredSlug,
        from: 'subdomain',
      }
    }
  }

  return null
}

// Enforce vendor presence in API routes. Returns either a NextResponse (error) or VendorContext
export async function requireVendorScope(req: NextRequest | Request): Promise<VendorContext | NextResponse> {
  const ctx = await getVendorContext(req)
  if (ctx && ctx.id) return ctx

  const hint = ctx?.slug
    ? `Unrecognized vendor slug: ${ctx.slug}. Ensure the vendor exists and is correctly configured.`
    : 'Missing vendor context. Provide it via subdomain (acme.example.com), path (/v/acme), or headers.'

  return NextResponse.json({
    success: false,
    error: 'Vendor scope required',
    hint,
  }, { status: 401 })
}

// Helper to attach vendor headers to outgoing fetch calls
export function withVendorHeaders(init: RequestInit = {}, ctx?: VendorContext): RequestInit {
  const headers = new Headers(init.headers || {})
  if (ctx?.id) headers.set('x-vendor-domain-id', ctx.id)
  if (ctx?.slug) headers.set('x-vendor-slug', ctx.slug)
  return { ...init, headers }
}
