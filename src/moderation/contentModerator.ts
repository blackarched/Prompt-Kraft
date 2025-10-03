/**
 * Content Moderation System for PromptCraft
 * Implements comprehensive content filtering, toxicity detection, and policy enforcement
 */

export interface ModerationConfig {
  enableProfanityFilter: boolean
  enableToxicityDetection: boolean
  enableSpamDetection: boolean
  enablePIIDetection: boolean
  enableMalwareDetection: boolean
  customRules: ModerationRule[]
  severity: 'strict' | 'moderate' | 'lenient'
  autoAction: 'block' | 'flag' | 'warn'
  reviewQueue: boolean
  notificationWebhook?: string
}

export interface ModerationRule {
  id: string
  name: string
  pattern: RegExp | string
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'block' | 'flag' | 'warn' | 'review'
  description: string
  category: string
}

export interface ModerationResult {
  allowed: boolean
  confidence: number
  flags: ModerationFlag[]
  sanitizedContent?: string
  recommendedAction: 'allow' | 'block' | 'review' | 'warn'
  riskScore: number
  processingTime: number
}

export interface ModerationFlag {
  rule: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  message: string
  confidence: number
  position?: { start: number; end: number }
  suggestedReplacement?: string
}

/**
 * Advanced Content Moderator
 */
export class ContentModerator {
  private config: ModerationConfig
  private profanityList: Set<string> = new Set()
  private toxicityModel: ToxicityDetector
  private spamDetector: SpamDetector
  private piiDetector: PIIDetector
  private malwareDetector: MalwareDetector

  constructor(config: Partial<ModerationConfig> = {}) {
    this.config = {
      enableProfanityFilter: true,
      enableToxicityDetection: true,
      enableSpamDetection: true,
      enablePIIDetection: true,
      enableMalwareDetection: true,
      customRules: [],
      severity: 'moderate',
      autoAction: 'flag',
      reviewQueue: true,
      ...config
    }

    this.initializeComponents()
    this.loadProfanityList()
  }

  private initializeComponents(): void {
    this.toxicityModel = new ToxicityDetector()
    this.spamDetector = new SpamDetector()
    this.piiDetector = new PIIDetector()
    this.malwareDetector = new MalwareDetector()
  }

  private loadProfanityList(): void {
    // Load comprehensive profanity list
    const commonProfanity = [
      // This would be loaded from a comprehensive database
      // Including variations, leetspeak, and multiple languages
      'badword1', 'badword2', // Placeholder - real implementation would have actual list
    ]

    commonProfanity.forEach(word => this.profanityList.add(word.toLowerCase()))
  }

