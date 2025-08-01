import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Social crawler functionality has been migrated to Supabase background jobs',
    status: 'not_implemented'
  }, { status: 501 })
}

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Social crawler functionality has been migrated to Supabase background jobs',
    status: 'not_implemented'
  }, { status: 501 })
}
