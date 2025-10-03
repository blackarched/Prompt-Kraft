import React, { useState, useEffect, useCallback, useRef, useId } from 'react'
import type { PromptCraftUIProps, PromptCraftConfig, EnhancementResult } from './types'
import { enhancePrompt, createDefaultConfig, ValidationError, ConfigurationError } from './utils'

/**
 * Fully Accessible PromptCraft UI Component
 * Implements comprehensive ARIA, keyboard navigation, screen reader support, and i18n
 */
const AccessiblePromptCraftUI: React.FC<PromptCraftUIProps & {
  locale?: string
  onLocaleChange?: (locale: string) => void
  enableA11yTesting?: boolean
}> = ({
  config: userConfig,
  defaultModel = 'default',
  onEnhance,
  onError,
  className = '',
  theme = 'auto',
  locale = 'en',
  onLocaleChange,
  enableA11yTesting = false
}) => {
  // Core state
  const [input, setInput] = useState('')
  const [model, setModel] = useState(defaultModel)
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<PromptCraftConfig>(() => {
    const defaultConfig = createDefaultConfig()
    return userConfig ? { ...defaultConfig, ...userConfig } : defaultConfig
  })

  // Accessibility state
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [focusedElement, setFocusedElement] = useState<string | null>(null)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [fontSize, setFontSize] = useState('medium')

  // Refs for accessibility
  const mainRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  // Generate stable IDs
  const formId = useId()
  const inputId = useId()
  const modelSelectId = useId()
  const enhanceButtonId = useId()
  const resultId = useId()
  const statusId = useId()
  const alertId = useId()

  // Translations (simplified - would use actual i18n system)
  const translations = {
    en: {
      title: 'PromptCraft',
      subtitle: 'Neural Prompt Enhancement System',
      inputLabel: 'Your Prompt',
      inputPlaceholder: 'Enter your prompt here...',
      inputHelp: 'Enter the prompt you want to enhance. Be as specific as possible for better results.',
      modelLabel: 'Target Model',
      modelHelp: 'Select the AI model you plan to use with this prompt for optimized formatting.',
      enhanceButton: 'Enhance Prompt',
      enhancing: 'Enhancing...',
      enhancedPrompt: 'Enhanced Prompt',
      copy: 'Copy to Clipboard',
      copied: 'Copied to clipboard!',
      copyFailed: 'Failed to copy to clipboard',
      error: 'Error',
      loading: 'Loading',
      required: 'Required',
      skipToMain: 'Skip to main content',
      skipToResult: 'Skip to enhanced result',
      closeError: 'Close error message',
      keyboardShortcuts: 'Keyboard shortcuts: Ctrl+Enter to enhance, Alt+C to copy result, Escape to clear error',
      languageSelector: 'Select Language',
      themeSelector: 'Select Theme',
      accessibilitySettings: 'Accessibility Settings',
      highContrast: 'High Contrast Mode',
      reducedMotion: 'Reduced Motion',
      fontSize: 'Font Size'
    },
    es: {
      title: 'PromptCraft',
      subtitle: 'Sistema de Mejora Neural de Prompts',
      inputLabel: 'Tu Prompt',
      inputPlaceholder: 'Ingresa tu prompt aquí...',
      inputHelp: 'Ingresa el prompt que quieres mejorar. Sé lo más específico posible para mejores resultados.',
      modelLabel: 'Modelo Objetivo',
      modelHelp: 'Selecciona el modelo de IA que planeas usar con este prompt para un formateo optimizado.',
      enhanceButton: 'Mejorar Prompt',
      enhancing: 'Mejorando...',
      enhancedPrompt: 'Prompt Mejorado',
      copy: 'Copiar al Portapapeles',
      copied: '¡Copiado al portapapeles!',
      copyFailed: 'Error al copiar al portapapeles',
      error: 'Error',
      loading: 'Cargando',
      required: 'Requerido',
      skipToMain: 'Saltar al contenido principal',
      skipToResult: 'Saltar al resultado mejorado',
      closeError: 'Cerrar mensaje de error',
      keyboardShortcuts: 'Atajos de teclado: Ctrl+Enter para mejorar, Alt+C para copiar resultado, Escape para limpiar error',
      languageSelector: 'Seleccionar Idioma',
      themeSelector: 'Seleccionar Tema',
      accessibilitySettings: 'Configuración de Accesibilidad',
      highContrast: 'Modo de Alto Contraste',
      reducedMotion: 'Movimiento Reducido',
      fontSize: 'Tamaño de Fuente'
    }
  }

  const t = (key: string): string => {
    const currentTranslations = translations[locale as keyof typeof translations] || translations.en
    return (currentTranslations as any)[key] || key
  }

  // Accessibility preferences detection
  useEffect(() => {
    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)')
    
    setReducedMotion(prefersReducedMotion.matches)
    setHighContrast(prefersHighContrast.matches)

    // Listen for changes
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches)

    prefersReducedMotion.addEventListener('change', handleMotionChange)
    prefersHighContrast.addEventListener('change', handleContrastChange)

    return () => {
      prefersReducedMotion.removeEventListener('change', handleMotionChange)
      prefersHighContrast.removeEventListener('change', handleContrastChange)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter to enhance
      if (event.ctrlKey && event.key === 'Enter' && input.trim() && !loading) {
        event.preventDefault()
        handleEnhance()
      }
      
      // Alt+C to copy result
      if (event.altKey && event.key === 'c' && result) {
        event.preventDefault()
        handleCopy()
      }
      
      // Escape to clear error
      if (event.key === 'Escape' && error) {
        event.preventDefault()
        setError(null)
        announceToScreenReader(t('closeError'))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [input, loading, result, error])

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message])
    
    // Update appropriate live region
    const regionRef = priority === 'assertive' ? alertRef : statusRef
    if (regionRef.current) {
      regionRef.current.textContent = message
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  // Enhanced handleEnhance with accessibility
  const handleEnhance = useCallback(async () => {
    if (!input.trim()) {
      const errorMsg = t('error') + ': ' + 'Please enter a prompt to enhance'
      setError(errorMsg)
      announceToScreenReader(errorMsg, 'assertive')
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    setError(null)
    announceToScreenReader(t('enhancing'), 'polite')

    try {
      const enhancementResult = enhancePrompt(config, input, { model })
      setResult(enhancementResult)
      
      // Announce success
      const successMsg = `${t('enhancedPrompt')} ready. ${enhancementResult.enhanced_prompt.length} characters.`
      announceToScreenReader(successMsg, 'polite')
      
      // Focus result for screen readers
      setTimeout(() => {
        resultRef.current?.focus()
      }, 100)
      
      onEnhance?.(enhancementResult)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      announceToScreenReader(`${t('error')}: ${errorMessage}`, 'assertive')
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [input, model, config, onEnhance, onError, t, announceToScreenReader])

  // Enhanced copy with accessibility
  const handleCopy = useCallback(async () => {
    if (!result) return
    
    try {
      // Check for secure context (HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result.enhanced_prompt)
        announceToScreenReader(t('copied'), 'polite')
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = result.enhanced_prompt
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (success) {
          announceToScreenReader(t('copied'), 'polite')
        } else {
          throw new Error('Copy failed')
        }
      }
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err)
      announceToScreenReader(t('copyFailed'), 'assertive')
    }
  }, [result, t, announceToScreenReader])

  // Language change handler
  const handleLanguageChange = useCallback((newLocale: string) => {
    if (onLocaleChange) {
      onLocaleChange(newLocale)
    }
    announceToScreenReader(`Language changed to ${newLocale}`, 'polite')
  }, [onLocaleChange, announceToScreenReader])

  const availableModels = Object.keys(config.model_instructions)
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(locale)

  return (
    <div 
      className={`promptcraft-ui ${className} ${highContrast ? 'high-contrast' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
      data-theme={theme}
      dir={isRTL ? 'rtl' : 'ltr'}
      lang={locale}
    >
      {/* Skip Links */}
      <div className="skip-links">
        <a 
          href="#main-content" 
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            mainRef.current?.focus()
            announceToScreenReader(t('skipToMain'))
          }}
        >
          {t('skipToMain')}
        </a>
        {result && (
          <a 
            href="#enhanced-result" 
            className="skip-link"
            onClick={(e) => {
              e.preventDefault()
              resultRef.current?.focus()
              announceToScreenReader(t('skipToResult'))
            }}
          >
            {t('skipToResult')}
          </a>
        )}
      </div>

      {/* Live Regions for Screen Readers */}
      <div
        ref={statusRef}
        id={statusId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      <div
        ref={alertRef}
        id={alertId}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />

      {/* Main Content */}
      <main 
        ref={mainRef}
        id="main-content"
        className="promptcraft-container"
        tabIndex={-1}
        role="main"
        aria-labelledby="app-title"
        aria-describedby="app-description"
      >
        {/* Header */}
        <header className="promptcraft-header" role="banner">
          <h1 id="app-title">{t('title')}</h1>
          <p id="app-description">{t('subtitle')}</p>
          
          {/* Accessibility Settings */}
          <div className="accessibility-controls" role="group" aria-label={t('accessibilitySettings')}>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
              aria-describedby="high-contrast-help"
              className="a11y-toggle"
            >
              {t('highContrast')}
            </button>
            <div id="high-contrast-help" className="sr-only">
              Toggle high contrast mode for better visibility
            </div>

            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              aria-pressed={reducedMotion}
              aria-describedby="reduced-motion-help"
              className="a11y-toggle"
            >
              {t('reducedMotion')}
            </button>
            <div id="reduced-motion-help" className="sr-only">
              Toggle reduced motion for users sensitive to movement
            </div>

            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              aria-label={t('fontSize')}
              className="font-size-selector"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="x-large">Extra Large</option>
            </select>

            {/* Language Selector */}
            <select
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              aria-label={t('languageSelector')}
              className="language-selector"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ar">العربية</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </header>

        {/* Form Section */}
        <section 
          className="promptcraft-form"
          role="form"
          aria-labelledby="form-title"
          aria-describedby="form-description keyboard-shortcuts"
        >
          <h2 id="form-title" className="sr-only">Prompt Enhancement Form</h2>
          <p id="form-description" className="sr-only">
            Enter your prompt and select options to enhance it with AI optimization.
          </p>
          <p id="keyboard-shortcuts" className="sr-only">
            {t('keyboardShortcuts')}
          </p>

          {/* Input Group */}
          <div className="input-group" role="group" aria-labelledby="input-group-label">
            <label 
              htmlFor={inputId}
              id="input-group-label"
              className="input-label"
            >
              {t('inputLabel')}
              <span className="required-indicator" aria-label={t('required')}>*</span>
            </label>
            <textarea
              ref={inputRef}
              id={inputId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('inputPlaceholder')}
              rows={4}
              disabled={loading}
              required
              aria-required="true"
              aria-describedby="input-help input-status"
              aria-invalid={error ? 'true' : 'false'}
              className="prompt-input"
              onFocus={() => setFocusedElement('input')}
              onBlur={() => setFocusedElement(null)}
            />
            <div id="input-help" className="help-text">
              {t('inputHelp')}
            </div>
            <div id="input-status" className="input-status" aria-live="polite">
              {input.length > 0 && `${input.length} characters`}
            </div>
          </div>

          {/* Model Selection */}
          <div className="model-group" role="group" aria-labelledby="model-group-label">
            <label 
              htmlFor={modelSelectId}
              id="model-group-label"
              className="model-label"
            >
              {t('modelLabel')}
            </label>
            <select
              id={modelSelectId}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              aria-describedby="model-help"
              className="model-select"
              onFocus={() => setFocusedElement('model')}
              onBlur={() => setFocusedElement(null)}
            >
              {availableModels.map((modelKey) => (
                <option key={modelKey} value={modelKey}>
                  {modelKey === 'default' ? 'Default' : modelKey.toUpperCase()}
                </option>
              ))}
            </select>
            <div id="model-help" className="help-text">
              {t('modelHelp')}
            </div>
          </div>

          {/* Enhance Button */}
          <button
            id={enhanceButtonId}
            onClick={handleEnhance}
            disabled={loading || !input.trim()}
            className="enhance-button"
            type="button"
            aria-describedby="enhance-help enhance-status"
            onFocus={() => setFocusedElement('button')}
            onBlur={() => setFocusedElement(null)}
          >
            {loading ? (
              <>
                <span className="loading-spinner" aria-hidden="true" />
                <span>{t('enhancing')}</span>
              </>
            ) : (
              t('enhanceButton')
            )}
          </button>
          <div id="enhance-help" className="help-text">
            Press Ctrl+Enter as a keyboard shortcut
          </div>
          <div id="enhance-status" className="sr-only" aria-live="polite">
            {loading ? 'Processing your prompt enhancement request' : ''}
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <section 
            className="error-section"
            role="alert"
            aria-labelledby="error-title"
            aria-describedby="error-message"
          >
            <h3 id="error-title" className="error-title">
              <span aria-hidden="true">⚠️</span>
              {t('error')}
            </h3>
            <p id="error-message" className="error-message">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null)
                announceToScreenReader('Error dismissed')
                inputRef.current?.focus()
              }}
              aria-label={t('closeError')}
              className="error-close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </section>
        )}

        {/* Results Section */}
        {result && (
          <section 
            ref={resultRef}
            id="enhanced-result"
            className="result-section"
            role="region"
            aria-labelledby="result-title"
            aria-describedby="result-description"
            tabIndex={-1}
          >
            <header className="result-header">
              <h2 id="result-title">{t('enhancedPrompt')}</h2>
              <p id="result-description" className="sr-only">
                Your prompt has been enhanced. The improved version is displayed below with metadata about the enhancement process.
              </p>
              
              <div className="result-meta" role="group" aria-label="Enhancement metadata">
                <span 
                  className="template-badge"
                  role="img"
                  aria-label={`Template used: ${result.template_name}`}
                >
                  {result.template_name}
                </span>
                <span 
                  className="model-badge"
                  role="img"
                  aria-label={`Model: ${result.model}`}
                >
                  {result.model.toUpperCase()}
                </span>
                <button
                  onClick={handleCopy}
                  className="copy-button"
                  type="button"
                  aria-describedby="copy-help"
                  onFocus={() => setFocusedElement('copy')}
                  onBlur={() => setFocusedElement(null)}
                >
                  <span aria-hidden="true">📋</span>
                  {t('copy')}
                </button>
                <div id="copy-help" className="sr-only">
                  Copy the enhanced prompt to your clipboard. Keyboard shortcut: Alt+C
                </div>
              </div>
            </header>

            <div 
              className="enhanced-prompt"
              role="region"
              aria-labelledby="prompt-content-title"
              aria-describedby="prompt-content-description"
            >
              <h3 id="prompt-content-title" className="sr-only">Enhanced Prompt Content</h3>
              <p id="prompt-content-description" className="sr-only">
                The following is your enhanced prompt. It has been optimized for clarity, specificity, and effectiveness with AI models.
              </p>
              <pre 
                aria-label="Enhanced prompt text"
                tabIndex={0}
                className="prompt-text"
              >
                {result.enhanced_prompt}
              </pre>
            </div>

            {/* Enhancement Details */}
            <details className="enhancement-details" open={focusedElement === 'details'}>
              <summary 
                className="details-summary"
                onFocus={() => setFocusedElement('details')}
                onBlur={() => setFocusedElement(null)}
              >
                Enhancement Details
                <span className="sr-only">(expandable section)</span>
              </summary>
              <div className="details-content">
                <dl className="enhancement-metadata">
                  <dt>Original Length:</dt>
                  <dd>{input.length} characters</dd>
                  <dt>Enhanced Length:</dt>
                  <dd>{result.enhanced_prompt.length} characters</dd>
                  <dt>Template Used:</dt>
                  <dd>{result.template_name}</dd>
                  <dt>Target Model:</dt>
                  <dd>{result.model}</dd>
                </dl>
              </div>
            </details>
          </section>
        )}

        {/* Loading Progress */}
        {loading && (
          <div 
            className="loading-section"
            role="status"
            aria-labelledby="loading-title"
            aria-describedby="loading-description"
          >
            <h3 id="loading-title" className="sr-only">{t('loading')}</h3>
            <p id="loading-description" className="sr-only">
              Your prompt is being enhanced. Please wait.
            </p>
            <div 
              className="progress-indicator"
              role="progressbar"
              aria-label="Enhancement progress"
              aria-describedby="progress-description"
            >
              <div className="progress-bar" />
            </div>
            <p id="progress-description" className="sr-only">
              Enhancement in progress. This typically takes a few seconds.
            </p>
          </div>
        )}
      </main>

      {/* Styles with accessibility considerations */}
      <style jsx>{`
        .promptcraft-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-size: ${fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'x-large' ? '22px' : '16px'};
          line-height: 1.6;
        }

        /* Skip Links */
        .skip-links {
          position: absolute;
          top: -40px;
          left: 6px;
          z-index: 10000;
        }

        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          border: 2px solid #fff;
        }

        .skip-link:focus {
          position: static;
          width: auto;
          height: auto;
          left: auto;
          top: auto;
          overflow: visible;
          outline: 3px solid #ffff00;
          outline-offset: 2px;
        }

        /* Screen Reader Only Content */
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        /* Main Container */
        .promptcraft-container {
          background: var(--bg-primary, #ffffff);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 24px;
          border: 2px solid var(--border-color, #e5e7eb);
          position: relative;
        }

        .promptcraft-container:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
        }

        /* Header */
        .promptcraft-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .promptcraft-header h1 {
          margin: 0 0 8px 0;
          color: var(--text-primary, #1f2937);
          font-size: 1.8rem;
          font-weight: 600;
        }

        .promptcraft-header p {
          margin: 0 0 16px 0;
          color: var(--text-secondary, #6b7280);
          font-size: 1rem;
        }

        /* Accessibility Controls */
        .accessibility-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin-top: 16px;
          padding: 12px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 8px;
        }

        .a11y-toggle {
          padding: 6px 12px;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #1f2937);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .a11y-toggle:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
        }

        .a11y-toggle[aria-pressed="true"] {
          background: var(--accent-color, #3b82f6);
          color: white;
          border-color: var(--accent-color, #3b82f6);
        }

        .language-selector,
        .font-size-selector {
          padding: 6px 12px;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #1f2937);
          font-size: 14px;
        }

        .language-selector:focus,
        .font-size-selector:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
          border-color: #0066cc;
        }

        /* Form Styles */
        .promptcraft-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .input-group,
        .model-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label,
        .model-label {
          font-weight: 600;
          color: var(--text-primary, #1f2937);
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required-indicator {
          color: #dc2626;
          font-weight: bold;
        }

        .prompt-input {
          padding: 16px;
          border: 3px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-family: inherit;
          font-size: inherit;
          line-height: 1.5;
          resize: vertical;
          min-height: 120px;
          background: var(--bg-secondary, #f9fafb);
          color: var(--text-primary, #1f2937);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .prompt-input:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .prompt-input:invalid {
          border-color: #dc2626;
        }

        .prompt-input[aria-invalid="true"] {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .model-select {
          padding: 12px 16px;
          border: 3px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-family: inherit;
          font-size: inherit;
          background: var(--bg-secondary, #f9fafb);
          color: var(--text-primary, #1f2937);
          cursor: pointer;
        }

        .model-select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .help-text {
          font-size: 0.875rem;
          color: var(--text-secondary, #6b7280);
          margin-top: 4px;
        }

        .input-status {
          font-size: 0.875rem;
          color: var(--text-secondary, #6b7280);
          text-align: right;
        }

        /* Button Styles */
        .enhance-button {
          padding: 16px 32px;
          background: var(--accent-color, #3b82f6);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }

        .enhance-button:hover:not(:disabled) {
          background: var(--accent-hover, #2563eb);
          transform: ${reducedMotion ? 'none' : 'translateY(-1px)'};
        }

        .enhance-button:focus {
          outline: 3px solid #ffff00;
          outline-offset: 2px;
          box-shadow: 0 0 0 1px #ffffff, 0 0 0 4px #0066cc;
        }

        .enhance-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: ${reducedMotion ? 'none' : 'spin 1s linear infinite'};
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Styles */
        .error-section {
          background: #fef2f2;
          border: 3px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          position: relative;
        }

        .error-title {
          margin: 0 0 8px 0;
          color: #dc2626;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-message {
          margin: 0;
          color: #dc2626;
          font-size: 0.95rem;
        }

        .error-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 24px;
          color: #dc2626;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          min-width: 32px;
          min-height: 32px;
        }

        .error-close:focus {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }

        /* Results Styles */
        .result-section {
          border: 3px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
          margin-top: 24px;
        }

        .result-section:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
        }

        .result-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: var(--bg-secondary, #f9fafb);
          border-bottom: 2px solid var(--border-color, #e5e7eb);
        }

        .result-header h2 {
          margin: 0;
          color: var(--text-primary, #1f2937);
          font-size: 1.3rem;
          font-weight: 600;
        }

        .result-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }

        .template-badge,
        .model-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 2px solid transparent;
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
          padding: 8px 16px;
          background: var(--bg-primary, #ffffff);
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          color: var(--text-secondary, #6b7280);
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
        }

        .copy-button:hover:not(:disabled) {
          background: var(--bg-secondary, #f9fafb);
          border-color: var(--accent-color, #3b82f6);
        }

        .copy-button:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
          border-color: #0066cc;
        }

        .enhanced-prompt {
          padding: 24px;
          background: var(--bg-primary, #ffffff);
        }

        .prompt-text {
          margin: 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
          color: var(--text-primary, #1f2937);
          border: 2px solid transparent;
          border-radius: 4px;
          padding: 8px;
        }

        .prompt-text:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
          border-color: #0066cc;
        }

        /* Enhancement Details */
        .enhancement-details {
          margin: 16px 20px;
        }

        .details-summary {
          cursor: pointer;
          padding: 12px;
          background: var(--bg-secondary, #f9fafb);
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-weight: 500;
          color: var(--text-primary, #1f2937);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .details-summary:focus {
          outline: 3px solid #0066cc;
          outline-offset: 2px;
        }

        .details-summary::marker {
          display: none;
        }

        .details-summary::before {
          content: '▶';
          transition: transform 0.2s ease;
          margin-right: 8px;
        }

        .enhancement-details[open] .details-summary::before {
          transform: ${reducedMotion ? 'none' : 'rotate(90deg)'};
        }

        .details-content {
          padding: 16px 12px;
        }

        .enhancement-metadata {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 16px;
          margin: 0;
        }

        .enhancement-metadata dt {
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }

        .enhancement-metadata dd {
          margin: 0;
          color: var(--text-secondary, #6b7280);
        }

        /* Loading Styles */
        .loading-section {
          text-align: center;
          padding: 32px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 8px;
          margin: 24px 0;
        }

        .progress-indicator {
          width: 100%;
          height: 8px;
          background: var(--border-color, #e5e7eb);
          border-radius: 4px;
          overflow: hidden;
          margin: 16px 0;
        }

        .progress-bar {
          height: 100%;
          background: var(--accent-color, #3b82f6);
          width: 100%;
          animation: ${reducedMotion ? 'none' : 'progress 2s ease-in-out infinite'};
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }

        /* High Contrast Mode */
        .high-contrast {
          --bg-primary: #000000;
          --bg-secondary: #1a1a1a;
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --border-color: #ffffff;
          --accent-color: #ffff00;
          --accent-hover: #cccc00;
        }

        .high-contrast .promptcraft-container {
          border-width: 3px;
        }

        .high-contrast .prompt-input,
        .high-contrast .model-select {
          border-width: 3px;
        }

        .high-contrast *:focus {
          outline: 4px solid #ffff00 !important;
          outline-offset: 2px !important;
        }

        /* Dark Theme */
        [data-theme="dark"] {
          --bg-primary: #1f2937;
          --bg-secondary: #374151;
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --border-color: #4b5563;
          --accent-color: #3b82f6;
          --accent-hover: #2563eb;
        }

        /* RTL Support */
        [dir="rtl"] .result-meta {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .details-summary::before {
          margin-right: 0;
          margin-left: 8px;
        }

        [dir="rtl"] .enhancement-details[open] .details-summary::before {
          transform: ${reducedMotion ? 'none' : 'rotate(-90deg)'};
        }

        /* Responsive Design with Accessibility */
        @media (max-width: 768px) {
          .promptcraft-ui {
            padding: 16px;
            font-size: ${fontSize === 'small' ? '16px' : fontSize === 'large' ? '20px' : fontSize === 'x-large' ? '24px' : '18px'};
          }
          
          .promptcraft-container {
            padding: 20px;
          }
          
          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .result-meta {
            width: 100%;
            justify-content: space-between;
          }

          .accessibility-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .a11y-toggle,
          .language-selector,
          .font-size-selector {
            width: 100%;
            min-height: 44px;
          }
        }

        @media (max-width: 480px) {
          .promptcraft-ui {
            font-size: ${fontSize === 'small' ? '18px' : fontSize === 'large' ? '22px' : fontSize === 'x-large' ? '26px' : '20px'};
          }

          .prompt-input {
            min-height: 100px;
            font-size: inherit;
          }

          .enhance-button {
            min-height: 52px;
            font-size: 1.1rem;
          }
        }

        /* Print Styles */
        @media print {
          .skip-links,
          .accessibility-controls,
          .copy-button,
          .error-close {
            display: none;
          }
          
          .promptcraft-container {
            box-shadow: none;
            border: 2px solid #000;
          }
        }

        /* Reduced Motion */
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        /* Focus Management */
        .focus-within {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default AccessiblePromptCraftUI