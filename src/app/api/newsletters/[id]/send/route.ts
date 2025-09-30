import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendHtmlEmailWithGmail, tokensFromCalendarConnection } from '@/lib/google/gmail'
import { getCurrentVendorDomainId } from '@/lib/vendor-domain-utils'

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const {
      connectionId, // calendar_connections.id to use for Gmail tokens
      recipientEmails = [] as string[],
      fromName,
    } = body || {}

    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'Missing connectionId' }, { status: 400 })
    }
    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'No recipientEmails provided' }, { status: 400 })
    }

    const supabase = await createClient()
    const vendorDomainId = await getCurrentVendorDomainId()
    if (!vendorDomainId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing vendor scope' }, { status: 403 })
    }

    // Load newsletter
    const { data: newsletter, error: nErr } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .eq('vendor_domain_id', vendorDomainId)
      .single()

    if (nErr || !newsletter) {
      return NextResponse.json({ success: false, error: 'Newsletter not found' }, { status: 404 })
    }

    // Load google connection (we reuse calendar_connections for tokens)
    const { data: conn, error: cErr } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (cErr || !conn) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 })
    }

    const tokens = tokensFromCalendarConnection(conn)
    if (!tokens.access_token) {
      return NextResponse.json({ success: false, error: 'Missing Google access token on connection' }, { status: 400 })
    }

    const subject: string = newsletter.subject || newsletter.title || 'Newsletter'
    const html: string = newsletter.htmlContent || newsletter.content || `<div>${newsletter.title ?? 'Newsletter'}</div>`

    const fromEmail: string = conn.email

    const results: { to: string; status: 'sent' | 'failed'; id?: string; error?: string }[] = []

    for (const to of recipientEmails) {
      try {
        const res = await sendHtmlEmailWithGmail(
          {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || undefined,
            expiry_date: tokens.expiry_date,
          },
          {
            fromEmail,
            fromName: fromName || conn.title || undefined,
            toEmail: to,
            subject,
            html,
          }
        )
        const messageId = (res as any)?.id || undefined
        results.push({ to, status: 'sent', id: messageId })
      } catch (e: any) {
        console.error('Failed to send to', to, e)
        results.push({ to, status: 'failed', error: e?.message || 'send_failed' })
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length

    // Update newsletter sentAt if all sent
    if (sentCount === recipientEmails.length) {
      await supabase
        .from('newsletters')
        .update({ sentAt: new Date().toISOString(), status: 'SENT' })
        .eq('id', id)
        .eq('vendor_domain_id', vendorDomainId)
    }

    return NextResponse.json({ success: true, results, sentCount })
  } catch (error) {
    console.error('Error sending newsletter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send newsletter', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
