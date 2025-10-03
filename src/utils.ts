// Utility functions for PromptCraft library
import type { PromptCraftConfig, EnhancementResult, ValidationOptions, EnhancementOptions } from './types'

export class PromptCraftError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PromptCraftError'
  }
}

export class ValidationError extends PromptCraftError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConfigurationError extends PromptCraftError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export function validateInput(
  input: string, 
  options: ValidationOptions = {}
): string {
  const { maxLength = 10000, allowEmpty = false, sanitize = true } = options

  if (!allowEmpty && (!input || !input.trim())) {
    throw new ValidationError('Input cannot be empty')
  }

  if (input.length > maxLength) {
    throw new ValidationError(`Input too long. Maximum ${maxLength} characters allowed`)
  }

  if (sanitize) {
    // Remove control characters but keep newlines, tabs, and carriage returns
    const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    return sanitized.trim()
  }

  return input.trim()
}

export function detectTemplate(input: string, keywords: { [key: string]: string[] }): string {
  const lowerInput = input.toLowerCase()
  let bestTemplate = 'general'
  let maxMatches = 0

  for (const [templateKey, templateKeywords] of Object.entries(keywords)) {
    const matches = templateKeywords.filter(keyword => 
      lowerInput.includes(keyword.toLowerCase())
    ).length

    if (matches > maxMatches) {
      maxMatches = matches
      bestTemplate = templateKey
    }
  }

  return bestTemplate
}

export function enhancePrompt(
  config: PromptCraftConfig,
  userInput: string,
  options: EnhancementOptions = {}
): EnhancementResult {
  const { model = 'default', templateKey, validation } = options

  // Validate input
  const validatedInput = validateInput(userInput, validation)

  // Determine template
  const selectedTemplate = templateKey || detectTemplate(validatedInput, config.keywords)

  // Validate template exists
  if (!config.templates[selectedTemplate]) {
    throw new ConfigurationError(`Template '${selectedTemplate}' not found`)
  }

  const template = config.templates[selectedTemplate]
  
  // Get model instructions
  const modelInstructions = config.model_instructions[model] || 
                           config.model_instructions.default || 
                           ''

  // Replace placeholders
  const enhancedPrompt = template.content
    .replace('{user_input}', validatedInput)
    .replace('{model_instructions}', modelInstructions)

  return {
    enhanced_prompt: enhancedPrompt,
    template_name: template.name,
    template_key: selectedTemplate,
    model
  }
}

export function createDefaultConfig(): PromptCraftConfig {
  return {
    templates: {
      code: {
        name: "Code Generation 💻",
        content: "**Role:** You are a senior software engineer with expertise in multiple programming paradigms and languages.\n**Task:** Write code for: \"{user_input}\"\n\n**Requirements:**\n1. Robust, efficient, and best-practice code.\n2. Clear comments for complex logic.\n3. Comprehensive error handling.\n4. Consideration of edge cases.\n{model_instructions}"
      },
      creative: {
        name: "Creative Writing ✍️",
        content: "**Role:** You are a skilled creative writer with mastery over narrative techniques and stylistic flourishes.\n**Task:** Write for the prompt: \"{user_input}\"\n\n**Tone and Style:** Engaging and immersive\n**Audience:** Discerning readers who appreciate nuanced prose\n{model_instructions}"
      },
      explain: {
        name: "Detailed Explanation 🎓",
        content: "**Role:** You are a master educator capable of distilling complex concepts into comprehensible explanations.\n**Task:** Explain the topic: \"{user_input}\"\n\n**Target Audience:** Intelligent learners seeking depth\n**Instructions:**\n- Use clear analogies where appropriate.\n- Build understanding progressively.\n- Avoid unnecessary jargon.\n{model_instructions}"
      },
      general: {
        name: "General Expert 🧠",
        content: "**Role:** You are a world-class expert with comprehensive knowledge across domains.\n**Task:** Fulfill the request: \"{user_input}\"\n\n**Constraints:**\n- Provide a well-structured response.\n- Verify facts and maintain accuracy.\n- Consider multiple perspectives.\n{model_instructions}"
      }
    },
    model_instructions: {
      default: "**Output Format:** Provide a clear, well-formatted response using markdown where appropriate.",
      gpt4: "**For GPT-4:** Leverage your advanced reasoning capabilities and multi-step analytical processes.",
      claude: "**For Claude:** Utilize your nuanced understanding and contextual awareness to provide helpful, precise responses.",
      gemini: "**For Gemini:** Apply your multimodal reasoning and comprehensive analytical capabilities."
    },
    keywords: {
      code: ["code", "python", "javascript", "function", "script", "sql", "program", "algorithm"],
      creative: ["write", "create", "poem", "story", "email", "narrative", "compose"],
      explain: ["explain", "what is", "how does", "summarize", "describe", "clarify"]
    }
  }
}