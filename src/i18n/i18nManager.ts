/**
 * Comprehensive Internationalization (i18n) System for PromptCraft
 * Supports multiple languages, RTL, pluralization, date/time formatting, and accessibility
 */

export interface I18nConfig {
  defaultLocale: string
  supportedLocales: string[]
  fallbackLocale: string
  loadPath: string
  interpolation: InterpolationConfig
  pluralization: PluralizationConfig
  dateTime: DateTimeConfig
  numbers: NumberConfig
  rtl: RTLConfig
  accessibility: A11yI18nConfig
}

export interface InterpolationConfig {
  prefix: string
  suffix: string
  escapeValue: boolean
  format?: (value: any, format?: string, lng?: string) => string
}

export interface PluralizationConfig {
  rules: Record<string, (count: number) => string>
  suffixes: Record<string, string[]>
}

export interface DateTimeConfig {
  formats: Record<string, Intl.DateTimeFormatOptions>
  defaultFormat: string
}

export interface NumberConfig {
  formats: Record<string, Intl.NumberFormatOptions>
  defaultFormat: string
}

export interface RTLConfig {
  rtlLanguages: string[]
  autoDetect: boolean
  attribute: string
}

export interface A11yI18nConfig {
  announceLanguageChange: boolean
  announceDirectionChange: boolean
  screenReaderLabels: boolean
}

export interface TranslationResource {
  [key: string]: string | TranslationResource | string[]
}

export interface TranslationOptions {
  count?: number
  context?: string
  defaultValue?: string
  interpolation?: Record<string, any>
  lng?: string
  fallbackLng?: string
}

export interface LocaleInfo {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  region?: string
  script?: string
}

/**
 * I18n Manager Class
 */
