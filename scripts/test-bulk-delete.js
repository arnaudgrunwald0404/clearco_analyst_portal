#!/usr/bin/env node

/**
 * Test runner for bulk delete functionality
 * 
 * This script runs the comprehensive test suite for the analyst access removal feature.
 * It includes unit tests, integration tests, and end-to-end tests.
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Running Bulk Delete Feature Tests\n')

const testFiles = [
  'tests/api/admin/remove-analyst-access.test.ts',
  'tests/components/admin/AnalystAccountsSection.test.tsx'
]

const e2eTestFiles = [
  'tests/e2e/admin-bulk-delete.spec.ts'
]

function runTests(files, type) {
  console.log(`📋 Running ${type} tests...`)
  
  try {
    files.forEach(file => {
      console.log(`  ▶️  ${file}`)
      
      if (type === 'Unit/Integration') {
        // Run with Jest
        execSync(`npx jest ${file}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        })
      } else {
        // Run with Playwright
        execSync(`npx playwright test ${file}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        })
      }
    })
    
    console.log(`✅ ${type} tests completed successfully\n`)
  } catch (error) {
    console.error(`❌ ${type} tests failed:`, error.message)
    process.exit(1)
  }
}

// Check if test files exist
function checkTestFiles() {
  const fs = require('fs')
  const allFiles = [...testFiles, ...e2eTestFiles]
  
  console.log('🔍 Checking test files...')
  
  allFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file)
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  ${file} - Not found (will be skipped)`)
    } else {
      console.log(`  ✅ ${file} - Found`)
    }
  })
  
  console.log('')
}

// Main execution
async function main() {
  try {
    checkTestFiles()
    
    // Run unit and integration tests
    const existingTestFiles = testFiles.filter(file => {
      const fs = require('fs')
      return fs.existsSync(path.join(process.cwd(), file))
    })
    
    if (existingTestFiles.length > 0) {
      runTests(existingTestFiles, 'Unit/Integration')
    } else {
      console.log('⚠️  No unit/integration test files found, skipping...\n')
    }
    
    // Run E2E tests
    const existingE2EFiles = e2eTestFiles.filter(file => {
      const fs = require('fs')
      return fs.existsSync(path.join(process.cwd(), file))
    })
    
    if (existingE2EFiles.length > 0) {
      runTests(existingE2EFiles, 'End-to-End')
    } else {
      console.log('⚠️  No E2E test files found, skipping...\n')
    }
    
    console.log('🎉 All bulk delete tests completed successfully!')
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message)
    process.exit(1)
  }
}

// Test coverage report
function generateCoverageReport() {
  console.log('📊 Generating test coverage report...')
  
  try {
    execSync('npx jest --coverage', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Coverage report generated\n')
  } catch (error) {
    console.log('⚠️  Coverage report generation failed (this is optional)\n')
  }
}

// Add coverage option
if (process.argv.includes('--coverage')) {
  generateCoverageReport()
}

// Run main function
main().catch(console.error)
