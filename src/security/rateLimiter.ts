/**
 * Comprehensive Rate Limiting System for PromptCraft
 * Implements multiple rate limiting strategies with Redis support, sliding windows, and adaptive limits
 */

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  onLimitReached?: (identifier: string, info: RateLimitInfo) => void
  store?: RateLimitStore
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

export interface RateLimitInfo {
  totalHits: number
  totalRequests: number
  remainingRequests: number
  msBeforeNext: number
  resetTime: Date
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>
  set(key: string, info: RateLimitInfo): Promise<void>
  increment(key: string): Promise<RateLimitInfo>
  reset(key: string): Promise<void>
}

/**
 * In-memory rate limit store with LRU eviction
 */
export class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitInfo>()
  private maxSize: number
  private cleanupInterval: NodeJS.Timeout

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, info] of this.store.entries()) {
      if (info.resetTime.getTime() <= now) {
        this.store.delete(key)
      }
    }
  }

  private evictLRU(): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      this.store.delete(firstKey)
    }
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const info = this.store.get(key)
    if (!info) return null

    // Check if expired
    if (info.resetTime.getTime() <= Date.now()) {
      this.store.delete(key)
      return null
    }

    // Move to end (LRU)
    this.store.delete(key)
    this.store.set(key, info)
    
    return info
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    this.evictLRU()
    this.store.set(key, info)
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const existing = await this.get(key)
    
    if (existing) {
      existing.totalHits++
      existing.totalRequests++
      existing.remainingRequests = Math.max(0, existing.remainingRequests - 1)
      existing.msBeforeNext = existing.resetTime.getTime() - Date.now()
      
      await this.set(key, existing)
      return existing
    }

    // Create new entry
    const windowMs = 60000 // Default 1 minute window
    const maxRequests = 100 // Default limit
    const resetTime = new Date(Date.now() + windowMs)
    
    const info: RateLimitInfo = {
      totalHits: 1,
      totalRequests: 1,
      remainingRequests: maxRequests - 1,
      msBeforeNext: windowMs,
      resetTime
    }

    await this.set(key, info)
    return info
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

/**
 * Redis-based rate limit store
 */
export class RedisStore implements RateLimitStore {
  private client: any
  private prefix: string