  /**
   * Moderate content with comprehensive analysis
   */
  async moderateContent(content: string, context?: {
    userId?: string
    sessionId?: string
    contentType?: string
    metadata?: Record<string, any>
  }): Promise<ModerationResult> {
    const startTime = Date.now()
    const flags: ModerationFlag[] = []
    let sanitizedContent = content
    let riskScore = 0

    try {
      // 1. Profanity Detection
      if (this.config.enableProfanityFilter) {
        const profanityResult = await this.detectProfanity(content)
        flags.push(...profanityResult.flags)
        if (profanityResult.sanitized) {
          sanitizedContent = profanityResult.sanitized
        }
        riskScore += profanityResult.riskScore
      }

      // 2. Toxicity Detection
      if (this.config.enableToxicityDetection) {
        const toxicityResult = await this.toxicityModel.analyze(content)
        flags.push(...toxicityResult.flags)
        riskScore += toxicityResult.riskScore
      }

      // 3. Spam Detection
      if (this.config.enableSpamDetection) {
        const spamResult = await this.spamDetector.analyze(content, context)
        flags.push(...spamResult.flags)
        riskScore += spamResult.riskScore
      }

      // 4. PII Detection
      if (this.config.enablePIIDetection) {
        const piiResult = await this.piiDetector.analyze(content)
        flags.push(...piiResult.flags)
        riskScore += piiResult.riskScore
      }

      // 5. Malware/Phishing Detection
      if (this.config.enableMalwareDetection) {
        const malwareResult = await this.malwareDetector.analyze(content)
        flags.push(...malwareResult.flags)
        riskScore += malwareResult.riskScore
      }

      // 6. Custom Rules
      const customResult = await this.applyCustomRules(content)
      flags.push(...customResult.flags)
      riskScore += customResult.riskScore

      // Calculate final decision
      const processingTime = Date.now() - startTime
      const result = this.calculateFinalDecision(flags, riskScore, processingTime)
      
      // Log moderation event
      await this.logModerationEvent(content, result, context)

      // Send to review queue if needed
      if (result.recommendedAction === 'review' && this.config.reviewQueue) {
        await this.sendToReviewQueue(content, result, context)
      }

      return {
        ...result,
        sanitizedContent: sanitizedContent !== content ? sanitizedContent : undefined
      }

    } catch (error) {
      console.error('Content moderation error:', error)
      
      // Fail safe - allow content but log error
      return {
        allowed: true,
        confidence: 0,
        flags: [{
          rule: 'system_error',
          severity: 'medium',
          category: 'system',
          message: 'Moderation system error - content allowed by default',
          confidence: 0
        }],
        recommendedAction: 'allow',
        riskScore: 0,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Detect profanity and offensive language
   */
  private async detectProfanity(content: string): Promise<{
    flags: ModerationFlag[]
    sanitized?: string
    riskScore: number
  }> {
    const flags: ModerationFlag[] = []
    let sanitized = content
    let riskScore = 0

    const words = content.toLowerCase().split(/\s+/)
    const profanityFound: Array<{ word: string; position: number }> = []

    // Check each word against profanity list
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '')
      
      if (this.profanityList.has(cleanWord)) {
        profanityFound.push({ word: cleanWord, position: index })
      }

      // Check for leetspeak variations
      const leetVariations = this.generateLeetSpeakVariations(cleanWord)
      leetVariations.forEach(variation => {
        if (this.profanityList.has(variation)) {
          profanityFound.push({ word: variation, position: index })
        }
      })
    })

    // Create flags for found profanity
    profanityFound.forEach(({ word, position }) => {
      const severity = this.getProfanitySeverity(word)
      flags.push({
        rule: 'profanity_filter',
        severity,
        category: 'profanity',
        message: `Profanity detected: "${word}"`,
        confidence: 0.9,
        position: { start: position, end: position + word.length }
      })

      riskScore += severity === 'high' ? 30 : severity === 'medium' ? 20 : 10

      // Sanitize content
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      sanitized = sanitized.replace(regex, '*'.repeat(word.length))
    })

    return { flags, sanitized: sanitized !== content ? sanitized : undefined, riskScore }
  }

  private generateLeetSpeakVariations(word: string): string[] {
    const leetMap: Record<string, string[]> = {
      'a': ['@', '4'],
      'e': ['3'],
      'i': ['1', '!'],
      'o': ['0'],
      's': ['5', '$'],
      't': ['7'],
      'l': ['1'],
      'g': ['9']
    }

    const variations = [word]
    
    for (const [letter, replacements] of Object.entries(leetMap)) {
      const newVariations: string[] = []
      variations.forEach(variation => {
        replacements.forEach(replacement => {
          newVariations.push(variation.replace(new RegExp(letter, 'g'), replacement))
        })
      })
      variations.push(...newVariations)
    }

    return [...new Set(variations)]
  }

  private getProfanitySeverity(word: string): 'low' | 'medium' | 'high' {
    // This would be based on a comprehensive severity database
    const highSeverity = ['extreme_word1', 'extreme_word2'] // Placeholder
    const mediumSeverity = ['moderate_word1', 'moderate_word2'] // Placeholder
    
    if (highSeverity.includes(word)) return 'high'
    if (mediumSeverity.includes(word)) return 'medium'
    return 'low'
  }

