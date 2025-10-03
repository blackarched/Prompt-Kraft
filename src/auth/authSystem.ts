/**
 * Authentication System for PromptCraft
 * Implements flexible authentication with multiple providers and security features
 */

import { createHash, randomBytes, pbkdf2Sync } from 'crypto'

export interface AuthConfig {
  providers: AuthProvider[]
  sessionConfig: SessionConfig
  passwordPolicy: PasswordPolicy
  mfaRequired: boolean
  rateLimiting: AuthRateLimiting
  tokenConfig: TokenConfig
  hooks: AuthHooks
}

export interface AuthProvider {
  name: string
  type: 'local' | 'oauth' | 'saml' | 'ldap' | 'api_key'
  enabled: boolean
  config: Record<string, any>
  priority: number
}

export interface SessionConfig {
  maxAge: number // in milliseconds
  secure: boolean
  httpOnly: boolean
  sameSite: 'strict' | 'lax' | 'none'
  rolling: boolean
  regenerateOnAuth: boolean
}

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventReuse: number // number of previous passwords to check
  maxAge: number // password expiration in days
}

export interface AuthRateLimiting {
  maxAttempts: number
  windowMs: number
  lockoutDuration: number
  progressiveDelay: boolean
}

export interface TokenConfig {
  accessTokenTTL: number
  refreshTokenTTL: number
  algorithm: 'HS256' | 'RS256'
  issuer: string
  audience: string
}

export interface AuthHooks {
  beforeLogin?: (credentials: any) => Promise<void>
  afterLogin?: (user: User, session: Session) => Promise<void>
  beforeLogout?: (user: User, session: Session) => Promise<void>
  afterLogout?: (userId: string) => Promise<void>
  onAuthFailure?: (credentials: any, reason: string) => Promise<void>
}

export interface User {
  id: string
  email: string
  username?: string
  displayName?: string
  roles: string[]
  permissions: string[]
  profile: UserProfile
  preferences: UserPreferences
  security: UserSecurity
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
  isVerified: boolean
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  avatar?: string
  timezone?: string
  language?: string
  organization?: string
  title?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
  accessibility: AccessibilityPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
  frequency: 'immediate' | 'daily' | 'weekly' | 'never'
}

export interface PrivacyPreferences {
  shareAnalytics: boolean
  shareUsageData: boolean
  allowPersonalization: boolean
  dataRetentionPeriod: number
}

export interface AccessibilityPreferences {
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
}

export interface UserSecurity {
  passwordHash: string
  salt: string
  mfaEnabled: boolean
  mfaSecret?: string
  backupCodes?: string[]
  lastPasswordChange: Date
  failedLoginAttempts: number
  lockedUntil?: Date
  trustedDevices: TrustedDevice[]
  sessions: Session[]
}

export interface TrustedDevice {
  id: string
  name: string
  fingerprint: string
  addedAt: Date
  lastUsedAt: Date
  ipAddress: string
  userAgent: string
}

export interface Session {
  id: string
  userId: string
  createdAt: Date
  expiresAt: Date
  lastAccessedAt: Date
  ipAddress: string
  userAgent: string
  deviceFingerprint?: string
  isActive: boolean
  data: Record<string, any>
}

export interface AuthResult {
  success: boolean
  user?: User
  session?: Session
  tokens?: {
    accessToken: string
    refreshToken: string
  }
  error?: string
  requiresMFA?: boolean
  requiresPasswordChange?: boolean
}

/**
 * Main Authentication System
 */
export class AuthSystem {
  private config: AuthConfig
  private userStore: UserStore
  private sessionStore: SessionStore
  private tokenManager: TokenManager
  private mfaManager: MFAManager
  private rateLimiter: AuthRateLimiter

  constructor(
    config: Partial<AuthConfig> = {},
    userStore: UserStore,
    sessionStore: SessionStore
  ) {
    this.config = this.createDefaultConfig(config)
    this.userStore = userStore
    this.sessionStore = sessionStore
    this.tokenManager = new TokenManager(this.config.tokenConfig)
    this.mfaManager = new MFAManager()
    this.rateLimiter = new AuthRateLimiter(this.config.rateLimiting)
  }

