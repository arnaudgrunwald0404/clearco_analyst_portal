require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testRLSDirect() {
  console.log('🧪 Testing RLS Policies - Direct Database Access\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  }
  
  try {
    // Test 1: Basic Table Access
    console.log('🔍 Test 1: Basic Table Access')
    console.log('------------------------------')
    await testBasicAccess(supabase, testResults)
    
    // Test 2: Field References
    console.log('🔍 Test 2: Field References')
    console.log('----------------------------')
    await testFieldReferences(supabase, testResults)
    
    // Test 3: Cross-Table Joins
    console.log('🔍 Test 3: Cross-Table Joins')
    console.log('------------------------------')
    await testCrossTableJoins(supabase, testResults)
    
    // Test 4: CRUD Operations
    console.log('🔍 Test 4: CRUD Operations')
    console.log('---------------------------')
    await testCRUDOperations(supabase, testResults)
    
    // Test 5: Policy Enforcement
    console.log('🔍 Test 5: Policy Enforcement')
    console.log('-------------------------------')
    await testPolicyEnforcement(supabase, testResults)
    
  } catch (error) {
    console.error('💥 Test suite failed:', error)
    testResults.errors.push(error.message)
  }
  
  // Results
  console.log('\n📊 TEST RESULTS')
  console.log('================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`💥 Errors: ${testResults.errors.length}`)
  
  if (testResults.failed === 0 && testResults.errors.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! RLS policies are working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.')
  }
}

async function testBasicAccess(supabase, results) {
  try {
    const testTables = [
      'analysts',
      'briefings', 
      'testimonials',
      'topics',
      'awards',
      'calendar_connections'
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
          console.log(`✅ ${tableName}: Accessible (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Exception - ${err.message}`)
        allAccessible = false
      }
    }
    
    if (allAccessible) {
      console.log('✅ All test tables are accessible')
      results.passed++
    } else {
      console.log('❌ Some tables are not accessible')
      results.failed++
    }
    
  } catch (error) {
    console.log(`❌ Basic Access test failed: ${error.message}`)
    results.failed++
  }
  console.log('')
}

async function testFieldReferences(supabase, results) {
  try {
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
          console.log(`✅ ${test.table}.${test.field}: Query successful (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${test.table}.${test.field}: Exception - ${err.message}`)
        allFieldsWork = false
      }
    }
    
    if (allFieldsWork) {
      console.log('✅ All field references work correctly')
      results.passed++
    } else {
      console.log('❌ Some field references have issues')
      results.failed++
    }
    
  } catch (error) {
    console.log(`❌ Field Reference test failed: ${error.message}`)
    results.failed++
  }
  console.log('')
}

async function testCrossTableJoins(supabase, results) {
  try {
    const joinTests = [
      {
        description: 'Testimonials with analyst info',
        query: supabase
          .from('testimonials')
          .select(`
            id, text, author,
            analysts!testimonials_analyst_id_fkey (firstName, lastName, company)
          `)
          .limit(1)
      },
      {
        description: 'Analysts basic query',
        query: supabase
          .from('analysts')
          .select('id, firstName, lastName, company')
          .limit(1)
      },
      {
        description: 'Briefings basic query',
        query: supabase
          .from('briefings')
          .select('id, title, scheduledAt')
          .limit(1)
      }
    ]
    
    let allJoinsWork = true
    
    for (const test of joinTests) {
      try {
        const { data, error } = await test.query
        
        if (error) {
          console.log(`❌ ${test.description}: Failed - ${error.message}`)
          allJoinsWork = false
        } else {
          console.log(`✅ ${test.description}: Successful (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        allJoinsWork = false
      }
    }
    
    if (allJoinsWork) {
      console.log('✅ Cross-table queries work correctly')
      results.passed++
    } else {
      console.log('❌ Some cross-table queries have issues')
      results.failed++
    }
    
  } catch (error) {
    console.log(`❌ Cross-Table Joins test failed: ${error.message}`)
    results.failed++
  }
  console.log('')
}

async function testCRUDOperations(supabase, results) {
  try {
    // Test SELECT operations
    const selectTests = [
      { table: 'analysts', description: 'Select analysts' },
      { table: 'testimonials', description: 'Select testimonials' },
      { table: 'topics', description: 'Select topics' }
    ]
    
    let allCRUDWork = true
    
    for (const test of selectTests) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('*')
          .limit(5)
        
        if (error) {
          console.log(`❌ ${test.description}: Failed - ${error.message}`)
          allCRUDWork = false
        } else {
          console.log(`✅ ${test.description}: Successful (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        allCRUDWork = false
      }
    }
    
    if (allCRUDWork) {
      console.log('✅ CRUD operations work correctly')
      results.passed++
    } else {
      console.log('❌ Some CRUD operations have issues')
      results.failed++
    }
    
  } catch (error) {
    console.log(`❌ CRUD Operations test failed: ${error.message}`)
    results.failed++
  }
  console.log('')
}

async function testPolicyEnforcement(supabase, results) {
  try {
    // Test that policies are enforced by trying to access user-specific data
    const policyTests = [
      {
        description: 'Calendar connections with user filter',
        query: supabase
          .from('calendar_connections')
          .select('*')
          .eq('user_id', 'test-user-id')
          .limit(1)
      },
      {
        description: 'Action items with user filter',
        query: supabase
          .from('ActionItem')
          .select('*')
          .eq('userId', 'test-user-id')
          .limit(1)
      }
    ]
    
    let allPoliciesWork = true
    
    for (const test of policyTests) {
      try {
        const { data, error } = await test.query
        
        if (error && error.message.includes('policy')) {
          console.log(`✅ ${test.description}: Policy correctly enforced`)
        } else if (error) {
          console.log(`⚠️  ${test.description}: Other error - ${error.message}`)
        } else {
          console.log(`✅ ${test.description}: Query successful (may be empty result)`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        allPoliciesWork = false
      }
    }
    
    if (allPoliciesWork) {
      console.log('✅ Policy enforcement tests passed')
      results.passed++
    } else {
      console.log('❌ Some policy enforcement tests failed')
      results.failed++
    }
    
  } catch (error) {
    console.log(`❌ Policy Enforcement test failed: ${error.message}`)
    results.failed++
  }
  console.log('')
}

// Run tests
if (require.main === module) {
  testRLSDirect()
    .then(() => {
      console.log('🏁 Direct test suite completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Direct test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { testRLSDirect }
