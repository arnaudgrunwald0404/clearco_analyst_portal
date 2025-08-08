#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner
 * Runs all test suites and generates reports
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Configuration
const TEST_RESULTS_DIR = 'test-results'
const REPORTS_DIR = 'test-reports'

// Ensure directories exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true })
}

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
}

interface TestSuite {
  name: string
  command: string
  description: string
  timeout?: number
}

const testSuites: TestSuite[] = [
  {
    name: 'page-load-tests',
    command: 'npx playwright test tests/e2e/page-load-tests.spec.ts',
    description: 'Page load and authentication tests',
    timeout: 300000 // 5 minutes
  },
  {
    name: 'ux-patterns',
    command: 'npx playwright test tests/e2e/ux-patterns.spec.ts',
    description: 'UX patterns: modals, drawers, forms',
    timeout: 300000 // 5 minutes
  },
  {
    name: 'api-endpoints',
    command: 'npx playwright test tests/api/api-endpoints.spec.ts',
    description: 'API endpoint tests',
    timeout: 180000 // 3 minutes
  },
  {
    name: 'performance',
    command: 'npx playwright test tests/performance/performance.spec.ts',
    description: 'Performance and load time tests',
    timeout: 240000 // 4 minutes
  }
]

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  details?: any
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  console.log(`\n🧪 Running ${suite.name}: ${suite.description}`)
  console.log(`📝 Command: ${suite.command}`)
  
  const startTime = Date.now()
  
  try {
    const output = execSync(suite.command, {
      encoding: 'utf8',
      timeout: suite.timeout || 180000,
      stdio: ['inherit', 'pipe', 'pipe']
    })
    
    const duration = Date.now() - startTime
    
    console.log(`✅ ${suite.name} completed successfully in ${duration}ms`)
    
    return {
      name: suite.name,
      status: 'passed',
      duration,
      details: { output: output.toString() }
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    console.error(`❌ ${suite.name} failed after ${duration}ms`)
    console.error(`Error: ${error.message}`)
    
    if (error.stdout) {
      console.log('STDOUT:', error.stdout.toString())
    }
    
    if (error.stderr) {
      console.error('STDERR:', error.stderr.toString())
    }
    
    return {
      name: suite.name,
      status: 'failed',
      duration,
      error: error.message,
      details: {
        stdout: error.stdout?.toString(),
        stderr: error.stderr?.toString()
      }
    }
  }
}

function generateSummaryReport(results: TestResult[]) {
  const totalTests = results.length
  const passedTests = results.filter(r => r.status === 'passed').length
  const failedTests = results.filter(r => r.status === 'failed').length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  
  const report = {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      totalDuration,
      timestamp: new Date().toISOString()
    },
    results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      ci: !!process.env.CI
    }
  }
  
  // Save JSON report
  const jsonReportPath = path.join(REPORTS_DIR, 'test-summary.json')
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2))
  
  // Generate HTML report
  generateHTMLReport(report)
  
  return report
}

function generateHTMLReport(report: any) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results Summary</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .test-result { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
        .test-result.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-result.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-name { font-weight: bold; font-size: 1.2em; margin-bottom: 10px; }
        .test-duration { color: #666; font-size: 0.9em; }
        .error-details { background: #fff; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; white-space: pre-wrap; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Results Summary</h1>
        <p class="timestamp">Generated: ${new Date(report.summary.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.summary.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value passed">${report.summary.passedTests}</div>
            <div>Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value failed">${report.summary.failedTests}</div>
            <div>Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.successRate}%</div>
            <div>Success Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${Math.round(report.summary.totalDuration / 1000)}s</div>
            <div>Total Duration</div>
        </div>
    </div>
    
    <h2>📋 Test Results</h2>
    ${report.results.map((result: TestResult) => `
        <div class="test-result ${result.status}">
            <div class="test-name">${result.name}</div>
            <div class="test-duration">Duration: ${Math.round(result.duration / 1000)}s</div>
            ${result.error ? `<div class="error-details">${result.error}</div>` : ''}
        </div>
    `).join('')}
    
    <h2>🖥️ Environment</h2>
    <ul>
        <li>Node.js: ${report.environment.nodeVersion}</li>
        <li>Platform: ${report.environment.platform} ${report.environment.arch}</li>
        <li>CI: ${report.environment.ci ? 'Yes' : 'No'}</li>
    </ul>
</body>
</html>
  `
  
  const htmlReportPath = path.join(REPORTS_DIR, 'test-summary.html')
  fs.writeFileSync(htmlReportPath, html)
}

async function main() {
  console.log('🚀 Starting comprehensive test suite...')
  console.log(`📊 Running ${testSuites.length} test suites\n`)
  
  const results: TestResult[] = []
  
  // Run all test suites
  for (const suite of testSuites) {
    const result = await runTestSuite(suite)
    results.push(result)
  }
  
  // Generate reports
  console.log('\n📊 Generating test reports...')
  const report = generateSummaryReport(results)
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('🏁 TEST SUITE SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${report.summary.totalTests}`)
  console.log(`✅ Passed: ${report.summary.passedTests}`)
  console.log(`❌ Failed: ${report.summary.failedTests}`)
  console.log(`📈 Success Rate: ${report.summary.successRate}%`)
  console.log(`⏱️  Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`)
  console.log('')
  
  // List failed tests
  const failedTests = results.filter(r => r.status === 'failed')
  if (failedTests.length > 0) {
    console.log('❌ Failed Tests:')
    failedTests.forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`)
    })
    console.log('')
  }
  
  console.log(`📄 Reports saved to:`)
  console.log(`  - JSON: ${path.join(REPORTS_DIR, 'test-summary.json')}`)
  console.log(`  - HTML: ${path.join(REPORTS_DIR, 'test-summary.html')}`)
  
  // Exit with appropriate code
  const exitCode = failedTests.length > 0 ? 1 : 0
  process.exit(exitCode)
}

// Run the test suite
main().catch(error => {
  console.error('❌ Test runner failed:', error)
  process.exit(1)
})