// Type definitions for PromptCraft library

export interface Template {
  name: string
  content: string
}

export interface ModelInstructions {
  [model: string]: string
}

export interface Keywords {
  [template: string]: string[]
}

export interface PromptCraftConfig {
  templates: { [key: string]: Template }
  model_instructions: ModelInstructions
  keywords: Keywords
}

export interface EnhancementResult {
  enhanced_prompt: string
  template_name: string
  template_key: string
  model: string
}

export interface PromptCraftUIProps {
  config?: Partial<PromptCraftConfig>
  defaultModel?: string
  onEnhance?: (result: EnhancementResult) => void
  onError?: (error: Error) => void
  className?: string
  theme?: 'light' | 'dark' | 'auto'
}

export interface ValidationOptions {
  maxLength?: number
  allowEmpty?: boolean
  sanitize?: boolean
}

export interface EnhancementOptions {
  model?: string
  templateKey?: string
  validation?: ValidationOptions
}