  /**
   * Apply custom moderation rules
   */
  private async applyCustomRules(content: string): Promise<{
    flags: ModerationFlag[]
    riskScore: number
  }> {
    const flags: ModerationFlag[] = []
    let riskScore = 0

    for (const rule of this.config.customRules) {
      try {
        const pattern = typeof rule.pattern === 'string' 
          ? new RegExp(rule.pattern, 'gi')
          : rule.pattern

        const matches = content.match(pattern)
        
        if (matches) {
          flags.push({
            rule: rule.id,
            severity: rule.severity,
            category: rule.category,
            message: `Custom rule violation: ${rule.description}`,
            confidence: 0.8
          })

          riskScore += rule.severity === 'critical' ? 50 : 
                      rule.severity === 'high' ? 30 :
                      rule.severity === 'medium' ? 20 : 10
        }
      } catch (error) {
        console.error(`Error applying custom rule ${rule.id}:`, error)
      }
    }

    return { flags, riskScore }
  }

  /**
   * Calculate final moderation decision
   */
  private calculateFinalDecision(
    flags: ModerationFlag[],
    riskScore: number,
    processingTime: number
  ): ModerationResult {
    const criticalFlags = flags.filter(f => f.severity === 'critical')
    const highFlags = flags.filter(f => f.severity === 'high')
    const mediumFlags = flags.filter(f => f.severity === 'medium')

    let recommendedAction: 'allow' | 'block' | 'review' | 'warn' = 'allow'
    let allowed = true
    let confidence = 1.0

    // Determine action based on severity and configuration
    if (criticalFlags.length > 0) {
      recommendedAction = 'block'
      allowed = false
      confidence = 0.95
    } else if (highFlags.length > 0) {
      if (this.config.severity === 'strict') {
        recommendedAction = 'block'
        allowed = false
      } else {
        recommendedAction = 'review'
        allowed = this.config.autoAction !== 'block'
      }
      confidence = 0.85
    } else if (mediumFlags.length > 0) {
      if (this.config.severity === 'strict') {
        recommendedAction = 'review'
        allowed = this.config.autoAction !== 'block'
      } else {
        recommendedAction = 'warn'
      }
      confidence = 0.7
    } else if (riskScore > 50) {
      recommendedAction = 'review'
      allowed = this.config.autoAction !== 'block'
      confidence = 0.6
    }

    // Adjust confidence based on number of flags
    confidence = Math.max(0.1, confidence - (flags.length * 0.05))

    return {
      allowed,
      confidence,
      flags,
      recommendedAction,
      riskScore,
      processingTime
    }
  }

  /**
   * Log moderation event for audit trail
   */
  private async logModerationEvent(
    content: string,
    result: ModerationResult,
    context?: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      contentHash: this.hashContent(content),
      contentLength: content.length,
      result,
      context,
      version: '1.0'
    }

    // Log to secure logger
    console.log('Moderation Event:', logEntry)

    // Send to external logging service if configured
    if (this.config.notificationWebhook) {
      try {
        await fetch(this.config.notificationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        })
      } catch (error) {
        console.error('Failed to send moderation webhook:', error)
      }
    }
  }

  /**
   * Send content to human review queue
   */
  private async sendToReviewQueue(
    content: string,
    result: ModerationResult,
    context?: any
  ): Promise<void> {
    const reviewItem = {
      id: this.generateReviewId(),
      timestamp: new Date().toISOString(),
      content: content.substring(0, 1000), // Limit content length
      contentHash: this.hashContent(content),
      moderationResult: result,
      context,
      status: 'pending',
      priority: this.calculateReviewPriority(result)
    }

    // In a real implementation, this would be sent to a review queue system
    console.log('Review Queue Item:', reviewItem)
  }

  private hashContent(content: string): string {
    // Simple hash for content identification (not cryptographic)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private calculateReviewPriority(result: ModerationResult): 'low' | 'medium' | 'high' | 'urgent' {
    const criticalFlags = result.flags.filter(f => f.severity === 'critical').length
    const highFlags = result.flags.filter(f => f.severity === 'high').length

    if (criticalFlags > 0) return 'urgent'
    if (highFlags > 1) return 'high'
    if (highFlags > 0 || result.riskScore > 40) return 'medium'
    return 'low'
  }

  /**
   * Add custom moderation rule
   */
  addCustomRule(rule: ModerationRule): void {
    this.config.customRules.push(rule)
  }

  /**
   * Remove custom moderation rule
   */
  removeCustomRule(ruleId: string): void {
    this.config.customRules = this.config.customRules.filter(r => r.id !== ruleId)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get moderation statistics
   */
  getStatistics(): {
    totalProcessed: number
    blocked: number
    flagged: number
    averageProcessingTime: number
  } {
    // This would be implemented with actual statistics tracking
    return {
      totalProcessed: 0,
      blocked: 0,
      flagged: 0,
      averageProcessingTime: 0
    }
  }
}

