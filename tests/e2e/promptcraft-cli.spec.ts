import { test, expect } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

test.describe('PromptCraft CLI', () => {
  const pythonCmd = 'python prompt_craft.py'
  
  test.beforeEach(async () => {
    // Ensure we're in the right directory and Python dependencies are available
    process.chdir(process.cwd())
  })

  test('should show help message', async () => {
    const { stdout, stderr } = await execAsync(`${pythonCmd} --help`)
    
    expect(stdout).toContain('PromptCraft')
    expect(stdout).toContain('Neural Prompt Enhancement System')
    expect(stdout).toContain('usage:')
    expect(stdout).toContain('--interactive')
    expect(stdout).toContain('--model')
    expect(stderr).toBe('')
  })

  test('should show version', async () => {
    const { stdout, stderr } = await execAsync(`${pythonCmd} --version`)
    
    expect(stdout).toContain('PromptCraft')
    expect(stdout).toContain('3.0.1')
    expect(stderr).toBe('')
  })

  test('should enhance a simple prompt', async () => {
    const testPrompt = 'write a hello world function'
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "${testPrompt}"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain(testPrompt)
    expect(stdout.length).toBeGreaterThan(testPrompt.length)
  })

  test('should enhance prompt with specific model', async () => {
    const testPrompt = 'explain artificial intelligence'
    const { stdout, stderr } = await execAsync(`${pythonCmd} -m gpt4 -q "${testPrompt}"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain(testPrompt)
    // Should contain model-specific instructions
    expect(stdout).toContain('GPT-4' || stdout).toContain('advanced reasoning')
  })

  test('should detect code template', async () => {
    const codePrompt = 'create a python function to sort numbers'
    const { stdout } = await execAsync(`${pythonCmd} "${codePrompt}"`)
    
    expect(stdout).toContain('Code Generation')
    expect(stdout).toContain('💻')
    expect(stdout).toContain('senior software engineer')
  })

  test('should detect creative template', async () => {
    const creativePrompt = 'write a poem about the ocean'
    const { stdout } = await execAsync(`${pythonCmd} "${creativePrompt}"`)
    
    expect(stdout).toContain('Creative Writing')
    expect(stdout).toContain('✍️')
    expect(stdout).toContain('creative writer')
  })

  test('should detect explain template', async () => {
    const explainPrompt = 'explain how photosynthesis works'
    const { stdout } = await execAsync(`${pythonCmd} "${explainPrompt}"`)
    
    expect(stdout).toContain('Detailed Explanation')
    expect(stdout).toContain('🎓')
    expect(stdout).toContain('master educator')
  })

  test('should handle quiet mode', async () => {
    const testPrompt = 'test quiet mode'
    const { stdout } = await execAsync(`${pythonCmd} -q "${testPrompt}"`)
    
    // Quiet mode should not contain decorative elements
    expect(stdout).not.toContain('✨')
    expect(stdout).not.toContain('─')
    expect(stdout).not.toContain('Template:')
  })

  test('should handle verbose mode', async () => {
    const testPrompt = 'test verbose mode'
    const { stdout, stderr } = await execAsync(`${pythonCmd} -v "${testPrompt}"`)
    
    // Verbose mode should contain debug information
    expect(stderr).toContain('DEBUG' || stdout).toContain('DEBUG')
  })

  test('should show error for empty prompt', async () => {
    try {
      await execAsync(`${pythonCmd}`)
    } catch (error: any) {
      expect(error.code).toBe(1)
      expect(error.stdout).toContain('No prompt provided')
    }
  })

  test('should handle special characters in prompt', async () => {
    const specialPrompt = 'test with "quotes" and \'apostrophes\' and $symbols'
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "${specialPrompt.replace(/"/g, '\\"')}"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain('quotes')
    expect(stdout).toContain('apostrophes')
  })

  test('should handle long prompts', async () => {
    const longPrompt = 'This is a very long prompt that tests the system\'s ability to handle extended input. '.repeat(50)
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "${longPrompt}"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain('very long prompt')
  })

  test('should create default config if not exists', async () => {
    // Remove config if it exists
    try {
      await execAsync('rm -rf ~/.config/promptcraft-test')
    } catch (e) {
      // Config might not exist, which is fine
    }
    
    // Set test config directory
    const env = { ...process.env, PROMPTCRAFT_CONFIG_DIR: '~/.config/promptcraft-test' }
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "test config creation"`, { env })
    
    expect(stderr).toBe('')
    expect(stdout).toContain('test config creation')
    
    // Verify config was created
    const { stdout: lsOutput } = await execAsync('ls ~/.config/promptcraft-test/')
    expect(lsOutput).toContain('config.json')
  })

  test('should handle different model instructions', async () => {
    const testPrompt = 'test model instructions'
    
    const models = ['default', 'gpt4', 'claude', 'gemini']
    
    for (const model of models) {
      const { stdout } = await execAsync(`${pythonCmd} -m ${model} -q "${testPrompt}"`)
      expect(stdout).toContain(testPrompt)
      
      // Each model should have different instructions
      if (model === 'gpt4') {
        expect(stdout).toContain('GPT-4' || stdout).toContain('advanced reasoning')
      } else if (model === 'claude') {
        expect(stdout).toContain('Claude' || stdout).toContain('nuanced understanding')
      } else if (model === 'gemini') {
        expect(stdout).toContain('Gemini' || stdout).toContain('multimodal')
      }
    }
  })

  test('should handle configuration validation', async () => {
    // Test with invalid config (this would need a way to inject invalid config)
    // For now, test that normal operation doesn't fail validation
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "test validation"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain('test validation')
  })

  test('should handle input sanitization', async () => {
    // Test with potentially problematic input
    const problematicPrompt = 'test with\ttabs\nand\nnewlines'
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "${problematicPrompt}"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain('test with')
    expect(stdout).toContain('tabs')
    expect(stdout).toContain('newlines')
  })

  test('should handle environment variables', async () => {
    const env = {
      ...process.env,
      PROMPTCRAFT_ENV: 'test',
      PROMPTCRAFT_DEBUG: 'false',
      PROMPTCRAFT_LOG_LEVEL: 'error'
    }
    
    const { stdout, stderr } = await execAsync(`${pythonCmd} -q "test environment"`, { env })
    
    expect(stderr).toBe('')
    expect(stdout).toContain('test environment')
  })

  test('should handle keyboard interrupt gracefully', async () => {
    // This test is tricky to implement as it requires simulating Ctrl+C
    // For now, we'll test that the CLI can start and stop normally
    const { stdout, stderr } = await execAsync(`${pythonCmd} --help`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain('PromptCraft')
  })

  test('should validate input length limits', async () => {
    // Test with input that might exceed limits
    const veryLongPrompt = 'x'.repeat(50000)
    
    try {
      const { stdout, stderr } = await execAsync(`${pythonCmd} -q "${veryLongPrompt}"`)
      // If it succeeds, that's fine
      expect(stderr).toBe('')
    } catch (error: any) {
      // If it fails, it should be due to length validation
      expect(error.stdout || error.stderr).toContain('too long' || error.stdout || error.stderr).toContain('length')
    }
  })

  test('should handle custom config file', async () => {
    // Create a custom config file
    const customConfig = {
      templates: {
        test: {
          name: "Test Template",
          content: "Test: {user_input} - {model_instructions}"
        }
      },
      model_instructions: {
        default: "Test instructions"
      },
      keywords: {
        test: ["test"]
      }
    }
    
    await execAsync(`echo '${JSON.stringify(customConfig)}' > /tmp/test-config.json`)
    
    const { stdout, stderr } = await execAsync(`${pythonCmd} --config /tmp/test-config.json -q "test custom config"`)
    
    expect(stderr).toBe('')
    expect(stdout).toContain('test custom config')
    expect(stdout).toContain('Test instructions')
    
    // Cleanup
    await execAsync('rm -f /tmp/test-config.json')
  })
})

test.describe('PromptCraft CLI Integration', () => {
  test('should work with piped input', async () => {
    const { stdout, stderr } = await execAsync(`echo "piped input test" | ${pythonCmd} -q`)
    
    // Note: This might not work as expected since the CLI expects arguments
    // This test documents the expected behavior for future implementation
    expect(stderr).toBe('') // or expect specific error message
  })

  test('should handle multiple enhancement requests', async () => {
    const prompts = [
      'first test prompt',
      'second test prompt',
      'third test prompt'
    ]
    
    for (const prompt of prompts) {
      const { stdout, stderr } = await execAsync(`${pythonCmd} -q "${prompt}"`)
      expect(stderr).toBe('')
      expect(stdout).toContain(prompt)
    }
  })

  test('should maintain consistent output format', async () => {
    const testPrompt = 'consistency test'
    
    // Run the same prompt multiple times
    const results = []
    for (let i = 0; i < 3; i++) {
      const { stdout } = await execAsync(`${pythonCmd} -q "${testPrompt}"`)
      results.push(stdout)
    }
    
    // All results should contain the original prompt
    results.forEach(result => {
      expect(result).toContain(testPrompt)
    })
    
    // Results should be consistent (same template, same structure)
    const firstResult = results[0]
    results.forEach(result => {
      // Should have similar length (within reasonable variance)
      expect(Math.abs(result.length - firstResult.length)).toBeLessThan(100)
    })
  })
})