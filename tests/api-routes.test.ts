import test from 'node:test'
import assert from 'node:assert'
import { NextRequest } from 'next/server'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const originalEnv = { ...process.env }

function resetEnv() {
  process.env = { ...originalEnv }
}

test('metrics GET returns 500 when DATABASE_URL is missing', async () => {
  process.env.DATABASE_URL = 'postgres://test/test'
  const mod = await import('../src/app/api/dashboard/metrics/route')
  delete process.env.DATABASE_URL
  const res = await mod.GET()
  assert.strictEqual(res.status, 500)
  resetEnv()
})

test('top analysts GET returns 500 when DATABASE_URL is missing', async () => {
  process.env.DATABASE_URL = 'postgres://test/test'
  const mod = await import('../src/app/api/dashboard/top-analysts/route')
  delete process.env.DATABASE_URL
  const res = await mod.GET()
  assert.strictEqual(res.status, 500)
  resetEnv()
})

test('recent activity GET returns 500 when DATABASE_URL is missing', async () => {
  process.env.DATABASE_URL = 'postgres://test/test'
  const mod = await import('../src/app/api/dashboard/recent-activity/route')
  delete process.env.DATABASE_URL
  const res = await mod.GET()
  assert.strictEqual(res.status, 500)
  resetEnv()
})

test('action items GET returns 500 when DATABASE_URL is missing', async () => {
  process.env.DATABASE_URL = 'postgres://test/test'
  const mod = await import('../src/app/api/action-items/route')
  delete process.env.DATABASE_URL
  const req = new NextRequest('http://localhost/api/action-items')
  const res = await mod.GET(req)
  assert.strictEqual(res.status, 500)
  resetEnv()
})

test('analysts module throws when Supabase env vars missing', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  await assert.rejects(() => import('../src/app/api/analysts/route'),
    /NEXT_PUBLIC_SUPABASE_URL/)
  resetEnv()
})
