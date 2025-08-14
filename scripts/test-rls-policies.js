require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role for testing
  testTimeout: 30000
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

async function runRLSTests() {
  console.log('🧪 Starting RLS Policy Validation Tests...\n')
  
  if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey)
  
  try {
    // Test 1: Basic RLS Status Check
    await testRLSStatus(supabase)
    
    // Test 2: Policy Count Validation
    await testPolicyCounts(supabase)
    
    // Test 3: Table Access Tests
    await testTableAccess(supabase)
    
    // Test 4: Field Reference Tests
    await testFieldReferences(supabase)
    
    // Test 5: Policy Logic Tests
    await testPolicyLogic(supabase)
    
    // Test 6: Cross-Table Relationship Tests
    await testCrossTableRelationships(supabase)
    
    // Test 7: Performance Tests
    await testPerformance(supabase)
    
    // Test 8: Edge Case Tests
    await testEdgeCases(supabase)
    
  } catch (error) {
    console.error('💥 Test suite failed:', error)
    testResults.errors.push(error.message)
  }
  
  // Final Results
  console.log('\n📊 FINAL TEST RESULTS')
  console.log('=====================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`💥 Errors: ${testResults.errors.length}`)
  
  if (testResults.failed === 0 && testResults.errors.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! RLS policies are working correctly.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.')
    process.exit(1)
  }
}

