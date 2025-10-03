/**
 * Secure ML System Integration for PromptCraft
 * Combines all security features with ML-backed enhancement
 */

import { CSPManager, ClientCSP } from '../security/csp'
import { SecureLogger, logger } from '../logging/secureLogger'
import { AdvancedRateLimiter, ClientRateLimiter } from '../security/rateLimiter'
import { ContentModerator } from '../moderation/contentModerator'
import { DataRetentionManager } from '../compliance/dataRetention'
import { AuthSystem } from '../auth/authSystem'
import { MLPromptEnhancer } from '../ai/mlEnhancer'

export interface SecureMLConfig {
  csp: {
    environment: 'development' | 'production' | 'test'
    trustedDomains: string[]
    reportUri?: string
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    encryptionKey?: string
    retentionDays: number
  }
  rateLimiting: {
    promptEnhancement: { requests: number; windowMs: number }
    authentication: { attempts: number; windowMs: number }
    api: { requests: number; windowMs: number }
  }
  moderation: {
    severity: 'strict' | 'moderate' | 'lenient'
    autoAction: 'block' | 'flag' | 'warn'
    enablePII: boolean
  }
  dataRetention: {
    promptHistory: number // days
    userProfiles: number // days
    auditLogs: number // days
  }
  authentication: {
    required: boolean
    providers: string[]
    mfaRequired: boolean
  }
  mlEnhancement: {
    providers: string[]
    fallbackToTemplate: boolean
    cacheEnabled: boolean
  }
}

/**
 * Integrated Secure ML System
 */
export class SecureMLSystem {
  private cspManager: CSPManager
  private logger: SecureLogger
  private rateLimiter: AdvancedRateLimiter
  private moderator: ContentModerator
  private retentionManager: DataRetentionManager
  private authSystem?: AuthSystem
  private mlEnhancer: MLPromptEnhancer
  private config: SecureMLConfig

  constructor(config: Partial<SecureMLConfig> = {}) {
    this.config = this.createDefaultConfig(config)
    this.initializeComponents()
  }

  private createDefaultConfig(customConfig: Partial<SecureMLConfig>): SecureMLConfig {
    return {
      csp: {
        environment: 'production',
        trustedDomains: [
          'api.openai.com',
          'api.anthropic.com',
          'generativelanguage.googleapis.com'
        ]
      },
      logging: {
        level: 'info',
        retentionDays: 90
      },
      rateLimiting: {
        promptEnhancement: { requests: 20, windowMs: 60000 },
        authentication: { attempts: 5, windowMs: 900000 },
        api: { requests: 100, windowMs: 60000 }
      },
      moderation: {
        severity: 'moderate',
        autoAction: 'flag',
        enablePII: true
      },
      dataRetention: {
        promptHistory: 365,
        userProfiles: 2555,
        auditLogs: 2555
      },
      authentication: {
        required: false,
        providers: ['local'],
        mfaRequired: false
      },
      mlEnhancement: {
        providers: ['openai'],
        fallbackToTemplate: true,
        cacheEnabled: true
      },
      ...customConfig
    }
  }