  constructor(redisClient: any, prefix: string = 'rl:') {
    this.client = redisClient
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    try {
      const data = await this.client.get(this.getKey(key))
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    try {
      const ttl = Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
      await this.client.setex(this.getKey(key), ttl, JSON.stringify(info))
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const redisKey = this.getKey(key)
    
    try {
      // Use Lua script for atomic increment
      const script = `
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local current = redis.call('GET', key)
        if current == false then
          local info = {
            totalHits = 1,
            totalRequests = 1,
            remainingRequests = limit - 1,
            msBeforeNext = window,
            resetTime = now + window
          }
          redis.call('SETEX', key, math.ceil(window / 1000), cjson.encode(info))
          return cjson.encode(info)
        else
          local info = cjson.decode(current)
          info.totalHits = info.totalHits + 1
          info.totalRequests = info.totalRequests + 1
          info.remainingRequests = math.max(0, info.remainingRequests - 1)
          info.msBeforeNext = info.resetTime - now
          
          local ttl = math.ceil((info.resetTime - now) / 1000)
          redis.call('SETEX', key, ttl, cjson.encode(info))
          return cjson.encode(info)
        end
      `
      
      const result = await this.client.eval(script, 1, redisKey, 60000, 100, Date.now())
      return JSON.parse(result)
    } catch (error) {
      console.error('Redis increment error:', error)
      // Fallback to simple increment
      return this.simpleIncrement(key)
    }
  }

  private async simpleIncrement(key: string): Promise<RateLimitInfo> {
    const existing = await this.get(key)
    
    if (existing) {
      existing.totalHits++
      existing.totalRequests++
      existing.remainingRequests = Math.max(0, existing.remainingRequests - 1)
      existing.msBeforeNext = existing.resetTime.getTime() - Date.now()
      
      await this.set(key, existing)
      return existing
    }

    const windowMs = 60000
    const maxRequests = 100
    const resetTime = new Date(Date.now() + windowMs)
    
    const info: RateLimitInfo = {
      totalHits: 1,
      totalRequests: 1,
      remainingRequests: maxRequests - 1,
      msBeforeNext: windowMs,
      resetTime
    }

    await this.set(key, info)
    return info
  }

  async reset(key: string): Promise<void> {
    try {
      await this.client.del(this.getKey(key))
    } catch (error) {
      console.error('Redis reset error:', error)
    }
  }
}

/**
 * Advanced rate limiter with multiple strategies
 */
export class AdvancedRateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map()
  private defaultStore: RateLimitStore

  constructor(defaultStore?: RateLimitStore) {
    this.defaultStore = defaultStore || new MemoryStore()
  }

  /**
   * Add rate limit configuration for a specific endpoint or user type
   */
  addLimit(name: string, config: RateLimitConfig): void {
    this.configs.set(name, {
      store: this.defaultStore,
      keyGenerator: (id) => `${name}:${id}`,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests, please try again later',
      ...config
    })
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(limitName: string, identifier: string): Promise<{
    allowed: boolean
    info: RateLimitInfo
    headers: Record<string, string>
  }> {
    const config = this.configs.get(limitName)
    if (!config) {
      throw new Error(`Rate limit configuration '${limitName}' not found`)
    }

    const key = config.keyGenerator!(identifier)
    const store = config.store!
    
    const info = await store.increment(key)
    const allowed = info.remainingRequests > 0

    // Call limit reached callback
    if (!allowed && config.onLimitReached) {
      config.onLimitReached(identifier, info)
    }

    const headers = this.generateHeaders(config, info)

    return { allowed, info, headers }
  }

  /**
   * Generate rate limit headers
   */
  private generateHeaders(config: RateLimitConfig, info: RateLimitInfo): Record<string, string> {
    const headers: Record<string, string> = {}

    if (config.standardHeaders) {
      headers['RateLimit-Limit'] = config.maxRequests.toString()
      headers['RateLimit-Remaining'] = info.remainingRequests.toString()
      headers['RateLimit-Reset'] = Math.ceil(info.resetTime.getTime() / 1000).toString()
    }

    if (config.legacyHeaders) {
      headers['X-RateLimit-Limit'] = config.maxRequests.toString()
      headers['X-RateLimit-Remaining'] = info.remainingRequests.toString()
      headers['X-RateLimit-Reset'] = Math.ceil(info.resetTime.getTime() / 1000).toString()
    }

    return headers
  }

  /**
   * Reset rate limit for specific identifier
   */
  async resetLimit(limitName: string, identifier: string): Promise<void> {
    const config = this.configs.get(limitName)
    if (!config) return

    const key = config.keyGenerator!(identifier)
    await config.store!.reset(key)
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>()
  private windowSize: number
  private maxRequests: number

  constructor(windowSize: number = 60000, maxRequests: number = 100) {
    this.windowSize = windowSize
    this.maxRequests = maxRequests

    // Cleanup old windows every minute
    setInterval(() => this.cleanup(), 60000)
  }

  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.windowSize

    for (const [key, timestamps] of this.windows.entries()) {
      const filtered = timestamps.filter(t => t > cutoff)
      if (filtered.length === 0) {
        this.windows.delete(key)
      } else {
        this.windows.set(key, filtered)
      }
    }
  }

  /**
   * Check if request is allowed using sliding window
   */
  checkRequest(identifier: string): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const cutoff = now - this.windowSize
    
    // Get existing timestamps and filter old ones
    const timestamps = this.windows.get(identifier) || []
    const validTimestamps = timestamps.filter(t => t > cutoff)
    
    const allowed = validTimestamps.length < this.maxRequests
    
    if (allowed) {
      validTimestamps.push(now)
      this.windows.set(identifier, validTimestamps)
    }

    const remaining = Math.max(0, this.maxRequests - validTimestamps.length)
    const resetTime = validTimestamps.length > 0 
      ? Math.min(...validTimestamps) + this.windowSize
      : now + this.windowSize

    return { allowed, remaining, resetTime }
  }
}

/**
 * Adaptive rate limiter that adjusts limits based on system load
 */
export class AdaptiveRateLimiter {
  private baseLimits = new Map<string, number>()
  private currentLimits = new Map<string, number>()
  private systemLoad = 0
  private loadThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  }