/**
 * Toxicity Detection using ML models
 */
class ToxicityDetector {
  async analyze(content: string): Promise<{
    flags: ModerationFlag[]
    riskScore: number
  }> {
    // This would integrate with actual ML models like:
    // - Google's Perspective API
    // - OpenAI's moderation API
    // - Custom trained models
    
    const flags: ModerationFlag[] = []
    let riskScore = 0

    // Simulate toxicity detection
    const toxicityScore = this.simulateToxicityScore(content)
    
    if (toxicityScore > 0.7) {
      flags.push({
        rule: 'toxicity_high',
        severity: 'high',
        category: 'toxicity',
        message: `High toxicity detected (score: ${toxicityScore.toFixed(2)})`,
        confidence: toxicityScore
      })
      riskScore += 40
    } else if (toxicityScore > 0.5) {
      flags.push({
        rule: 'toxicity_medium',
        severity: 'medium',
        category: 'toxicity',
        message: `Medium toxicity detected (score: ${toxicityScore.toFixed(2)})`,
        confidence: toxicityScore
      })
      riskScore += 25
    }

    return { flags, riskScore }
  }

  private simulateToxicityScore(content: string): number {
    // Simplified toxicity detection based on keywords
    const toxicKeywords = ['hate', 'kill', 'die', 'stupid', 'idiot']
    const words = content.toLowerCase().split(/\s+/)
    const toxicCount = words.filter(word => toxicKeywords.includes(word)).length
    
    return Math.min(1.0, toxicCount / words.length * 10)
  }
}

/**
 * Spam Detection
 */
class SpamDetector {
  async analyze(content: string, context?: any): Promise<{
    flags: ModerationFlag[]
    riskScore: number
  }> {
    const flags: ModerationFlag[] = []
    let riskScore = 0

    // Check for spam indicators
    const spamScore = this.calculateSpamScore(content, context)
    
    if (spamScore > 0.8) {
      flags.push({
        rule: 'spam_high',
        severity: 'high',
        category: 'spam',
        message: `High spam probability (score: ${spamScore.toFixed(2)})`,
        confidence: spamScore
      })
      riskScore += 35
    } else if (spamScore > 0.6) {
      flags.push({
        rule: 'spam_medium',
        severity: 'medium',
        category: 'spam',
        message: `Medium spam probability (score: ${spamScore.toFixed(2)})`,
        confidence: spamScore
      })
      riskScore += 20
    }

    return { flags, riskScore }
  }

  private calculateSpamScore(content: string, context?: any): number {
    let score = 0

    // Check for excessive repetition
    const words = content.split(/\s+/)
    const uniqueWords = new Set(words)
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      score += 0.3
    }

    // Check for excessive URLs
    const urlCount = (content.match(/https?:\/\/\S+/g) || []).length
    if (urlCount > 2) {
      score += urlCount * 0.2
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.5) {
      score += 0.3
    }

    // Check for rapid submission (if context provided)
    if (context?.rapidSubmission) {
      score += 0.4
    }

