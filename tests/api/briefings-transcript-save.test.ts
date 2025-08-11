import { describe, test, expect } from '@jest/globals'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Briefings PATCH saves transcript and notes', () => {
  test('should save transcript and notes for a created briefing', async () => {
    // 1) Create a minimal briefing
    const createResp = await fetch(`${baseUrl}/api/briefings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Test Save ${Date.now()}`,
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        duration: 30,
        status: 'SCHEDULED'
      })
    })
    const created = await createResp.json()
    expect(createResp.status).toBe(201)
    expect(created.success).toBe(true)

    const id = created.data.id

    // 2) Patch transcript and notes
    const transcript = 'Speaker A: This is a test transcript.'
    const notes = 'These are my notes.'

    const patchResp = await fetch(`${baseUrl}/api/briefings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, notes })
    })
    const patched = await patchResp.json()
    expect(patchResp.status).toBe(200)
    expect(patched.success).toBe(true)
    expect(patched.data.transcript).toBe(transcript)
    expect(patched.data.notes).toBe(notes)

    // 3) GET should reflect saved data
    const getResp = await fetch(`${baseUrl}/api/briefings/${id}`)
    const fetched = await getResp.json()
    expect(getResp.status).toBe(200)
    expect(fetched.transcript || fetched.data?.transcript).toBe(transcript)
    expect(fetched.notes || fetched.data?.notes).toBe(notes)
  })
})

