// PromptCraft Library Entry Point
export { default as PromptCraftUI } from './PromptCraftUI'
export type { 
  PromptCraftConfig,
  Template,
  ModelInstructions,
  EnhancementResult,
  PromptCraftUIProps 
} from './types'

// Re-export utility functions for advanced usage
export { 
  enhancePrompt,
  detectTemplate,
  validateInput,
  createDefaultConfig 
} from './utils'