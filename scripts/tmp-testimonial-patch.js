require('dotenv').config({ path: '.env.local' });
const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

(async () => {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const id = process.argv[2];
    if (!id) {
      console.error('Usage: node scripts/tmp-testimonial-patch.js <testimonial_id>');
      process.exit(1);
    }
    const payload = { quote: 'Test updated via tmp script', isPublished: true };
    const res = await fetch(`${base}/api/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();

