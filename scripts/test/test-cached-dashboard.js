const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api/dashboard/metrics';

async function testCachedDashboard() {
  console.log('🧪 Testing Cached Dashboard API\n');

  try {
    // Test 1: First request (should be fresh data)
    console.log('📊 Test 1: First request (fresh data)');
    const start1 = Date.now();
    const response1 = await fetch(API_BASE);
    const data1 = await response1.json();
    const time1 = Date.now() - start1;

    console.log(`⏱️  Response time: ${time1}ms`);
    console.log(`📦 Cached: ${data1.cached || false}`);
    console.log(`📈 Success: ${data1.success}`);
    console.log(`📊 Data keys: ${Object.keys(data1.data || {}).length}`);
    console.log('');

    // Test 2: Second request (should be cached)
    console.log('📊 Test 2: Second request (cached data)');
    const start2 = Date.now();
    const response2 = await fetch(API_BASE);
    const data2 = await response2.json();
    const time2 = Date.now() - start2;

    console.log(`⏱️  Response time: ${time2}ms`);
    console.log(`📦 Cached: ${data2.cached || false}`);
    console.log(`📈 Success: ${data2.success}`);
    console.log(`⏰ Cache age: ${data2.cacheAge || 0}s`);
    console.log('');

    // Test 3: Cache invalidation
    console.log('📊 Test 3: Cache invalidation');
    const invalidationResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalidate' })
    });
    const invalidationData = await invalidationResponse.json();
    console.log(`📦 Invalidation result: ${invalidationData.success}`);
    console.log(`💬 Message: ${invalidationData.message}`);
    console.log('');

    // Test 4: Third request (should be fresh data again)
    console.log('📊 Test 4: Third request (fresh data after invalidation)');
    const start4 = Date.now();
    const response4 = await fetch(API_BASE);
    const data4 = await response4.json();
    const time4 = Date.now() - start4;

    console.log(`⏱️  Response time: ${time4}ms`);
    console.log(`📦 Cached: ${data4.cached || false}`);
    console.log(`📈 Success: ${data4.success}`);
    console.log('');

    // Performance analysis
    console.log('📈 Performance Analysis:');
    console.log(`🚀 Cache speedup: ${Math.round((time1 / time2) * 100) / 100}x faster`);
    console.log(`⏱️  Fresh data time: ${time1}ms`);
    console.log(`⚡ Cached data time: ${time2}ms`);
    console.log(`💰 Time saved: ${time1 - time2}ms per cached request`);

    // Sample data structure
    if (data1.data) {
      console.log('\n📊 Sample Data Structure:');
      console.log(`👥 Total Analysts: ${data1.data.totalAnalysts}`);
      console.log(`✅ Active Analysts: ${data1.data.activeAnalysts}`);
      console.log(`📧 Newsletters Sent: ${data1.data.newslettersSentPast90Days}`);
      console.log(`📝 Content Items: ${data1.data.contentItemsPast90Days}`);
      console.log(`📅 Briefings: ${data1.data.briefingsPast90Days}`);
      console.log(`🔔 Active Alerts: ${data1.data.activeAlerts}`);
    }

  } catch (error) {
    console.error('❌ Error testing cached dashboard:', error.message);
    console.log('\n💡 Make sure your development server is running on port 3000');
    console.log('💡 Run: npm run dev');
  }
}

// Run the test
testCachedDashboard(); 