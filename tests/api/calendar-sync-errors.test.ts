import { NextRequest } from 'next/server'

describe('Calendar sync API - error scenarios', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('returns 401 when token refresh fails', async () => {
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: {
            id: 'conn_1', user_id: 'user_1', is_active: true, access_token: 'at', refresh_token: 'rt', last_sync_at: null
          } })
        })
      })
    }))
    jest.doMock('@/lib/auth-utils', () => ({ requireAuth: jest.fn().mockResolvedValue({ id: 'user_1', email: 't@e.com' }) }))
    jest.doMock('googleapis', () => ({
      google: {
        auth: { OAuth2: jest.fn().mockImplementation(() => ({ setCredentials: jest.fn(), getAccessToken: jest.fn().mockRejectedValue(new Error('expired')) })) },
        calendar: jest.fn()
      }
    }))

    const { POST: syncPost } = await import('@/app/api/settings/calendar-connections/[id]/sync/route')
    const req = new NextRequest('http://localhost/api/settings/calendar-connections/conn_1/sync', { method: 'POST', body: JSON.stringify({ user_id: 'user_1' }) } as any)
    const res = await syncPost(req, { params: Promise.resolve({ id: 'conn_1' }) } as any)
    expect((res as any).status).toBe(401)
  })

  it('returns 404 when connection not found / user mismatch', async () => {
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
        })
      })
    }))
    jest.doMock('@/lib/auth-utils', () => ({ requireAuth: jest.fn().mockResolvedValue({ id: 'user_2', email: 't@e.com' }) }))
    jest.doMock('googleapis', () => ({ google: { auth: { OAuth2: jest.fn() }, calendar: jest.fn() } }))

    const { POST: syncPost } = await import('@/app/api/settings/calendar-connections/[id]/sync/route')
    const req = new NextRequest('http://localhost/api/settings/calendar-connections/conn_1/sync', { method: 'POST', body: JSON.stringify({ user_id: 'user_1' }) } as any)
    const res = await syncPost(req, { params: Promise.resolve({ id: 'conn_1' }) } as any)
    expect((res as any).status).toBe(404)
  })

  it('returns 409 when recently synced', async () => {
    const recent = new Date(Date.now() - 60 * 1000).toISOString()
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: {
            id: 'conn_1', user_id: 'user_1', is_active: true, access_token: 'at', refresh_token: 'rt', last_sync_at: recent
          } })
        })
      })
    }))
    jest.doMock('@/lib/auth-utils', () => ({ requireAuth: jest.fn().mockResolvedValue({ id: 'user_1', email: 't@e.com' }) }))
    jest.doMock('googleapis', () => ({ google: { auth: { OAuth2: jest.fn() }, calendar: jest.fn() } }))

    const { POST: syncPost } = await import('@/app/api/settings/calendar-connections/[id]/sync/route')
    const req = new NextRequest('http://localhost/api/settings/calendar-connections/conn_1/sync', { method: 'POST', body: JSON.stringify({ user_id: 'user_1' }) } as any)
    const res = await syncPost(req, { params: Promise.resolve({ id: 'conn_1' }) } as any)
    expect((res as any).status).toBe(409)
  })

  it('returns 500 when Google API fails', async () => {
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: {
            id: 'conn_1', user_id: 'user_1', is_active: true, access_token: 'at', refresh_token: 'rt', last_sync_at: null
          } })
        })
      })
    }))
    jest.doMock('@/lib/auth-utils', () => ({ requireAuth: jest.fn().mockResolvedValue({ id: 'user_1', email: 't@e.com' }) }))
    jest.doMock('googleapis', () => ({
      google: {
        auth: { OAuth2: jest.fn().mockImplementation(() => ({ setCredentials: jest.fn(), getAccessToken: jest.fn().mockResolvedValue({ token: 'new' }) })) },
        calendar: jest.fn().mockImplementation(() => ({ events: { list: jest.fn().mockRejectedValue(Object.assign(new Error('boom'), { code: 500 })) } }))
      }
    }))

    const { POST: syncPost } = await import('@/app/api/settings/calendar-connections/[id]/sync/route')
    const req = new NextRequest('http://localhost/api/settings/calendar-connections/conn_1/sync', { method: 'POST', body: JSON.stringify({ user_id: 'user_1' }) } as any)
    const res = await syncPost(req, { params: Promise.resolve({ id: 'conn_1' }) } as any)
    expect((res as any).status).toBe(500)
  })
})


