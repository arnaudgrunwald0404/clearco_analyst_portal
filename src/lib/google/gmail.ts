import { google } from 'googleapis'
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production'

function decryptToken(token: string | null | undefined): string | null {
  if (!token) return null
  try {
    const bytes = CryptoJS.AES.decrypt(token, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || null
  } catch (e) {
    console.warn('[gmail] Failed to decrypt token, using raw value')
    return token
  }
}

export type GmailCredentials = {
  clientId: string
  clientSecret: string
  redirectUri: string
  accessToken: string
  refreshToken?: string | null
  expiryDate?: number | null
}

function getOAuth2Client(creds: GmailCredentials) {
  const oauth2Client = new google.auth.OAuth2(
    creds.clientId,
    creds.clientSecret,
    creds.redirectUri
  )
  oauth2Client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken || undefined,
    expiry_date: creds.expiryDate || undefined,
  })
  return oauth2Client
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export type SendEmailParams = {
  fromEmail: string
  toEmail: string
  subject: string
  html: string
  fromName?: string
}

export async function sendHtmlEmailWithGmail(
  tokens: { access_token: string; refresh_token?: string | null; expiry_date?: number | null },
  params: SendEmailParams
) {
  const oauth2Client = getOAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || undefined,
    expiryDate: tokens.expiry_date || undefined,
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const fromHeader = params.fromName
    ? `${params.fromName} <${params.fromEmail}>`
    : params.fromEmail

  const message =
    `From: ${fromHeader}\r\n` +
    `To: ${params.toEmail}\r\n` +
    `Subject: ${params.subject}\r\n` +
    'MIME-Version: 1.0\r\n' +
    'Content-Type: text/html; charset=UTF-8\r\n' +
    '\r\n' +
    params.html

  const raw = base64UrlEncode(message)

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  })

  return res.data
}

// Helper to read an existing calendar connection row and produce usable Gmail tokens
export function tokensFromCalendarConnection(row: any) {
  // Support different schemas (snake_case vs camelCase)
  const rawAccess = row.access_token || row.accessToken
  const rawRefresh = row.refresh_token ?? row.refreshToken
  const rawExpiry = row.token_expiry || row.expiresAt

  const access_token = decryptToken(rawAccess) || rawAccess
  const refresh_token = decryptToken(rawRefresh) || rawRefresh
  let expiry_date: number | undefined
  if (rawExpiry) {
    const d = typeof rawExpiry === 'string' ? new Date(rawExpiry) : rawExpiry
    const ms = d instanceof Date ? d.getTime() : Number(rawExpiry)
    if (!Number.isNaN(ms)) expiry_date = ms
  }
  return { access_token, refresh_token, expiry_date }
}
