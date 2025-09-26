require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function backfillVendorDomainId() {
  const TARGET_ID = process.env.TARGET_VENDOR_DOMAIN_ID || 'cmdpejhce0000mmhg4dxzpo7k'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('❌ Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  try {
    // Count total rows before update
    const { count: totalCount, error: countErr } = await supabase
      .from('briefing_analysts')
      .select('*', { count: 'exact', head: true })

    if (countErr) {
      console.error('❌ Failed to count briefing_analysts:', countErr)
      process.exit(1)
    }

    console.log(`📊 briefing_analysts rows: ${totalCount ?? 0}`)
    console.log(`🏷️ Setting vendor_domain_id to: ${TARGET_ID}`)

    // Update every row to the target (user requested full backfill)
    const { error: updErr } = await supabase
      .from('briefing_analysts')
      .update({ vendor_domain_id: TARGET_ID })
      .not('id', 'is', null)

    if (updErr) {
      console.error('❌ Update failed:', updErr)
      process.exit(1)
    }

    // Verify how many rows now match the target id
    const { count: matchedCount, error: matchErr } = await supabase
      .from('briefing_analysts')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_domain_id', TARGET_ID)

    if (matchErr) {
      console.error('❌ Verification count failed:', matchErr)
      process.exit(1)
    }

    console.log(`✅ Rows with vendor_domain_id=${TARGET_ID}: ${matchedCount ?? 0}`)

    process.exit(0)
  } catch (e) {
    console.error('💥 Unexpected error:', e)
    process.exit(1)
  }
}

if (require.main === module) {
  backfillVendorDomainId()
}
