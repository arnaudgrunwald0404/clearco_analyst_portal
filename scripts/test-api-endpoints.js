require('dotenv').config({ path: '.env.local' })

async function testAPIEndpoints() {
  console.log('🌐 Testing API Endpoints with RLS Policies\n')
  
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') 
    ? 'http://localhost:3000' 
    : 'https://your-domain.com' // Update this
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  }
  
  const endpoints = [
    { path: '/api/analysts', method: 'GET', description: 'Get analysts' },
    { path: '/api/briefings', method: 'GET', description: 'Get briefings' },
    { path: '/api/testimonials', method: 'GET', description: 'Get testimonials' },
    { path: '/api/topics', method: 'GET', description: 'Get topics' },
    { path: '/api/awards', method: 'GET', description: 'Get awards' }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint.description}`)
      console.log(`   ${endpoint.method} ${endpoint.path}`)
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Success (${response.status}) - ${data.data?.length || 0} items`)
        testResults.passed++
      } else {
        console.log(`   ❌ Failed (${response.status}) - ${response.statusText}`)
        testResults.failed++
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`)
      testResults.errors.push(`${endpoint.path}: ${error.message}`)
    }
    console.log('')
  }
  
  // Results
  console.log('📊 API TEST RESULTS')
  console.log('==================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`💥 Errors: ${testResults.errors.length}`)
  
  if (testResults.failed === 0 && testResults.errors.length === 0) {
    console.log('\n🎉 ALL API TESTS PASSED!')
  } else {
    console.log('\n⚠️  Some API tests failed.')
  }
}

// Run tests
if (require.main === module) {
  testAPIEndpoints()
    .then(() => {
      console.log('🏁 API test suite completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 API test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { testAPIEndpoints }
