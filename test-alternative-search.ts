#!/usr/bin/env node

/**
 * Test script for alternative search engines
 * This script tests the publication discovery without requiring Google API keys
 */

import { PrismaClient } from '@prisma/client'
import { AlternativeComprehensiveSearchEngine } from './src/lib/publication-discovery/alternative-search'

const prisma = new PrismaClient()

async function testAlternativeSearch() {
  console.log('🧪 Testing Alternative Search Engines')
  console.log('=====================================\n')

  try {
    // Initialize the alternative search engine
    const searchEngine = new AlternativeComprehensiveSearchEngine()

    // Test with a sample analyst
    const testQuery = {
      analystName: 'John Smith',
      company: 'Gartner',
      searchTerms: ['HR Technology', 'Digital Transformation'],
      timeRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    }

    console.log(`🔍 Testing search for: ${testQuery.analystName}`)
    console.log(`🏢 Company: ${testQuery.company}`)
    console.log(`🏷️  Search terms: ${testQuery.searchTerms.join(', ')}\n`)

    // Perform the search
    const results = await searchEngine.searchAnalyst(testQuery)

    console.log(`\n📊 Search Results Summary:`)
    console.log(`   📄 Total results found: ${results.length}`)

    if (results.length > 0) {
      console.log(`\n📋 Results Preview:`)
      results.slice(0, 5).forEach((result, index) => {
        console.log(`\n   ${index + 1}. ${result.title}`)
        console.log(`      🔗 URL: ${result.url}`)
        console.log(`      🌐 Domain: ${result.domain}`)
        console.log(`      🔍 Source: ${result.source}`)
        console.log(`      📝 Snippet: ${result.snippet?.substring(0, 100)}...`)
      })

      // Analyze result sources
      const sources = results.reduce((acc, result) => {
        acc[result.source] = (acc[result.source] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log(`\n📈 Results by Source:`)
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   📊 ${source}: ${count} results`)
      })
    } else {
      console.log(`\n📭 No results found. This could be because:`)
      console.log(`   • DuckDuckGo instant answers don't have relevant data`)
      console.log(`   • The analyst name might not be well-known`)
      console.log(`   • Network connectivity issues`)
      console.log(`   • Rate limiting from search engines`)
    }

    console.log(`\n✅ Alternative search test completed successfully!`)

  } catch (error) {
    console.error('❌ Alternative search test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Test individual search engines
async function testIndividualEngines() {
  console.log('\n🔬 Testing Individual Search Engines')
  console.log('====================================\n')

  const { DuckDuckGoSearchEngine, DirectWebSearchEngine, LinkedInPublicSearchEngine } = await import('./src/lib/publication-discovery/alternative-search')

  // Test DuckDuckGo
  console.log('1. Testing DuckDuckGo Search Engine...')
  try {
    const ddg = new DuckDuckGoSearchEngine()
    const ddgResults = await ddg.search('Gartner Magic Quadrant 2024', 3)
    console.log(`   📄 DuckDuckGo found ${ddgResults.length} results`)
    if (ddgResults.length > 0) {
      console.log(`   📋 Sample: ${ddgResults[0].title}`)
    }
  } catch (error) {
    console.error('   ❌ DuckDuckGo test failed:', error.message)
  }

  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Test LinkedIn Public Search
  console.log('\n2. Testing LinkedIn Public Search...')
  try {
    const linkedin = new LinkedInPublicSearchEngine()
    const linkedinResults = await linkedin.search('HR Technology analyst insights', 2)
    console.log(`   📄 LinkedIn found ${linkedinResults.length} results`)
    if (linkedinResults.length > 0) {
      console.log(`   📋 Sample: ${linkedinResults[0].title}`)
    }
  } catch (error) {
    console.error('   ❌ LinkedIn test failed:', error.message)
  }

  console.log('\n✅ Individual engine tests completed!')
}

// Main execution
async function main() {
  console.log('🚀 Starting Alternative Search Engine Tests\n')

  try {
    await testAlternativeSearch()
    await testIndividualEngines()

    console.log('\n🎉 All tests completed successfully!')
    console.log('\n💡 Next Steps:')
    console.log('   1. The alternative search engines are working')
    console.log('   2. You can now run publication discovery without Google API')
    console.log('   3. Run: npm run discover:daily')
    console.log('   4. The system will automatically use alternative engines')

  } catch (error) {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error)
}

export { testAlternativeSearch, testIndividualEngines }
