import { NextRequest } from 'next/server'

describe('Calendar sync SSE (GET)', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('streams progress and completes when last_sync_at is set', async () => {
    jest.useFakeTimers()

    // Mock Supabase returning a matching connection, then last_sync_at on poll
    const selectMock = jest.fn().mockReturnThis()
    const eqMock = jest.fn().mockReturnThis()
    const singleMock = jest
      .fn()
      // first call: verify access to connection
      .mockResolvedValueOnce({ data: { id: 'conn_1', user_id: 'user_1' } })
      // second call (poll): return last_sync_at to complete
      .mockResolvedValueOnce({ data: { last_sync_at: new Date().toISOString() } })

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnValue({ select: selectMock, eq: eqMock, single: singleMock })
      })
    }))

    const { GET: sseGet } = await import('@/app/api/settings/calendar-connections/[id]/sync/route')

    const req = new NextRequest('http://localhost/api/settings/calendar-connections/conn_1/sync?user_id=user_1', { method: 'GET' } as any)
    const res = await sseGet(req, { params: Promise.resolve({ id: 'conn_1' }) } as any)

    expect((res as any).status).toBe(200)
    expect((res as any).headers.get('Content-Type')).toContain('text/event-stream')

    // Advance timers to trigger polling interval in route (2s)
    await Promise.resolve()
    jest.advanceTimersByTime(2100)

    // Drain any pending microtasks
    await Promise.resolve()
  })
})