  private initializeComponents(): void {
    // Initialize CSP
    this.cspManager = new CSPManager({
      environment: this.config.csp.environment,
      trustedDomains: this.config.csp.trustedDomains,
      reportUri: this.config.csp.reportUri
    })

    // Initialize secure logging
    this.logger = new SecureLogger({
      level: this.config.logging.level,
      encryptionKey: this.config.logging.encryptionKey,
      retentionDays: this.config.logging.retentionDays,
      enableStructuredLogging: true,
      enableAuditTrail: true,
      piiDetection: true
    })

    // Initialize rate limiting
    this.rateLimiter = new AdvancedRateLimiter()
    this.setupRateLimits()

    // Initialize content moderation
    this.moderator = new ContentModerator({
      severity: this.config.moderation.severity,
      autoAction: this.config.moderation.autoAction,
      enablePIIDetection: this.config.moderation.enablePII,
      enableToxicityDetection: true,
      enableSpamDetection: true,
      enableMalwareDetection: true
    })

    // Initialize data retention (would need actual storage implementation)
    // this.retentionManager = new DataRetentionManager(...)

    // Initialize authentication if required
    if (this.config.authentication.required) {
      // this.authSystem = new AuthSystem(...)
    }

    // Initialize ML enhancer
    this.mlEnhancer = new MLPromptEnhancer({
      providers: this.getMLProviders(),
      fallbackStrategy: this.config.mlEnhancement.fallbackToTemplate ? 'template' : 'error',
      caching: {
        enabled: this.config.mlEnhancement.cacheEnabled,
        ttl: 3600,
        maxSize: 10000,
        strategy: 'lru'
      }
    })
  }

  private setupRateLimits(): void {
    this.rateLimiter.addLimit('prompt_enhancement', {
      windowMs: this.config.rateLimiting.promptEnhancement.windowMs,
      maxRequests: this.config.rateLimiting.promptEnhancement.requests,
      message: 'Too many prompt enhancement requests'
    })

    this.rateLimiter.addLimit('authentication', {
      windowMs: this.config.rateLimiting.authentication.windowMs,
      maxRequests: this.config.rateLimiting.authentication.attempts,
      message: 'Too many authentication attempts'
    })

    this.rateLimiter.addLimit('api', {
      windowMs: this.config.rateLimiting.api.windowMs,
      maxRequests: this.config.rateLimiting.api.requests,
      message: 'Too many API requests'
    })
  }

  private getMLProviders(): any[] {
    return this.config.mlEnhancement.providers.map(provider => {
      switch (provider) {
        case 'openai':
          return {
            name: 'openai',
            type: 'openai',
            enabled: !!process.env.OPENAI_API_KEY,
            priority: 1,
            config: {
              apiKey: process.env.OPENAI_API_KEY,
              model: 'gpt-4',
              maxTokens: 2000,
              temperature: 0.7
            },
            rateLimits: {
              requestsPerMinute: 60,
              tokensPerMinute: 100000
            }
          }
        case 'anthropic':
          return {
            name: 'anthropic',
            type: 'anthropic',
            enabled: !!process.env.ANTHROPIC_API_KEY,
            priority: 2,
            config: {
              apiKey: process.env.ANTHROPIC_API_KEY,
              model: 'claude-3',
              maxTokens: 2000
            },
            rateLimits: {
              requestsPerMinute: 50,
              tokensPerMinute: 80000
            }
          }
        default:
          return null
      }
    }).filter(Boolean)
  }