  constructor() {
    // Monitor system load (simplified)
    setInterval(() => this.updateSystemLoad(), 5000)
  }

  private updateSystemLoad(): void {
    // In a real implementation, this would measure:
    // - CPU usage
    // - Memory usage
    // - Response times
    // - Error rates
    
    // Simplified simulation
    this.systemLoad = Math.random()
    this.adjustLimits()
  }

  private adjustLimits(): void {
    const multiplier = this.getLoadMultiplier()
    
    for (const [key, baseLimit] of this.baseLimits.entries()) {
      const adjustedLimit = Math.floor(baseLimit * multiplier)
      this.currentLimits.set(key, adjustedLimit)
    }
  }

  private getLoadMultiplier(): number {
    if (this.systemLoad < this.loadThresholds.low) {
      return 1.2 // Increase limits when load is low
    } else if (this.systemLoad < this.loadThresholds.medium) {
      return 1.0 // Normal limits
    } else if (this.systemLoad < this.loadThresholds.high) {
      return 0.7 // Reduce limits when load is medium-high
    } else {
      return 0.4 // Severely reduce limits when load is high
    }
  }

  setBaseLimit(identifier: string, limit: number): void {
    this.baseLimits.set(identifier, limit)
    this.currentLimits.set(identifier, limit)
  }

  getCurrentLimit(identifier: string): number {
    return this.currentLimits.get(identifier) || 100
  }

  getSystemStatus(): {
    load: number
    status: string
    multiplier: number
  } {
    const multiplier = this.getLoadMultiplier()
    let status = 'normal'
    
    if (this.systemLoad > this.loadThresholds.high) {
      status = 'high_load'
    } else if (this.systemLoad > this.loadThresholds.medium) {
      status = 'medium_load'
    } else if (this.systemLoad < this.loadThresholds.low) {
      status = 'low_load'
    }

    return { load: this.systemLoad, status, multiplier }
  }
}

/**
 * Client-side rate limiter for frontend applications
 */
export class ClientRateLimiter {
  private limits = new Map<string, {
    count: number
    resetTime: number
    windowMs: number
    maxRequests: number
  }>()

  /**
   * Check if client-side action is allowed
   */
  checkAction(action: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const limit = this.limits.get(action)

    if (!limit || now >= limit.resetTime) {
      // Create new window
      this.limits.set(action, {
        count: 1,
        resetTime: now + windowMs,
        windowMs,
        maxRequests
      })
      return true
    }

    if (limit.count >= maxRequests) {
      return false
    }

    limit.count++
    return true
  }

  /**
   * Get remaining requests for an action
   */
  getRemaining(action: string): number {
    const limit = this.limits.get(action)
    if (!limit || Date.now() >= limit.resetTime) {
      return limit?.maxRequests || 10
    }
    return Math.max(0, limit.maxRequests - limit.count)
  }

  /**
   * Get time until reset
   */
  getResetTime(action: string): number {
    const limit = this.limits.get(action)
    if (!limit) return 0
    return Math.max(0, limit.resetTime - Date.now())
  }
}

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const rateLimiter = new AdvancedRateLimiter()
  rateLimiter.addLimit('default', config)

  return async (req: any, res: any, next: any) => {
    try {
      const identifier = req.ip || req.connection.remoteAddress || 'unknown'
      const result = await rateLimiter.checkLimit('default', identifier)

      // Set headers
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil(result.info.msBeforeNext / 1000)
        })
      }

      next()
    } catch (error) {
      console.error('Rate limiting error:', error)
      next() // Allow request to proceed on error
    }
  }
}

/**
 * Default rate limiter instances
 */
export const defaultRateLimiter = new AdvancedRateLimiter()

// Configure default limits
defaultRateLimiter.addLimit('api', {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  message: 'Too many API requests'
})

defaultRateLimiter.addLimit('auth', {
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts'
})

defaultRateLimiter.addLimit('prompt', {
  windowMs: 60000, // 1 minute
  maxRequests: 20,
  message: 'Too many prompt enhancement requests'
})

export const clientRateLimiter = new ClientRateLimiter()
export const slidingWindowLimiter = new SlidingWindowRateLimiter()
export const adaptiveLimiter = new AdaptiveRateLimiter()