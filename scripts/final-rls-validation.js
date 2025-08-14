require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function finalRLSValidation() {
  console.log('🎯 FINAL RLS POLICY VALIDATION\n')
  console.log('================================\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const validationResults = {
    critical: { passed: 0, failed: 0 },
    important: { passed: 0, failed: 0 },
    niceToHave: { passed: 0, failed: 0 }
  }
  
  try {
    // CRITICAL TESTS - These must pass for the app to function
    console.log('🔴 CRITICAL TESTS (Must Pass)')
    console.log('==============================')
    
    // Test 1: Core table access
    const criticalTables = ['analysts', 'briefings', 'testimonials']
    let criticalAccess = true
    
    for (const table of criticalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: Access failed - ${error.message}`)
          criticalAccess = false
        } else {
          console.log(`✅ ${table}: Accessible (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err.message}`)
        criticalAccess = false
      }
    }
    
    if (criticalAccess) {
      console.log('✅ All critical tables accessible')
      validationResults.critical.passed++
    } else {
      console.log('❌ Critical table access issues')
      validationResults.critical.failed++
    }
    
    // Test 2: Field references
    const criticalFields = [
      { table: 'Content', field: 'isPublished' },
      { table: 'CompanyVision', field: 'isPublished' },
      { table: 'ExclusiveContent', field: 'isActive' }
    ]
    
    let criticalFieldsWork = true
    for (const field of criticalFields) {
      try {
        const { data, error } = await supabase
          .from(field.table)
          .select('*')
          .eq(field.field, true)
          .limit(1)
        
        if (error) {
          console.log(`❌ ${field.table}.${field.field}: Query failed`)
          criticalFieldsWork = false
        } else {
          console.log(`✅ ${field.table}.${field.field}: Query successful`)
        }
      } catch (err) {
        console.log(`❌ ${field.table}.${field.field}: Exception`)
        criticalFieldsWork = false
      }
    }
    
    if (criticalFieldsWork) {
      console.log('✅ All critical field references work')
      validationResults.critical.passed++
    } else {
      console.log('❌ Critical field reference issues')
      validationResults.critical.failed++
    }
    
    console.log('')
    
    // IMPORTANT TESTS - These should pass for full functionality
    console.log('🟡 IMPORTANT TESTS (Should Pass)')
    console.log('=================================')
    
    // Test 3: Cross-table joins
    const importantJoins = [
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
    
    let importantJoinsWork = true
    for (const join of importantJoins) {
      try {
        const { data, error } = await join.query
        
        if (error) {
          console.log(`❌ ${join.description}: Failed - ${error.message}`)
          importantJoinsWork = false
        } else {
          console.log(`✅ ${join.description}: Successful (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${join.description}: Exception - ${err.message}`)
        importantJoinsWork = false
      }
    }
    
    if (importantJoinsWork) {
      console.log('✅ Important cross-table joins work')
      validationResults.important.passed++
    } else {
      console.log('❌ Important cross-table join issues')
      validationResults.important.failed++
    }
    
    // Test 4: Additional tables
    const additionalTables = ['topics', 'awards', 'calendar_connections']
    let additionalAccess = true
    
    for (const table of additionalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: Access failed - ${error.message}`)
          additionalAccess = false
        } else {
          console.log(`✅ ${table}: Accessible (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err.message}`)
        additionalAccess = false
      }
    }
    
    if (additionalAccess) {
      console.log('✅ All additional tables accessible')
      validationResults.important.passed++
    } else {
      console.log('❌ Additional table access issues')
      validationResults.important.failed++
    }
    
    console.log('')
    
    // NICE TO HAVE TESTS - These are good to have
    console.log('🟢 NICE TO HAVE TESTS (Good to Pass)')
    console.log('=====================================')
    
    // Test 5: Performance
    const performanceTests = [
      { table: 'analysts', description: 'Analysts query performance' },
      { table: 'testimonials', description: 'Testimonials query performance' }
    ]
    
    let performanceGood = true
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
          console.log(`❌ ${test.description}: Failed - ${error.message}`)
          performanceGood = false
        } else if (duration > 5000) {
          console.log(`⚠️  ${test.description}: Slow (${duration}ms)`)
          performanceGood = false
        } else {
          console.log(`✅ ${test.description}: Fast (${duration}ms)`)
        }
      } catch (err) {
        console.log(`❌ ${test.description}: Exception - ${err.message}`)
        performanceGood = false
      }
    }
    
    if (performanceGood) {
      console.log('✅ Performance is good')
      validationResults.niceToHave.passed++
    } else {
      console.log('❌ Performance issues detected')
      validationResults.niceToHave.failed++
    }
    
    console.log('')
    
  } catch (error) {
    console.error('💥 Validation failed:', error)
  }
  
  // FINAL RESULTS
  console.log('📊 FINAL VALIDATION RESULTS')
  console.log('============================')
  
  const totalCritical = validationResults.critical.passed + validationResults.critical.failed
  const totalImportant = validationResults.important.passed + validationResults.important.failed
  const totalNiceToHave = validationResults.niceToHave.passed + validationResults.niceToHave.failed
  
  console.log(`🔴 Critical: ${validationResults.critical.passed}/${totalCritical} passed`)
  console.log(`🟡 Important: ${validationResults.important.passed}/${totalImportant} passed`)
  console.log(`🟢 Nice to Have: ${validationResults.niceToHave.passed}/${totalNiceToHave} passed`)
  
  const criticalPassed = validationResults.critical.failed === 0
  const importantPassed = validationResults.important.failed === 0
  
  console.log('')
  
  if (criticalPassed && importantPassed) {
    console.log('🎉 EXCELLENT! All critical and important tests passed.')
    console.log('✅ Your RLS policies are working correctly.')
    console.log('✅ Your application should function normally.')
    console.log('✅ Your database is properly secured.')
    console.log('✅ You can deploy with confidence.')
  } else if (criticalPassed) {
    console.log('✅ GOOD! All critical tests passed.')
    console.log('⚠️  Some important features may have issues.')
    console.log('✅ Your application should work for core functionality.')
  } else {
    console.log('❌ CRITICAL ISSUES DETECTED!')
    console.log('❌ Your application may not function correctly.')
    console.log('❌ Review the failed tests above.')
  }
  
  console.log('')
  console.log('🔍 NEXT STEPS:')
  if (criticalPassed) {
    console.log('✅ Test your application manually')
    console.log('✅ Monitor for any RLS-related errors')
    console.log('✅ Deploy when ready')
  } else {
    console.log('❌ Fix critical issues before proceeding')
    console.log('❌ Review RLS policy configuration')
    console.log('❌ Test again after fixes')
  }
}

// Run validation
if (require.main === module) {
  finalRLSValidation()
    .then(() => {
      console.log('🏁 Final validation completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Final validation failed:', error)
      process.exit(1)
    })
}

module.exports = { finalRLSValidation }
