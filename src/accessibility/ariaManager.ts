/**
 * ARIA Manager for PromptCraft
 * Comprehensive ARIA attributes, labels, and accessibility state management
 */

export interface AriaConfig {
  announcements: boolean
  liveRegions: boolean
  describedBy: boolean
  labelledBy: boolean
  expanded: boolean
  selected: boolean
  pressed: boolean
  checked: boolean
  disabled: boolean
  invalid: boolean
  required: boolean
  readonly: boolean
  hidden: boolean
}

export interface AriaLabel {
  id: string
  text: string
  context?: string
  level?: number
  type: 'label' | 'description' | 'error' | 'help' | 'status'
}

export interface AriaLiveRegion {
  id: string
  politeness: 'off' | 'polite' | 'assertive'
  atomic: boolean
  relevant: 'additions' | 'removals' | 'text' | 'all'
  busy: boolean
}

export interface KeyboardShortcut {
  key: string
  modifiers: string[]
  action: string
  description: string
  scope: 'global' | 'local'
  element?: string
}

/**
 * ARIA Manager Class
 */
export class AriaManager {
  private config: AriaConfig
  private labels: Map<string, AriaLabel> = new Map()
  private liveRegions: Map<string, AriaLiveRegion> = new Map()
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private focusHistory: string[] = []
  private announcements: string[] = []

  constructor(config: Partial<AriaConfig> = {}) {
    this.config = {
      announcements: true,
      liveRegions: true,
      describedBy: true,
      labelledBy: true,
      expanded: true,
      selected: true,
      pressed: true,
      checked: true,
      disabled: true,
      invalid: true,
      required: true,
      readonly: true,
      hidden: true,
      ...config
    }

    this.initializeAriaSupport()
  }

  private initializeAriaSupport(): void {
    // Create global live regions
    this.createLiveRegion('aria-status', 'polite', true, 'all')
    this.createLiveRegion('aria-alerts', 'assertive', true, 'all')
    this.createLiveRegion('aria-log', 'polite', false, 'additions')

    // Set up global keyboard shortcuts
    this.setupGlobalShortcuts()

    // Initialize focus management
    this.initializeFocusManagement()
  }

  /**
   * Create and manage ARIA labels
   */
  createLabel(id: string, text: string, type: AriaLabel['type'] = 'label', context?: string): string {
    const label: AriaLabel = {
      id: `aria-${type}-${id}`,
      text,
      context,
      type
    }

    this.labels.set(id, label)
    
    // Create DOM element for the label
    this.createLabelElement(label)
    
    return label.id
  }

  private createLabelElement(label: AriaLabel): void {
    const existing = document.getElementById(label.id)
    if (existing) {
      existing.textContent = label.text
      return
    }

    const element = document.createElement('span')
    element.id = label.id
    element.textContent = label.text
    element.className = `aria-${label.type} sr-only`
    element.setAttribute('aria-hidden', 'true')

    // Add to document
    document.body.appendChild(element)
  }

  /**
   * Update existing label
   */
  updateLabel(id: string, text: string): void {
    const label = this.labels.get(id)
    if (label) {
      label.text = text
      this.createLabelElement(label)
    }
  }

  /**
   * Create live regions for dynamic content
   */
  createLiveRegion(
    id: string,
    politeness: AriaLiveRegion['politeness'] = 'polite',
    atomic: boolean = true,
    relevant: AriaLiveRegion['relevant'] = 'all'
  ): string {
    const region: AriaLiveRegion = {
      id,
      politeness,
      atomic,
      relevant,
      busy: false
    }

    this.liveRegions.set(id, region)
    this.createLiveRegionElement(region)
    
    return id
  }

  private createLiveRegionElement(region: AriaLiveRegion): void {
    const existing = document.getElementById(region.id)
    if (existing) return

    const element = document.createElement('div')
    element.id = region.id
    element.setAttribute('aria-live', region.politeness)
    element.setAttribute('aria-atomic', region.atomic.toString())
    element.setAttribute('aria-relevant', region.relevant)
    element.setAttribute('aria-busy', region.busy.toString())
    element.className = 'sr-only'

    document.body.appendChild(element)
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.announcements) return

    const regionId = priority === 'assertive' ? 'aria-alerts' : 'aria-status'
    const region = document.getElementById(regionId)
    