    return Math.min(1.0, score)
  }
}

/**
 * PII Detection
 */
class PIIDetector {
  async analyze(content: string): Promise<{
    flags: ModerationFlag[]
    riskScore: number
  }> {
    const flags: ModerationFlag[] = []
    let riskScore = 0

    const piiPatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN', severity: 'high' as const },
      { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, type: 'Credit Card', severity: 'high' as const },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'Email', severity: 'medium' as const },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, type: 'Phone', severity: 'medium' as const }
    ]

    piiPatterns.forEach(({ pattern, type, severity }) => {
      const matches = content.match(pattern)
      if (matches) {
        flags.push({
          rule: `pii_${type.toLowerCase().replace(' ', '_')}`,
          severity,
          category: 'pii',
          message: `${type} detected in content`,
          confidence: 0.9
        })
        riskScore += severity === 'high' ? 30 : 20
      }
    })

    return { flags, riskScore }
  }
}

/**
 * Malware/Phishing Detection
 */
class MalwareDetector {
  async analyze(content: string): Promise<{
    flags: ModerationFlag[]
    riskScore: number
  }> {
    const flags: ModerationFlag[] = []
    let riskScore = 0

    // Check for suspicious URLs
    const urls = content.match(/https?:\/\/\S+/g) || []
    
    for (const url of urls) {
      if (await this.isSuspiciousURL(url)) {
        flags.push({
          rule: 'suspicious_url',
          severity: 'high',
          category: 'malware',
          message: `Suspicious URL detected: ${url}`,
          confidence: 0.8
        })
        riskScore += 40
      }
    }

    // Check for phishing keywords
    const phishingKeywords = ['verify account', 'click here now', 'urgent action required', 'suspended account']
    const lowerContent = content.toLowerCase()
    
    phishingKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        flags.push({
          rule: 'phishing_keyword',
          severity: 'medium',
          category: 'phishing',
          message: `Phishing keyword detected: "${keyword}"`,
          confidence: 0.7
        })
        riskScore += 25
      }
    })

    return { flags, riskScore }
  }

  private async isSuspiciousURL(url: string): Promise<boolean> {
    // This would integrate with URL reputation services
    // For now, simple heuristics
    try {
      const urlObj = new URL(url)
      
      // Check for suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf']
      if (suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
        return true
      }

      // Check for URL shorteners (could be used for phishing)
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'short.link']
      if (shorteners.includes(urlObj.hostname)) {
        return true
      }

      return false
    } catch {
      return false
    }
  }
}

/**
 * Default content moderator instance
 */
export const defaultModerator = new ContentModerator({
  severity: 'moderate',
  autoAction: 'flag',
  enableProfanityFilter: true,
  enableToxicityDetection: true,
  enableSpamDetection: true,
  enablePIIDetection: true,
  enableMalwareDetection: true
})

/**
 * Express middleware for content moderation
 */
export function contentModerationMiddleware(moderator: ContentModerator = defaultModerator) {
  return async (req: any, res: any, next: any) => {
    try {
      const content = req.body?.content || req.body?.prompt || req.body?.message
      
      if (content && typeof content === 'string') {
        const result = await moderator.moderateContent(content, {
          userId: req.user?.id,
          sessionId: req.sessionID,
          contentType: req.body?.type || 'prompt',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: Date.now()
          }
        })

        // Add moderation result to request
        req.moderationResult = result

        // Block if not allowed
        if (!result.allowed) {
          return res.status(400).json({
            error: 'Content Violation',
            message: 'Content violates community guidelines',
            flags: result.flags.map(f => ({
              category: f.category,
              message: f.message
            }))
          })
        }

        // Add warning headers if flagged
        if (result.flags.length > 0) {
          res.setHeader('X-Content-Warning', 'Content flagged for review')
        }
      }

      next()
    } catch (error) {
      console.error('Content moderation error:', error)
      next() // Allow request to proceed on error
    }
  }
}