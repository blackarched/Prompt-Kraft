/**
 * Screen Reader Support System for PromptCraft
 * Comprehensive screen reader announcements, live regions, and assistive technology support
 */

export interface ScreenReaderConfig {
  enableAnnouncements: boolean
  enableLiveRegions: boolean
  enableProgressAnnouncements: boolean
  enableNavigationAnnouncements: boolean
  enableFormAnnouncements: boolean
  enableErrorAnnouncements: boolean
  enableStatusAnnouncements: boolean
  verbosityLevel: 'minimal' | 'standard' | 'verbose'
  announcementDelay: number
  repeatImportantAnnouncements: boolean
}

export interface Announcement {
  id: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: 'status' | 'alert' | 'progress' | 'navigation' | 'form' | 'error' | 'success'
  timestamp: Date
  repeated: boolean
  context?: string
}

export interface LiveRegionConfig {
  id: string
  politeness: 'off' | 'polite' | 'assertive'
  atomic: boolean
  relevant: 'additions' | 'removals' | 'text' | 'all'
  live: boolean
}

export interface ProgressAnnouncement {
  current: number
  total: number
  label: string
  percentage?: number
  timeRemaining?: number
  stage?: string
}

/**
 * Screen Reader Support Manager
 */
export class ScreenReaderManager {
  private config: ScreenReaderConfig
  private announcements: Announcement[] = []
  private liveRegions: Map<string, LiveRegionConfig> = new Map()
  private announcementQueue: Announcement[] = []
  private isProcessingQueue = false
  private lastAnnouncement: string = ''
  private announcementHistory: string[] = []