    if (region) {
      // Clear and set new message
      region.textContent = ''
      setTimeout(() => {
        region.textContent = message
      }, 10)

      // Track announcements
      this.announcements.push(`${new Date().toISOString()}: ${message}`)
      
      // Limit announcement history
      if (this.announcements.length > 50) {
        this.announcements = this.announcements.slice(-25)
      }
    }
  }

  /**
   * Set ARIA attributes on elements
   */
  setAriaAttributes(element: HTMLElement, attributes: Record<string, string | boolean | number>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`
      
      if (typeof value === 'boolean') {
        element.setAttribute(ariaKey, value.toString())
      } else {
        element.setAttribute(ariaKey, value.toString())
      }
    })
  }

  /**
   * Enhanced form field labeling
   */
  labelFormField(
    fieldElement: HTMLElement,
    labelText: string,
    options: {
      required?: boolean
      invalid?: boolean
      description?: string
      errorMessage?: string
      helpText?: string
    } = {}
  ): void {
    const fieldId = fieldElement.id || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    if (!fieldElement.id) fieldElement.id = fieldId

    // Create main label
    const labelId = this.createLabel(fieldId, labelText, 'label')
    fieldElement.setAttribute('aria-labelledby', labelId)

    // Handle required fields
    if (options.required) {
      fieldElement.setAttribute('aria-required', 'true')
      const requiredId = this.createLabel(`${fieldId}-required`, '(required)', 'label')
      const existingLabelledBy = fieldElement.getAttribute('aria-labelledby') || ''
      fieldElement.setAttribute('aria-labelledby', `${existingLabelledBy} ${requiredId}`.trim())
    }

    // Handle invalid fields
    if (options.invalid) {
      fieldElement.setAttribute('aria-invalid', 'true')
      if (options.errorMessage) {
        const errorId = this.createLabel(`${fieldId}-error`, options.errorMessage, 'error')
        fieldElement.setAttribute('aria-describedby', this.addToDescribedBy(fieldElement, errorId))
      }
    }

    // Handle descriptions
    if (options.description) {
      const descId = this.createLabel(`${fieldId}-desc`, options.description, 'description')
      fieldElement.setAttribute('aria-describedby', this.addToDescribedBy(fieldElement, descId))
    }

    // Handle help text
    if (options.helpText) {
      const helpId = this.createLabel(`${fieldId}-help`, options.helpText, 'help')
      fieldElement.setAttribute('aria-describedby', this.addToDescribedBy(fieldElement, helpId))
    }
  }

  private addToDescribedBy(element: HTMLElement, newId: string): string {
    const existing = element.getAttribute('aria-describedby') || ''
    const ids = existing.split(' ').filter(id => id.length > 0)
    if (!ids.includes(newId)) {
      ids.push(newId)
    }
    return ids.join(' ')
  }

  /**
   * Button accessibility enhancement
   */
  enhanceButton(
    button: HTMLElement,
    options: {
      label?: string
      description?: string
      pressed?: boolean
      expanded?: boolean
      controls?: string
      hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
    } = {}
  ): void {
    // Ensure button role
    if (!button.getAttribute('role') && button.tagName !== 'BUTTON') {
      button.setAttribute('role', 'button')
    }

    // Ensure tabindex for non-button elements
    if (button.tagName !== 'BUTTON' && !button.hasAttribute('tabindex')) {
      button.setAttribute('tabindex', '0')
    }

    // Set label
    if (options.label) {
      const labelId = this.createLabel(button.id || `btn-${Date.now()}`, options.label, 'label')
      button.setAttribute('aria-labelledby', labelId)
    }

    // Set description
    if (options.description) {
      const descId = this.createLabel(`${button.id}-desc`, options.description, 'description')
      button.setAttribute('aria-describedby', descId)
    }

    // Set pressed state
    if (options.pressed !== undefined) {
      button.setAttribute('aria-pressed', options.pressed.toString())
    }

    // Set expanded state
    if (options.expanded !== undefined) {
      button.setAttribute('aria-expanded', options.expanded.toString())
    }

    // Set controls
    if (options.controls) {
      button.setAttribute('aria-controls', options.controls)
    }

    // Set popup indicator
    if (options.hasPopup) {
      const popupValue = typeof options.hasPopup === 'boolean' ? 'true' : options.hasPopup
      button.setAttribute('aria-haspopup', popupValue)
    }
  }

  /**
   * Progress indicator accessibility
   */
  enhanceProgressIndicator(
    element: HTMLElement,
    options: {
      label?: string
      value?: number
      max?: number
      indeterminate?: boolean
      description?: string
    }
  ): void {
    element.setAttribute('role', 'progressbar')

    if (options.label) {
      const labelId = this.createLabel(`${element.id}-label`, options.label, 'label')
      element.setAttribute('aria-labelledby', labelId)
    }

    if (options.description) {
      const descId = this.createLabel(`${element.id}-desc`, options.description, 'description')
      element.setAttribute('aria-describedby', descId)
    }

    if (options.indeterminate) {
      element.removeAttribute('aria-valuenow')
      element.removeAttribute('aria-valuemax')
    } else {
      if (options.value !== undefined) {
        element.setAttribute('aria-valuenow', options.value.toString())
      }
      if (options.max !== undefined) {
        element.setAttribute('aria-valuemax', options.max.toString())
      }
      element.setAttribute('aria-valuemin', '0')
    }
  }

  /**
   * Dialog accessibility enhancement
   */
  enhanceDialog(
    dialog: HTMLElement,
    options: {
      title?: string
      description?: string
      modal?: boolean
      closeButton?: HTMLElement
    }
  ): void {
    dialog.setAttribute('role', 'dialog')
    
    if (options.modal) {
      dialog.setAttribute('aria-modal', 'true')
    }

    if (options.title) {
      const titleId = this.createLabel(`${dialog.id}-title`, options.title, 'label')
      dialog.setAttribute('aria-labelledby', titleId)
    }

    if (options.description) {
      const descId = this.createLabel(`${dialog.id}-desc`, options.description, 'description')
      dialog.setAttribute('aria-describedby', descId)
    }

    // Ensure dialog is focusable
    if (!dialog.hasAttribute('tabindex')) {
      dialog.setAttribute('tabindex', '-1')
    }

    // Enhance close button
    if (options.closeButton) {
      this.enhanceButton(options.closeButton, {
        label: 'Close dialog',
        description: 'Closes the current dialog and returns to the main content'
      })
    }
  }

  /**
   * List and menu accessibility
   */
  enhanceList(
    list: HTMLElement,
    options: {
      type: 'list' | 'menu' | 'menubar' | 'listbox'
      label?: string
      multiselectable?: boolean
      orientation?: 'horizontal' | 'vertical'
    }
  ): void {
    list.setAttribute('role', options.type)

    if (options.label) {
      const labelId = this.createLabel(`${list.id}-label`, options.label, 'label')
      list.setAttribute('aria-labelledby', labelId)
    }

    if (options.multiselectable) {
      list.setAttribute('aria-multiselectable', 'true')
    }

    if (options.orientation) {
      list.setAttribute('aria-orientation', options.orientation)
    }

    // Enhance list items
    const items = list.querySelectorAll('li, [role="menuitem"], [role="option"]')
    items.forEach((item, index) => {
      this.enhanceListItem(item as HTMLElement, {
        position: index + 1,
        total: items.length,
        type: options.type
      })
    })
  }

  private enhanceListItem(
    item: HTMLElement,
    options: {
      position: number
      total: number
      type: string
    }
  ): void {
    // Set appropriate role
    if (!item.getAttribute('role')) {
      const role = options.type === 'menu' || options.type === 'menubar' ? 'menuitem' :
                   options.type === 'listbox' ? 'option' : 'listitem'
      item.setAttribute('role', role)
    }

    // Set position in set
    item.setAttribute('aria-posinset', options.position.toString())
    item.setAttribute('aria-setsize', options.total.toString())

    // Ensure focusable for interactive items
    if (options.type !== 'list' && !item.hasAttribute('tabindex')) {
      item.setAttribute('tabindex', '-1')
    }
  }

  /**
   * Status and alert management
   */
  createStatus(message: string, type: 'status' | 'alert' | 'error' | 'success' = 'status'): string {
    const statusId = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const element = document.createElement('div')
    element.id = statusId
    element.textContent = message
    element.className = `status-message status-${type}`
    
    // Set appropriate ARIA attributes
    switch (type) {
      case 'alert':
      case 'error':
        element.setAttribute('role', 'alert')
        element.setAttribute('aria-live', 'assertive')
        break
      case 'status':
      case 'success':
        element.setAttribute('role', 'status')
        element.setAttribute('aria-live', 'polite')
        break
    }

    element.setAttribute('aria-atomic', 'true')
    
    // Add to appropriate container or body
    const container = document.querySelector('.status-container') || document.body
    container.appendChild(element)

    // Auto-remove after delay for non-persistent messages
    if (type !== 'error') {
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      }, 5000)
    }

    return statusId
  }

  /**
   * Keyboard shortcut management
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = `${shortcut.modifiers.join('+')}+${shortcut.key}`.toLowerCase()
    this.shortcuts.set(key, shortcut)
  }

  private setupGlobalShortcuts(): void {
    // Common accessibility shortcuts
    this.registerShortcut({
      key: 'h',
      modifiers: ['alt'],
      action: 'show-shortcuts',
      description: 'Show keyboard shortcuts help',
      scope: 'global'
    })

    this.registerShortcut({
      key: 'escape',
      modifiers: [],
      action: 'close-modal',
      description: 'Close modal or dialog',
      scope: 'global'
    })

    this.registerShortcut({
      key: '1',
      modifiers: ['alt'],
      action: 'main-content',
      description: 'Skip to main content',
      scope: 'global'
    })

    // Set up keyboard event listener
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this))
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')

    const key = `${modifiers.join('+')}+${event.key}`.toLowerCase()
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      this.executeShortcut(shortcut)
    }
  }

  private executeShortcut(shortcut: KeyboardShortcut): void {
    switch (shortcut.action) {
      case 'show-shortcuts':
        this.showKeyboardShortcuts()
        break
      case 'close-modal':
        this.closeTopModal()
        break
      case 'main-content':
        this.focusMainContent()
        break
      default:
        // Emit custom event for application-specific shortcuts
        document.dispatchEvent(new CustomEvent('aria-shortcut', {
          detail: shortcut
        }))
    }
  }

  /**
   * Focus management
   */
  private initializeFocusManagement(): void {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target.id) {
        this.focusHistory.push(target.id)
        if (this.focusHistory.length > 10) {
          this.focusHistory = this.focusHistory.slice(-5)
        }
      }
    })

    // Handle focus trapping in modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event)
      }
    })
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    const modal = document.querySelector('[aria-modal="true"]') as HTMLElement
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  /**
   * Utility methods
   */
  private showKeyboardShortcuts(): void {
    const shortcuts = Array.from(this.shortcuts.values())
    const shortcutList = shortcuts.map(s => 
      `${s.modifiers.join(' + ')} + ${s.key}: ${s.description}`
    ).join('\n')

    this.announce(`Keyboard shortcuts: ${shortcutList}`, 'polite')
  }

  private closeTopModal(): void {
    const modal = document.querySelector('[aria-modal="true"]') as HTMLElement
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], .close-button') as HTMLElement
      if (closeButton) {
        closeButton.click()
      } else {
        // Hide modal and restore focus
        modal.style.display = 'none'
        modal.setAttribute('aria-hidden', 'true')
        this.restoreFocus()
      }
    }
  }

  private focusMainContent(): void {
    const main = document.querySelector('main, [role="main"], #main-content') as HTMLElement
    if (main) {
      main.focus()
      this.announce('Focused main content', 'polite')
    }
  }

  private restoreFocus(): void {
    if (this.focusHistory.length > 0) {
      const lastFocusedId = this.focusHistory[this.focusHistory.length - 2] // Skip current
      const element = document.getElementById(lastFocusedId)
      if (element) {
        element.focus()
      }
    }
  }

  /**
   * Validation and testing
   */
  validateAccessibility(): {
    errors: string[]
    warnings: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check for missing alt text on images
    const images = document.querySelectorAll('img:not([alt])')
    if (images.length > 0) {
      errors.push(`${images.length} images missing alt text`)
    }

    // Check for missing form labels
    const unlabeledInputs = document.querySelectorAll('input:not([aria-labelledby]):not([aria-label]):not([title])')
    if (unlabeledInputs.length > 0) {
      errors.push(`${unlabeledInputs.length} form inputs missing labels`)
    }

    // Check for missing headings structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings.length === 0) {
      warnings.push('No heading structure found')
    }

    // Check for missing main landmark
    const main = document.querySelector('main, [role="main"]')
    if (!main) {
      warnings.push('No main landmark found')
    }

    // Check for missing skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]:first-child')
    if (skipLinks.length === 0) {
      suggestions.push('Consider adding skip navigation links')
    }

    return { errors, warnings, suggestions }
  }

  /**
   * Get accessibility report
   */
  getAccessibilityReport(): {
    labels: number
    liveRegions: number
    shortcuts: number
    announcements: number
    focusHistory: string[]
    validation: ReturnType<typeof this.validateAccessibility>
  } {
    return {
      labels: this.labels.size,
      liveRegions: this.liveRegions.size,
      shortcuts: this.shortcuts.size,
      announcements: this.announcements.length,
      focusHistory: [...this.focusHistory],
      validation: this.validateAccessibility()
    }
  }
}

/**
 * Default ARIA manager instance
 */
export const ariaManager = new AriaManager({
  announcements: true,
  liveRegions: true,
  describedBy: true,
  labelledBy: true
})

/**
 * React hook for ARIA management
 */
export function useAria() {
  return {
    announce: ariaManager.announce.bind(ariaManager),
    createLabel: ariaManager.createLabel.bind(ariaManager),
    updateLabel: ariaManager.updateLabel.bind(ariaManager),
    setAriaAttributes: ariaManager.setAriaAttributes.bind(ariaManager),
    labelFormField: ariaManager.labelFormField.bind(ariaManager),
    enhanceButton: ariaManager.enhanceButton.bind(ariaManager),
    enhanceDialog: ariaManager.enhanceDialog.bind(ariaManager),
    createStatus: ariaManager.createStatus.bind(ariaManager),
    registerShortcut: ariaManager.registerShortcut.bind(ariaManager)
  }
}