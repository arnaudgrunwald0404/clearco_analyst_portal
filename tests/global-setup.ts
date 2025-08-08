import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto(baseURL)
    await page.waitForSelector('body', { timeout: 30000 })
    
    // Check if the application is running properly
    const title = await page.title()
    console.log(`✅ Application is ready. Title: "${title}"`)
    
    // Optionally, set up test data or perform initial setup
    await setupTestData(page, baseURL)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('✅ Global test setup completed')
}

async function setupTestData(page: any, baseURL: string) {
  console.log('📊 Setting up test data...')
  
  try {
    // Check if we can access the API
    const response = await page.request.get(`${baseURL}/api/settings/general`)
    
    if (response.status() === 401) {
      console.log('🔐 API requires authentication (expected)')
    } else if (response.status() === 200) {
      console.log('✅ API is accessible')
    } else {
      console.warn(`⚠️  API returned unexpected status: ${response.status()}`)
    }
    
    // You can add more test data setup here, such as:
    // - Creating test users
    // - Setting up test analysts
    // - Initializing test settings
    
  } catch (error) {
    console.warn('⚠️  Test data setup failed (may be expected):', error)
  }
}

export default globalSetup