  constructor(config: Partial<ScreenReaderConfig> = {}) {
    this.config = {
      enableAnnouncements: true,
      enableLiveRegions: true,
      enableProgressAnnouncements: true,
      enableNavigationAnnouncements: true,
      enableFormAnnouncements: true,
      enableErrorAnnouncements: true,
      enableStatusAnnouncements: true,
      verbosityLevel: 'standard',
      announcementDelay: 100,
      repeatImportantAnnouncements: false,
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    this.setupLiveRegions()
    this.setupFormSupport()
    this.setupNavigationSupport()
    this.setupProgressSupport()
    this.setupErrorSupport()
    this.detectScreenReader()
  }

  /**
   * Screen reader detection
   */
  private detectScreenReader(): void {
    // Detect common screen readers
    const userAgent = navigator.userAgent.toLowerCase()
    const screenReaders = {
      nvda: userAgent.includes('nvda'),
      jaws: userAgent.includes('jaws'),
      voiceover: /mac os x/.test(userAgent) && /safari/.test(userAgent),
      narrator: userAgent.includes('windows nt') && userAgent.includes('edge'),
      orca: userAgent.includes('linux')
    }

    // Check for screen reader indicators
    const hasScreenReader = Object.values(screenReaders).some(Boolean) ||
                           window.speechSynthesis ||
                           'speechSynthesis' in window ||
                           navigator.userAgent.includes('screen reader')

    if (hasScreenReader) {
      document.body.setAttribute('data-screen-reader', 'true')
      this.announceScreenReaderDetected()
    }

    // Store screen reader info
    document.body.dataset.screenReaders = JSON.stringify(screenReaders)
  }

  private announceScreenReaderDetected(): void {
    setTimeout(() => {
      this.announce(
        'PromptCraft application loaded. Press Alt+H for keyboard shortcuts.',
        'medium',
        'status'
      )
    }, 1000)
  }

  /**
   * Live regions setup
   */
  private setupLiveRegions(): void {
    if (!this.config.enableLiveRegions) return

    // Main announcement region (polite)
    this.createLiveRegion({
      id: 'sr-announcements',
      politeness: 'polite',
      atomic: true,
      relevant: 'all',
      live: true
    })

    // Alert region (assertive)
    this.createLiveRegion({
      id: 'sr-alerts',
      politeness: 'assertive',
      atomic: true,
      relevant: 'all',
      live: true
    })

    // Status region (polite)
    this.createLiveRegion({
      id: 'sr-status',
      politeness: 'polite',
      atomic: false,
      relevant: 'text',
      live: true
    })

    // Progress region (polite)
    this.createLiveRegion({
      id: 'sr-progress',
      politeness: 'polite',
      atomic: true,
      relevant: 'text',
      live: true
    })

    // Log region for verbose information
    this.createLiveRegion({
      id: 'sr-log',
      politeness: 'polite',
      atomic: false,
      relevant: 'additions',
      live: true
    })
  }

  private createLiveRegion(config: LiveRegionConfig): void {
    this.liveRegions.set(config.id, config)

    const existing = document.getElementById(config.id)
    if (existing) return

    const region = document.createElement('div')
    region.id = config.id
    region.className = 'sr-only live-region'
    region.setAttribute('aria-live', config.politeness)
    region.setAttribute('aria-atomic', config.atomic.toString())
    region.setAttribute('aria-relevant', config.relevant)

    // Add screen reader only styles
    this.addScreenReaderStyles()

    document.body.appendChild(region)
  }

  private addScreenReaderStyles(): void {
    if (document.getElementById('sr-styles')) return

    const style = document.createElement('style')
    style.id = 'sr-styles'
    style.textContent = `
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
      
      .sr-only-focusable:focus {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: inherit !important;
        margin: inherit !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: inherit !important;
      }
      
      .live-region {
        speak: normal;
      }
      
      .live-region[aria-live="assertive"] {
        speak: assertive;
      }
      
      .live-region[aria-live="polite"] {
        speak: polite;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Main announcement system
   */
  announce(
    message: string,
    priority: Announcement['priority'] = 'medium',
    type: Announcement['type'] = 'status',
    context?: string
  ): string {
    if (!this.config.enableAnnouncements) return ''

    // Check if we should announce based on type
    if (!this.shouldAnnounce(type)) return ''

    // Create announcement
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: this.formatMessage(message, type),
      priority,
      type,
      timestamp: new Date(),
      repeated: false,
      context
    }

    // Add to queue
    this.announcements.push(announcement)
    this.announcementQueue.push(announcement)

    // Process queue
    this.processAnnouncementQueue()

    return announcement.id
  }

  private shouldAnnounce(type: Announcement['type']): boolean {
    switch (type) {
      case 'status':
        return this.config.enableStatusAnnouncements
      case 'alert':
      case 'error':
        return this.config.enableErrorAnnouncements
      case 'progress':
        return this.config.enableProgressAnnouncements
      case 'navigation':
        return this.config.enableNavigationAnnouncements
      case 'form':
        return this.config.enableFormAnnouncements
      default:
        return true
    }
  }

  private formatMessage(message: string, type: Announcement['type']): string {
    const verbosity = this.config.verbosityLevel

    let formatted = message

    // Add context based on verbosity level
    if (verbosity === 'verbose') {
      switch (type) {
        case 'status':
          formatted = `Status: ${message}`
          break
        case 'alert':
          formatted = `Alert: ${message}`
          break
        case 'error':
          formatted = `Error: ${message}`
          break
        case 'progress':
          formatted = `Progress: ${message}`
          break
        case 'navigation':
          formatted = `Navigation: ${message}`
          break
        case 'form':
          formatted = `Form: ${message}`
          break
        case 'success':
          formatted = `Success: ${message}`
          break
      }
    }

    return formatted
  }

  private processAnnouncementQueue(): void {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) return

    this.isProcessingQueue = true

    setTimeout(() => {
      const announcement = this.announcementQueue.shift()
      if (announcement) {
        this.deliverAnnouncement(announcement)
      }
      
      this.isProcessingQueue = false
      
      // Process next in queue
      if (this.announcementQueue.length > 0) {
        this.processAnnouncementQueue()
      }
    }, this.config.announcementDelay)
  }

  private deliverAnnouncement(announcement: Announcement): void {
    // Avoid duplicate announcements
    if (this.lastAnnouncement === announcement.message && 
        !this.config.repeatImportantAnnouncements) {
      return
    }

    // Select appropriate live region
    const regionId = this.selectLiveRegion(announcement)
    const region = document.getElementById(regionId)

    if (region) {
      // Clear and set message
      region.textContent = ''
      
      setTimeout(() => {
        region.textContent = announcement.message
        this.lastAnnouncement = announcement.message
        this.announcementHistory.push(announcement.message)
        
        // Limit history
        if (this.announcementHistory.length > 50) {
          this.announcementHistory = this.announcementHistory.slice(-25)
        }
      }, 50)
    }

    // Log announcement for debugging
    console.log(`[Screen Reader] ${announcement.type}: ${announcement.message}`)
  }

  private selectLiveRegion(announcement: Announcement): string {
    switch (announcement.priority) {
      case 'critical':
      case 'high':
        return 'sr-alerts'
      case 'medium':
        return announcement.type === 'progress' ? 'sr-progress' : 'sr-announcements'
      case 'low':
        return 'sr-status'
      default:
        return 'sr-announcements'
    }
  }

  /**
   * Specialized announcement methods
   */
  announcePageChange(pageName: string, pageDescription?: string): void {
    const message = pageDescription ? 
      `${pageName} page. ${pageDescription}` : 
      `${pageName} page loaded`
    
    this.announce(message, 'medium', 'navigation')
  }

  announceFormError(fieldName: string, errorMessage: string): void {
    const message = `${fieldName} field has an error: ${errorMessage}`
    this.announce(message, 'high', 'error')
  }

  announceFormSuccess(message: string): void {
    this.announce(message, 'medium', 'success')
  }

  announceProgress(progress: ProgressAnnouncement): void {
    if (!this.config.enableProgressAnnouncements) return

    let message = `${progress.label}: `
    
    if (progress.percentage !== undefined) {
      message += `${Math.round(progress.percentage)}% complete`
    } else {
      message += `${progress.current} of ${progress.total}`
    }

    if (progress.stage) {
      message += `. ${progress.stage}`
    }

    if (progress.timeRemaining) {
      const minutes = Math.ceil(progress.timeRemaining / 60)
      message += `. Estimated ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`
    }

    this.announce(message, 'low', 'progress')
  }

  announceButtonAction(buttonLabel: string, action: string): void {
    const message = `${buttonLabel} button ${action}`
    this.announce(message, 'low', 'status')
  }

  announceModalOpen(modalTitle: string, modalDescription?: string): void {
    let message = `${modalTitle} dialog opened`
    if (modalDescription) {
      message += `. ${modalDescription}`
    }
    message += '. Press Escape to close.'
    
    this.announce(message, 'medium', 'navigation')
  }

  announceModalClose(modalTitle?: string): void {
    const message = modalTitle ? 
      `${modalTitle} dialog closed` : 
      'Dialog closed'
    
    this.announce(message, 'low', 'navigation')
  }

  announceListNavigation(
    currentItem: string, 
    position: number, 
    total: number, 
    listType: string = 'list'
  ): void {
    const message = `${currentItem}. ${position} of ${total} in ${listType}`
    this.announce(message, 'low', 'navigation')
  }

  announceTabChange(tabName: string, tabPanel?: string): void {
    let message = `${tabName} tab selected`
    if (tabPanel) {
      message += `. ${tabPanel} panel`
    }
    
    this.announce(message, 'medium', 'navigation')
  }

  announceSearchResults(count: number, query?: string): void {
    let message = `${count} search result${count !== 1 ? 's' : ''} found`
    if (query) {
      message += ` for "${query}"`
    }
    
    this.announce(message, 'medium', 'status')
  }

  announceLoading(operation: string): void {
    this.announce(`Loading ${operation}`, 'low', 'status')
  }

  announceLoadingComplete(operation: string): void {
    this.announce(`${operation} loaded`, 'low', 'status')
  }

  /**
   * Form support
   */
  private setupFormSupport(): void {
    if (!this.config.enableFormAnnouncements) return

    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      const formName = form.getAttribute('aria-label') || 
                      form.getAttribute('name') || 
                      'Form'
      
      this.announce(`Submitting ${formName}`, 'medium', 'form')
    })

    // Monitor form validation
    document.addEventListener('invalid', (event) => {
      const field = event.target as HTMLInputElement
      const fieldName = this.getFieldName(field)
      const validationMessage = field.validationMessage
      
      this.announceFormError(fieldName, validationMessage)
    })

    // Monitor form field changes
    document.addEventListener('change', (event) => {
      const field = event.target as HTMLInputElement
      if (field.type === 'checkbox' || field.type === 'radio') {
        const fieldName = this.getFieldName(field)
        const state = field.checked ? 'checked' : 'unchecked'
        this.announce(`${fieldName} ${state}`, 'low', 'form')
      }
    })
  }

  private getFieldName(field: HTMLElement): string {
    // Try various methods to get field name
    const label = document.querySelector(`label[for="${field.id}"]`)
    if (label) return label.textContent?.trim() || 'Field'

    const ariaLabel = field.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    const ariaLabelledBy = field.getAttribute('aria-labelledby')
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy)
      if (labelElement) return labelElement.textContent?.trim() || 'Field'
    }

    return field.getAttribute('name') || field.getAttribute('placeholder') || 'Field'
  }

  /**
   * Navigation support
   */
  private setupNavigationSupport(): void {
    if (!this.config.enableNavigationAnnouncements) return

    // Monitor focus changes for navigation announcements
    let lastFocusedElement: HTMLElement | null = null

    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      
      // Announce region changes
      const currentRegion = this.findContainingRegion(target)
      const lastRegion = lastFocusedElement ? this.findContainingRegion(lastFocusedElement) : null

      if (currentRegion && currentRegion !== lastRegion) {
        this.announceRegionChange(currentRegion)
      }

      lastFocusedElement = target
    })

    // Monitor page navigation
    window.addEventListener('popstate', () => {
      this.announcePageChange(document.title)
    })
  }

  private findContainingRegion(element: HTMLElement): HTMLElement | null {
    const regionSelectors = [
      '[role="banner"]', 'header',
      '[role="navigation"]', 'nav',
      '[role="main"]', 'main',
      '[role="complementary"]', 'aside',
      '[role="contentinfo"]', 'footer'
    ]

    for (const selector of regionSelectors) {
      const region = element.closest(selector) as HTMLElement
      if (region) return region
    }

    return null
  }

  private announceRegionChange(region: HTMLElement): void {
    const role = region.getAttribute('role') || region.tagName.toLowerCase()
    const label = region.getAttribute('aria-label') || 
                 region.getAttribute('aria-labelledby') ||
                 this.getRegionName(role)

    this.announce(`Entered ${label} region`, 'low', 'navigation')
  }

  private getRegionName(role: string): string {
    const roleNames: Record<string, string> = {
      'banner': 'header',
      'navigation': 'navigation',
      'main': 'main content',
      'complementary': 'sidebar',
      'contentinfo': 'footer'
    }

    return roleNames[role] || role
  }

  /**
   * Progress support
   */
  private setupProgressSupport(): void {
    if (!this.config.enableProgressAnnouncements) return

    // Monitor progress elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'aria-valuenow') {
          const target = mutation.target as HTMLElement
          if (target.getAttribute('role') === 'progressbar') {
            this.handleProgressUpdate(target)
          }
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-valuenow', 'aria-valuetext']
    })
  }

  private handleProgressUpdate(progressElement: HTMLElement): void {
    const current = parseFloat(progressElement.getAttribute('aria-valuenow') || '0')
    const max = parseFloat(progressElement.getAttribute('aria-valuemax') || '100')
    const min = parseFloat(progressElement.getAttribute('aria-valuemin') || '0')
    const label = progressElement.getAttribute('aria-label') || 'Progress'
    const valueText = progressElement.getAttribute('aria-valuetext')

    if (valueText) {
      this.announce(`${label}: ${valueText}`, 'low', 'progress')
    } else {
      const percentage = ((current - min) / (max - min)) * 100
      this.announceProgress({
        current,
        total: max,
        label,
        percentage
      })
    }
  }

  /**
   * Error support
   */
  private setupErrorSupport(): void {
    if (!this.config.enableErrorAnnouncements) return

    // Monitor for error messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            
            // Check for error roles or classes
            if (element.getAttribute('role') === 'alert' ||
                element.classList.contains('error') ||
                element.classList.contains('alert')) {
              
              const message = element.textContent?.trim()
              if (message) {
                this.announce(message, 'high', 'error')
              }
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Monitor for JavaScript errors
    window.addEventListener('error', (event) => {
      this.announce(
        'A system error occurred. Please try again or contact support.',
        'high',
        'error'
      )
    })
  }

  /**
   * Utility methods
   */
  clearAnnouncements(): void {
    this.announcementQueue = []
    this.liveRegions.forEach((_, regionId) => {
      const region = document.getElementById(regionId)
      if (region) {
        region.textContent = ''
      }
    })
  }

  getAnnouncementHistory(): string[] {
    return [...this.announcementHistory]
  }

  repeatLastAnnouncement(): void {
    if (this.lastAnnouncement) {
      this.announce(this.lastAnnouncement, 'medium', 'status')
    }
  }

  setVerbosity(level: ScreenReaderConfig['verbosityLevel']): void {
    this.config.verbosityLevel = level
  }

  isScreenReaderDetected(): boolean {
    return document.body.getAttribute('data-screen-reader') === 'true'
  }

  /**
   * Testing and validation
   */
  validateScreenReaderSupport(): {
    liveRegions: number
    announcements: number
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for required live regions
    const requiredRegions = ['sr-announcements', 'sr-alerts', 'sr-status']
    requiredRegions.forEach(regionId => {
      const region = document.getElementById(regionId)
      if (!region) {
        errors.push(`Missing required live region: ${regionId}`)
      } else if (!region.getAttribute('aria-live')) {
        errors.push(`Live region ${regionId} missing aria-live attribute`)
      }
    })

    // Check for proper ARIA labels
    const unlabeledElements = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), ' +
      'input:not([aria-label]):not([aria-labelledby]), ' +
      '[role="button"]:not([aria-label]):not([aria-labelledby])'
    )

    if (unlabeledElements.length > 0) {
      warnings.push(`${unlabeledElements.length} interactive elements may need labels`)
    }

    return {
      liveRegions: this.liveRegions.size,
      announcements: this.announcements.length,
      errors,
      warnings
    }
  }
}

/**
 * Default screen reader manager
 */
export const screenReader = new ScreenReaderManager({
  enableAnnouncements: true,
  enableLiveRegions: true,
  verbosityLevel: 'standard',
  announcementDelay: 100
})

/**
 * React hook for screen reader support
 */
export function useScreenReader() {
  return {
    announce: screenReader.announce.bind(screenReader),
    announcePageChange: screenReader.announcePageChange.bind(screenReader),
    announceFormError: screenReader.announceFormError.bind(screenReader),
    announceFormSuccess: screenReader.announceFormSuccess.bind(screenReader),
    announceProgress: screenReader.announceProgress.bind(screenReader),
    announceModalOpen: screenReader.announceModalOpen.bind(screenReader),
    announceModalClose: screenReader.announceModalClose.bind(screenReader),
    announceLoading: screenReader.announceLoading.bind(screenReader),
    announceLoadingComplete: screenReader.announceLoadingComplete.bind(screenReader),
    clearAnnouncements: screenReader.clearAnnouncements.bind(screenReader),
    repeatLastAnnouncement: screenReader.repeatLastAnnouncement.bind(screenReader),
    isScreenReaderDetected: screenReader.isScreenReaderDetected.bind(screenReader)
  }
}