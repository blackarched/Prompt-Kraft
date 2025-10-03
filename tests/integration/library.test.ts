import {
  enhancePrompt,
  detectTemplate,
  createDefaultConfig,
  validateInput
} from '../../src/utils'
import type { PromptCraftConfig } from '../../src/types'

describe('Library Integration Tests', () => {
  let config: PromptCraftConfig

  beforeEach(() => {
    config = createDefaultConfig()
  })

  describe('End-to-end prompt enhancement workflow', () => {
    it('should complete full enhancement workflow for code prompt', () => {
      const userInput = 'write a python function to calculate fibonacci numbers'
      
      // Step 1: Validate input
      const validatedInput = validateInput(userInput)
      expect(validatedInput).toBe(userInput)
      
      // Step 2: Detect template
      const templateKey = detectTemplate(validatedInput, config.keywords)
      expect(templateKey).toBe('code')
      
      // Step 3: Enhance prompt
      const result = enhancePrompt(config, validatedInput, { model: 'gpt4' })
      
      expect(result.enhanced_prompt).toContain(userInput)
      expect(result.enhanced_prompt).toContain('senior software engineer')
      expect(result.enhanced_prompt).toContain('GPT-4')
      expect(result.template_name).toBe('Code Generation 💻')
      expect(result.template_key).toBe('code')
      expect(result.model).toBe('gpt4')
    })

    it('should complete full enhancement workflow for creative prompt', () => {
      const userInput = 'write a short story about a magical forest'
      
      const validatedInput = validateInput(userInput)
      const templateKey = detectTemplate(validatedInput, config.keywords)
      const result = enhancePrompt(config, validatedInput, { model: 'claude' })
      
      expect(templateKey).toBe('creative')
      expect(result.enhanced_prompt).toContain(userInput)
      expect(result.enhanced_prompt).toContain('creative writer')
      expect(result.enhanced_prompt).toContain('Claude')
      expect(result.template_name).toBe('Creative Writing ✍️')
    })

    it('should complete full enhancement workflow for explanation prompt', () => {
      const userInput = 'explain how neural networks work'
      
      const validatedInput = validateInput(userInput)
      const templateKey = detectTemplate(validatedInput, config.keywords)
      const result = enhancePrompt(config, validatedInput, { model: 'gemini' })
      
      expect(templateKey).toBe('explain')
      expect(result.enhanced_prompt).toContain(userInput)
      expect(result.enhanced_prompt).toContain('master educator')
      expect(result.enhanced_prompt).toContain('Gemini')
      expect(result.template_name).toBe('Detailed Explanation 🎓')
    })
  })

  describe('Template detection accuracy', () => {
    const testCases = [
      // Code-related prompts
      { input: 'create a javascript function', expected: 'code' },
      { input: 'write python script for data analysis', expected: 'code' },
      { input: 'build an algorithm to sort arrays', expected: 'code' },
      { input: 'debug this SQL query', expected: 'code' },
      
      // Creative writing prompts
      { input: 'compose a poem about love', expected: 'creative' },
      { input: 'write an email to my boss', expected: 'creative' },
      { input: 'create a narrative about adventure', expected: 'creative' },
      
      // Explanation prompts
      { input: 'explain quantum computing', expected: 'explain' },
      { input: 'what is machine learning', expected: 'explain' },
      { input: 'how does photosynthesis work', expected: 'explain' },
      { input: 'describe the water cycle', expected: 'explain' },
      
      // General prompts (fallback)
      { input: 'help me plan my vacation', expected: 'general' },
      { input: 'random unrelated text', expected: 'general' }
    ]

    testCases.forEach(({ input, expected }) => {
      it(`should detect "${expected}" template for: "${input}"`, () => {
        const detected = detectTemplate(input, config.keywords)
        expect(detected).toBe(expected)
      })
    })
  })

  describe('Model instruction integration', () => {
    it('should apply correct model instructions for each model', () => {
      const testPrompt = 'test prompt for model instructions'
      
      const models = ['default', 'gpt4', 'claude', 'gemini']
      
      models.forEach(model => {
        const result = enhancePrompt(config, testPrompt, { model })
        
        expect(result.enhanced_prompt).toContain(testPrompt)
        expect(result.model).toBe(model)
        
        switch (model) {
          case 'gpt4':
            expect(result.enhanced_prompt).toContain('GPT-4')
            expect(result.enhanced_prompt).toContain('advanced reasoning')
            break
          case 'claude':
            expect(result.enhanced_prompt).toContain('Claude')
            expect(result.enhanced_prompt).toContain('nuanced understanding')
            break
          case 'gemini':
            expect(result.enhanced_prompt).toContain('Gemini')
            expect(result.enhanced_prompt).toContain('multimodal')
            break
          case 'default':
            expect(result.enhanced_prompt).toContain('markdown')
            break
        }
      })
    })
  })

  describe('Configuration validation and consistency', () => {
    it('should have consistent template and keyword mappings', () => {
      const templateKeys = Object.keys(config.templates)
      const keywordKeys = Object.keys(config.keywords)
      
      // All templates (except general) should have corresponding keywords
      templateKeys.forEach(templateKey => {
        if (templateKey !== 'general') {
          expect(keywordKeys).toContain(templateKey)
          expect(Array.isArray(config.keywords[templateKey])).toBe(true)
          expect(config.keywords[templateKey].length).toBeGreaterThan(0)
        }
      })
    })

    it('should have all required placeholders in templates', () => {
      Object.entries(config.templates).forEach(([key, template]) => {
        expect(template.content).toContain('{user_input}')
        expect(template.content).toContain('{model_instructions}')
        expect(template.name).toBeTruthy()
        expect(template.content.length).toBeGreaterThan(50) // Reasonable minimum length
      })
    })

    it('should have model instructions for all supported models', () => {
      const requiredModels = ['default', 'gpt4', 'claude', 'gemini']
      
      requiredModels.forEach(model => {
        expect(config.model_instructions).toHaveProperty(model)
        expect(config.model_instructions[model]).toBeTruthy()
        expect(config.model_instructions[model].length).toBeGreaterThan(10)
      })
    })
  })

  describe('Input validation edge cases', () => {
    it('should handle various input formats correctly', () => {
      const testInputs = [
        'Simple prompt',
        'Prompt with\nmultiple\nlines',
        'Prompt with "quotes" and \'apostrophes\'',
        'Prompt with special chars: !@#$%^&*()',
        '   Prompt with extra whitespace   ',
        'Very long prompt that exceeds normal length but should still be processed correctly. '.repeat(10)
      ]
      
      testInputs.forEach(input => {
        const validated = validateInput(input)
        expect(validated).toBeTruthy()
        expect(validated.trim()).toBe(validated) // Should be trimmed
        
        const result = enhancePrompt(config, validated)
        expect(result.enhanced_prompt).toContain(validated)
      })
    })

    it('should handle unicode and international characters', () => {
      const unicodeInputs = [
        'Créer une fonction en français',
        'Создать функцию на русском',
        '日本語でプログラムを書く',
        'Escribir código en español',
        'Test with émojis 🚀🎯💻'
      ]
      
      unicodeInputs.forEach(input => {
        const validated = validateInput(input)
        const result = enhancePrompt(config, validated)
        expect(result.enhanced_prompt).toContain(validated)
      })
    })
  })

  describe('Performance and scalability', () => {
    it('should process multiple prompts efficiently', () => {
      const prompts = Array.from({ length: 100 }, (_, i) => `Test prompt number ${i}`)
      
      const startTime = Date.now()
      
      const results = prompts.map(prompt => enhancePrompt(config, prompt))
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // Should process 100 prompts in reasonable time (adjust threshold as needed)
      expect(totalTime).toBeLessThan(1000) // 1 second
      
      // All results should be valid
      results.forEach((result, i) => {
        expect(result.enhanced_prompt).toContain(prompts[i])
        expect(result.template_name).toBeTruthy()
        expect(result.template_key).toBeTruthy()
      })
    })

    it('should handle concurrent processing', async () => {
      const prompts = Array.from({ length: 20 }, (_, i) => `Concurrent test ${i}`)
      
      const promises = prompts.map(async (prompt) => {
        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
        return enhancePrompt(config, prompt)
      })
      
      const results = await Promise.all(promises)
      
      results.forEach((result, i) => {
        expect(result.enhanced_prompt).toContain(prompts[i])
      })
    })
  })

  describe('Error recovery and robustness', () => {
    it('should handle malformed configuration gracefully', () => {
      const malformedConfig = {
        ...config,
        templates: {
          broken: {
            name: '',
            content: 'Missing placeholders'
          }
        }
      }
      
      // Should still work with other valid templates
      const result = enhancePrompt(malformedConfig, 'test prompt', { templateKey: 'general' })
      expect(result.enhanced_prompt).toContain('test prompt')
    })

    it('should fallback gracefully when template detection fails', () => {
      const configWithNoKeywords = {
        ...config,
        keywords: {}
      }
      
      const result = enhancePrompt(configWithNoKeywords, 'any prompt')
      expect(result.template_key).toBe('general')
      expect(result.enhanced_prompt).toContain('any prompt')
    })

    it('should handle missing model instructions', () => {
      const configWithLimitedModels = {
        ...config,
        model_instructions: {
          default: 'Only default available'
        }
      }
      
      const result = enhancePrompt(configWithLimitedModels, 'test', { model: 'nonexistent' })
      expect(result.enhanced_prompt).toContain('Only default available')
    })
  })

  describe('Consistency across multiple runs', () => {
    it('should produce consistent results for identical inputs', () => {
      const testPrompt = 'consistent test prompt'
      
      const results = Array.from({ length: 10 }, () => 
        enhancePrompt(config, testPrompt, { model: 'gpt4' })
      )
      
      // All results should be identical
      const firstResult = results[0]
      results.forEach(result => {
        expect(result.enhanced_prompt).toBe(firstResult.enhanced_prompt)
        expect(result.template_name).toBe(firstResult.template_name)
        expect(result.template_key).toBe(firstResult.template_key)
        expect(result.model).toBe(firstResult.model)
      })
    })
  })
})