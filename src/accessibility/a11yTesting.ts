/**
 * Accessibility Testing and Validation System for PromptCraft
 * Comprehensive automated and manual accessibility testing tools
 */

export interface A11yTestConfig {
  enableAutomatedTests: boolean
  enableManualChecks: boolean
  enablePerformanceTests: boolean
  enableColorContrastTests: boolean
  enableKeyboardTests: boolean
  enableScreenReaderTests: boolean
  wcagLevel: 'A' | 'AA' | 'AAA'
  reportFormat: 'json' | 'html' | 'console'
  outputPath?: string
}

export interface A11yTestResult {
  id: string
  rule: string
  level: 'A' | 'AA' | 'AAA'
  severity: 'error' | 'warning' | 'info'
  element?: HTMLElement
  selector?: string
  message: string
  description: string
  helpUrl?: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  tags: string[]
}

export interface A11yReport {
  timestamp: Date
  url: string
  title: string
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
    incomplete: number
  }
  results: A11yTestResult[]
  performance: {
    testDuration: number
    elementsScanned: number
  }
  wcagCompliance: {
    level: string
    compliant: boolean
    violations: number
  }
}

export interface ColorContrastResult {
  foreground: string
  background: string
  ratio: number
  aaPass: boolean
  aaaPass: boolean
  element: HTMLElement
  selector: string
}

export interface KeyboardTestResult {
  element: HTMLElement
  selector: string
  focusable: boolean
  tabIndex: number
  hasVisibleFocus: boolean
  hasAriaLabel: boolean
  issues: string[]
}

/**
 * Accessibility Testing Manager
 */
export class A11yTester {
  private config: A11yTestConfig
  private testResults: A11yTestResult[] = []
  private performanceMetrics: any = {}

  constructor(config: Partial<A11yTestConfig> = {}) {
    this.config = {
      enableAutomatedTests: true,
      enableManualChecks: true,
      enablePerformanceTests: true,
      enableColorContrastTests: true,
      enableKeyboardTests: true,
      enableScreenReaderTests: true,
      wcagLevel: 'AA',
      reportFormat: 'console',
      ...config
    }
  }

  /**
   * Run comprehensive accessibility tests
   */
  async runTests(): Promise<A11yReport> {
    const startTime = Date.now()
    this.testResults = []

    console.log('🔍 Running accessibility tests...')

    // Run different test categories
    if (this.config.enableAutomatedTests) {
      await this.runAutomatedTests()
    }

    if (this.config.enableColorContrastTests) {
      await this.runColorContrastTests()
    }

    if (this.config.enableKeyboardTests) {
      await this.runKeyboardTests()
    }

    if (this.config.enableScreenReaderTests) {
      await this.runScreenReaderTests()
    }

    if (this.config.enableManualChecks) {
      await this.runManualChecks()
    }

    const endTime = Date.now()
    const testDuration = endTime - startTime

    // Generate report
    const report = this.generateReport(testDuration)

    // Output report
    await this.outputReport(report)

    return report
  }

  /**
   * Automated accessibility tests
   */
  private async runAutomatedTests(): Promise<void> {
    console.log('  📋 Running automated WCAG tests...')

    // Test 1: Missing alt text on images
    this.testImageAltText()

    // Test 2: Form labels
    this.testFormLabels()

    // Test 3: Heading structure
    this.testHeadingStructure()

    // Test 4: Landmark roles
    this.testLandmarkRoles()

    // Test 5: ARIA attributes
    this.testAriaAttributes()

    // Test 6: Focus management
    this.testFocusManagement()

    // Test 7: Color contrast (basic)
    this.testBasicColorContrast()

    // Test 8: Interactive elements
    this.testInteractiveElements()

    // Test 9: Language attributes
    this.testLanguageAttributes()

    // Test 10: Page structure
    this.testPageStructure()
  }

