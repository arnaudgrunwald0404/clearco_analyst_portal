import { NextRequest } from 'next/server'
import { POST as syncPost } from '@/app/api/settings/calendar-connections/[id]/sync/route'

// Mocks
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {
        id: 'conn_1',
        user_id: 'user_1',
        is_active: true,
        access_token: 'at',
        refresh_token: 'rt',
        last_sync_at: null
      } })
    })
  })
}))

jest.mock('@/lib/auth-utils', () => ({
  requireAuth: jest.fn().mockResolvedValue({ id: 'user_1', email: 'test@example.com' })
}))

// Patch googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        getAccessToken: jest.fn().mockResolvedValue({ token: 'new' })
      }))
    },
    calendar: jest.fn().mockImplementation(() => ({
      events: {
        list: jest.fn().mockResolvedValue({ data: { items: [
          { id: 'g1', summary: 'Meeting', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date().toISOString() }, attendees: [{ email: 'a@x.com' }, { email: 'b@y.com' }] }
        ] } })
      }
    }))
  }
}))

describe('Calendar sync API', () => {
  it('returns 200 when sync starts and fetches events', async () => {
    const req = new NextRequest('http://localhost/api/settings/calendar-connections/conn_1/sync', {
      method: 'POST',
      body: JSON.stringify({ timeWindowOptions: { days: 7 }, user_id: 'user_1' })
    } as any)

    const res = await syncPost(req, { params: Promise.resolve({ id: 'conn_1' }) } as any)
    const json = await (res as any).json()
    expect((res as any).status).toBe(200)
    expect(json.success).toBe(true)
  })
})