  private createDefaultConfig(customConfig: Partial<AuthConfig>): AuthConfig {
    return {
      providers: [
        {
          name: 'local',
          type: 'local',
          enabled: true,
          config: {},
          priority: 1
        }
      ],
      sessionConfig: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        rolling: true,
        regenerateOnAuth: true
      },
      passwordPolicy: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        preventReuse: 5,
        maxAge: 90
      },
      mfaRequired: false,
      rateLimiting: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        lockoutDuration: 30 * 60 * 1000, // 30 minutes
        progressiveDelay: true
      },
      tokenConfig: {
        accessTokenTTL: 15 * 60, // 15 minutes
        refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days
        algorithm: 'HS256',
        issuer: 'promptcraft',
        audience: 'promptcraft-users'
      },
      hooks: {},
      ...customConfig
    }
  }

  /**
   * Authenticate user with credentials
   */
  async authenticate(
    credentials: {
      email?: string
      username?: string
      password?: string
      provider?: string
      token?: string
      mfaCode?: string
    },
    context: {
      ipAddress: string
      userAgent: string
      deviceFingerprint?: string
    }
  ): Promise<AuthResult> {
    try {
      // Rate limiting check
      const rateLimitResult = await this.rateLimiter.checkAttempt(
        credentials.email || credentials.username || 'unknown',
        context.ipAddress
      )

      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds`
        }
      }

      // Call before login hook
      if (this.config.hooks.beforeLogin) {
        await this.config.hooks.beforeLogin(credentials)
      }

      // Find user
      const user = await this.findUser(credentials)
      if (!user) {
        await this.handleAuthFailure(credentials, 'User not found')
        return { success: false, error: 'Invalid credentials' }
      }

      // Check if account is locked
      if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
        return {
          success: false,
          error: `Account locked until ${user.security.lockedUntil.toISOString()}`
        }
      }

      // Verify credentials based on provider
      const provider = this.getProvider(credentials.provider || 'local')
      const credentialsValid = await this.verifyCredentials(user, credentials, provider)

      if (!credentialsValid) {
        await this.handleAuthFailure(credentials, 'Invalid credentials')
        await this.incrementFailedAttempts(user)
        return { success: false, error: 'Invalid credentials' }
      }

      // Check if MFA is required
      if (user.security.mfaEnabled || this.config.mfaRequired) {
        if (!credentials.mfaCode) {
          return {
            success: false,
            requiresMFA: true,
            error: 'MFA code required'
          }
        }

        const mfaValid = await this.mfaManager.verifyCode(user.security.mfaSecret!, credentials.mfaCode)
        if (!mfaValid) {
          await this.handleAuthFailure(credentials, 'Invalid MFA code')
          return { success: false, error: 'Invalid MFA code' }
        }
      }

      // Check if password change is required
      const passwordAge = Date.now() - user.security.lastPasswordChange.getTime()
      const maxPasswordAge = this.config.passwordPolicy.maxAge * 24 * 60 * 60 * 1000
      
      if (passwordAge > maxPasswordAge) {
        return {
          success: false,
          requiresPasswordChange: true,
          error: 'Password has expired and must be changed'
        }
      }

      // Create session
      const session = await this.createSession(user, context)

      // Generate tokens
      const tokens = await this.tokenManager.generateTokens(user, session)

      // Reset failed attempts
      await this.resetFailedAttempts(user)

      // Update last login
      user.lastLoginAt = new Date()
      await this.userStore.update(user)

      // Call after login hook
      if (this.config.hooks.afterLogin) {
        await this.config.hooks.afterLogin(user, session)
      }

      return {
        success: true,
        user,
        session,
        tokens
      }

    } catch (error) {
      console.error('Authentication error:', error)
      return {
        success: false,
        error: 'Authentication failed'
      }
    }
  }

  /**
   * Register new user
   */
  async register(
    userData: {
      email: string
      username?: string
      password: string
      profile?: Partial<UserProfile>
      preferences?: Partial<UserPreferences>
    },
    context: {
      ipAddress: string
      userAgent: string
    }
  ): Promise<AuthResult> {
    try {
      // Validate password policy
      const passwordValidation = this.validatePassword(userData.password)
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        }
      }

      // Check if user already exists
      const existingUser = await this.userStore.findByEmail(userData.email)
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists'
        }
      }

      // Hash password
      const { hash, salt } = await this.hashPassword(userData.password)

      // Create user
      const user: User = {
        id: this.generateUserId(),
        email: userData.email,
        username: userData.username,
        displayName: userData.profile?.firstName && userData.profile?.lastName
          ? `${userData.profile.firstName} ${userData.profile.lastName}`
          : userData.username || userData.email,
        roles: ['user'],
        permissions: ['prompt:create', 'prompt:read'],
        profile: {
          timezone: 'UTC',
          language: 'en',
          ...userData.profile
        },
        preferences: {
          theme: 'auto',
          notifications: {
            email: true,
            push: false,
            inApp: true,
            frequency: 'immediate'
          },
          privacy: {
            shareAnalytics: false,
            shareUsageData: false,
            allowPersonalization: true,
            dataRetentionPeriod: 365
          },
          accessibility: {
            highContrast: false,
            largeText: false,
            screenReader: false,
            keyboardNavigation: false
          },
          ...userData.preferences
        },
        security: {
          passwordHash: hash,
          salt,
          mfaEnabled: false,
          lastPasswordChange: new Date(),
          failedLoginAttempts: 0,
          trustedDevices: [],
          sessions: []
        },
        createdAt: new Date(),
        isActive: true,
        isVerified: false
      }

      await this.userStore.create(user)

      // Send verification email (if configured)
      await this.sendVerificationEmail(user)

      return {
        success: true,
        user
      }

    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Registration failed'
      }
    }
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    try {
      const session = await this.sessionStore.get(sessionId)
      if (!session) return

      const user = await this.userStore.findById(session.userId)
      
      // Call before logout hook
      if (this.config.hooks.beforeLogout && user) {
        await this.config.hooks.beforeLogout(user, session)
      }

      // Invalidate session
      await this.sessionStore.delete(sessionId)

      // Revoke tokens
      await this.tokenManager.revokeTokens(sessionId)

      // Call after logout hook
      if (this.config.hooks.afterLogout) {
        await this.config.hooks.afterLogout(session.userId)
      }

    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken?: string
    refreshToken?: string
    error?: string
  }> {
    try {
      const tokenData = await this.tokenManager.verifyRefreshToken(refreshToken)
      if (!tokenData) {
        return { error: 'Invalid refresh token' }
      }

      const user = await this.userStore.findById(tokenData.userId)
      const session = await this.sessionStore.get(tokenData.sessionId)

      if (!user || !session || !session.isActive) {
        return { error: 'Invalid session' }
      }

      // Generate new tokens
      const tokens = await this.tokenManager.generateTokens(user, session)

      return tokens

    } catch (error) {
      console.error('Token refresh error:', error)
      return { error: 'Token refresh failed' }
    }
  }

  /**
   * Verify session
   */
  async verifySession(sessionId: string): Promise<{
    valid: boolean
    user?: User
    session?: Session
  }> {
    try {
      const session = await this.sessionStore.get(sessionId)
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return { valid: false }
      }

      const user = await this.userStore.findById(session.userId)
      if (!user || !user.isActive) {
        return { valid: false }
      }

      // Update last accessed time
      session.lastAccessedAt = new Date()
      await this.sessionStore.update(session)

      return { valid: true, user, session }

    } catch (error) {
      console.error('Session verification error:', error)
      return { valid: false }
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string): Promise<{
    secret: string
    qrCode: string
    backupCodes: string[]
  }> {
    const user = await this.userStore.findById(userId)
    if (!user) throw new Error('User not found')

    const mfaSetup = await this.mfaManager.generateSecret(user.email)
    
    user.security.mfaSecret = mfaSetup.secret
    user.security.backupCodes = mfaSetup.backupCodes
    
    await this.userStore.update(user)

    return mfaSetup
  }

  /**
   * Confirm MFA setup
   */
  async confirmMFA(userId: string, code: string): Promise<boolean> {
    const user = await this.userStore.findById(userId)
    if (!user || !user.security.mfaSecret) return false

    const isValid = await this.mfaManager.verifyCode(user.security.mfaSecret, code)
    if (isValid) {
      user.security.mfaEnabled = true
      await this.userStore.update(user)
    }

    return isValid
  }

  /**
   * Private helper methods
   */
  private async findUser(credentials: any): Promise<User | null> {
    if (credentials.email) {
      return this.userStore.findByEmail(credentials.email)
    }
    if (credentials.username) {
      return this.userStore.findByUsername(credentials.username)
    }
    return null
  }

  private getProvider(name: string): AuthProvider {
    const provider = this.config.providers.find(p => p.name === name)
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${name} not found or disabled`)
    }
    return provider
  }

  private async verifyCredentials(
    user: User,
    credentials: any,
    provider: AuthProvider
  ): Promise<boolean> {
    switch (provider.type) {
      case 'local':
        return this.verifyPassword(credentials.password, user.security.passwordHash, user.security.salt)
      case 'oauth':
        return this.verifyOAuthToken(credentials.token, provider)
      case 'api_key':
        return this.verifyApiKey(credentials.token, user)
      default:
        return false
    }
  }

  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return computedHash === hash
  }

  private async verifyOAuthToken(token: string, provider: AuthProvider): Promise<boolean> {
    // Implementation would depend on OAuth provider
    return false
  }

  private async verifyApiKey(apiKey: string, user: User): Promise<boolean> {
    // Implementation for API key verification
    return false
  }

  private async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = randomBytes(32).toString('hex')
    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return { hash, salt }
  }

  private validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const policy = this.config.passwordPolicy

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`)
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`)
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return { valid: errors.length === 0, errors }
  }

  private async createSession(user: User, context: any): Promise<Session> {
    const session: Session = {
      id: this.generateSessionId(),
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionConfig.maxAge),
      lastAccessedAt: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      isActive: true,
      data: {}
    }

    await this.sessionStore.create(session)
    return session
  }

  private async handleAuthFailure(credentials: any, reason: string): Promise<void> {
    if (this.config.hooks.onAuthFailure) {
      await this.config.hooks.onAuthFailure(credentials, reason)
    }
  }

  private async incrementFailedAttempts(user: User): Promise<void> {
    user.security.failedLoginAttempts++
    
    if (user.security.failedLoginAttempts >= this.config.rateLimiting.maxAttempts) {
      user.security.lockedUntil = new Date(Date.now() + this.config.rateLimiting.lockoutDuration)
    }

    await this.userStore.update(user)
  }

  private async resetFailedAttempts(user: User): Promise<void> {
    user.security.failedLoginAttempts = 0
    user.security.lockedUntil = undefined
    await this.userStore.update(user)
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    // Implementation for sending verification email
    console.log(`Verification email would be sent to ${user.email}`)
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${randomBytes(16).toString('hex')}`
  }
}

/**
 * Supporting classes and interfaces
 */
export interface UserStore {
  create(user: User): Promise<void>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
}

export interface SessionStore {
  create(session: Session): Promise<void>
  get(id: string): Promise<Session | null>
  update(session: Session): Promise<void>
  delete(id: string): Promise<void>
  cleanup(): Promise<void>
}

class TokenManager {
  constructor(private config: TokenConfig) {}

  async generateTokens(user: User, session: Session): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    // Implementation would use JWT or similar
    return {
      accessToken: 'access_token_placeholder',
      refreshToken: 'refresh_token_placeholder'
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    // Implementation for token verification
    return null
  }

  async revokeTokens(sessionId: string): Promise<void> {
    // Implementation for token revocation
  }
}

class MFAManager {
  async generateSecret(email: string): Promise<{
    secret: string
    qrCode: string
    backupCodes: string[]
  }> {
    // Implementation for MFA secret generation
    return {
      secret: 'mfa_secret_placeholder',
      qrCode: 'qr_code_data_placeholder',
      backupCodes: ['backup1', 'backup2', 'backup3']
    }
  }

  async verifyCode(secret: string, code: string): Promise<boolean> {
    // Implementation for MFA code verification
    return false
  }
}

class AuthRateLimiter {
  constructor(private config: AuthRateLimiting) {}

  async checkAttempt(identifier: string, ip: string): Promise<{
    allowed: boolean
    resetTime: number
  }> {
    // Implementation for rate limiting
    return { allowed: true, resetTime: 0 }
  }
}

/**
 * Express middleware for authentication
 */
export function authMiddleware(authSystem: AuthSystem, options: {
  required?: boolean
  roles?: string[]
  permissions?: string[]
} = {}) {
  return async (req: any, res: any, next: any) => {
    try {
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id']
      const token = req.headers.authorization?.replace('Bearer ', '')

      let authResult = null

      if (sessionId) {
        authResult = await authSystem.verifySession(sessionId)
      } else if (token) {
        // Verify JWT token
        // Implementation would verify JWT and extract user info
      }

      if (authResult?.valid) {
        req.user = authResult.user
        req.session = authResult.session
      }

      // Check if authentication is required
      if (options.required && !req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // Check roles
      if (options.roles && req.user) {
        const hasRole = options.roles.some(role => req.user.roles.includes(role))
        if (!hasRole) {
          return res.status(403).json({ error: 'Insufficient privileges' })
        }
      }

      // Check permissions
      if (options.permissions && req.user) {
        const hasPermission = options.permissions.some(perm => req.user.permissions.includes(perm))
        if (!hasPermission) {
          return res.status(403).json({ error: 'Insufficient permissions' })
        }
      }

      next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      if (options.required) {
        return res.status(401).json({ error: 'Authentication failed' })
      }
      next()
    }
  }
}