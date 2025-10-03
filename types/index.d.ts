// TypeScript definitions for PromptCraft
// Version: 3.0.1

declare module 'promptcraft' {
  // Core interfaces
  export interface Template {
    name: string;
    content: string;
  }

  export interface ModelInstructions {
    [key: string]: string;
  }

  export interface Keywords {
    [templateId: string]: string[];
  }

  export interface PromptConfig {
    templates: Record<string, Template>;
    model_instructions: ModelInstructions;
    keywords: Keywords;
  }

  export interface Model {
    id: string;
    name: string;
    color: string;
  }

  // Component props
  export interface PromptCraftUIProps {
    /** Callback fired when a prompt is enhanced */
    onPromptEnhanced?: (enhancedPrompt: string, templateName: string) => void;
    
    /** Callback fired when template selection changes */
    onTemplateChanged?: (templateId: string, templateName: string) => void;
    
    /** Callback fired when model selection changes */
    onModelChanged?: (modelId: string, modelName: string) => void;
    
    /** Default model to select */
    defaultModel?: string;
    
    /** Default template to select */
    defaultTemplate?: string;
    
    /** UI theme */
    theme?: 'cyberpunk' | 'minimal' | 'dark';
    
    /** Whether to show the settings panel */
    showSettings?: boolean;
    
    /** Enable auto-enhancement on input */
    autoEnhance?: boolean;
    
    /** Maximum input length */
    maxInputLength?: number;
    
    /** Custom configuration */
    config?: Partial<PromptConfig>;
    
    /** Custom CSS class name */
    className?: string;
    
    /** Custom inline styles */
    style?: React.CSSProperties;
    
    /** Whether animations are enabled */
    animateOutput?: boolean;
    
    /** Whether tooltips are shown */
    showTooltips?: boolean;
    
    /** Placeholder text for input */
    placeholder?: string;
    
    /** Whether the component is disabled */
    disabled?: boolean;
  }

  // State interfaces
  export interface PromptCraftState {
    userInput: string;
    selectedTemplate: string;
    selectedModel: string;
    enhancedPrompt: string;
    copied: boolean;
    showSettings: boolean;
    animateOutput: boolean;
    showTooltips: boolean;
    autoEnhance: boolean;
    charCount: number;
    isProcessing: boolean;
    showModelDropdown: boolean;
    showTemplateDropdown: boolean;
  }

  // Event interfaces
  export interface PromptEnhancedEvent extends CustomEvent {
    detail: {
      prompt: string;
      template: string;
      model: string;
      originalInput: string;
    };
  }

  export interface TemplateChangedEvent extends CustomEvent {
    detail: {
      templateId: string;
      templateName: string;
      previousTemplate: string;
    };
  }

  export interface ModelChangedEvent extends CustomEvent {
    detail: {
      modelId: string;
      modelName: string;
      previousModel: string;
    };
  }

  // Error types
  export class PromptCraftError extends Error {
    constructor(message: string);
  }

  export class ConfigurationError extends PromptCraftError {
    constructor(message: string);
  }

  export class ValidationError extends PromptCraftError {
    constructor(message: string);
  }

  // Utility functions
  export function validateConfig(config: PromptConfig): void;
  export function validateInput(input: string): string;
  export function detectTemplate(input: string, keywords: Keywords): string;
  export function enhancePrompt(
    config: PromptConfig,
    userInput: string,
    model: string
  ): [string, string];

  // React component
  declare const PromptCraftUI: React.FC<PromptCraftUIProps>;
  export default PromptCraftUI;

  // Environment variables
  export interface EnvironmentConfig {
    PROMPTCRAFT_ENV?: 'development' | 'production';
    PROMPTCRAFT_DEBUG?: boolean;
    PROMPTCRAFT_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
    PROMPTCRAFT_CONFIG_DIR?: string;
    PROMPTCRAFT_CONFIG_FILE?: string;
    PROMPTCRAFT_VALIDATE_INPUT?: boolean;
    PROMPTCRAFT_SANITIZE_OUTPUT?: boolean;
    PROMPTCRAFT_MAX_INPUT_LENGTH?: number;
    PROMPTCRAFT_CACHE_TTL?: number;
    PROMPTCRAFT_REQUEST_TIMEOUT?: number;
    PROMPTCRAFT_MAX_RETRIES?: number;
    PROMPTCRAFT_ENABLE_ANALYTICS?: boolean;
    PROMPTCRAFT_ENABLE_TELEMETRY?: boolean;
    PROMPTCRAFT_ENABLE_CACHE?: boolean;
  }

  // Configuration schema
  export const CONFIG_SCHEMA: {
    type: 'object';
    properties: {
      templates: {
        type: 'object';
        additionalProperties: {
          type: 'object';
          properties: {
            name: { type: 'string'; minLength: 1 };
            content: { type: 'string'; minLength: 10 };
          };
          required: ['name', 'content'];
        };
      };
      model_instructions: {
        type: 'object';
        additionalProperties: { type: 'string' };
      };
      keywords: {
        type: 'object';
        additionalProperties: {
          type: 'array';
          items: { type: 'string' };
        };
      };
    };
    required: ['templates', 'model_instructions', 'keywords'];
  };

  // Constants
  export const DEFAULT_MODELS: Model[];
  export const DEFAULT_CONFIG: PromptConfig;
  export const VERSION: string;
}

// Global type augmentations
declare global {
  interface Window {
    PromptCraft: {
      version: string;
      config: PromptConfig;
      enhance: (input: string, model?: string) => Promise<string>;
      setConfig: (config: Partial<PromptConfig>) => void;
    };
  }

  interface HTMLElementEventMap {
    'promptcraft:enhanced': PromptEnhancedEvent;
    'promptcraft:template-changed': TemplateChangedEvent;
    'promptcraft:model-changed': ModelChangedEvent;
  }
}

// Re-export React types for convenience
import * as React from 'react';
export { React };