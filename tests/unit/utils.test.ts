import {
  validateInput,
  detectTemplate,
  enhancePrompt,
  createDefaultConfig,
  ValidationError,
  ConfigurationError
} from '../../src/utils'
import type { PromptCraftConfig } from '../../src/types'

describe('Utils', () => {
  describe('validateInput', () => {
    it('should validate normal input', () => {
      const input = 'This is a normal prompt'
      const result = validateInput(input)
      expect(result).toBe(input)
    })

    it('should trim whitespace', () => {
      const input = '  whitespace prompt  '
      const result = validateInput(input)
      expect(result).toBe('whitespace prompt')
    })

    it('should throw ValidationError for empty input', () => {
      expect(() => validateInput('')).toThrow(ValidationError)
      expect(() => validateInput('   ')).toThrow(ValidationError)
    })

    it('should allow empty input when allowEmpty is true', () => {
      const result = validateInput('', { allowEmpty: true })
      expect(result).toBe('')
    })

    it('should throw ValidationError for input exceeding maxLength', () => {
      const longInput = 'a'.repeat(101)
      expect(() => validateInput(longInput, { maxLength: 100 })).toThrow(ValidationError)
    })

    it('should sanitize control characters when sanitize is true', () => {
      const inputWithControls = 'test\x00\x01prompt'
      const result = validateInput(inputWithControls, { sanitize: true })
      expect(result).toBe('testprompt')
    })

    it('should not sanitize when sanitize is false', () => {
      const inputWithControls = 'test\x00\x01prompt'
      const result = validateInput(inputWithControls, { sanitize: false })
      expect(result).toBe(inputWithControls.trim())
    })
  })

  describe('detectTemplate', () => {
    const keywords = {
      code: ['code', 'function', 'python', 'javascript'],
      creative: ['write', 'story', 'poem', 'create'],
      explain: ['explain', 'what is', 'how does', 'describe'],
      general: []
    }

    it('should detect code template', () => {
      const result = detectTemplate('write a python function', keywords)
      expect(result).toBe('code')
    })

    it('should detect creative template', () => {
      const result = detectTemplate('write a story about adventure', keywords)
      expect(result).toBe('creative')
    })

    it('should detect explain template', () => {
      const result = detectTemplate('explain how this works', keywords)
      expect(result).toBe('explain')
    })

    it('should default to general template', () => {
      const result = detectTemplate('random unmatched text', keywords)
      expect(result).toBe('general')
    })

    it('should be case insensitive', () => {
      const result = detectTemplate('Write a PYTHON Function', keywords)
      expect(result).toBe('code')
    })

    it('should select template with most matches', () => {
      const result = detectTemplate('write python code function', keywords)
      expect(result).toBe('code') // 'code' has more matches than 'creative'
    })

    it('should handle multiple keyword matches', () => {
      const result = detectTemplate('explain how to write code', keywords)
      // Should pick the template with more matches
      expect(['code', 'explain']).toContain(result)
    })
  })

  describe('enhancePrompt', () => {
    let config: PromptCraftConfig

    beforeEach(() => {
      config = {
        templates: {
          general: {
            name: 'General Expert',
            content: 'Task: {user_input}\nInstructions: {model_instructions}'
          },
          code: {
            name: 'Code Generator',
            content: 'Code task: {user_input}\nCode instructions: {model_instructions}'
          }
        },
        model_instructions: {
          default: 'Be helpful and clear',
          gpt4: 'Use advanced reasoning'
        },
        keywords: {
          code: ['code', 'function'],
          general: []
        }
      }
    })

    it('should enhance prompt with default template and model', () => {
      const result = enhancePrompt(config, 'help me with something')
      
      expect(result.enhanced_prompt).toContain('help me with something')
      expect(result.enhanced_prompt).toContain('Be helpful and clear')
      expect(result.template_name).toBe('General Expert')
      expect(result.template_key).toBe('general')
      expect(result.model).toBe('default')
    })

    it('should use specific model instructions', () => {
      const result = enhancePrompt(config, 'help me', { model: 'gpt4' })
      
      expect(result.enhanced_prompt).toContain('Use advanced reasoning')
      expect(result.model).toBe('gpt4')
    })

    it('should detect and use appropriate template', () => {
      const result = enhancePrompt(config, 'write a function')
      
      expect(result.template_name).toBe('Code Generator')
      expect(result.template_key).toBe('code')
      expect(result.enhanced_prompt).toContain('Code task: write a function')
    })

    it('should use specified template key', () => {
      const result = enhancePrompt(config, 'general task', { templateKey: 'code' })
      
      expect(result.template_key).toBe('code')
      expect(result.enhanced_prompt).toContain('Code task: general task')
    })

    it('should fall back to default model instructions', () => {
      const result = enhancePrompt(config, 'test', { model: 'unknown' })
      
      expect(result.enhanced_prompt).toContain('Be helpful and clear')
      expect(result.model).toBe('unknown')
    })

    it('should throw ConfigurationError for missing template', () => {
      expect(() => {
        enhancePrompt(config, 'test', { templateKey: 'nonexistent' })
      }).toThrow(ConfigurationError)
    })

    it('should validate input when validation options provided', () => {
      expect(() => {
        enhancePrompt(config, '', { validation: { allowEmpty: false } })
      }).toThrow(ValidationError)
    })

    it('should handle empty model instructions gracefully', () => {
      const configWithoutInstructions = {
        ...config,
        model_instructions: {}
      }
      
      const result = enhancePrompt(configWithoutInstructions, 'test')
      expect(result.enhanced_prompt).toContain('test')
      expect(result.enhanced_prompt).toContain('Instructions: ')
    })
  })

  describe('createDefaultConfig', () => {
    it('should create valid default configuration', () => {
      const config = createDefaultConfig()
      
      expect(config).toHaveProperty('templates')
      expect(config).toHaveProperty('model_instructions')
      expect(config).toHaveProperty('keywords')
      
      expect(Object.keys(config.templates).length).toBeGreaterThan(0)
      expect(Object.keys(config.model_instructions).length).toBeGreaterThan(0)
      expect(Object.keys(config.keywords).length).toBeGreaterThan(0)
    })

    it('should have required templates', () => {
      const config = createDefaultConfig()
      
      expect(config.templates).toHaveProperty('code')
      expect(config.templates).toHaveProperty('creative')
      expect(config.templates).toHaveProperty('explain')
      expect(config.templates).toHaveProperty('general')
    })

    it('should have default model instructions', () => {
      const config = createDefaultConfig()
      
      expect(config.model_instructions).toHaveProperty('default')
      expect(config.model_instructions).toHaveProperty('gpt4')
      expect(config.model_instructions).toHaveProperty('claude')
      expect(config.model_instructions).toHaveProperty('gemini')
    })

    it('should have keyword mappings for each template', () => {
      const config = createDefaultConfig()
      
      const templateKeys = Object.keys(config.templates)
      templateKeys.forEach(key => {
        if (key !== 'general') { // general template might not have keywords
          expect(config.keywords).toHaveProperty(key)
          expect(Array.isArray(config.keywords[key])).toBe(true)
        }
      })
    })

    it('should have valid template structure', () => {
      const config = createDefaultConfig()
      
      Object.entries(config.templates).forEach(([key, template]) => {
        expect(template).toHaveProperty('name')
        expect(template).toHaveProperty('content')
        expect(typeof template.name).toBe('string')
        expect(typeof template.content).toBe('string')
        expect(template.name.length).toBeGreaterThan(0)
        expect(template.content.length).toBeGreaterThan(0)
        expect(template.content).toContain('{user_input}')
        expect(template.content).toContain('{model_instructions}')
      })
    })
  })

  describe('Error Classes', () => {
    it('should create ValidationError correctly', () => {
      const error = new ValidationError('Test validation error')
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Test validation error')
    })

    it('should create ConfigurationError correctly', () => {
      const error = new ConfigurationError('Test configuration error')
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ConfigurationError)
      expect(error.name).toBe('ConfigurationError')
      expect(error.message).toBe('Test configuration error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      const unicodeInput = 'Test with émojis 🚀 and ünïcödé'
      const result = validateInput(unicodeInput)
      expect(result).toBe(unicodeInput)
    })

    it('should handle very long valid input', () => {
      const longInput = 'a'.repeat(5000)
      const result = validateInput(longInput, { maxLength: 10000 })
      expect(result).toBe(longInput)
    })

    it('should handle input with only newlines and tabs', () => {
      const whitespaceInput = '\n\t\n\t'
      expect(() => validateInput(whitespaceInput)).toThrow(ValidationError)
    })

    it('should handle template detection with no keywords', () => {
      const emptyKeywords = {}
      const result = detectTemplate('any input', emptyKeywords)
      expect(result).toBe('general')
    })

    it('should handle config with missing model instructions', () => {
      const config: PromptCraftConfig = {
        templates: {
          general: {
            name: 'General',
            content: '{user_input} {model_instructions}'
          }
        },
        model_instructions: {},
        keywords: { general: [] }
      }
      
      const result = enhancePrompt(config, 'test')
      expect(result.enhanced_prompt).toContain('test')
    })
  })
})