  private testImageAltText(): void {
    const images = document.querySelectorAll('img')
    
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt')
      const src = img.getAttribute('src')
      
      if (alt === null) {
        this.addResult({
          id: `img-alt-${index}`,
          rule: 'image-alt',
          level: 'A',
          severity: 'error',
          element: img,
          selector: this.getSelector(img),
          message: 'Image missing alt attribute',
          description: 'All images must have an alt attribute for screen readers',
          impact: 'serious',
          tags: ['wcag2a', 'images']
        })
      } else if (alt === '' && !this.isDecorativeImage(img)) {
        this.addResult({
          id: `img-alt-empty-${index}`,
          rule: 'image-alt',
          level: 'A',
          severity: 'warning',
          element: img,
          selector: this.getSelector(img),
          message: 'Image has empty alt attribute but may not be decorative',
          description: 'Empty alt attributes should only be used for decorative images',
          impact: 'moderate',
          tags: ['wcag2a', 'images']
        })
      }
    })
  }

  private testFormLabels(): void {
    const formControls = document.querySelectorAll('input, select, textarea')
    
    formControls.forEach((control, index) => {
      const element = control as HTMLElement
      const type = element.getAttribute('type')
      
      // Skip hidden inputs
      if (type === 'hidden') return

      const hasLabel = this.hasLabel(element)
      const hasAriaLabel = element.hasAttribute('aria-label')
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby')
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        this.addResult({
          id: `form-label-${index}`,
          rule: 'form-label',
          level: 'A',
          severity: 'error',
          element,
          selector: this.getSelector(element),
          message: 'Form control missing accessible label',
          description: 'All form controls must have an accessible label',
          impact: 'serious',
          tags: ['wcag2a', 'forms']
        })
      }
    })
  }

  private testHeadingStructure(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    
    if (headings.length === 0) {
      this.addResult({
        id: 'no-headings',
        rule: 'heading-structure',
        level: 'AA',
        severity: 'warning',
        message: 'Page has no heading structure',
        description: 'Pages should have a logical heading structure for navigation',
        impact: 'moderate',
        tags: ['wcag2aa', 'structure']
      })
      return
    }

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      
      // Check for h1
      if (index === 0 && level !== 1) {
        this.addResult({
          id: 'first-heading-not-h1',
          rule: 'heading-structure',
          level: 'AA',
          severity: 'warning',
          element: heading as HTMLElement,
          selector: this.getSelector(heading as HTMLElement),
          message: 'First heading is not h1',
          description: 'The first heading on a page should typically be h1',
          impact: 'moderate',
          tags: ['wcag2aa', 'structure']
        })
      }

      // Check for skipped levels
      if (level > previousLevel + 1) {
        this.addResult({
          id: `heading-skip-${index}`,
          rule: 'heading-structure',
          level: 'AA',
          severity: 'error',
          element: heading as HTMLElement,
          selector: this.getSelector(heading as HTMLElement),
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          description: 'Heading levels should not be skipped',
          impact: 'serious',
          tags: ['wcag2aa', 'structure']
        })
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        this.addResult({
          id: `heading-empty-${index}`,
          rule: 'heading-content',
          level: 'A',
          severity: 'error',
          element: heading as HTMLElement,
          selector: this.getSelector(heading as HTMLElement),
          message: 'Heading is empty',
          description: 'Headings must contain descriptive text',
          impact: 'serious',
          tags: ['wcag2a', 'structure']
        })
      }

      previousLevel = level
    })
  }

  private testLandmarkRoles(): void {
    const requiredLandmarks = ['main', 'navigation', 'banner', 'contentinfo']
    const foundLandmarks: string[] = []

    // Check for semantic HTML landmarks
    const semanticLandmarks = {
      'main': document.querySelector('main'),
      'navigation': document.querySelector('nav'),
      'banner': document.querySelector('header'),
      'contentinfo': document.querySelector('footer')
    }

    // Check for ARIA landmarks
    requiredLandmarks.forEach(landmark => {
      const ariaElement = document.querySelector(`[role="${landmark}"]`)
      const semanticElement = semanticLandmarks[landmark as keyof typeof semanticLandmarks]
      
      if (ariaElement || semanticElement) {
        foundLandmarks.push(landmark)
      } else {
        this.addResult({
          id: `missing-landmark-${landmark}`,
          rule: 'landmark-roles',
          level: 'AA',
          severity: 'warning',
          message: `Missing ${landmark} landmark`,
          description: `Pages should have a ${landmark} landmark for navigation`,
          impact: 'moderate',
          tags: ['wcag2aa', 'landmarks']
        })
      }
    })

    // Check for multiple main landmarks
    const mainElements = document.querySelectorAll('main, [role="main"]')
    if (mainElements.length > 1) {
      this.addResult({
        id: 'multiple-main',
        rule: 'landmark-roles',
        level: 'A',
        severity: 'error',
        message: 'Multiple main landmarks found',
        description: 'A page should have only one main landmark',
        impact: 'serious',
        tags: ['wcag2a', 'landmarks']
      })
    }
  }

  private testAriaAttributes(): void {
    const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby]')
    
    elementsWithAria.forEach((element, index) => {
      const labelledBy = element.getAttribute('aria-labelledby')
      const describedBy = element.getAttribute('aria-describedby')
      
      // Check aria-labelledby references
      if (labelledBy) {
        const ids = labelledBy.split(' ')
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.addResult({
              id: `aria-labelledby-${index}-${id}`,
              rule: 'aria-valid-attr-value',
              level: 'A',
              severity: 'error',
              element: element as HTMLElement,
              selector: this.getSelector(element as HTMLElement),
              message: `aria-labelledby references non-existent element: ${id}`,
              description: 'ARIA labelledby must reference existing elements',
              impact: 'serious',
              tags: ['wcag2a', 'aria']
            })
          }
        })
      }

      // Check aria-describedby references
      if (describedBy) {
        const ids = describedBy.split(' ')
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.addResult({
              id: `aria-describedby-${index}-${id}`,
              rule: 'aria-valid-attr-value',
              level: 'A',
              severity: 'error',
              element: element as HTMLElement,
              selector: this.getSelector(element as HTMLElement),
              message: `aria-describedby references non-existent element: ${id}`,
              description: 'ARIA describedby must reference existing elements',
              impact: 'serious',
              tags: ['wcag2a', 'aria']
            })
          }
        })
      }
    })
  }

  private testFocusManagement(): void {
    const focusableElements = this.getFocusableElements()
    
    focusableElements.forEach((element, index) => {
      // Check for visible focus indicators
      const computedStyle = window.getComputedStyle(element)
      const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px'
      const hasBoxShadow = computedStyle.boxShadow !== 'none'
      const hasBorder = computedStyle.border !== 'none'
      
      if (!hasOutline && !hasBoxShadow && !hasBorder) {
        this.addResult({
          id: `focus-indicator-${index}`,
          rule: 'focus-visible',
          level: 'AA',
          severity: 'error',
          element,
          selector: this.getSelector(element),
          message: 'Focusable element may lack visible focus indicator',
          description: 'All focusable elements must have a visible focus indicator',
          impact: 'serious',
          tags: ['wcag2aa', 'keyboard']
        })
      }

      // Check tabindex values
      const tabIndex = element.getAttribute('tabindex')
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addResult({
          id: `positive-tabindex-${index}`,
          rule: 'tabindex',
          level: 'A',
          severity: 'warning',
          element,
          selector: this.getSelector(element),
          message: 'Positive tabindex found',
          description: 'Positive tabindex values can disrupt natural tab order',
          impact: 'moderate',
          tags: ['wcag2a', 'keyboard']
        })
      }
    })
  }

  private testBasicColorContrast(): void {
    const textElements = document.querySelectorAll('p, span, div, a, button, label, h1, h2, h3, h4, h5, h6')
    
    textElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement
      const style = window.getComputedStyle(htmlElement)
      const fontSize = parseFloat(style.fontSize)
      const fontWeight = style.fontWeight
      
      // Skip if no text content
      if (!htmlElement.textContent?.trim()) return

      const foreground = style.color
      const background = this.getBackgroundColor(htmlElement)
      
      if (foreground && background) {
        const ratio = this.calculateContrastRatio(foreground, background)
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))
        
        const aaThreshold = isLargeText ? 3 : 4.5
        const aaaThreshold = isLargeText ? 4.5 : 7
        
        if (ratio < aaThreshold) {
          this.addResult({
            id: `color-contrast-${index}`,
            rule: 'color-contrast',
            level: 'AA',
            severity: 'error',
            element: htmlElement,
            selector: this.getSelector(htmlElement),
            message: `Insufficient color contrast: ${ratio.toFixed(2)}:1 (minimum ${aaThreshold}:1)`,
            description: 'Text must have sufficient contrast against its background',
            impact: 'serious',
            tags: ['wcag2aa', 'color']
          })
        } else if (this.config.wcagLevel === 'AAA' && ratio < aaaThreshold) {
          this.addResult({
            id: `color-contrast-aaa-${index}`,
            rule: 'color-contrast-enhanced',
            level: 'AAA',
            severity: 'warning',
            element: htmlElement,
            selector: this.getSelector(htmlElement),
            message: `Insufficient color contrast for AAA: ${ratio.toFixed(2)}:1 (minimum ${aaaThreshold}:1)`,
            description: 'Enhanced contrast requirements for AAA compliance',
            impact: 'moderate',
            tags: ['wcag2aaa', 'color']
          })
        }
      }
    })
  }

  private testInteractiveElements(): void {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]')
    
    interactiveElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement
      
      // Check minimum size (44x44px for touch targets)
      const rect = htmlElement.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        this.addResult({
          id: `touch-target-${index}`,
          rule: 'target-size',
          level: 'AAA',
          severity: 'warning',
          element: htmlElement,
          selector: this.getSelector(htmlElement),
          message: `Touch target too small: ${rect.width}x${rect.height}px (minimum 44x44px)`,
          description: 'Interactive elements should be at least 44x44 pixels for touch accessibility',
          impact: 'moderate',
          tags: ['wcag2aaa', 'touch']
        })
      }

      // Check for accessible name
      const accessibleName = this.getAccessibleName(htmlElement)
      if (!accessibleName && htmlElement.tagName !== 'INPUT') {
        this.addResult({
          id: `accessible-name-${index}`,
          rule: 'accessible-name',
          level: 'A',
          severity: 'error',
          element: htmlElement,
          selector: this.getSelector(htmlElement),
          message: 'Interactive element lacks accessible name',
          description: 'All interactive elements must have an accessible name',
          impact: 'serious',
          tags: ['wcag2a', 'names']
        })
      }
    })
  }

  private testLanguageAttributes(): void {
    const html = document.documentElement
    const lang = html.getAttribute('lang')
    
    if (!lang) {
      this.addResult({
        id: 'html-lang',
        rule: 'html-has-lang',
        level: 'A',
        severity: 'error',
        element: html,
        selector: 'html',
        message: 'HTML element missing lang attribute',
        description: 'The html element must have a lang attribute to identify the page language',
        impact: 'serious',
        tags: ['wcag2a', 'language']
      })
    } else if (!this.isValidLanguageCode(lang)) {
      this.addResult({
        id: 'html-lang-valid',
        rule: 'valid-lang',
        level: 'A',
        severity: 'error',
        element: html,
        selector: 'html',
        message: `Invalid language code: ${lang}`,
        description: 'The lang attribute must contain a valid language code',
        impact: 'moderate',
        tags: ['wcag2a', 'language']
      })
    }
  }

  private testPageStructure(): void {
    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]')
    const hasSkipLink = Array.from(skipLinks).some(link => 
      link.textContent?.toLowerCase().includes('skip') ||
      link.textContent?.toLowerCase().includes('jump')
    )

    if (!hasSkipLink) {
      this.addResult({
        id: 'skip-link',
        rule: 'skip-link',
        level: 'A',
        severity: 'warning',
        message: 'No skip navigation link found',
        description: 'Pages should provide a way to skip repetitive navigation',
        impact: 'moderate',
        tags: ['wcag2a', 'navigation']
      })
    }

    // Check page title
    const title = document.title
    if (!title || title.trim().length === 0) {
      this.addResult({
        id: 'page-title',
        rule: 'document-title',
        level: 'A',
        severity: 'error',
        message: 'Page missing title',
        description: 'Every page must have a descriptive title',
        impact: 'serious',
        tags: ['wcag2a', 'titles']
      })
    }
  }

  /**
   * Color contrast testing
   */
  private async runColorContrastTests(): Promise<void> {
    console.log('  🎨 Running detailed color contrast tests...')

    const textElements = document.querySelectorAll('*')
    const results: ColorContrastResult[] = []

    textElements.forEach(element => {
      const htmlElement = element as HTMLElement
      const style = window.getComputedStyle(htmlElement)
      
      if (htmlElement.textContent?.trim()) {
        const foreground = style.color
        const background = this.getBackgroundColor(htmlElement)
        
        if (foreground && background) {
          const ratio = this.calculateContrastRatio(foreground, background)
          const fontSize = parseFloat(style.fontSize)
          const fontWeight = style.fontWeight
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))
          
          results.push({
            foreground,
            background,
            ratio,
            aaPass: ratio >= (isLargeText ? 3 : 4.5),
            aaaPass: ratio >= (isLargeText ? 4.5 : 7),
            element: htmlElement,
            selector: this.getSelector(htmlElement)
          })
        }
      }
    })

    // Report contrast issues
    results.forEach((result, index) => {
      if (!result.aaPass) {
        this.addResult({
          id: `contrast-detail-${index}`,
          rule: 'color-contrast-aa',
          level: 'AA',
          severity: 'error',
          element: result.element,
          selector: result.selector,
          message: `Color contrast ${result.ratio.toFixed(2)}:1 fails AA requirements`,
          description: `Foreground: ${result.foreground}, Background: ${result.background}`,
          impact: 'serious',
          tags: ['wcag2aa', 'color-contrast']
        })
      }
    })
  }

  /**
   * Keyboard navigation testing
   */
  private async runKeyboardTests(): Promise<void> {
    console.log('  ⌨️  Running keyboard navigation tests...')

    const focusableElements = this.getFocusableElements()
    const results: KeyboardTestResult[] = []

    focusableElements.forEach(element => {
      const tabIndex = element.tabIndex
      const hasAriaLabel = element.hasAttribute('aria-label') || 
                          element.hasAttribute('aria-labelledby')
      
      // Test focus visibility
      element.focus()
      const style = window.getComputedStyle(element)
      const hasVisibleFocus = style.outline !== 'none' && style.outline !== '0px' ||
                             style.boxShadow !== 'none' ||
                             style.border !== style.border // This is a simplified check

      const issues: string[] = []
      
      if (!hasVisibleFocus) {
        issues.push('No visible focus indicator')
      }
      
      if (!hasAriaLabel && !element.textContent?.trim()) {
        issues.push('No accessible name')
      }
      
      if (tabIndex > 0) {
        issues.push('Positive tabindex disrupts tab order')
      }

      results.push({
        element,
        selector: this.getSelector(element),
        focusable: true,
        tabIndex,
        hasVisibleFocus,
        hasAriaLabel,
        issues
      })
    })

    // Report keyboard issues
    results.forEach((result, index) => {
      result.issues.forEach(issue => {
        this.addResult({
          id: `keyboard-${index}-${issue.replace(/\s+/g, '-').toLowerCase()}`,
          rule: 'keyboard-navigation',
          level: 'A',
          severity: issue.includes('visible focus') ? 'error' : 'warning',
          element: result.element,
          selector: result.selector,
          message: issue,
          description: 'Keyboard navigation must be fully accessible',
          impact: issue.includes('visible focus') ? 'serious' : 'moderate',
          tags: ['wcag2a', 'keyboard']
        })
      })
    })
  }

  /**
   * Screen reader testing
   */
  private async runScreenReaderTests(): Promise<void> {
    console.log('  🔊 Running screen reader compatibility tests...')

    // Test live regions
    const liveRegions = document.querySelectorAll('[aria-live]')
    if (liveRegions.length === 0) {
      this.addResult({
        id: 'no-live-regions',
        rule: 'live-regions',
        level: 'AA',
        severity: 'warning',
        message: 'No ARIA live regions found',
        description: 'Dynamic content should use live regions for screen reader announcements',
        impact: 'moderate',
        tags: ['wcag2aa', 'screen-reader']
      })
    }

    // Test ARIA roles
    const elementsWithRoles = document.querySelectorAll('[role]')
    elementsWithRoles.forEach((element, index) => {
      const role = element.getAttribute('role')
      if (role && !this.isValidAriaRole(role)) {
        this.addResult({
          id: `invalid-role-${index}`,
          rule: 'aria-roles',
          level: 'A',
          severity: 'error',
          element: element as HTMLElement,
          selector: this.getSelector(element as HTMLElement),
          message: `Invalid ARIA role: ${role}`,
          description: 'ARIA roles must be valid and recognized',
          impact: 'serious',
          tags: ['wcag2a', 'aria']
        })
      }
    })

    // Test form structure for screen readers
    const forms = document.querySelectorAll('form')
    forms.forEach((form, index) => {
      const fieldsets = form.querySelectorAll('fieldset')
      const inputs = form.querySelectorAll('input[type="radio"], input[type="checkbox"]')
      
      if (inputs.length > 3 && fieldsets.length === 0) {
        this.addResult({
          id: `form-fieldset-${index}`,
          rule: 'form-fieldset-legend',
          level: 'A',
          severity: 'warning',
          element: form as HTMLElement,
          selector: this.getSelector(form as HTMLElement),
          message: 'Form with multiple inputs should use fieldsets',
          description: 'Related form controls should be grouped with fieldset and legend',
          impact: 'moderate',
          tags: ['wcag2a', 'forms']
        })
      }
    })
  }

  /**
   * Manual accessibility checks
   */
  private async runManualChecks(): Promise<void> {
    console.log('  👁️  Running manual accessibility checks...')

    // These are checks that require human judgment
    this.addResult({
      id: 'manual-check-alt-text',
      rule: 'manual-check',
      level: 'A',
      severity: 'info',
      message: 'Manual check: Verify alt text is descriptive and meaningful',
      description: 'Alt text should describe the content and function of images',
      impact: 'minor',
      tags: ['manual', 'images']
    })

    this.addResult({
      id: 'manual-check-headings',
      rule: 'manual-check',
      level: 'AA',
      severity: 'info',
      message: 'Manual check: Verify heading text describes section content',
      description: 'Headings should be descriptive and accurately represent section content',
      impact: 'minor',
      tags: ['manual', 'headings']
    })

    this.addResult({
      id: 'manual-check-links',
      rule: 'manual-check',
      level: 'A',
      severity: 'info',
      message: 'Manual check: Verify link text describes destination or function',
      description: 'Link text should be descriptive without relying on surrounding context',
      impact: 'minor',
      tags: ['manual', 'links']
    })
  }

  /**
   * Utility methods
   */
  private addResult(result: Omit<A11yTestResult, 'helpUrl'>): void {
    this.testResults.push({
      ...result,
      helpUrl: this.getHelpUrl(result.rule)
    })
  }

  private getHelpUrl(rule: string): string {
    const baseUrl = 'https://www.w3.org/WAI/WCAG21/Understanding/'
    const ruleMap: Record<string, string> = {
      'image-alt': 'non-text-content.html',
      'form-label': 'labels-or-instructions.html',
      'heading-structure': 'headings-and-labels.html',
      'color-contrast': 'contrast-minimum.html',
      'keyboard-navigation': 'keyboard.html',
      'focus-visible': 'focus-visible.html'
    }
    
    return ruleMap[rule] ? baseUrl + ruleMap[rule] : baseUrl
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`
    }
    
    const classes = Array.from(element.classList).join('.')
    if (classes) {
      return `${element.tagName.toLowerCase()}.${classes}`
    }
    
    return element.tagName.toLowerCase()
  }

  private hasLabel(element: HTMLElement): boolean {
    const id = element.id
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) return true
    }
    
    const parentLabel = element.closest('label')
    return !!parentLabel
  }

  private isDecorativeImage(img: HTMLImageElement): boolean {
    // Simple heuristic - real implementation would be more sophisticated
    const parent = img.parentElement
    return parent?.classList.contains('decoration') || 
           parent?.classList.contains('icon') ||
           img.classList.contains('decoration')
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[]
  }

  private getAccessibleName(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel.trim()

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy)
      if (labelElement) return labelElement.textContent?.trim() || ''
    }

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`)
      if (label) return label.textContent?.trim() || ''
    }

    // Check text content
    return element.textContent?.trim() || ''
  }

  private getBackgroundColor(element: HTMLElement): string {
    let current: HTMLElement | null = element
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current)
      const bgColor = style.backgroundColor
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor
      }
      
      current = current.parentElement
    }
    
    return 'rgb(255, 255, 255)' // Default to white
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground)
    const bgLuminance = this.getLuminance(background)
    
    const lighter = Math.max(fgLuminance, bgLuminance)
    const darker = Math.min(fgLuminance, bgLuminance)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  private getLuminance(color: string): number {
    const rgb = this.parseColor(color)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  private parseColor(color: string): [number, number, number] | null {
    // Simple RGB parser - real implementation would handle more formats
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    }
    return null
  }

  private isValidLanguageCode(lang: string): boolean {
    // Basic language code validation
    return /^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang)
  }

  private isValidAriaRole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'dialog', 'directory', 'document',
      'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
      'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
      'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
      'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
      'tooltip', 'tree', 'treegrid', 'treeitem'
    ]
    
    return validRoles.includes(role)
  }

  /**
   * Report generation
   */
  private generateReport(testDuration: number): A11yReport {
    const summary = {
      total: this.testResults.length,
      passed: 0,
      failed: this.testResults.filter(r => r.severity === 'error').length,
      warnings: this.testResults.filter(r => r.severity === 'warning').length,
      incomplete: this.testResults.filter(r => r.severity === 'info').length
    }
    
    summary.passed = summary.total - summary.failed - summary.warnings - summary.incomplete

    const wcagViolations = this.testResults.filter(r => 
      r.severity === 'error' && r.level === this.config.wcagLevel
    ).length

    return {
      timestamp: new Date(),
      url: window.location.href,
      title: document.title,
      summary,
      results: this.testResults,
      performance: {
        testDuration,
        elementsScanned: document.querySelectorAll('*').length
      },
      wcagCompliance: {
        level: this.config.wcagLevel,
        compliant: wcagViolations === 0,
        violations: wcagViolations
      }
    }
  }

  private async outputReport(report: A11yReport): Promise<void> {
    switch (this.config.reportFormat) {
      case 'console':
        this.outputConsoleReport(report)
        break
      case 'json':
        console.log(JSON.stringify(report, null, 2))
        break
      case 'html':
        await this.outputHTMLReport(report)
        break
    }
  }

  private outputConsoleReport(report: A11yReport): void {
    console.log('\n📊 Accessibility Test Report')
    console.log('═'.repeat(50))
    console.log(`🌐 URL: ${report.url}`)
    console.log(`📄 Title: ${report.title}`)
    console.log(`⏱️  Test Duration: ${report.performance.testDuration}ms`)
    console.log(`🔍 Elements Scanned: ${report.performance.elementsScanned}`)
    console.log(`📏 WCAG Level: ${report.wcagCompliance.level}`)
    console.log(`✅ WCAG Compliant: ${report.wcagCompliance.compliant ? 'Yes' : 'No'}`)
    
    console.log('\n📈 Summary:')
    console.log(`  ✅ Passed: ${report.summary.passed}`)
    console.log(`  ❌ Failed: ${report.summary.failed}`)
    console.log(`  ⚠️  Warnings: ${report.summary.warnings}`)
    console.log(`  ℹ️  Info: ${report.summary.incomplete}`)
    
    if (report.results.length > 0) {
      console.log('\n🔍 Issues Found:')
      report.results.forEach(result => {
        const icon = result.severity === 'error' ? '❌' : 
                    result.severity === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`  ${icon} [${result.level}] ${result.message}`)
        if (result.selector) {
          console.log(`     📍 ${result.selector}`)
        }
      })
    }
    
    console.log('\n' + '═'.repeat(50))
  }

  private async outputHTMLReport(report: A11yReport): Promise<void> {
    const html = this.generateHTMLReport(report)
    
    if (this.config.outputPath) {
      // In a real implementation, this would write to file
      console.log('HTML report would be written to:', this.config.outputPath)
    } else {
      // Open in new window/tab
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(html)
        newWindow.document.close()
      }
    }
  }

  private generateHTMLReport(report: A11yReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric { text-align: center; padding: 15px; border-radius: 8px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        .info { background: #d1ecf1; color: #0c5460; }
        .results { margin-top: 20px; }
        .result { margin: 10px 0; padding: 15px; border-left: 4px solid; }
        .error { border-color: #dc3545; background: #f8d7da; }
        .warning { border-color: #ffc107; background: #fff3cd; }
        .info { border-color: #17a2b8; background: #d1ecf1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Accessibility Test Report</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Title:</strong> ${report.title}</p>
        <p><strong>Test Date:</strong> ${report.timestamp.toLocaleString()}</p>
        <p><strong>WCAG Level:</strong> ${report.wcagCompliance.level} 
           ${report.wcagCompliance.compliant ? '✅ Compliant' : '❌ Non-compliant'}</p>
    </div>
    
    <div class="summary">
        <div class="metric passed">
            <h3>${report.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric failed">
            <h3>${report.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric warning">
            <h3>${report.summary.warnings}</h3>
            <p>Warnings</p>
        </div>
        <div class="metric info">
            <h3>${report.summary.incomplete}</h3>
            <p>Info</p>
        </div>
    </div>
    
    <div class="results">
        <h2>📋 Detailed Results</h2>
        ${report.results.map(result => `
            <div class="result ${result.severity}">
                <h4>[${result.level}] ${result.message}</h4>
                <p>${result.description}</p>
                ${result.selector ? `<p><strong>Element:</strong> <code>${result.selector}</code></p>` : ''}
                <p><strong>Impact:</strong> ${result.impact}</p>
                <p><strong>Tags:</strong> ${result.tags.join(', ')}</p>
                ${result.helpUrl ? `<p><a href="${result.helpUrl}" target="_blank">Learn more</a></p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `
  }
}

/**
 * Default accessibility tester
 */
export const a11yTester = new A11yTester({
  enableAutomatedTests: true,
  enableColorContrastTests: true,
  enableKeyboardTests: true,
  enableScreenReaderTests: true,
  wcagLevel: 'AA',
  reportFormat: 'console'
})

/**
 * Quick accessibility check function
 */
export async function checkAccessibility(config?: Partial<A11yTestConfig>): Promise<A11yReport> {
  const tester = new A11yTester(config)
  return await tester.runTests()
}

/**
 * React hook for accessibility testing
 */
export function useA11yTesting() {
  return {
    runTests: a11yTester.runTests.bind(a11yTester),
    checkAccessibility
  }
}