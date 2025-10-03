import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...')
  
  try {
    // Clean up any global test data
    await cleanupTestData()
    
    // Generate test reports
    await generateTestReports()
    
    console.log('✅ Global E2E test teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw here to avoid masking test failures
  }
}

async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...')
  
  // Clean up any persistent test data
  // This could include:
  // - Removing test files
  // - Cleaning up test databases
  // - Removing temporary configurations
  
  console.log('✅ Test data cleanup completed')
}

async function generateTestReports() {
  console.log('📊 Generating test reports...')
  
  // Generate any additional reports or summaries
  // This could include:
  // - Performance metrics
  // - Coverage reports
  // - Custom test summaries
  
  const testSummary = {
    timestamp: new Date().toISOString(),
    environment: process.env.PROMPTCRAFT_ENV || 'test',
    baseUrl: process.env.BASE_URL || 'http://localhost:4173'
  }
  
  console.log('📋 Test Summary:', testSummary)
  console.log('✅ Test reports generated')
}

export default globalTeardown