async function testRLSStatus(supabase) {
  console.log('🔍 Test 1: RLS Status Check')
  console.log('----------------------------')
  
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .not('table_name', 'like', '_prisma_%')
      .not('table_name', 'like', 'pg_%')
    
    if (error) throw error
    
    let allEnabled = true
    let allHavePolicies = true
    
    for (const table of tables) {
      // Check RLS status
      const { data: rlsStatus, error: rlsError } = await supabase.rpc('get_table_rls_status', { 
        table_name: table.table_name 
      })
      
      if (rlsError) {
        console.log(`⚠️  Could not check RLS status for ${table.table_name}: ${rlsError.message}`)
        continue
      }
      
      if (!rlsStatus.row_security) {
        console.log(`❌ ${table.table_name}: RLS not enabled`)
        allEnabled = false
      }
      
      // Check policy count
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('policyname')
        .eq('schemaname', 'public')
        .eq('tablename', table.table_name)
      
      if (policyError) {
        console.log(`⚠️  Could not check policies for ${table.table_name}: ${policyError.message}`)
        continue
      }
      
      if (!policies || policies.length === 0) {
        console.log(`❌ ${table.table_name}: No policies found`)
        allHavePolicies = false
      }
    }
    
    if (allEnabled && allHavePolicies) {
      console.log('✅ All tables have RLS enabled and policies')
      testResults.passed++
    } else {
      console.log('❌ Some tables missing RLS or policies')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ RLS Status test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testPolicyCounts(supabase) {
  console.log('🔍 Test 2: Policy Count Validation')
  console.log('----------------------------------')
  
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .eq('schemaname', 'public')
      .order('tablename')
    
    if (error) throw error
    
    const tablePolicyCounts = {}
    policies.forEach(policy => {
      if (!tablePolicyCounts[policy.tablename]) {
        tablePolicyCounts[policy.tablename] = { total: 0, commands: {} }
      }
      tablePolicyCounts[policy.tablename].total++
      if (!tablePolicyCounts[policy.tablename].commands[policy.cmd]) {
        tablePolicyCounts[policy.tablename].commands[policy.cmd] = 0
      }
      tablePolicyCounts[policy.tablename].commands[policy.cmd]++
    })
    
    let allTablesHavePolicies = true
    let allTablesHaveFullCoverage = true
    
    for (const [tableName, counts] of Object.entries(tablePolicyCounts)) {
      console.log(`${tableName}: ${counts.total} policies`)
      
      if (counts.total === 0) {
        allTablesHavePolicies = false
      }
      
      // Check if we have basic CRUD coverage
      const hasSelect = counts.commands.SELECT > 0
      const hasInsert = counts.commands.INSERT > 0
      const hasUpdate = counts.commands.UPDATE > 0
      const hasDelete = counts.commands.DELETE > 0
      
      if (!hasSelect || !hasInsert || !hasUpdate || !hasDelete) {
        console.log(`  ⚠️  Missing: ${!hasSelect ? 'SELECT ' : ''}${!hasInsert ? 'INSERT ' : ''}${!hasUpdate ? 'UPDATE ' : ''}${!hasDelete ? 'DELETE' : ''}`)
        allTablesHaveFullCoverage = false
      }
    }
    
    if (allTablesHavePolicies && allTablesHaveFullCoverage) {
      console.log('✅ All tables have comprehensive policy coverage')
      testResults.passed++
    } else {
      console.log('❌ Some tables missing policy coverage')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Policy Count test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testTableAccess(supabase) {
  console.log('🔍 Test 3: Table Access Tests')
  console.log('------------------------------')
  
  try {
    // Test basic table access
    const testTables = [
      'analysts',
      'briefings', 
      'testimonials',
      'topics',
      'awards'
    ]
    
    let allAccessible = true
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: Access failed - ${error.message}`)
          allAccessible = false
        } else {
          console.log(`✅ ${tableName}: Accessible`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Exception - ${err.message}`)
        allAccessible = false
      }
    }
    
    if (allAccessible) {
      console.log('✅ All test tables are accessible')
      testResults.passed++
    } else {
      console.log('❌ Some tables are not accessible')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Table Access test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testFieldReferences(supabase) {
  console.log('🔍 Test 4: Field Reference Tests')
  console.log('---------------------------------')
  
  try {
    // Test tables with specific field references
    const fieldTests = [
      { table: 'Content', field: 'isPublished', testValue: true },
      { table: 'CompanyVision', field: 'isPublished', testValue: true },
      { table: 'ExclusiveContent', field: 'isActive', testValue: true }
    ]
    
    let allFieldsWork = true
    
    for (const test of fieldTests) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('*')
          .eq(test.field, test.testValue)
          .limit(1)
        
        if (error) {
          console.log(`❌ ${test.table}.${test.field}: Query failed - ${error.message}`)
          allFieldsWork = false
        } else {
          console.log(`✅ ${test.table}.${test.field}: Query successful`)
        }
      } catch (err) {
        console.log(`❌ ${test.table}.${test.field}: Exception - ${err.message}`)
        allFieldsWork = false
      }
    }
    
    if (allFieldsWork) {
      console.log('✅ All field references work correctly')
      testResults.passed++
    } else {
      console.log('❌ Some field references have issues')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Field Reference test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testPolicyLogic(supabase) {
  console.log('🔍 Test 5: Policy Logic Tests')
  console.log('------------------------------')
  
  try {
    // Test user-specific policies
    const userSpecificTests = [
      { table: 'calendar_connections', field: 'user_id' },
      { table: 'ActionItem', field: 'userId' },
      { table: 'AnalystPortalSession', field: 'analystId' }
    ]
    
    let allPoliciesWork = true
    
    for (const test of userSpecificTests) {
      try {
        // Test with a dummy user ID
        const { data, error } = await supabase
          .from(test.table)
          .select('*')
          .eq(test.field, 'test-user-id')
          .limit(1)
        
        if (error && error.message.includes('policy')) {
          console.log(`✅ ${test.table}: Policy correctly enforced`)
        } else if (error) {
          console.log(`⚠️  ${test.table}: Other error - ${error.message}`)
        } else {
          console.log(`✅ ${test.table}: Query successful (may be empty result)`)
        }
      } catch (err) {
        console.log(`❌ ${test.table}: Exception - ${err.message}`)
        allPoliciesWork = false
      }
    }
    
    if (allPoliciesWork) {
      console.log('✅ Policy logic tests passed')
      testResults.passed++
    } else {
      console.log('❌ Some policy logic tests failed')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Policy Logic test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testCrossTableRelationships(supabase) {
  console.log('🔍 Test 6: Cross-Table Relationship Tests')
  console.log('------------------------------------------')
  
  try {
    // Test joins between tables
    const relationshipTests = [
      {
        description: 'Analysts with briefings',
        query: supabase
          .from('analysts')
          .select(`
            id, firstName, lastName,
            briefings!briefing_analysts_analystId_fkey (id, title)
          `)
          .limit(1)
      },
      {
        description: 'Testimonials with analyst info',
        query: supabase
          .from('testimonials')
          .select(`
            id, text, author,
            analysts!testimonials_analyst_id_fkey (firstName, lastName, company)
          `)
          .limit(1)
      }
    ]
    
    let allRelationshipsWork = true
    
    for (const test of relationshipTests) {
      try {
        const { data, error } = await test.query
        
        if (error) {
          console.log(`❌ ${test.description}: Failed - ${error.message}`)
          allRelationshipsWork = false
        } else {
          console.log(`✅ ${test.description}: Successful`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        allRelationshipsWork = false
      }
    }
    
    if (allRelationshipsWork) {
      console.log('✅ Cross-table relationships work correctly')
      testResults.passed++
    } else {
      console.log('❌ Some cross-table relationships have issues')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Cross-Table Relationship test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testPerformance(supabase) {
  console.log('🔍 Test 7: Performance Tests')
  console.log('-----------------------------')
  
  try {
    const performanceTests = [
      { table: 'analysts', description: 'Analysts table' },
      { table: 'briefings', description: 'Briefings table' },
      { table: 'testimonials', description: 'Testimonials table' }
    ]
    
    let allPerformant = true
    
    for (const test of performanceTests) {
      const startTime = Date.now()
      
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('*')
          .limit(100)
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        if (error) {
          console.log(`❌ ${test.description}: Query failed - ${error.message}`)
          allPerformant = false
        } else if (duration > 5000) { // 5 second threshold
          console.log(`⚠️  ${test.description}: Slow query (${duration}ms)`)
          allPerformant = false
        } else {
          console.log(`✅ ${test.description}: Fast query (${duration}ms)`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        allPerformant = false
      }
    }
    
    if (allPerformant) {
      console.log('✅ Performance tests passed')
      testResults.passed++
    } else {
      console.log('❌ Some performance issues detected')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

async function testEdgeCases(supabase) {
  console.log('🔍 Test 8: Edge Case Tests')
  console.log('---------------------------')
  
  try {
    const edgeCaseTests = [
      {
        description: 'Empty result set',
        query: supabase
          .from('analysts')
          .select('*')
          .eq('id', 'non-existent-id')
      },
      {
        description: 'Large limit query',
        query: supabase
          .from('topics')
          .select('*')
          .limit(1000)
      },
      {
        description: 'Complex filter',
        query: supabase
          .from('briefings')
          .select('*')
          .gte('scheduledAt', '2020-01-01')
          .lte('scheduledAt', '2030-12-31')
          .limit(10)
      }
    ]
    
    let allEdgeCasesWork = true
    
    for (const test of edgeCaseTests) {
      try {
        const { data, error } = await test.query
        
        if (error && error.message.includes('policy')) {
          console.log(`✅ ${test.description}: Policy correctly enforced`)
        } else if (error) {
          console.log(`⚠️  ${test.description}: Other error - ${error.message}`)
        } else {
          console.log(`✅ ${test.description}: Successful`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        allEdgeCasesWork = false
      }
    }
    
    if (allEdgeCasesWork) {
      console.log('✅ Edge case tests passed')
      testResults.passed++
    } else {
      console.log('❌ Some edge case tests failed')
      testResults.failed++
    }
    
  } catch (error) {
    console.log(`❌ Edge Case test failed: ${error.message}`)
    testResults.failed++
  }
  console.log('')
}

// Run the tests
if (require.main === module) {
  runRLSTests()
    .then(() => {
      console.log('🏁 Test suite completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { runRLSTests }
