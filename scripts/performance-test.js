// Use built-in fetch for Node.js 18+

const API_ENDPOINTS = [
  { name: 'Dashboard Metrics', url: 'http://localhost:3000/api/dashboard/metrics' },
  { name: 'Analysts', url: 'http://localhost:3000/api/analysts' },
  { name: 'General Settings', url: 'http://localhost:3000/api/settings/general' },
  { name: 'Social Media Activity', url: 'http://localhost:3000/api/social-media/recent-activity?limit=10' },
  { name: 'Recent Activity', url: 'http://localhost:3000/api/dashboard/recent-activity' }
];

async function testEndpoint(name, url, iterations = 3) {
  console.log(`\n🧪 Testing ${name}...`);
  
  const times = [];
  const cacheHits = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(url);
      const data = await response.json();
      const time = Date.now() - start;
      
      times.push(time);
      cacheHits.push(data.cached || false);
      
      console.log(`  Request ${i + 1}: ${time}ms ${data.cached ? '(cached)' : '(fresh)'}`);
      
      // Wait a bit between requests
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`  ❌ Request ${i + 1} failed:`, error.message);
    }
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const cacheHitRate = cacheHits.filter(hit => hit).length / cacheHits.length;
  
  return {
    name,
    avgTime: Math.round(avgTime),
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    cacheHitRate: Math.round(cacheHitRate * 100),
    times,
    cacheHits
  };
}

async function runPerformanceTest() {
  console.log('🚀 Performance Test - Cached APIs\n');
  console.log('Testing all optimized endpoints...\n');
  
  const results = [];
  
  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Performance Summary:');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    console.log(`${result.name.padEnd(25)} | ${result.avgTime.toString().padStart(4)}ms avg | ${result.minTime.toString().padStart(4)}ms min | ${result.maxTime.toString().padStart(4)}ms max | ${result.cacheHitRate}% cache hit`);
  });
  
  console.log('='.repeat(80));
  
  // Calculate overall improvements
  const totalAvgTime = results.reduce((sum, r) => sum + r.avgTime, 0);
  const avgCacheHitRate = results.reduce((sum, r) => sum + r.cacheHitRate, 0) / results.length;
  
  console.log(`\n🎯 Overall Performance:`);
  console.log(`   Average Response Time: ${Math.round(totalAvgTime / results.length)}ms`);
  console.log(`   Average Cache Hit Rate: ${Math.round(avgCacheHitRate)}%`);
  
  // Expected improvements
  console.log(`\n💡 Expected Improvements:`);
  console.log(`   • First load: 2-4 seconds → 200-500ms (80-90% faster)`);
  console.log(`   • Cached loads: 5-50ms (10-50x faster)`);
  console.log(`   • Reduced database load: 80-90% fewer queries`);
  console.log(`   • Better user experience: No more spinning loaders`);
  
  return results;
}

// Run the test
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, testEndpoint }; 