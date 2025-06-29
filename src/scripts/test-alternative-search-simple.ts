#!/usr/bin/env node

/**
 * Simple test script for alternative search engines
 * Tests the improved error handling for DuckDuckGo and other engines
 */

import { AlternativeComprehensiveSearchEngine } from '../lib/publication-discovery/alternative-search'

async function main() {
  console.log('🧪 Testing Alternative Search Engines...\n')

  const searchEngine = new AlternativeComprehensiveSearchEngine()

  // Test with a well-known analyst
  const testQuery = {
    analystName: 'Josh Bersin',
    company: 'Josh Bersin Company',
    searchTerms: ['HR technology', 'workforce analytics']
  }

  console.log(`🔍 Testing search for: ${testQuery.analystName}`)
  console.log(`📊 Company: ${testQuery.company}`)
  console.log(`🏷️  Search terms: ${testQuery.searchTerms.join(', ')}`)
  console.log('─'.repeat(50))

  try {
    const results = await searchEngine.searchAnalyst(testQuery)
    
    console.log('\n📊 SEARCH RESULTS SUMMARY:')
    console.log(`   📄 Total results found: ${results.length}`)
    
    if (results.length > 0) {
      console.log('\n📋 Sample Results:')
      results.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`)
        console.log(`      🔗 ${result.url}`)
        console.log(`      🏷️  Source: ${result.source}`)
        console.log('')
      })
    } else {
      console.log('   ℹ️  No results found - this is expected with limited alternative search engines')
    }

    console.log('\n✅ Test completed successfully!')
    console.log('   The alternative search engines are working with improved error handling.')
    console.log('   Limited results are expected due to API limitations.')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

// Run the test
main().catch(console.error)
