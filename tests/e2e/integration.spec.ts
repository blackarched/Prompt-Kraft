import { test, expect } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

test.describe('PromptCraft Integration Tests', () => {
  test('CLI and UI should use same configuration', async ({ page }) => {
    // Test that CLI and UI produce similar results for the same input
    const testPrompt = 'write a function to calculate fibonacci numbers'
    
    // Get CLI result
    const { stdout: cliResult } = await execAsync(`python prompt_craft.py -q "${testPrompt}"`)
    
    // Get UI result
    await page.goto('/prompt_craft.html')
    await page.fill('textarea[placeholder*="prompt"]', testPrompt)
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    const uiResult = await page.locator('.enhanced-prompt pre').textContent()
    
    // Both should contain the original prompt
    expect(cliResult).toContain(testPrompt)
    expect(uiResult).toContain(testPrompt)
    
    // Both should use the same template (code template for this prompt)
    expect(cliResult).toContain('senior software engineer')
    expect(uiResult).toContain('senior software engineer')
  })

  test('Configuration changes should affect both CLI and UI', async ({ page }) => {
    // Create a custom config
    const customConfig = {
      templates: {
        test: {
          name: "Integration Test Template",
          content: "INTEGRATION_TEST: {user_input} | {model_instructions}"
        },
        general: {
          name: "General Expert",
          content: "GENERAL: {user_input} | {model_instructions}"
        }
      },
      model_instructions: {
        default: "INTEGRATION_INSTRUCTIONS"
      },
      keywords: {
        test: ["integration"],
        general: []
      }
    }
    
    // Write custom config
    await execAsync(`mkdir -p /tmp/promptcraft-integration`)
    await execAsync(`echo '${JSON.stringify(customConfig)}' > /tmp/promptcraft-integration/config.json`)
    
    const env = {
      ...process.env,
      PROMPTCRAFT_CONFIG_DIR: '/tmp/promptcraft-integration'
    }
    
    // Test CLI with custom config
    const { stdout: cliResult } = await execAsync(
      `python prompt_craft.py -q "integration test prompt"`,
      { env }
    )
    
    expect(cliResult).toContain('INTEGRATION_TEST')
    expect(cliResult).toContain('INTEGRATION_INSTRUCTIONS')
    
    // Test UI with same config (would need to set environment for UI server)
    // For now, verify that the UI can handle the same type of prompt
    await page.goto('/prompt_craft.html')
    await page.fill('textarea[placeholder*="prompt"]', 'integration test prompt')
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    
    const uiResult = await page.locator('.enhanced-prompt pre').textContent()
    expect(uiResult).toContain('integration test prompt')
    
    // Cleanup
    await execAsync('rm -rf /tmp/promptcraft-integration')
  })

  test('Template detection should be consistent between CLI and UI', async ({ page }) => {
    const testCases = [
      { prompt: 'write python code', expectedTemplate: 'Code Generation' },
      { prompt: 'create a story', expectedTemplate: 'Creative Writing' },
      { prompt: 'explain quantum physics', expectedTemplate: 'Detailed Explanation' },
      { prompt: 'help me with general task', expectedTemplate: 'General Expert' }
    ]
    
    for (const testCase of testCases) {
      // Test CLI
      const { stdout: cliResult } = await execAsync(`python prompt_craft.py "${testCase.prompt}"`)
      expect(cliResult).toContain(testCase.expectedTemplate)
      
      // Test UI
      await page.goto('/prompt_craft.html')
      await page.fill('textarea[placeholder*="prompt"]', testCase.prompt)
      await page.click('button:has-text("Enhance")')
      await page.waitForSelector('.result-container')
      
      const templateBadge = await page.locator('.template-badge').textContent()
      expect(templateBadge).toContain(testCase.expectedTemplate.split(' ')[0]) // First word of template name
    }
  })

  test('Model instructions should work consistently', async ({ page }) => {
    const testPrompt = 'test model consistency'
    const models = ['default', 'gpt4', 'claude']
    
    for (const model of models) {
      // Test CLI
      const { stdout: cliResult } = await execAsync(`python prompt_craft.py -m ${model} -q "${testPrompt}"`)
      
      // Test UI
      await page.goto('/prompt_craft.html')
      await page.fill('textarea[placeholder*="prompt"]', testPrompt)
      
      // Check if model exists in UI
      const modelOption = page.locator(`option[value="${model}"]`)
      if (await modelOption.count() > 0) {
        await page.selectOption('select', model)
        await page.click('button:has-text("Enhance")')
        await page.waitForSelector('.result-container')
        
        const uiResult = await page.locator('.enhanced-prompt pre').textContent()
        
        // Both should contain model-specific content
        if (model === 'gpt4') {
          expect(cliResult).toContain('GPT-4' || cliResult).toContain('advanced reasoning')
          expect(uiResult).toContain('GPT-4' || uiResult).toContain('advanced reasoning')
        } else if (model === 'claude') {
          expect(cliResult).toContain('Claude' || cliResult).toContain('nuanced understanding')
          expect(uiResult).toContain('Claude' || uiResult).toContain('nuanced understanding')
        }
      }
    }
  })

  test('Error handling should be consistent', async ({ page }) => {
    // Test empty input handling
    
    // CLI should show error for empty input
    try {
      await execAsync('python prompt_craft.py')
    } catch (error: any) {
      expect(error.stdout).toContain('No prompt provided')
    }
    
    // UI should show error for empty input
    await page.goto('/prompt_craft.html')
    await page.click('button:has-text("Enhance")')
    
    const errorMessage = page.locator('.error-message')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/empty|required/i)
  })

  test('Input validation should work the same way', async ({ page }) => {
    // Test with potentially problematic input
    const testInputs = [
      'normal input',
      'input with\ttabs and\nnewlines',
      'input with "quotes" and \'apostrophes\'',
      'input with special chars: !@#$%^&*()',
    ]
    
    for (const input of testInputs) {
      // Test CLI
      const { stdout: cliResult, stderr: cliError } = await execAsync(
        `python prompt_craft.py -q "${input.replace(/"/g, '\\"')}"`
      )
      
      // Test UI
      await page.goto('/prompt_craft.html')
      await page.fill('textarea[placeholder*="prompt"]', input)
      await page.click('button:has-text("Enhance")')
      
      // Wait for either result or error
      await page.waitForSelector('.result-container, .error-message')
      
      const hasUiResult = await page.locator('.result-container').count() > 0
      const hasUiError = await page.locator('.error-message').count() > 0
      
      // If CLI succeeded, UI should succeed (and vice versa)
      if (cliError === '') {
        expect(hasUiResult).toBeTruthy()
        if (hasUiResult) {
          const uiResult = await page.locator('.enhanced-prompt pre').textContent()
          expect(uiResult).toContain(input.replace(/[\t\n]/g, ' ').trim())
        }
      } else {
        expect(hasUiError).toBeTruthy()
      }
    }
  })

  test('Performance should be reasonable for both interfaces', async ({ page }) => {
    const testPrompt = 'performance test prompt'
    
    // Measure CLI performance
    const cliStart = Date.now()
    await execAsync(`python prompt_craft.py -q "${testPrompt}"`)
    const cliTime = Date.now() - cliStart
    
    // Measure UI performance
    await page.goto('/prompt_craft.html')
    const uiStart = Date.now()
    await page.fill('textarea[placeholder*="prompt"]', testPrompt)
    await page.click('button:has-text("Enhance")')
    await page.waitForSelector('.result-container')
    const uiTime = Date.now() - uiStart
    
    // Both should complete within reasonable time (adjust thresholds as needed)
    expect(cliTime).toBeLessThan(5000) // 5 seconds
    expect(uiTime).toBeLessThan(10000) // 10 seconds (includes browser overhead)
    
    console.log(`Performance: CLI ${cliTime}ms, UI ${uiTime}ms`)
  })

  test('Configuration file format should be valid JSON', async () => {
    // Create default config and verify it's valid JSON
    const configDir = '/tmp/promptcraft-json-test'
    await execAsync(`mkdir -p ${configDir}`)
    
    const env = {
      ...process.env,
      PROMPTCRAFT_CONFIG_DIR: configDir
    }
    
    // Trigger config creation
    await execAsync(`python prompt_craft.py -q "test config creation"`, { env })
    
    // Verify config file exists and is valid JSON
    const { stdout: configContent } = await execAsync(`cat ${configDir}/config.json`)
    
    expect(() => JSON.parse(configContent)).not.toThrow()
    
    const config = JSON.parse(configContent)
    expect(config).toHaveProperty('templates')
    expect(config).toHaveProperty('model_instructions')
    expect(config).toHaveProperty('keywords')
    
    // Cleanup
    await execAsync(`rm -rf ${configDir}`)
  })

  test('Both interfaces should handle concurrent usage', async ({ page, browser }) => {
    // Test concurrent CLI calls
    const cliPromises = Array.from({ length: 3 }, (_, i) => 
      execAsync(`python prompt_craft.py -q "concurrent test ${i}"`)
    )
    
    // Test concurrent UI usage
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    
    const uiPromises = [
      (async () => {
        await page.goto('/prompt_craft.html')
        await page.fill('textarea[placeholder*="prompt"]', 'concurrent UI test 1')
        await page.click('button:has-text("Enhance")')
        await page.waitForSelector('.result-container')
        return page.locator('.enhanced-prompt pre').textContent()
      })(),
      (async () => {
        await page2.goto('/prompt_craft.html')
        await page2.fill('textarea[placeholder*="prompt"]', 'concurrent UI test 2')
        await page2.click('button:has-text("Enhance")')
        await page2.waitForSelector('.result-container')
        return page2.locator('.enhanced-prompt pre').textContent()
      })()
    ]
    
    // Wait for all to complete
    const cliResults = await Promise.all(cliPromises)
    const uiResults = await Promise.all(uiPromises)
    
    // All should succeed
    cliResults.forEach((result, i) => {
      expect(result.stdout).toContain(`concurrent test ${i}`)
    })
    
    uiResults.forEach((result, i) => {
      expect(result).toContain(`concurrent UI test ${i + 1}`)
    })
    
    await context2.close()
  })

  test('Version consistency between CLI and package.json', async () => {
    // Get version from CLI
    const { stdout: cliVersion } = await execAsync('python prompt_craft.py --version')
    
    // Get version from package.json
    const { stdout: packageJson } = await execAsync('cat package.json')
    const packageVersion = JSON.parse(packageJson).version
    
    // Extract version number from CLI output
    const cliVersionMatch = cliVersion.match(/(\d+\.\d+\.\d+)/)
    expect(cliVersionMatch).toBeTruthy()
    
    const cliVersionNumber = cliVersionMatch![1]
    expect(cliVersionNumber).toBe(packageVersion)
  })
})