  /**
   * Securely enhance a prompt with full security pipeline
   */
  async enhancePromptSecurely(
    prompt: string,
    options: {
      userId?: string
      sessionId?: string
      ipAddress?: string
      userAgent?: string
      context?: any
      preferences?: any
    } = {}
  ): Promise<{
    success: boolean
    result?: any
    error?: string
    warnings?: string[]
  }> {
    const startTime = Date.now()
    const warnings: string[] = []

    try {
      // 1. Rate limiting check
      const identifier = options.userId || options.ipAddress || 'anonymous'
      const rateLimitResult = await this.rateLimiter.checkLimit('prompt_enhancement', identifier)
      
      if (!rateLimitResult.allowed) {
        this.logger.warn('Rate limit exceeded for prompt enhancement', {
          identifier,
          remaining: rateLimitResult.info.remainingRequests
        })
        
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }
      }

      // 2. Content moderation
      const moderationResult = await this.moderator.moderateContent(prompt, {
        userId: options.userId,
        sessionId: options.sessionId,
        contentType: 'prompt',
        metadata: {
          ip: options.ipAddress,
          userAgent: options.userAgent
        }
      })

      if (!moderationResult.allowed) {
        this.logger.security('Content blocked by moderation', {
          userId: options.userId,
          flags: moderationResult.flags,
          riskScore: moderationResult.riskScore
        })

        return {
          success: false,
          error: 'Content violates community guidelines',
          warnings: moderationResult.flags.map(f => f.message)
        }
      }

      if (moderationResult.flags.length > 0) {
        warnings.push(...moderationResult.flags.map(f => f.message))
      }

      // 3. Authentication check (if required)
      if (this.config.authentication.required && !options.userId) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      // 4. ML Enhancement
      const enhancementRequest = {
        originalPrompt: moderationResult.sanitizedContent || prompt,
        context: options.context,
        preferences: options.preferences,
        userId: options.userId,
        sessionId: options.sessionId
      }

      const enhancementResult = await this.mlEnhancer.enhancePrompt(enhancementRequest)

      // 5. Post-enhancement moderation
      const postModerationResult = await this.moderator.moderateContent(
        enhancementResult.enhancedPrompt,
        {
          userId: options.userId,
          sessionId: options.sessionId,
          contentType: 'enhanced_prompt'
        }
      )

      if (!postModerationResult.allowed) {
        this.logger.security('Enhanced content blocked by moderation', {
          userId: options.userId,
          originalPrompt: prompt,
          enhancedPrompt: enhancementResult.enhancedPrompt
        })

        // Fallback to original prompt if enhancement is blocked
        enhancementResult.enhancedPrompt = prompt
        enhancementResult.confidence = 0.5
        warnings.push('Enhanced content was moderated, using original prompt')
      }

      // 6. Data retention (store with retention policy)
      if (this.retentionManager) {
        await this.retentionManager.storeData(
          'prompt_history',
          {
            originalPrompt: prompt,
            enhancedPrompt: enhancementResult.enhancedPrompt,
            moderationResult,
            enhancementMetadata: enhancementResult.metadata
          },
          options.userId,
          options.sessionId,
          {
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            processingTime: Date.now() - startTime
          }
        )
      }

      // 7. Audit logging
      this.logger.audit('Prompt enhancement completed', {
        userId: options.userId,
        sessionId: options.sessionId,
        originalLength: prompt.length,
        enhancedLength: enhancementResult.enhancedPrompt.length,
        confidence: enhancementResult.confidence,
        provider: enhancementResult.metadata.provider,
        processingTime: Date.now() - startTime,
        moderationFlags: moderationResult.flags.length,
        riskScore: moderationResult.riskScore
      })

      return {
        success: true,
        result: {
          ...enhancementResult,
          moderationResult: {
            riskScore: moderationResult.riskScore,
            flags: moderationResult.flags.map(f => ({
              category: f.category,
              severity: f.severity
            }))
          }
        },
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      this.logger.error('Secure prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: options.userId,
        sessionId: options.sessionId,
        processingTime: Date.now() - startTime
      })

      return {
        success: false,
        error: 'Enhancement failed due to system error'
      }
    }
  }

  /**
   * Get system security status
   */
  getSecurityStatus(): {
    csp: { enabled: boolean; violations: number }
    rateLimiting: { active: boolean; limits: number }
    moderation: { enabled: boolean; processed: number }
    authentication: { required: boolean; active: boolean }
    dataRetention: { enabled: boolean; policies: number }
    mlEnhancement: { providers: number; available: number }
  } {
    return {
      csp: {
        enabled: true,
        violations: 0 // Would track actual violations
      },
      rateLimiting: {
        active: true,
        limits: 3 // Number of configured limits
      },
      moderation: {
        enabled: true,
        processed: 0 // Would track actual processed content
      },
      authentication: {
        required: this.config.authentication.required,
        active: !!this.authSystem
      },
      dataRetention: {
        enabled: !!this.retentionManager,
        policies: 3 // Number of retention policies
      },
      mlEnhancement: {
        providers: this.config.mlEnhancement.providers.length,
        available: 1 // Would check actual provider availability
      }
    }
  }

  /**
   * Generate security headers for HTTP responses
   */
  getSecurityHeaders(): Record<string, string> {
    return this.cspManager.getSecurityHeaders()
  }

  /**
   * Get CSP nonce for inline scripts/styles
   */
  getCSPNonce(): string {
    return this.cspManager.getNonce()
  }

  /**
   * Validate URL against CSP policy
   */
  isURLAllowed(url: string): boolean {
    return this.cspManager.isURLAllowed(url)
  }

  /**
   * Create child logger with context
   */
  createLogger(context: Record<string, any>): SecureLogger {
    return this.logger.child(context)
  }

  /**
   * Check rate limit for specific action
   */
  async checkRateLimit(action: string, identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const result = await this.rateLimiter.checkLimit(action, identifier)
    return {
      allowed: result.allowed,
      remaining: result.info.remainingRequests,
      resetTime: result.info.resetTime.getTime()
    }
  }

  /**
   * Moderate content independently
   */
  async moderateContent(content: string, context?: any): Promise<{
    allowed: boolean
    riskScore: number
    flags: Array<{ category: string; severity: string; message: string }>
  }> {
    const result = await this.moderator.moderateContent(content, context)
    return {
      allowed: result.allowed,
      riskScore: result.riskScore,
      flags: result.flags.map(f => ({
        category: f.category,
        severity: f.severity,
        message: f.message
      }))
    }
  }

  /**
   * Get system statistics
   */
  async getStatistics(): Promise<{
    security: any
    performance: any
    usage: any
  }> {
    return {
      security: this.getSecurityStatus(),
      performance: await this.mlEnhancer.getStatistics(),
      usage: {
        // Would include usage statistics
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0
      }
    }
  }
}

