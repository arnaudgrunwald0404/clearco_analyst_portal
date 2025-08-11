require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function norm(s) {
  return (s || '').toString().trim().toUpperCase();
}

async function main() {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffISO = cutoff.toISOString();
  const nowISO = now.toISOString();

  // Fetch active analysts
  const { data: analysts, error: analystsError } = await supabase
    .from('analysts')
    .select('id, firstName, lastName, email, influence, status')
    .eq('status', 'ACTIVE');
  if (analystsError) throw analystsError;

  const active = analysts || [];
  const activeIds = active.map(a => a.id);

  // Totals by tier
  const tierTotals = { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const influenceById = {};
  for (const a of active) {
    const key = norm(a.influence);
    influenceById[a.id] = key;
    if (key in tierTotals) tierTotals[key]++;
  }

  // Fetch join rows for active analysts
  const { data: baRows, error: baError } = await supabase
    .from('briefing_analysts')
    .select('briefingId, analystId')
    .in('analystId', activeIds);
  if (baError) throw baError;

  // Fetch candidate briefings (window)
  const { data: briefings, error: briefingsError } = await supabase
    .from('briefings')
    .select('id, title, status, scheduledAt')
    .gte('scheduledAt', cutoffISO)
    .order('scheduledAt', { ascending: false });
  if (briefingsError) throw briefingsError;

  const qualifying = [];
  const qualifyingIds = new Set();
  for (const b of briefings || []) {
    const scheduledPastOk = b.scheduledAt && b.scheduledAt >= cutoffISO && b.scheduledAt <= nowISO;
    if (scheduledPastOk) {
      qualifying.push(b);
      qualifyingIds.add(b.id);
    }
  }

  const covered = new Set();
  // via join only
  for (const row of baRows || []) {
    if (row.briefingId && qualifyingIds.has(row.briefingId)) {
      if (row.analystId) covered.add(row.analystId);
    }
  }
  // Optional: fallback by naive name-in-title match for debugging only
  const nameToId = active.map(a => ({ id: a.id, first: (a.firstName||'').toLowerCase(), last: (a.lastName||'').toLowerCase() }));
  for (const b of qualifying) {
    const title = (b.title || '').toLowerCase();
    for (const { id, first, last } of nameToId) {
      if (!first && !last) continue;
      if (title.includes(first) && title.includes(last)) {
        covered.add(id);
      }
    }
  }

  const coveredByTier = { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const id of covered) {
    const key = influenceById[id];
    if (key in coveredByTier) coveredByTier[key]++;
  }

  const pct = (c, t) => (t > 0 ? Math.round((c / t) * 100) : 0);
  console.log('Cutoff ISO:', cutoffISO);
  console.log('Active analysts:', active.length);
  console.log('Tier totals:', tierTotals);
  console.log('Covered counts:', coveredByTier);
  console.log('Coverage %:', {
    VERY_HIGH: pct(coveredByTier.VERY_HIGH, tierTotals.VERY_HIGH),
    HIGH: pct(coveredByTier.HIGH, tierTotals.HIGH),
    MEDIUM: pct(coveredByTier.MEDIUM, tierTotals.MEDIUM),
    LOW: pct(coveredByTier.LOW, tierTotals.LOW),
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

