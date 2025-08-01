const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api/dashboard/metrics';

class CacheManager {
  constructor() {
    this.apiBase = API_BASE;
  }

  async getCacheStatus() {
    try {
      const response = await fetch(this.apiBase);
      const data = await response.json();
      
      return {
        cached: data.cached || false,
        cacheAge: data.cacheAge || 0,
        success: data.success,
        hasData: !!data.data
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async invalidateCache() {
    try {
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalidate' })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  async refreshCache() {
    try {
      // First invalidate
      await this.invalidateCache();
      
      // Then fetch fresh data
      const response = await fetch(this.apiBase);
      const data = await response.json();
      
      return {
        success: data.success,
        cached: data.cached,
        message: 'Cache refreshed successfully'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async benchmarkPerformance() {
    try {
      console.log('🏃‍♂️ Benchmarking dashboard performance...\n');

      // Test fresh data
      console.log('📊 Testing fresh data fetch...');
      const start1 = Date.now();
      const response1 = await fetch(this.apiBase);
      const data1 = await response1.json();
      const time1 = Date.now() - start1;

      console.log(`⏱️  Fresh data time: ${time1}ms`);
      console.log(`📦 Cached: ${data1.cached || false}`);

      // Test cached data
      console.log('\n📊 Testing cached data fetch...');
      const start2 = Date.now();
      const response2 = await fetch(this.apiBase);
      const data2 = await response2.json();
      const time2 = Date.now() - start2;

      console.log(`⏱️  Cached data time: ${time2}ms`);
      console.log(`📦 Cached: ${data2.cached || false}`);

      // Calculate improvements
      const speedup = time1 > 0 ? (time1 / time2) : 0;
      const timeSaved = time1 - time2;

      console.log('\n📈 Performance Summary:');
      console.log(`🚀 Speedup: ${Math.round(speedup * 100) / 100}x faster`);
      console.log(`💰 Time saved: ${timeSaved}ms per cached request`);
      console.log(`📊 Data integrity: ${data1.success && data2.success ? '✅ Good' : '❌ Issues'}`);

      return {
        freshTime: time1,
        cachedTime: time2,
        speedup,
        timeSaved,
        success: data1.success && data2.success
      };

    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      return { error: error.message };
    }
  }
}

// CLI interface
async function main() {
  const cacheManager = new CacheManager();
  const command = process.argv[2];

  switch (command) {
    case 'status':
      console.log('📊 Checking cache status...');
      const status = await cacheManager.getCacheStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'invalidate':
      console.log('🗑️  Invalidating cache...');
      const result = await cacheManager.invalidateCache();
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'refresh':
      console.log('🔄 Refreshing cache...');
      const refresh = await cacheManager.refreshCache();
      console.log(JSON.stringify(refresh, null, 2));
      break;

    case 'benchmark':
      await cacheManager.benchmarkPerformance();
      break;

    default:
      console.log('📋 Cache Management Commands:');
      console.log('  node scripts/cache-management.js status     - Check cache status');
      console.log('  node scripts/cache-management.js invalidate - Clear cache');
      console.log('  node scripts/cache-management.js refresh    - Refresh cache');
      console.log('  node scripts/cache-management.js benchmark  - Performance test');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CacheManager; 