/**
 * Comprehensive Keyboard Navigation System for PromptCraft
 * Implements full keyboard accessibility with focus management, shortcuts, and navigation patterns
 */

export interface KeyboardConfig {
  enableFocusTrapping: boolean
  enableSkipLinks: boolean
  enableShortcuts: boolean
  enableRoving: boolean
  enableArrowNavigation: boolean
  focusIndicators: boolean
  customShortcuts: KeyboardShortcut[]
}

export interface KeyboardShortcut {
  keys: string[]
  action: string
  description: string
  scope: 'global' | 'component' | 'modal'
  element?: string
  preventDefault?: boolean
}

export interface FocusableElement {
  element: HTMLElement
  tabIndex: number
  role?: string
  disabled: boolean
  visible: boolean
}

export interface NavigationGroup {
  id: string
  elements: HTMLElement[]
  orientation: 'horizontal' | 'vertical' | 'both'
  wrap: boolean
  currentIndex: number
}

/**
 * Keyboard Navigation Manager
 */
export class KeyboardNavigationManager {
  private config: KeyboardConfig
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private navigationGroups: Map<string, NavigationGroup> = new Map()
  private focusStack: HTMLElement[] = []
  private skipLinks: HTMLElement[] = []
  private modalStack: HTMLElement[] = []

  constructor(config: Partial<KeyboardConfig> = {}) {
    this.config = {
      enableFocusTrapping: true,
      enableSkipLinks: true,
      enableShortcuts: true,
      enableRoving: true,
      enableArrowNavigation: true,
      focusIndicators: true,
      customShortcuts: [],
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    this.setupGlobalKeyboardHandlers()
    this.setupDefaultShortcuts()
    this.setupSkipLinks()
    this.setupFocusIndicators()
    this.setupModalHandling()
    
    // Add custom shortcuts
    this.config.customShortcuts.forEach(shortcut => {
      this.addShortcut(shortcut)
    })
  }

  /**
   * Setup global keyboard event handlers
   */
  private setupGlobalKeyboardHandlers(): void {
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this))
    document.addEventListener('keyup', this.handleGlobalKeyup.bind(this))
    document.addEventListener('focusin', this.handleFocusIn.bind(this))
    document.addEventListener('focusout', this.handleFocusOut.bind(this))
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    // Handle shortcuts
    if (this.config.enableShortcuts) {
      const shortcutKey = this.getShortcutKey(event)
      const shortcut = this.shortcuts.get(shortcutKey)
      
      if (shortcut && this.isShortcutApplicable(shortcut, event.target as HTMLElement)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        this.executeShortcut(shortcut, event)
        return
      }
    }

    // Handle modal focus trapping
    if (this.config.enableFocusTrapping && this.modalStack.length > 0) {
      this.handleModalKeydown(event)
    }

    // Handle arrow navigation
    if (this.config.enableArrowNavigation) {
      this.handleArrowNavigation(event)
    }

