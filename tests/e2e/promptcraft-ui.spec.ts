import { test, expect } from '@playwright/test'

test.describe('PromptCraft UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the PromptCraft UI
    await page.goto('/prompt_craft.html')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should load the PromptCraft interface', async ({ page }) => {
    // Check if the page title contains PromptCraft
    await expect(page).toHaveTitle(/PromptCraft/i)
    
    // Check for main UI elements
    await expect(page.locator('text=PromptCraft')).toBeVisible()
    await expect(page.locator('text=Neural Prompt Enhancement System')).toBeVisible()
  })

  test('should have all required form elements', async ({ page }) => {
    // Check for input textarea
    const promptInput = page.locator('textarea[placeholder*="prompt"]')
    await expect(promptInput).toBeVisible()
    
    // Check for model selector
    const modelSelect = page.locator('select')
    await expect(modelSelect).toBeVisible()
    
    // Check for enhance button
    const enhanceButton = page.locator('button:has-text("Enhance")')
    await expect(enhanceButton).toBeVisible()
  })

  test('should enhance a simple prompt', async ({ page }) => {
    // Fill in a test prompt
    const testPrompt = 'Write a hello world function'
    await page.fill('textarea[placeholder*="prompt"]', testPrompt)
    
    // Select a model (default should be selected)
    await page.selectOption('select', 'default')
    
    // Click enhance button
    await page.click('button:has-text("Enhance")')
    
    // Wait for results to appear
    await page.waitForSelector('.result-container', { timeout: 10000 })
    
    // Check if enhanced prompt is displayed
    const resultContainer = page.locator('.result-container')
    await expect(resultContainer).toBeVisible()
    
    // Check if the enhanced prompt contains the original input
    const enhancedPrompt = page.locator('.enhanced-prompt')
    await expect(enhancedPrompt).toContainText(testPrompt)
    
    // Check for template badge
    const templateBadge = page.locator('.template-badge')
    await expect(templateBadge).toBeVisible()
    
    // Check for copy button
    const copyButton = page.locator('button:has-text("Copy")')
    await expect(copyButton).toBeVisible()
  })

  test('should detect code template for programming prompts', async ({ page }) => {
    // Test with a coding prompt
    const codingPrompt = 'Create a Python function to sort a list'
    await page.fill('textarea[placeholder*="prompt"]', codingPrompt)
    
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    // Should use code template
    const templateBadge = page.locator('.template-badge')
    await expect(templateBadge).toContainText(/Code Generation|💻/)
  })

  test('should detect creative template for writing prompts', async ({ page }) => {
    // Test with a creative writing prompt
    const creativePrompt = 'Write a story about a magical forest'
    await page.fill('textarea[placeholder*="prompt"]', creativePrompt)
    
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    // Should use creative template
    const templateBadge = page.locator('.template-badge')
    await expect(templateBadge).toContainText(/Creative Writing|✍️/)
  })

  test('should detect explain template for explanation prompts', async ({ page }) => {
    // Test with an explanation prompt
    const explainPrompt = 'Explain how neural networks work'
    await page.fill('textarea[placeholder*="prompt"]', explainPrompt)
    
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    // Should use explain template
    const templateBadge = page.locator('.template-badge')
    await expect(templateBadge).toContainText(/Detailed Explanation|🎓/)
  })

  test('should handle different model selections', async ({ page }) => {
    const testPrompt = 'Test prompt for different models'
    await page.fill('textarea[placeholder*="prompt"]', testPrompt)
    
    // Test with different models
    const models = ['default', 'gpt4', 'claude', 'gemini']
    
    for (const model of models) {
      // Check if model option exists
      const modelOption = page.locator(`option[value="${model}"]`)
      if (await modelOption.count() > 0) {
        await page.selectOption('select', model)
        await page.click('button:has-text("Enhance")')
        await page.waitForSelector('.result-container')
        
        // Check model badge
        const modelBadge = page.locator('.model-badge')
        await expect(modelBadge).toContainText(model.toUpperCase())
        
        // Clear result for next iteration
        await page.reload()
        await page.fill('textarea[placeholder*="prompt"]', testPrompt)
      }
    }
  })

  test('should show error for empty prompt', async ({ page }) => {
    // Try to enhance without entering a prompt
    await page.click('button:has-text("Enhance")')
    
    // Should show error message
    const errorMessage = page.locator('.error-message')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/empty|required/i)
  })

  test('should copy enhanced prompt to clipboard', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    
    const testPrompt = 'Test prompt for clipboard'
    await page.fill('textarea[placeholder*="prompt"]', testPrompt)
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    // Click copy button
    await page.click('button:has-text("Copy")')
    
    // Verify clipboard content (if supported by browser)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain(testPrompt)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if UI adapts to mobile
    const container = page.locator('.promptcraft-container')
    await expect(container).toBeVisible()
    
    // Form elements should still be usable
    const promptInput = page.locator('textarea[placeholder*="prompt"]')
    await expect(promptInput).toBeVisible()
    
    const enhanceButton = page.locator('button:has-text("Enhance")')
    await expect(enhanceButton).toBeVisible()
    
    // Test functionality on mobile
    await page.fill('textarea[placeholder*="prompt"]', 'Mobile test prompt')
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    const resultContainer = page.locator('.result-container')
    await expect(resultContainer).toBeVisible()
  })

  test('should handle long prompts', async ({ page }) => {
    // Test with a very long prompt
    const longPrompt = 'This is a very long prompt. '.repeat(100)
    await page.fill('textarea[placeholder*="prompt"]', longPrompt)
    
    await page.click('button:has-text("Enhance")')
    
    // Should either enhance successfully or show appropriate error
    await page.waitForSelector('.result-container, .error-message', { timeout: 15000 })
    
    const hasResult = await page.locator('.result-container').count() > 0
    const hasError = await page.locator('.error-message').count() > 0
    
    expect(hasResult || hasError).toBeTruthy()
  })

  test('should maintain state during interaction', async ({ page }) => {
    // Fill form
    const testPrompt = 'State persistence test'
    await page.fill('textarea[placeholder*="prompt"]', testPrompt)
    await page.selectOption('select', 'gpt4')
    
    // Enhance
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    // Verify form state is maintained
    const inputValue = await page.inputValue('textarea[placeholder*="prompt"]')
    expect(inputValue).toBe(testPrompt)
    
    const selectedModel = await page.inputValue('select')
    expect(selectedModel).toBe('gpt4')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure by blocking requests
    await page.route('**/*', route => route.abort())
    
    await page.fill('textarea[placeholder*="prompt"]', 'Network error test')
    await page.click('button:has-text("Enhance")')
    
    // Should show some form of error handling
    // This might be an error message or the button returning to normal state
    await page.waitForTimeout(3000)
    
    const enhanceButton = page.locator('button:has-text("Enhance")')
    await expect(enhanceButton).not.toHaveText('Enhancing...')
  })
})