export class I18nManager {
  private config: I18nConfig
  private currentLocale: string
  private resources: Map<string, TranslationResource> = new Map()
  private loadedLocales: Set<string> = new Set()
  private formatters: Map<string, Intl.DateTimeFormat | Intl.NumberFormat> = new Map()
  private pluralRules: Map<string, Intl.PluralRules> = new Map()
  private changeListeners: Array<(locale: string) => void> = []

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = this.createDefaultConfig(config)
    this.currentLocale = this.detectLocale()
    this.initialize()
  }

  private createDefaultConfig(customConfig: Partial<I18nConfig>): I18nConfig {
    return {
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'he'],
      fallbackLocale: 'en',
      loadPath: '/locales/{{lng}}.json',
      interpolation: {
        prefix: '{{',
        suffix: '}}',
        escapeValue: true
      },
      pluralization: {
        rules: {},
        suffixes: {
          en: ['', '_plural'],
          es: ['', '_plural'],
          fr: ['', '_plural'],
          de: ['', '_plural'],
          ru: ['_0', '_1', '_2', '_5'],
          ar: ['_0', '_1', '_2', '_3', '_11', '_100']
        }
      },
      dateTime: {
        formats: {
          short: { dateStyle: 'short' },
          medium: { dateStyle: 'medium' },
          long: { dateStyle: 'long' },
          full: { dateStyle: 'full' },
          time: { timeStyle: 'short' },
          datetime: { dateStyle: 'medium', timeStyle: 'short' }
        },
        defaultFormat: 'medium'
      },
      numbers: {
        formats: {
          decimal: { style: 'decimal' },
          currency: { style: 'currency', currency: 'USD' },
          percent: { style: 'percent' },
          compact: { notation: 'compact' }
        },
        defaultFormat: 'decimal'
      },
      rtl: {
        rtlLanguages: ['ar', 'he', 'fa', 'ur'],
        autoDetect: true,
        attribute: 'dir'
      },
      accessibility: {
        announceLanguageChange: true,
        announceDirectionChange: true,
        screenReaderLabels: true
      },
      ...customConfig
    }
  }

  private async initialize(): Promise<void> {
    // Load default locale
    await this.loadLocale(this.currentLocale)
    
    // Set up pluralization rules
    this.setupPluralizationRules()
    
    // Set up formatters
    this.setupFormatters()
    
    // Apply locale to DOM
    this.applyLocaleToDOM()
    
    // Set up language detection
    this.setupLanguageDetection()
  }

  /**
   * Locale detection and management
   */
  private detectLocale(): string {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const urlLang = urlParams.get('lang')
    if (urlLang && this.config.supportedLocales.includes(urlLang)) {
      return urlLang
    }

    // Check localStorage
    const storedLang = localStorage.getItem('promptcraft-locale')
    if (storedLang && this.config.supportedLocales.includes(storedLang)) {
      return storedLang
    }

    // Check browser language
    const browserLangs = navigator.languages || [navigator.language]
    for (const lang of browserLangs) {
      const normalizedLang = this.normalizeLangCode(lang)
      if (this.config.supportedLocales.includes(normalizedLang)) {
        return normalizedLang
      }
    }

    return this.config.defaultLocale
  }

  private normalizeLangCode(lang: string): string {
    // Convert 'en-US' to 'en', 'zh-CN' to 'zh', etc.
    return lang.split('-')[0].toLowerCase()
  }

  async changeLocale(locale: string): Promise<void> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`)
    }

    const previousLocale = this.currentLocale
    this.currentLocale = locale

    // Load locale if not already loaded
    if (!this.loadedLocales.has(locale)) {
      await this.loadLocale(locale)
    }

    // Update formatters
    this.setupFormatters()

    // Apply to DOM
    this.applyLocaleToDOM()

    // Store preference
    localStorage.setItem('promptcraft-locale', locale)

    // Announce change for accessibility
    if (this.config.accessibility.announceLanguageChange) {
      this.announceLanguageChange(previousLocale, locale)
    }

    // Notify listeners
    this.changeListeners.forEach(listener => listener(locale))
  }

  private async loadLocale(locale: string): Promise<void> {
    try {
      const path = this.config.loadPath.replace('{{lng}}', locale)
      const response = await fetch(path)
      
      if (!response.ok) {
        throw new Error(`Failed to load locale ${locale}: ${response.statusText}`)
      }

      const resources = await response.json()
      this.resources.set(locale, resources)
      this.loadedLocales.add(locale)

    } catch (error) {
      console.warn(`Failed to load locale ${locale}, using fallback:`, error)
      
      // Load fallback if not the same as current attempt
      if (locale !== this.config.fallbackLocale) {
        await this.loadLocale(this.config.fallbackLocale)
      }
    }
  }

  private applyLocaleToDOM(): void {
    // Set document language
    document.documentElement.lang = this.currentLocale

    // Set direction for RTL languages
    const direction = this.isRTL(this.currentLocale) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute(this.config.rtl.attribute, direction)

    // Update page title if translation exists
    const titleKey = 'page.title'
    const translatedTitle = this.translate(titleKey)
    if (translatedTitle !== titleKey) {
      document.title = translatedTitle
    }

    // Announce direction change for accessibility
    if (this.config.accessibility.announceDirectionChange) {
      this.announceDirectionChange(direction)
    }
  }

  /**
   * Translation methods
   */
  translate(key: string, options: TranslationOptions = {}): string {
    const locale = options.lng || this.currentLocale
    const resources = this.resources.get(locale) || this.resources.get(this.config.fallbackLocale)

    if (!resources) {
      return options.defaultValue || key
    }

    // Get translation
    let translation = this.getNestedTranslation(resources, key)

    // Handle pluralization
    if (options.count !== undefined && Array.isArray(translation)) {
      translation = this.handlePluralization(translation, options.count, locale)
    }

    // Handle context
    if (options.context && typeof translation === 'object') {
      const contextKey = `${key}_${options.context}`
      const contextTranslation = this.getNestedTranslation(resources, contextKey)
      if (contextTranslation) {
        translation = contextTranslation
      }
    }

    // Convert to string
    const translationString = typeof translation === 'string' ? translation : 
                             Array.isArray(translation) ? translation[0] : 
                             options.defaultValue || key

    // Handle interpolation
    return this.interpolate(translationString, options.interpolation || {}, locale)
  }

  private getNestedTranslation(resources: TranslationResource, key: string): any {
    const keys = key.split('.')
    let current: any = resources

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return null
      }
    }

    return current
  }

  private handlePluralization(translations: string[], count: number, locale: string): string {
    const pluralRule = this.getPluralRule(locale)
    const form = pluralRule.select(count)
    
    // Map plural forms to array indices
    const formMap: Record<string, number> = {
      'zero': 0,
      'one': 1,
      'two': 2,
      'few': 3,
      'many': 4,
      'other': translations.length - 1
    }

    const index = formMap[form] !== undefined ? formMap[form] : formMap['other']
    return translations[Math.min(index, translations.length - 1)]
  }

  private interpolate(text: string, values: Record<string, any>, locale: string): string {
    const { prefix, suffix, escapeValue, format } = this.config.interpolation

    return text.replace(
      new RegExp(`${this.escapeRegex(prefix)}([^${this.escapeRegex(suffix)}]+)${this.escapeRegex(suffix)}`, 'g'),
      (match, key) => {
        const [mainKey, formatKey] = key.split(',').map((k: string) => k.trim())
        let value = values[mainKey]

        if (value === undefined || value === null) {
          return match
        }

        // Apply formatting if specified
        if (formatKey && format) {
          value = format(value, formatKey, locale)
        }

        // Apply default formatting for common types
        if (typeof value === 'number') {
          value = this.formatNumber(value, 'decimal', locale)
        } else if (value instanceof Date) {
          value = this.formatDate(value, 'medium', locale)
        }

        // Escape HTML if enabled
        if (escapeValue && typeof value === 'string') {
          value = this.escapeHtml(value)
        }

        return String(value)
      }
    )
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Pluralization support
   */
  private setupPluralizationRules(): void {
    this.config.supportedLocales.forEach(locale => {
      try {
        const pluralRule = new Intl.PluralRules(locale)
        this.pluralRules.set(locale, pluralRule)
      } catch (error) {
        console.warn(`Failed to create plural rules for ${locale}:`, error)
      }
    })
  }

  private getPluralRule(locale: string): Intl.PluralRules {
    return this.pluralRules.get(locale) || 
           this.pluralRules.get(this.config.fallbackLocale) ||
           new Intl.PluralRules('en')
  }

  /**
   * Date and number formatting
   */
  private setupFormatters(): void {
    this.formatters.clear()

    // Set up date formatters
    Object.entries(this.config.dateTime.formats).forEach(([key, options]) => {
      try {
        const formatter = new Intl.DateTimeFormat(this.currentLocale, options)
        this.formatters.set(`date-${key}`, formatter)
      } catch (error) {
        console.warn(`Failed to create date formatter for ${key}:`, error)
      }
    })

    // Set up number formatters
    Object.entries(this.config.numbers.formats).forEach(([key, options]) => {
      try {
        const formatter = new Intl.NumberFormat(this.currentLocale, options)
        this.formatters.set(`number-${key}`, formatter)
      } catch (error) {
        console.warn(`Failed to create number formatter for ${key}:`, error)
      }
    })
  }

  formatDate(date: Date, format: string = this.config.dateTime.defaultFormat, locale?: string): string {
    const formatterKey = `date-${format}`
    const formatter = this.formatters.get(formatterKey)

    if (formatter && formatter instanceof Intl.DateTimeFormat) {
      return formatter.format(date)
    }

    // Fallback
    try {
      const fallbackFormatter = new Intl.DateTimeFormat(locale || this.currentLocale)
      return fallbackFormatter.format(date)
    } catch {
      return date.toLocaleDateString()
    }
  }

  formatNumber(number: number, format: string = this.config.numbers.defaultFormat, locale?: string): string {
    const formatterKey = `number-${format}`
    const formatter = this.formatters.get(formatterKey)

    if (formatter && formatter instanceof Intl.NumberFormat) {
      return formatter.format(number)
    }

    // Fallback
    try {
      const fallbackFormatter = new Intl.NumberFormat(locale || this.currentLocale)
      return fallbackFormatter.format(number)
    } catch {
      return number.toString()
    }
  }

  formatCurrency(amount: number, currency: string = 'USD', locale?: string): string {
    try {
      const formatter = new Intl.NumberFormat(locale || this.currentLocale, {
        style: 'currency',
        currency
      })
      return formatter.format(amount)
    } catch {
      return `${currency} ${amount}`
    }
  }

  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale?: string): string {
    try {
      const formatter = new Intl.RelativeTimeFormat(locale || this.currentLocale, {
        numeric: 'auto'
      })
      return formatter.format(value, unit)
    } catch {
      return `${value} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`
    }
  }

  /**
   * RTL support
   */
  isRTL(locale?: string): boolean {
    const lang = locale || this.currentLocale
    return this.config.rtl.rtlLanguages.includes(lang)
  }

  getDirection(locale?: string): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr'
  }

  /**
   * Language detection and switching
   */
  private setupLanguageDetection(): void {
    // Listen for language changes in browser
    window.addEventListener('languagechange', () => {
      const newLocale = this.detectLocale()
      if (newLocale !== this.currentLocale) {
        this.changeLocale(newLocale)
      }
    })

    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (event) => {
      if (event.key === 'promptcraft-locale' && event.newValue) {
        const newLocale = event.newValue
        if (newLocale !== this.currentLocale && this.config.supportedLocales.includes(newLocale)) {
          this.changeLocale(newLocale)
        }
      }
    })
  }

  /**
   * Accessibility announcements
   */
  private announceLanguageChange(from: string, to: string): void {
    const fromName = this.getLocaleName(from)
    const toName = this.getLocaleName(to)
    
    // Announce in the new language
    const message = this.translate('accessibility.languageChanged', {
      interpolation: { from: fromName, to: toName }
    })

    this.announceToScreenReader(message)
  }

  private announceDirectionChange(direction: 'ltr' | 'rtl'): void {
    const message = this.translate(`accessibility.directionChanged.${direction}`)
    this.announceToScreenReader(message)
  }

  private announceToScreenReader(message: string): void {
    // Create temporary live region for announcement
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message

    document.body.appendChild(announcer)

    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  /**
   * Locale information
   */
  getSupportedLocales(): LocaleInfo[] {
    return this.config.supportedLocales.map(code => ({
      code,
      name: this.getLocaleName(code, 'en'),
      nativeName: this.getLocaleName(code, code),
      direction: this.getDirection(code)
    }))
  }

  private getLocaleName(locale: string, displayLocale?: string): string {
    try {
      const displayNames = new Intl.DisplayNames([displayLocale || this.currentLocale], {
        type: 'language'
      })
      return displayNames.of(locale) || locale
    } catch {
      // Fallback names
      const names: Record<string, string> = {
        en: 'English',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        it: 'Italiano',
        pt: 'Português',
        ru: 'Русский',
        zh: '中文',
        ja: '日本語',
        ko: '한국어',
        ar: 'العربية',
        he: 'עברית'
      }
      return names[locale] || locale
    }
  }

  getCurrentLocale(): string {
    return this.currentLocale
  }

  /**
   * Event listeners
   */
  onLanguageChange(listener: (locale: string) => void): () => void {
    this.changeListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.changeListeners.indexOf(listener)
      if (index > -1) {
        this.changeListeners.splice(index, 1)
      }
    }
  }

  /**
   * Utility methods
   */
  exists(key: string, locale?: string): boolean {
    const resources = this.resources.get(locale || this.currentLocale)
    return resources ? this.getNestedTranslation(resources, key) !== null : false
  }

  getResource(locale?: string): TranslationResource | undefined {
    return this.resources.get(locale || this.currentLocale)
  }

  addResource(locale: string, resource: TranslationResource): void {
    this.resources.set(locale, resource)
    this.loadedLocales.add(locale)
  }

  addResources(resources: Record<string, TranslationResource>): void {
    Object.entries(resources).forEach(([locale, resource]) => {
      this.addResource(locale, resource)
    })
  }

  /**
   * Validation and testing
   */
  validateTranslations(): {
    missingKeys: string[]
    extraKeys: string[]
    incompleteLocales: string[]
  } {
    const baseLocale = this.config.fallbackLocale
    const baseResource = this.resources.get(baseLocale)
    
    if (!baseResource) {
      return {
        missingKeys: [],
        extraKeys: [],
        incompleteLocales: this.config.supportedLocales
      }
    }

    const baseKeys = this.extractKeys(baseResource)
    const missingKeys: string[] = []
    const extraKeys: string[] = []
    const incompleteLocales: string[] = []

    this.config.supportedLocales.forEach(locale => {
      if (locale === baseLocale) return

      const resource = this.resources.get(locale)
      if (!resource) {
        incompleteLocales.push(locale)
        return
      }

      const localeKeys = this.extractKeys(resource)
      
      // Find missing keys
      baseKeys.forEach(key => {
        if (!localeKeys.includes(key)) {
          missingKeys.push(`${locale}:${key}`)
        }
      })

      // Find extra keys
      localeKeys.forEach(key => {
        if (!baseKeys.includes(key)) {
          extraKeys.push(`${locale}:${key}`)
        }
      })
    })

    return { missingKeys, extraKeys, incompleteLocales }
  }

  private extractKeys(resource: TranslationResource, prefix: string = ''): string[] {
    const keys: string[] = []

    Object.entries(resource).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'string' || Array.isArray(value)) {
        keys.push(fullKey)
      } else if (typeof value === 'object' && value !== null) {
        keys.push(...this.extractKeys(value as TranslationResource, fullKey))
      }
    })

    return keys
  }
}

/**
 * Default translation resources
 */
export const defaultTranslations = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      clear: 'Clear',
      submit: 'Submit',
      reset: 'Reset'
    },
    promptcraft: {
      title: 'PromptCraft',
      subtitle: 'Neural Prompt Enhancement System',
      enhance: 'Enhance Prompt',
      enhancing: 'Enhancing...',
      enhanced: 'Enhanced',
      copy: 'Copy',
      copied: 'Copied!',
      original: 'Original Prompt',
      result: 'Enhanced Prompt',
      model: 'Target Model',
      template: 'Template',
      confidence: 'Confidence'
    },
    form: {
      required: 'Required',
      optional: 'Optional',
      placeholder: 'Enter your prompt here...',
      validation: {
        required: 'This field is required',
        minLength: 'Minimum {{count}} characters required',
        maxLength: 'Maximum {{count}} characters allowed',
        email: 'Please enter a valid email address'
      }
    },
    accessibility: {
      languageChanged: 'Language changed from {{from}} to {{to}}',
      directionChanged: {
        ltr: 'Text direction changed to left-to-right',
        rtl: 'Text direction changed to right-to-left'
      },
      skipToMain: 'Skip to main content',
      skipToNav: 'Skip to navigation',
      closeDialog: 'Close dialog',
      openMenu: 'Open menu',
      loading: 'Loading content',
      error: 'An error occurred'
    },
    errors: {
      network: 'Network error. Please check your connection.',
      server: 'Server error. Please try again later.',
      validation: 'Please check your input and try again.',
      notFound: 'The requested resource was not found.',
      unauthorized: 'You are not authorized to perform this action.',
      forbidden: 'Access to this resource is forbidden.',
      timeout: 'The request timed out. Please try again.'
    }
  }
}

/**
 * Default i18n manager instance
 */
export const i18n = new I18nManager({
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'he'],
  fallbackLocale: 'en'
})

// Add default translations
i18n.addResources(defaultTranslations)

/**
 * React hook for i18n
 */
export function useTranslation() {
  return {
    t: i18n.translate.bind(i18n),
    changeLanguage: i18n.changeLocale.bind(i18n),
    language: i18n.getCurrentLocale(),
    languages: i18n.getSupportedLocales(),
    dir: i18n.getDirection(),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n)
  }
}

/**
 * Translation function shorthand
 */
export const t = i18n.translate.bind(i18n)