    // Handle tab navigation enhancements
    this.handleTabNavigation(event)
  }

  private handleGlobalKeyup(event: KeyboardEvent): void {
    // Handle any keyup-specific logic
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement
    
    // Add to focus stack
    this.focusStack.push(target)
    if (this.focusStack.length > 20) {
      this.focusStack = this.focusStack.slice(-10)
    }

    // Update roving tabindex if applicable
    this.updateRovingTabindex(target)

    // Announce focus changes for screen readers
    this.announceFocusChange(target)
  }

  private handleFocusOut(event: FocusEvent): void {
    // Handle focus out logic if needed
  }

  /**
   * Shortcut management
   */
  addShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKeyFromShortcut(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  removeShortcut(keys: string[]): void {
    const key = keys.join('+').toLowerCase()
    this.shortcuts.delete(key)
  }

  private setupDefaultShortcuts(): void {
    // Navigation shortcuts
    this.addShortcut({
      keys: ['Alt', '1'],
      action: 'skip-to-main',
      description: 'Skip to main content',
      scope: 'global'
    })

    this.addShortcut({
      keys: ['Alt', '2'],
      action: 'skip-to-nav',
      description: 'Skip to navigation',
      scope: 'global'
    })

    this.addShortcut({
      keys: ['Alt', 'h'],
      action: 'show-shortcuts',
      description: 'Show keyboard shortcuts',
      scope: 'global'
    })

    // Modal shortcuts
    this.addShortcut({
      keys: ['Escape'],
      action: 'close-modal',
      description: 'Close modal or dialog',
      scope: 'modal'
    })

    // Application shortcuts
    this.addShortcut({
      keys: ['Ctrl', 'Enter'],
      action: 'submit-form',
      description: 'Submit current form',
      scope: 'component'
    })

    this.addShortcut({
      keys: ['Alt', 'c'],
      action: 'copy-result',
      description: 'Copy enhanced prompt result',
      scope: 'component'
    })

    // Focus management shortcuts
    this.addShortcut({
      keys: ['Alt', 'b'],
      action: 'focus-previous',
      description: 'Focus previous element',
      scope: 'global'
    })

    this.addShortcut({
      keys: ['F6'],
      action: 'cycle-regions',
      description: 'Cycle through page regions',
      scope: 'global'
    })
  }

  private getShortcutKey(event: KeyboardEvent): string {
    const keys: string[] = []
    
    if (event.ctrlKey) keys.push('ctrl')
    if (event.altKey) keys.push('alt')
    if (event.shiftKey) keys.push('shift')
    if (event.metaKey) keys.push('meta')
    
    keys.push(event.key.toLowerCase())
    
    return keys.join('+')
  }

  private getShortcutKeyFromShortcut(shortcut: KeyboardShortcut): string {
    return shortcut.keys.map(k => k.toLowerCase()).join('+')
  }

  private isShortcutApplicable(shortcut: KeyboardShortcut, target: HTMLElement): boolean {
    switch (shortcut.scope) {
      case 'global':
        return true
      case 'modal':
        return this.modalStack.length > 0
      case 'component':
        return shortcut.element ? 
          target.closest(shortcut.element) !== null :
          true
      default:
        return false
    }
  }

  private executeShortcut(shortcut: KeyboardShortcut, event: KeyboardEvent): void {
    switch (shortcut.action) {
      case 'skip-to-main':
        this.skipToMain()
        break
      case 'skip-to-nav':
        this.skipToNavigation()
        break
      case 'show-shortcuts':
        this.showShortcutsHelp()
        break
      case 'close-modal':
        this.closeTopModal()
        break
      case 'submit-form':
        this.submitCurrentForm(event.target as HTMLElement)
        break
      case 'copy-result':
        this.copyResult()
        break
      case 'focus-previous':
        this.focusPrevious()
        break
      case 'cycle-regions':
        this.cycleRegions()
        break
      default:
        // Emit custom event for application-specific shortcuts
        document.dispatchEvent(new CustomEvent('keyboard-shortcut', {
          detail: { shortcut, event }
        }))
    }
  }

  /**
   * Skip link functionality
   */
  private setupSkipLinks(): void {
    if (!this.config.enableSkipLinks) return

    const skipLinksContainer = this.createSkipLinksContainer()
    
    // Main content skip link
    const skipToMain = this.createSkipLink('Skip to main content', '#main-content', 'main')
    skipLinksContainer.appendChild(skipToMain)

    // Navigation skip link
    const skipToNav = this.createSkipLink('Skip to navigation', '#navigation', 'nav')
    skipLinksContainer.appendChild(skipToNav)

    // Footer skip link
    const skipToFooter = this.createSkipLink('Skip to footer', '#footer', 'contentinfo')
    skipLinksContainer.appendChild(skipToFooter)

    document.body.insertBefore(skipLinksContainer, document.body.firstChild)
  }

  private createSkipLinksContainer(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'skip-links'
    container.setAttribute('role', 'navigation')
    container.setAttribute('aria-label', 'Skip links')
    
    // Style skip links (initially hidden, visible on focus)
    const style = document.createElement('style')
    style.textContent = `
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
      }
      
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        left: auto;
        top: auto;
        overflow: visible;
      }
    `
    document.head.appendChild(style)
    
    return container
  }

  private createSkipLink(text: string, href: string, landmark: string): HTMLElement {
    const link = document.createElement('a')
    link.href = href
    link.textContent = text
    link.className = 'skip-link'
    
    link.addEventListener('click', (event) => {
      event.preventDefault()
      this.skipToLandmark(landmark, href)
    })
    
    this.skipLinks.push(link)
    return link
  }

  private skipToLandmark(landmark: string, fallbackSelector: string): void {
    let target = document.querySelector(`[role="${landmark}"]`) as HTMLElement ||
                 document.querySelector(landmark) as HTMLElement ||
                 document.querySelector(fallbackSelector) as HTMLElement

    if (target) {
      // Make target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
      }
      
      target.focus()
      
      // Announce the skip
      this.announceSkip(landmark)
    }
  }

  private skipToMain(): void {
    this.skipToLandmark('main', '#main-content')
  }

  private skipToNavigation(): void {
    this.skipToLandmark('navigation', '#navigation')
  }

  private announceSkip(landmark: string): void {
    const message = `Skipped to ${landmark} content`
    this.announce(message, 'polite')
  }

  /**
   * Modal focus trapping
   */
  private setupModalHandling(): void {
    // Observe for modal additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            if (element.getAttribute('aria-modal') === 'true' || 
                element.getAttribute('role') === 'dialog') {
              this.handleModalOpen(element)
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private handleModalOpen(modal: HTMLElement): void {
    this.modalStack.push(modal)
    
    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement
    modal.dataset.previouslyFocused = previouslyFocused?.id || ''

    // Focus first focusable element in modal
    setTimeout(() => {
      const firstFocusable = this.getFirstFocusableElement(modal)
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }, 100)

    // Set up close handlers
    this.setupModalCloseHandlers(modal)
  }

  private handleModalKeydown(event: KeyboardEvent): void {
    const modal = this.modalStack[this.modalStack.length - 1]
    if (!modal) return

    if (event.key === 'Tab') {
      this.trapFocusInModal(event, modal)
    }
  }

  private trapFocusInModal(event: KeyboardEvent, modal: HTMLElement): void {
    const focusableElements = this.getFocusableElements(modal)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0].element
    const lastElement = focusableElements[focusableElements.length - 1].element

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  private setupModalCloseHandlers(modal: HTMLElement): void {
    // Close on backdrop click
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeModal(modal)
      }
    })

    // Close button handler
    const closeButton = modal.querySelector('[data-close], .close, .modal-close')
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeModal(modal)
      })
    }
  }

  private closeModal(modal: HTMLElement): void {
    const index = this.modalStack.indexOf(modal)
    if (index > -1) {
      this.modalStack.splice(index, 1)
    }

    // Restore focus
    const previouslyFocusedId = modal.dataset.previouslyFocused
    if (previouslyFocusedId) {
      const element = document.getElementById(previouslyFocusedId)
      if (element) {
        element.focus()
      }
    }

    // Hide modal
    modal.style.display = 'none'
    modal.setAttribute('aria-hidden', 'true')
  }

  private closeTopModal(): void {
    if (this.modalStack.length > 0) {
      const modal = this.modalStack[this.modalStack.length - 1]
      this.closeModal(modal)
    }
  }

  /**
   * Arrow key navigation
   */
  createNavigationGroup(
    id: string,
    elements: HTMLElement[],
    orientation: 'horizontal' | 'vertical' | 'both' = 'horizontal',
    wrap: boolean = true
  ): void {
    const group: NavigationGroup = {
      id,
      elements,
      orientation,
      wrap,
      currentIndex: 0
    }

    this.navigationGroups.set(id, group)
    this.setupNavigationGroupHandlers(group)
  }

  private setupNavigationGroupHandlers(group: NavigationGroup): void {
    group.elements.forEach((element, index) => {
      element.addEventListener('keydown', (event) => {
        this.handleNavigationGroupKeydown(event, group, index)
      })

      element.addEventListener('focus', () => {
        group.currentIndex = index
        this.updateRovingTabindexForGroup(group)
      })
    })

    // Initialize roving tabindex
    this.updateRovingTabindexForGroup(group)
  }

  private handleNavigationGroupKeydown(
    event: KeyboardEvent,
    group: NavigationGroup,
    currentIndex: number
  ): void {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        if (group.orientation === 'horizontal' || group.orientation === 'both') {
          event.preventDefault()
          newIndex = this.getNextIndex(currentIndex, group.elements.length, group.wrap)
        }
        break

      case 'ArrowLeft':
        if (group.orientation === 'horizontal' || group.orientation === 'both') {
          event.preventDefault()
          newIndex = this.getPreviousIndex(currentIndex, group.elements.length, group.wrap)
        }
        break

      case 'ArrowDown':
        if (group.orientation === 'vertical' || group.orientation === 'both') {
          event.preventDefault()
          newIndex = this.getNextIndex(currentIndex, group.elements.length, group.wrap)
        }
        break

      case 'ArrowUp':
        if (group.orientation === 'vertical' || group.orientation === 'both') {
          event.preventDefault()
          newIndex = this.getPreviousIndex(currentIndex, group.elements.length, group.wrap)
        }
        break

      case 'Home':
        event.preventDefault()
        newIndex = 0
        break

      case 'End':
        event.preventDefault()
        newIndex = group.elements.length - 1
        break
    }

    if (newIndex !== currentIndex) {
      group.currentIndex = newIndex
      group.elements[newIndex].focus()
    }
  }

  private getNextIndex(current: number, length: number, wrap: boolean): number {
    if (current === length - 1) {
      return wrap ? 0 : current
    }
    return current + 1
  }

  private getPreviousIndex(current: number, length: number, wrap: boolean): number {
    if (current === 0) {
      return wrap ? length - 1 : current
    }
    return current - 1
  }

  private updateRovingTabindexForGroup(group: NavigationGroup): void {
    if (!this.config.enableRoving) return

    group.elements.forEach((element, index) => {
      element.setAttribute('tabindex', index === group.currentIndex ? '0' : '-1')
    })
  }

  /**
   * General arrow navigation handling
   */
  private handleArrowNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    const role = target.getAttribute('role')

    // Handle specific roles
    switch (role) {
      case 'tablist':
        this.handleTablistNavigation(event, target)
        break
      case 'menu':
      case 'menubar':
        this.handleMenuNavigation(event, target)
        break
      case 'listbox':
        this.handleListboxNavigation(event, target)
        break
      case 'grid':
        this.handleGridNavigation(event, target)
        break
    }
  }

  private handleTablistNavigation(event: KeyboardEvent, tablist: HTMLElement): void {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')) as HTMLElement[]
    const currentIndex = tabs.indexOf(event.target as HTMLElement)

    if (currentIndex === -1) return

    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        newIndex = (currentIndex + 1) % tabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = tabs.length - 1
        break
    }

    if (newIndex !== currentIndex) {
      tabs[newIndex].focus()
      
      // Auto-activate tab if specified
      if (tablist.getAttribute('aria-orientation') !== 'vertical') {
        tabs[newIndex].click()
      }
    }
  }

  private handleMenuNavigation(event: KeyboardEvent, menu: HTMLElement): void {
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
    const currentIndex = items.indexOf(event.target as HTMLElement)

    if (currentIndex === -1) return

    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        newIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
        event.preventDefault()
        newIndex = (currentIndex - 1 + items.length) % items.length
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
      case 'Escape':
        event.preventDefault()
        this.closeMenu(menu)
        return
    }

    if (newIndex !== currentIndex) {
      items[newIndex].focus()
    }
  }

  private handleListboxNavigation(event: KeyboardEvent, listbox: HTMLElement): void {
    const options = Array.from(listbox.querySelectorAll('[role="option"]')) as HTMLElement[]
    const currentIndex = options.findIndex(option => 
      option.getAttribute('aria-selected') === 'true'
    )

    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        newIndex = Math.min(currentIndex + 1, options.length - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        newIndex = Math.max(currentIndex - 1, 0)
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = options.length - 1
        break
    }

    if (newIndex !== currentIndex && newIndex >= 0) {
      // Update selection
      options.forEach(option => option.setAttribute('aria-selected', 'false'))
      options[newIndex].setAttribute('aria-selected', 'true')
      options[newIndex].focus()
    }
  }

  private handleGridNavigation(event: KeyboardEvent, grid: HTMLElement): void {
    // Grid navigation is more complex and would need row/column calculation
    // This is a simplified version
    const cells = Array.from(grid.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
    const currentCell = event.target as HTMLElement
    const currentIndex = cells.indexOf(currentCell)

    if (currentIndex === -1) return

    // This would need proper row/column calculation for a real grid
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        newIndex = Math.min(currentIndex + 1, cells.length - 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = Math.max(currentIndex - 1, 0)
        break
      // ArrowUp/ArrowDown would need row calculation
    }

    if (newIndex !== currentIndex) {
      cells[newIndex].focus()
    }
  }

  /**
   * Focus management utilities
   */
  private getFocusableElements(container: HTMLElement = document.body): FocusableElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
    
    return elements
      .filter(element => this.isVisible(element))
      .map(element => ({
        element,
        tabIndex: parseInt(element.getAttribute('tabindex') || '0'),
        role: element.getAttribute('role') || undefined,
        disabled: element.hasAttribute('disabled'),
        visible: this.isVisible(element)
      }))
      .sort((a, b) => {
        // Sort by tabindex, then by DOM order
        if (a.tabIndex !== b.tabIndex) {
          return a.tabIndex - b.tabIndex
        }
        return 0
      })
  }

  private getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    return focusable.length > 0 ? focusable[0].element : null
  }

  private getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    return focusable.length > 0 ? focusable[focusable.length - 1].element : null
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0
  }

  /**
   * Roving tabindex management
   */
  private updateRovingTabindex(element: HTMLElement): void {
    if (!this.config.enableRoving) return

    const container = element.closest('[role="tablist"], [role="menu"], [role="menubar"], [role="listbox"]')
    if (!container) return

    const siblings = Array.from(container.children) as HTMLElement[]
    siblings.forEach(sibling => {
      if (sibling === element) {
        sibling.setAttribute('tabindex', '0')
      } else {
        sibling.setAttribute('tabindex', '-1')
      }
    })
  }

  /**
   * Focus indicators
   */
  private setupFocusIndicators(): void {
    if (!this.config.focusIndicators) return

    const style = document.createElement('style')
    style.textContent = `
      /* Enhanced focus indicators */
      *:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      /* High contrast focus for buttons */
      button:focus,
      [role="button"]:focus {
        outline: 3px solid #0066cc;
        outline-offset: 2px;
        box-shadow: 0 0 0 1px #ffffff, 0 0 0 4px #0066cc;
      }
      
      /* Focus indicators for form elements */
      input:focus,
      select:focus,
      textarea:focus {
        outline: 2px solid #0066cc;
        outline-offset: 1px;
        border-color: #0066cc;
      }
      
      /* Skip link focus */
      .skip-link:focus {
        outline: 3px solid #ffff00;
        outline-offset: 2px;
      }
      
      /* Modal focus trap indicator */
      [aria-modal="true"] {
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Utility methods for shortcut actions
   */
  private showShortcutsHelp(): void {
    const shortcuts = Array.from(this.shortcuts.values())
    const helpText = shortcuts
      .map(s => `${s.keys.join(' + ')}: ${s.description}`)
      .join('\n')

    this.announce(`Keyboard shortcuts: ${helpText}`, 'polite')
  }

  private submitCurrentForm(target: HTMLElement): void {
    const form = target.closest('form')
    if (form) {
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement
      if (submitButton) {
        submitButton.click()
      } else {
        form.submit()
      }
    }
  }

  private copyResult(): void {
    // Emit event for application to handle
    document.dispatchEvent(new CustomEvent('copy-result-requested'))
  }

  private focusPrevious(): void {
    if (this.focusStack.length > 1) {
      const previous = this.focusStack[this.focusStack.length - 2]
      if (previous && document.contains(previous)) {
        previous.focus()
      }
    }
  }

  private cycleRegions(): void {
    const regions = [
      document.querySelector('[role="banner"], header'),
      document.querySelector('[role="navigation"], nav'),
      document.querySelector('[role="main"], main'),
      document.querySelector('[role="complementary"], aside'),
      document.querySelector('[role="contentinfo"], footer')
    ].filter(Boolean) as HTMLElement[]

    if (regions.length === 0) return

    const currentRegion = regions.find(region => region.contains(document.activeElement))
    const currentIndex = currentRegion ? regions.indexOf(currentRegion) : -1
    const nextIndex = (currentIndex + 1) % regions.length

    const nextRegion = regions[nextIndex]
    if (!nextRegion.hasAttribute('tabindex')) {
      nextRegion.setAttribute('tabindex', '-1')
    }
    nextRegion.focus()

    this.announce(`Focused ${nextRegion.tagName.toLowerCase()} region`, 'polite')
  }

  private closeMenu(menu: HTMLElement): void {
    menu.style.display = 'none'
    menu.setAttribute('aria-hidden', 'true')

    // Focus the trigger element
    const trigger = document.querySelector(`[aria-controls="${menu.id}"]`) as HTMLElement
    if (trigger) {
      trigger.focus()
    }
  }

  /**
   * Announcement utility
   */
  private announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const regionId = priority === 'assertive' ? 'aria-alerts' : 'aria-status'
    const region = document.getElementById(regionId)
    
    if (region) {
      region.textContent = ''
      setTimeout(() => {
        region.textContent = message
      }, 10)
    }
  }

  /**
   * Public API methods
   */
  focusElement(selector: string | HTMLElement): boolean {
    const element = typeof selector === 'string' ? 
      document.querySelector(selector) as HTMLElement : 
      selector

    if (element && this.isVisible(element)) {
      element.focus()
      return true
    }
    return false
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  enableFocusTrapping(enable: boolean): void {
    this.config.enableFocusTrapping = enable
  }

  createSkipLink(text: string, target: string): HTMLElement {
    return this.createSkipLink(text, target, '')
  }
}

/**
 * Default keyboard navigation manager
 */
export const keyboardNav = new KeyboardNavigationManager({
  enableFocusTrapping: true,
  enableSkipLinks: true,
  enableShortcuts: true,
  enableRoving: true,
  enableArrowNavigation: true,
  focusIndicators: true
})

/**
 * React hook for keyboard navigation
 */
export function useKeyboardNavigation() {
  return {
    addShortcut: keyboardNav.addShortcut.bind(keyboardNav),
    removeShortcut: keyboardNav.removeShortcut.bind(keyboardNav),
    createNavigationGroup: keyboardNav.createNavigationGroup.bind(keyboardNav),
    focusElement: keyboardNav.focusElement.bind(keyboardNav),
    getShortcuts: keyboardNav.getShortcuts.bind(keyboardNav)
  }
}