import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    
    // Check if the web server is responding
    const baseURL = process.env.BASE_URL || 'http://localhost:4173'
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    
    // Verify the application loads correctly
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Check if PromptCraft UI is loaded
    const title = await page.title()
    if (!title.includes('PromptCraft') && !title.includes('Prompt')) {
      console.log(`⚠️  Page title: "${title}" - might not be the correct app`)
    }
    
    console.log('✅ Application is ready for testing')
    
    // Set up any global test data or configuration
    await setupTestData(page)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('✅ Global E2E test setup completed')
}

async function setupTestData(page: any) {
  // Create any test data needed across all tests
  console.log('📝 Setting up test data...')
  
  // Example: Clear any existing data, set up test configurations, etc.
  // This could include:
  // - Clearing localStorage/sessionStorage
  // - Setting up mock data
  // - Configuring test environment variables
  
  await page.evaluate(() => {
    // Clear any existing data
    localStorage.clear()
    sessionStorage.clear()
    
    // Set test configuration
    localStorage.setItem('promptcraft-test-mode', 'true')
    localStorage.setItem('promptcraft-e2e-setup', new Date().toISOString())
  })
  
  console.log('✅ Test data setup completed')
}

export default globalSetup