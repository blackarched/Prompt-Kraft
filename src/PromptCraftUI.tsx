import React, { useState, useEffect, useCallback } from 'react'
import type { PromptCraftUIProps, PromptCraftConfig, EnhancementResult } from './types'
import { enhancePrompt, createDefaultConfig, ValidationError, ConfigurationError } from './utils'

const PromptCraftUI: React.FC<PromptCraftUIProps> = ({
  config: userConfig,
  defaultModel = 'default',
  onEnhance,
  onError,
  className = '',
  theme = 'auto'
}) => {
  const [input, setInput] = useState('')
  const [model, setModel] = useState(defaultModel)
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<PromptCraftConfig>(() => {
    const defaultConfig = createDefaultConfig()
    return userConfig ? { ...defaultConfig, ...userConfig } : defaultConfig
  })

  // Update config when userConfig changes
  useEffect(() => {
    const defaultConfig = createDefaultConfig()
    setConfig(userConfig ? { ...defaultConfig, ...userConfig } : defaultConfig)
  }, [userConfig])

  // Theme handling
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const updateTheme = () => {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light')
      }
      updateTheme()
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  const handleEnhance = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter a prompt to enhance')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const enhancementResult = enhancePrompt(config, input, { model })
      setResult(enhancementResult)
      onEnhance?.(enhancementResult)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [input, model, config, onEnhance, onError])

  const handleCopy = useCallback(async () => {
    if (!result) return
    
    try {
      await navigator.clipboard.writeText(result.enhanced_prompt)
      // Could add a toast notification here
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err)
    }
  }, [result])

  const availableModels = Object.keys(config.model_instructions)

  return (
    <div className={`promptcraft-ui ${className}`} data-theme={theme}>
      <div className="promptcraft-container">
        <header className="promptcraft-header">
          <h2>✨ PromptCraft</h2>
          <p>Neural Prompt Enhancement System</p>
        </header>

        <div className="promptcraft-form">
          <div className="input-group">
            <label htmlFor="prompt-input">Your Prompt:</label>
            <textarea
              id="prompt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="model-selector">
            <label htmlFor="model-select">Target Model:</label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              {availableModels.map((modelKey) => (
                <option key={modelKey} value={modelKey}>
                  {modelKey === 'default' ? 'Default' : modelKey.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleEnhance}
            disabled={loading || !input.trim()}
            className="enhance-button"
          >
            {loading ? 'Enhancing...' : 'Enhance Prompt'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="result-container">
            <div className="result-header">
              <h3>Enhanced Prompt</h3>
              <div className="result-meta">
                <span className="template-badge">{result.template_name}</span>
                <span className="model-badge">{result.model}</span>
                <button onClick={handleCopy} className="copy-button">
                  📋 Copy
                </button>
              </div>
            </div>
            <div className="enhanced-prompt">
              <pre>{result.enhanced_prompt}</pre>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .promptcraft-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .promptcraft-container {
          background: var(--bg-primary, #ffffff);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 24px;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .promptcraft-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .promptcraft-header h2 {
          margin: 0 0 8px 0;
          color: var(--text-primary, #1f2937);
          font-size: 1.5rem;
        }

        .promptcraft-header p {
          margin: 0;
          color: var(--text-secondary, #6b7280);
          font-size: 0.9rem;
        }

        .promptcraft-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-weight: 500;
          color: var(--text-primary, #1f2937);
          font-size: 0.9rem;
        }

        textarea {
          padding: 12px;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 100px;
          background: var(--bg-secondary, #f9fafb);
          color: var(--text-primary, #1f2937);
        }

        textarea:focus {
          outline: none;
          border-color: var(--accent-color, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .model-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        select {
          padding: 10px 12px;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          background: var(--bg-secondary, #f9fafb);
          color: var(--text-primary, #1f2937);
        }

        .enhance-button {
          padding: 12px 24px;
          background: var(--accent-color, #3b82f6);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .enhance-button:hover:not(:disabled) {
          background: var(--accent-hover, #2563eb);
          transform: translateY(-1px);
        }

        .enhance-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }

        .result-container {
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--bg-secondary, #f9fafb);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .result-header h3 {
          margin: 0;
          color: var(--text-primary, #1f2937);
          font-size: 1.1rem;
        }

        .result-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .template-badge, .model-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .template-badge {
          background: #dbeafe;
          color: #1e40af;
        }

        .model-badge {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .copy-button {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          color: var(--text-secondary, #6b7280);
        }

        .copy-button:hover {
          background: var(--bg-secondary, #f9fafb);
        }

        .enhanced-prompt {
          padding: 20px;
          background: var(--bg-primary, #ffffff);
        }

        .enhanced-prompt pre {
          margin: 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          color: var(--text-primary, #1f2937);
        }

        /* Dark theme */
        [data-theme="dark"] {
          --bg-primary: #1f2937;
          --bg-secondary: #374151;
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --border-color: #4b5563;
          --accent-color: #3b82f6;
          --accent-hover: #2563eb;
        }

        @media (max-width: 640px) {
          .promptcraft-ui {
            padding: 16px;
          }
          
          .promptcraft-container {
            padding: 16px;
          }
          
          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .result-meta {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}

export default PromptCraftUI