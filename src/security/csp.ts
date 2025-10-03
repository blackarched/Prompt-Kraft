/**
 * Content Security Policy (CSP) implementation for PromptCraft
 * Provides comprehensive security headers and policies
 */

export interface CSPConfig {
  environment: 'development' | 'production' | 'test'
  allowInlineStyles?: boolean
  allowInlineScripts?: boolean
  reportUri?: string
  nonce?: string
  trustedDomains?: string[]
}

export class CSPManager {
  private config: CSPConfig
  private nonce: string

  constructor(config: CSPConfig) {
    this.config = config
    this.nonce = config.nonce || this.generateNonce()
  }

  /**
   * Generate a cryptographically secure nonce for CSP
   */
  private generateNonce(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16)
      crypto.getRandomValues(array)
      return btoa(String.fromCharCode(...array))
    }
    // Fallback for environments without crypto API
    return btoa(Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15))
  }

  /**
   * Get the current nonce value
   */
  getNonce(): string {
    return this.nonce
  }

  /**
   * Generate CSP header value based on configuration
   */
  getCSPHeader(): string {
    const directives: string[] = []

    // Default source - restrict to self
    directives.push("default-src 'self'")

    // Script sources
    const scriptSrc = ["'self'"]
    if (this.config.allowInlineScripts || this.config.environment === 'development') {
      scriptSrc.push(`'nonce-${this.nonce}'`)
    }
    if (this.config.environment === 'development') {
      scriptSrc.push("'unsafe-eval'") // For development tools
    }
    // Add trusted CDNs for production
    if (this.config.environment === 'production') {
      scriptSrc.push('https://cdn.jsdelivr.net', 'https://unpkg.com')
    }
    directives.push(`script-src ${scriptSrc.join(' ')}`)

    // Style sources
    const styleSrc = ["'self'"]
    if (this.config.allowInlineStyles || this.config.environment === 'development') {
      styleSrc.push(`'nonce-${this.nonce}'`, "'unsafe-inline'")
    }
    // Google Fonts and other trusted style sources
    styleSrc.push('https://fonts.googleapis.com', 'https://fonts.gstatic.com')
    directives.push(`style-src ${styleSrc.join(' ')}`)

    // Image sources
    directives.push("img-src 'self' data: https: blob:")

    // Font sources
    directives.push("font-src 'self' https://fonts.gstatic.com data:")

    // Connect sources (for API calls)
    const connectSrc = ["'self'"]
    if (this.config.trustedDomains) {
      connectSrc.push(...this.config.trustedDomains)
    }
    // Add common AI API endpoints
    connectSrc.push(
      'https://api.openai.com',
      'https://api.anthropic.com',
      'https://generativelanguage.googleapis.com'
    )
    directives.push(`connect-src ${connectSrc.join(' ')}`)

    // Media sources
    directives.push("media-src 'self'")

    // Object sources - block plugins
    directives.push("object-src 'none'")

    // Base URI restriction
    directives.push("base-uri 'self'")

    // Form action restriction
    directives.push("form-action 'self'")

    // Frame ancestors - prevent clickjacking
    directives.push("frame-ancestors 'none'")

    // Upgrade insecure requests in production
    if (this.config.environment === 'production') {
      directives.push("upgrade-insecure-requests")
    }

    // Report violations
    if (this.config.reportUri) {
      directives.push(`report-uri ${this.config.reportUri}`)
    }

    return directives.join('; ')
  }

  /**
   * Get all security headers
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      // Content Security Policy
      'Content-Security-Policy': this.getCSPHeader(),
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // XSS Protection
      'X-XSS-Protection': '1; mode=block',
      
      // Frame Options
      'X-Frame-Options': 'DENY',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy (formerly Feature Policy)
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()'
      ].join(', ')
    }

    // HSTS for production
    if (this.config.environment === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    }

    return headers
  }

  /**
   * Apply CSP to HTML content
   */
  applyToHTML(html: string): string {
    const nonce = this.getNonce()
    
    // Add nonce to inline scripts and styles
    html = html.replace(
      /<script(?![^>]*src=)/g,
      `<script nonce="${nonce}"`
    )
    
    html = html.replace(
      /<style(?![^>]*href=)/g,
      `<style nonce="${nonce}"`
    )

    // Add meta tag for CSP
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${this.getCSPHeader()}">`
    
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n  ${cspMeta}`)
    } else {
      html = `${cspMeta}\n${html}`
    }

    return html
  }

  /**
   * Validate if a URL is allowed by CSP
   */
  isURLAllowed(url: string, directive: string = 'connect-src'): boolean {
    try {
      const urlObj = new URL(url)
      
      // Always allow same origin
      if (urlObj.origin === window.location.origin) {
        return true
      }

      // Check against trusted domains
      if (this.config.trustedDomains) {
        return this.config.trustedDomains.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        )
      }

      return false
    } catch {
      return false
    }
  }

  /**
   * Report CSP violation
   */
  reportViolation(violation: any): void {
    if (this.config.reportUri) {
      fetch(this.config.reportUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report'
        },
        body: JSON.stringify({ 'csp-report': violation })
      }).catch(error => {
        console.error('Failed to report CSP violation:', error)
      })
    }

    // Log violation for monitoring
    console.warn('CSP Violation:', violation)
  }
}

/**
 * Express.js middleware for CSP
 */
export function cspMiddleware(config: CSPConfig) {
  const cspManager = new CSPManager(config)
  
  return (req: any, res: any, next: any) => {
    const headers = cspManager.getSecurityHeaders()
    
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    // Add nonce to response locals for template usage
    res.locals.cspNonce = cspManager.getNonce()
    
    next()
  }
}

/**
 * Client-side CSP utilities
 */
export class ClientCSP {
  private static instance: ClientCSP
  private cspManager: CSPManager

  private constructor() {
    // Detect environment
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost'
    
    this.cspManager = new CSPManager({
      environment: isDevelopment ? 'development' : 'production',
      allowInlineStyles: isDevelopment,
      allowInlineScripts: false, // Never allow inline scripts
      trustedDomains: [
        'api.openai.com',
        'api.anthropic.com',
        'generativelanguage.googleapis.com'
      ]
    })

    this.setupViolationReporting()
  }

  static getInstance(): ClientCSP {
    if (!ClientCSP.instance) {
      ClientCSP.instance = new ClientCSP()
    }
    return ClientCSP.instance
  }

  private setupViolationReporting(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      this.cspManager.reportViolation({
        'document-uri': e.documentURI,
        'referrer': e.referrer,
        'violated-directive': e.violatedDirective,
        'effective-directive': e.effectiveDirective,
        'original-policy': e.originalPolicy,
        'blocked-uri': e.blockedURI,
        'line-number': e.lineNumber,
        'column-number': e.columnNumber,
        'source-file': e.sourceFile,
        'status-code': e.statusCode,
        'disposition': e.disposition
      })
    })
  }

  /**
   * Safely execute inline script with nonce
   */
  executeScript(scriptContent: string): void {
    const script = document.createElement('script')
    script.nonce = this.cspManager.getNonce()
    script.textContent = scriptContent
    document.head.appendChild(script)
    document.head.removeChild(script)
  }

  /**
   * Safely add inline styles with nonce
   */
  addStyles(cssContent: string): HTMLStyleElement {
    const style = document.createElement('style')
    style.nonce = this.cspManager.getNonce()
    style.textContent = cssContent
    document.head.appendChild(style)
    return style
  }

  /**
   * Validate external resource before loading
   */
  canLoadResource(url: string): boolean {
    return this.cspManager.isURLAllowed(url)
  }
}

// Export singleton instance
export const clientCSP = ClientCSP.getInstance()