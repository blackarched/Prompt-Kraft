/**
 * Secure Logging System for PromptCraft
 * Implements comprehensive logging with data redaction, encryption, and compliance features
 */

import { createHash, createCipher, createDecipher, randomBytes } from 'crypto'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security' | 'audit'

export interface LoggerConfig {
  level: LogLevel
  redactionRules: RedactionRule[]
  encryptionKey?: string
  retentionDays: number
  maxLogSize: number
  enableStructuredLogging: boolean
  enableAuditTrail: boolean
  piiDetection: boolean
  outputTargets: LogTarget[]
}

export interface RedactionRule {
  pattern: RegExp
  replacement: string
  field?: string
  description: string
}

export interface LogTarget {
  type: 'console' | 'file' | 'remote' | 'database'
  config: Record<string, any>
  levels: LogLevel[]
}

export class SecureLogger {
  private config: LoggerConfig
  private sessionId: string
  private encryptionKey: Buffer | null = null

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      redactionRules: this.getDefaultRedactionRules(),
      retentionDays: 90,
      maxLogSize: 10 * 1024 * 1024, // 10MB
      enableStructuredLogging: true,
      enableAuditTrail: true,
      piiDetection: true,
      outputTargets: [{ type: 'console', config: {}, levels: ['debug', 'info', 'warn', 'error', 'security', 'audit'] }],
      ...config
    }

    this.sessionId = this.generateSessionId()
    
    if (this.config.encryptionKey) {
      this.encryptionKey = Buffer.from(this.config.encryptionKey, 'hex')
    }

    this.setupErrorHandling()
  }

  /**
   * Default redaction rules for common sensitive data
   */
  private getDefaultRedactionRules(): RedactionRule[] {
    return [
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL_REDACTED]',
        description: 'Email addresses'
      },
      {
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '[CARD_REDACTED]',
        description: 'Credit card numbers'
      },
      {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[SSN_REDACTED]',
        description: 'Social Security Numbers'
      },
      {
        pattern: /(password|pwd|pass|secret|token|key|api[_-]?key)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
        replacement: '$1: [CREDENTIAL_REDACTED]',
        description: 'Passwords and API keys'
      },
      {
        pattern: /(bearer\s+|authorization:\s*bearer\s+)([a-zA-Z0-9._-]+)/gi,
        replacement: '$1[TOKEN_REDACTED]',
        description: 'Bearer tokens'
      },
      {
        pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        replacement: '[IP_REDACTED]',
        description: 'IP addresses'
      },
      {
        pattern: /(sk-[a-zA-Z0-9]{48})/g,
        replacement: '[OPENAI_KEY_REDACTED]',
        description: 'OpenAI API keys'
      },
      {
        pattern: /(claude-[a-zA-Z0-9-]{32,})/g,
        replacement: '[CLAUDE_KEY_REDACTED]',
        description: 'Claude API keys'
      }
    ]
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return randomBytes(16).toString('hex')
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Unhandled error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          reason: event.reason,
          stack: event.reason?.stack
        })
      })
    }
  }

  /**
   * Redact sensitive information from text
   */
  private redactSensitiveData(text: string): string {
    let redacted = text

    for (const rule of this.config.redactionRules) {
      redacted = redacted.replace(rule.pattern, rule.replacement)
    }

    return redacted
  }

  /**
   * Detect and redact PII using advanced patterns
   */
  private detectAndRedactPII(data: any): any {
    if (!this.config.piiDetection) return data

    if (typeof data === 'string') {
      return this.redactSensitiveData(data)
    }

    if (Array.isArray(data)) {
      return data.map(item => this.detectAndRedactPII(item))
    }

    if (data && typeof data === 'object') {
      const redacted: any = {}
      for (const [key, value] of Object.entries(data)) {
        // Check if field name suggests sensitive data
        const sensitiveFields = ['password', 'token', 'key', 'secret', 'ssn', 'credit', 'card', 'phone', 'email']
        const isSensitiveField = sensitiveFields.some(field => 
          key.toLowerCase().includes(field)
        )

        if (isSensitiveField) {
          redacted[key] = '[FIELD_REDACTED]'
        } else {
          redacted[key] = this.detectAndRedactPII(value)
        }
      }
      return redacted
    }

    return data
  }

  /**
   * Encrypt log entry if encryption is enabled
   */
  private encryptLogEntry(entry: LogEntry): string {
    const serialized = JSON.stringify(entry)
    
    if (!this.encryptionKey) {
      return serialized
    }

    try {
      const iv = randomBytes(16)
      const cipher = createCipher('aes-256-cbc', this.encryptionKey)
      let encrypted = cipher.update(serialized, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      return JSON.stringify({
        encrypted: true,
        iv: iv.toString('hex'),
        data: encrypted
      })
    } catch (error) {
      console.error('Failed to encrypt log entry:', error)
      return serialized
    }
  }

  /**
   * Decrypt log entry
   */
  decryptLogEntry(encryptedData: string): LogEntry | null {
    if (!this.encryptionKey) {
      return JSON.parse(encryptedData)
    }

    try {
      const parsed = JSON.parse(encryptedData)
      
      if (!parsed.encrypted) {
        return parsed
      }

      const decipher = createDecipher('aes-256-cbc', this.encryptionKey)
      let decrypted = decipher.update(parsed.data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to decrypt log entry:', error)
      return null
    }
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.redactSensitiveData(message),
      sessionId: this.sessionId
    }

    if (context) {
      entry.context = this.detectAndRedactPII(context)
    }

    // Add request context if available
    if (typeof window !== 'undefined') {
      entry.metadata = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    }

    return entry
  }

  /**
   * Check if log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'security', 'audit']
    const configLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    
    return messageLevelIndex >= configLevelIndex
  }

  /**
   * Output log entry to configured targets
   */
  private async outputLog(entry: LogEntry): Promise<void> {
    const serialized = this.config.enableStructuredLogging 
      ? this.encryptLogEntry(entry)
      : `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`

    for (const target of this.config.outputTargets) {
      if (!target.levels.includes(entry.level)) continue

      try {
        switch (target.type) {
          case 'console':
            this.outputToConsole(entry, serialized)
            break
          case 'file':
            await this.outputToFile(entry, serialized, target.config)
            break
          case 'remote':
            await this.outputToRemote(entry, serialized, target.config)
            break
          case 'database':
            await this.outputToDatabase(entry, target.config)
            break
        }
      } catch (error) {
        console.error(`Failed to output to ${target.type}:`, error)
      }
    }
  }

  /**
   * Output to console with appropriate styling
   */
  private outputToConsole(entry: LogEntry, serialized: string): void {
    const styles = {
      debug: 'color: #6c757d',
      info: 'color: #17a2b8',
      warn: 'color: #ffc107; font-weight: bold',
      error: 'color: #dc3545; font-weight: bold',
      security: 'color: #e83e8c; font-weight: bold; background: #fff',
      audit: 'color: #6f42c1; font-weight: bold'
    }

    if (this.config.enableStructuredLogging) {
      console.log(`%c[${entry.level.toUpperCase()}]`, styles[entry.level], entry)
    } else {
      console.log(`%c${serialized}`, styles[entry.level])
    }
  }

  /**
   * Output to file (Node.js environment)
   */
  private async outputToFile(
    entry: LogEntry, 
    serialized: string, 
    config: Record<string, any>
  ): Promise<void> {
    // This would be implemented in Node.js environment
    if (typeof require !== 'undefined') {
      const fs = require('fs').promises
      const path = require('path')
      
      const logFile = config.path || './logs/promptcraft.log'
      const logDir = path.dirname(logFile)
      
      try {
        await fs.mkdir(logDir, { recursive: true })
        await fs.appendFile(logFile, serialized + '\n')
        
        // Rotate logs if they get too large
        const stats = await fs.stat(logFile)
        if (stats.size > this.config.maxLogSize) {
          await this.rotateLogFile(logFile)
        }
      } catch (error) {
        console.error('Failed to write to log file:', error)
      }
    }
  }

  /**
   * Output to remote logging service
   */
  private async outputToRemote(
    entry: LogEntry,
    serialized: string,
    config: Record<string, any>
  ): Promise<void> {
    if (!config.endpoint) return

    try {
      await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined,
          ...config.headers
        },
        body: JSON.stringify({
          service: 'promptcraft',
          entry: this.config.enableStructuredLogging ? entry : { message: serialized }
        })
      })
    } catch (error) {
      console.error('Failed to send log to remote service:', error)
    }
  }

  /**
   * Output to database
   */
  private async outputToDatabase(
    entry: LogEntry,
    config: Record<string, any>
  ): Promise<void> {
    // Implementation would depend on database type
    // This is a placeholder for database logging
    console.log('Database logging not implemented in browser environment')
  }

  /**
   * Rotate log file when it gets too large
   */
  private async rotateLogFile(logFile: string): Promise<void> {
    if (typeof require !== 'undefined') {
      const fs = require('fs').promises
      const path = require('path')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const rotatedFile = `${logFile}.${timestamp}`
      
      try {
        await fs.rename(logFile, rotatedFile)
        
        // Clean up old log files based on retention policy
        await this.cleanupOldLogs(path.dirname(logFile))
      } catch (error) {
        console.error('Failed to rotate log file:', error)
      }
    }
  }

  /**
   * Clean up old log files based on retention policy
   */
  private async cleanupOldLogs(logDir: string): Promise<void> {
    if (typeof require !== 'undefined') {
      const fs = require('fs').promises
      const path = require('path')
      
      try {
        const files = await fs.readdir(logDir)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)
        
        for (const file of files) {
          if (file.includes('promptcraft.log.')) {
            const filePath = path.join(logDir, file)
            const stats = await fs.stat(filePath)
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath)
            }
          }
        }
      } catch (error) {
        console.error('Failed to cleanup old logs:', error)
      }
    }
  }

  /**
   * Log methods for different levels
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, context)
      this.outputLog(entry)
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      const entry = this.createLogEntry('info', message, context)
      this.outputLog(entry)
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      const entry = this.createLogEntry('warn', message, context)
      this.outputLog(entry)
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, context)
      this.outputLog(entry)
    }
  }

  /**
   * Security-specific logging
   */
  security(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('security', message, {
      ...context,
      alertLevel: 'high',
      requiresReview: true
    })
    this.outputLog(entry)
    
    // Could trigger immediate alerts for security events
    this.triggerSecurityAlert(entry)
  }

  /**
   * Audit trail logging
   */
  audit(action: string, context?: Record<string, any>): void {
    if (this.config.enableAuditTrail) {
      const entry = this.createLogEntry('audit', `AUDIT: ${action}`, {
        ...context,
        auditTrail: true,
        immutable: true
      })
      this.outputLog(entry)
    }
  }

  /**
   * Trigger security alerts for high-priority events
   */
  private triggerSecurityAlert(entry: LogEntry): void {
    // Implementation for security alerting
    // Could integrate with:
    // - Slack webhooks
    // - PagerDuty
    // - Email alerts
    // - SIEM systems
    
    console.warn('🚨 SECURITY ALERT:', entry.message, entry.context)
  }

  /**
   * Performance logging
   */
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      duration,
      performance: true
    })
  }

  /**
   * User action logging
   */
  userAction(action: string, userId?: string, context?: Record<string, any>): void {
    this.audit(`User action: ${action}`, {
      ...context,
      userId,
      userAction: true
    })
  }

  /**
   * API request logging
   */
  apiRequest(method: string, url: string, statusCode: number, context?: Record<string, any>): void {
    const level = statusCode >= 400 ? 'warn' : 'info'
    this[level](`API ${method} ${url} - ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      apiRequest: true
    })
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): SecureLogger {
    const childLogger = new SecureLogger(this.config)
    childLogger.sessionId = this.sessionId
    
    // Override log methods to include additional context
    const originalMethods = ['debug', 'info', 'warn', 'error', 'security', 'audit']
    
    originalMethods.forEach(method => {
      const originalMethod = childLogger[method as keyof SecureLogger] as Function
      childLogger[method as keyof SecureLogger] = (message: string, additionalContext?: Record<string, any>) => {
        return originalMethod.call(childLogger, message, { ...context, ...additionalContext })
      }
    })
    
    return childLogger
  }
}

/**
 * Default logger instance
 */
export const logger = new SecureLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableStructuredLogging: true,
  enableAuditTrail: true,
  piiDetection: true,
  retentionDays: 90,
  outputTargets: [
    {
      type: 'console',
      config: {},
      levels: ['debug', 'info', 'warn', 'error', 'security', 'audit']
    }
  ]
})

/**
 * Express.js middleware for request logging
 */
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    const requestId = randomBytes(8).toString('hex')
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId)
    
    // Create request logger
    const requestLogger = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Log request
    requestLogger.info('Request started')

    // Override res.end to log response
    const originalEnd = res.end
    res.end = function(...args: any[]) {
      const duration = Date.now() - start
      requestLogger.apiRequest(req.method, req.url, res.statusCode, { duration })
      originalEnd.apply(this, args)
    }

    // Add logger to request object
    req.logger = requestLogger
    
    next()
  }
}