/**
 * Express middleware factory for the secure ML system
 */
export function createSecureMLMiddleware(system: SecureMLSystem) {
  return {
    // CSP middleware
    csp: (req: any, res: any, next: any) => {
      const headers = system.getSecurityHeaders()
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })
      res.locals.cspNonce = system.getCSPNonce()
      next()
    },

    // Rate limiting middleware
    rateLimit: (action: string) => async (req: any, res: any, next: any) => {
      const identifier = req.user?.id || req.ip
      const result = await system.checkRateLimit(action, identifier)
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        })
      }
      
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
      res.setHeader('X-RateLimit-Reset', result.resetTime.toString())
      next()
    },

    // Content moderation middleware
    moderation: async (req: any, res: any, next: any) => {
      const content = req.body?.prompt || req.body?.content
      
      if (content) {
        const result = await system.moderateContent(content, {
          userId: req.user?.id,
          sessionId: req.sessionID,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        })

        if (!result.allowed) {
          return res.status(400).json({
            error: 'Content violates guidelines',
            flags: result.flags
          })
        }

        req.moderationResult = result
      }
      
      next()
    },

    // Enhanced prompt processing
    enhancePrompt: async (req: any, res: any, next: any) => {
      const { prompt, context, preferences } = req.body
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' })
      }

      const result = await system.enhancePromptSecurely(prompt, {
        userId: req.user?.id,
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        context,
        preferences
      })

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          warnings: result.warnings
        })
      }

      res.json({
        success: true,
        data: result.result,
        warnings: result.warnings
      })
    }
  }
}

/**
 * Default secure ML system instance
 */
export const defaultSecureMLSystem = new SecureMLSystem({
  csp: {
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    trustedDomains: [
      'api.openai.com',
      'api.anthropic.com',
      'generativelanguage.googleapis.com'
    ]
  },
  authentication: {
    required: process.env.REQUIRE_AUTH === 'true',
    providers: ['local'],
    mfaRequired: process.env.REQUIRE_MFA === 'true'
  },
  mlEnhancement: {
    providers: ['openai'],
    fallbackToTemplate: true,
    cacheEnabled: true
  }
})