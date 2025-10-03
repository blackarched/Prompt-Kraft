/**
 * Data Retention Policy and Implementation for PromptCraft
 * Implements GDPR, CCPA, and other privacy regulation compliance
 */

export interface DataRetentionPolicy {
  userProfiles: RetentionRule
  promptHistory: RetentionRule
  sessionData: RetentionRule
  auditLogs: RetentionRule
  moderationLogs: RetentionRule
  analyticsData: RetentionRule
  errorLogs: RetentionRule
  backups: RetentionRule
  customCategories: Map<string, RetentionRule>
}

export interface RetentionRule {
  category: string
  retentionPeriod: number // in days
  archivePeriod?: number // days before archival
  purgeMethod: 'soft_delete' | 'hard_delete' | 'anonymize' | 'archive'
  legalHold: boolean
  encryptionRequired: boolean
  backupRetention?: number // backup retention in days
  geographicRestrictions?: string[]
  complianceReasons: string[]
  reviewRequired: boolean
  automaticPurge: boolean
}

export interface DataRecord {
  id: string
  category: string
  userId?: string
  sessionId?: string
  data: any
  createdAt: Date
  lastAccessed?: Date
  retentionDate: Date
  archiveDate?: Date
  purgeDate: Date
  legalHold: boolean
  encrypted: boolean
  metadata: {
    source: string
    version: string
    checksum?: string
    size: number
  }
}

export interface PurgeResult {
  category: string
  recordsProcessed: number
  recordsDeleted: number
  recordsArchived: number
  recordsAnonymized: number
  errors: string[]
  completedAt: Date
  nextScheduledPurge: Date
}

/**
 * Data Retention Manager
 */
export class DataRetentionManager {
  private policy: DataRetentionPolicy
  private storage: DataStorage
  private encryptionKey: string
  private auditLogger: AuditLogger

  constructor(
    policy: Partial<DataRetentionPolicy> = {},
    storage: DataStorage,
    encryptionKey: string
  ) {
    this.policy = this.createDefaultPolicy(policy)
    this.storage = storage
    this.encryptionKey = encryptionKey
    this.auditLogger = new AuditLogger()
    
    this.scheduleAutomaticPurge()
  }

  /**
   * Create default retention policy compliant with major regulations
   */
  private createDefaultPolicy(customPolicy: Partial<DataRetentionPolicy>): DataRetentionPolicy {
    const defaultPolicy: DataRetentionPolicy = {
      userProfiles: {
        category: 'user_profiles',
        retentionPeriod: 2555, // 7 years (financial records requirement)
        archivePeriod: 1095, // 3 years
        purgeMethod: 'anonymize',
        legalHold: false,
        encryptionRequired: true,
        backupRetention: 90,
        complianceReasons: ['GDPR Article 5', 'CCPA Section 1798.105'],
        reviewRequired: true,
        automaticPurge: true
      },
      promptHistory: {
        category: 'prompt_history',
        retentionPeriod: 365, // 1 year
        archivePeriod: 90, // 3 months
        purgeMethod: 'soft_delete',
        legalHold: false,
        encryptionRequired: true,
        backupRetention: 30,
        complianceReasons: ['Data minimization', 'User privacy'],
        reviewRequired: false,
        automaticPurge: true
      },
      sessionData: {
        category: 'session_data',
        retentionPeriod: 30, // 30 days
        purgeMethod: 'hard_delete',
        legalHold: false,
        encryptionRequired: false,
        complianceReasons: ['Session security', 'Performance optimization'],
        reviewRequired: false,
        automaticPurge: true
      },
      auditLogs: {
        category: 'audit_logs',
        retentionPeriod: 2555, // 7 years (compliance requirement)
        archivePeriod: 365, // 1 year
        purgeMethod: 'archive',
        legalHold: true,
        encryptionRequired: true,
        backupRetention: 180,
        complianceReasons: ['SOX compliance', 'Security auditing', 'Legal requirements'],
        reviewRequired: true,
        automaticPurge: false
      },
      moderationLogs: {
        category: 'moderation_logs',
        retentionPeriod: 1095, // 3 years
        archivePeriod: 365, // 1 year
        purgeMethod: 'archive',
        legalHold: false,
        encryptionRequired: true,
        backupRetention: 90,
        complianceReasons: ['Content safety', 'Legal protection'],
        reviewRequired: true,
        automaticPurge: true
      },
      analyticsData: {
        category: 'analytics_data',
        retentionPeriod: 730, // 2 years
        archivePeriod: 365, // 1 year
        purgeMethod: 'anonymize',
        legalHold: false,
        encryptionRequired: false,
        backupRetention: 60,
        complianceReasons: ['Business intelligence', 'Product improvement'],
        reviewRequired: false,
        automaticPurge: true
      },
      errorLogs: {
        category: 'error_logs',
        retentionPeriod: 365, // 1 year
        archivePeriod: 90, // 3 months
        purgeMethod: 'hard_delete',
        legalHold: false,
        encryptionRequired: false,
        backupRetention: 30,
        complianceReasons: ['System maintenance', 'Debugging'],
        reviewRequired: false,
        automaticPurge: true
      },
      backups: {
        category: 'backups',
        retentionPeriod: 90, // 90 days
        purgeMethod: 'hard_delete',
        legalHold: false,
        encryptionRequired: true,
        complianceReasons: ['Disaster recovery', 'Business continuity'],
        reviewRequired: false,
        automaticPurge: true
      },
      customCategories: new Map()
    }

    // Merge with custom policy
    return { ...defaultPolicy, ...customPolicy }
  }

  /**
   * Store data with retention metadata
   */
  async storeData(
    category: string,
    data: any,
    userId?: string,
    sessionId?: string,
    metadata?: any
  ): Promise<string> {
    const rule = this.getRetentionRule(category)
    const now = new Date()
    
    const record: DataRecord = {
      id: this.generateRecordId(),
      category,
      userId,
      sessionId,
      data: rule.encryptionRequired ? await this.encryptData(data) : data,
      createdAt: now,
      retentionDate: new Date(now.getTime() + (rule.retentionPeriod * 24 * 60 * 60 * 1000)),
      archiveDate: rule.archivePeriod 
        ? new Date(now.getTime() + (rule.archivePeriod * 24 * 60 * 60 * 1000))
        : undefined,
      purgeDate: new Date(now.getTime() + (rule.retentionPeriod * 24 * 60 * 60 * 1000)),
      legalHold: rule.legalHold,
      encrypted: rule.encryptionRequired,
      metadata: {
        source: 'promptcraft',
        version: '1.0',
        checksum: rule.encryptionRequired ? await this.calculateChecksum(data) : undefined,
        size: JSON.stringify(data).length,
        ...metadata
      }
    }

    await this.storage.store(record)
    
    // Log data creation for audit trail
    await this.auditLogger.logDataEvent('data_created', {
      recordId: record.id,
      category,
      userId,
      retentionDate: record.retentionDate,
      encrypted: record.encrypted
    })

    return record.id
  }

  /**
   * Retrieve data with access logging
   */
  async retrieveData(recordId: string, userId?: string): Promise<any> {
    const record = await this.storage.retrieve(recordId)
    
    if (!record) {
      throw new Error(`Record ${recordId} not found`)
    }

    // Check if data has expired
    if (new Date() > record.purgeDate && !record.legalHold) {
      throw new Error(`Record ${recordId} has expired and may have been purged`)
    }

    // Update last accessed time
    record.lastAccessed = new Date()
    await this.storage.update(record)

    // Log data access
    await this.auditLogger.logDataEvent('data_accessed', {
      recordId,
      userId,
      category: record.category,
      accessTime: record.lastAccessed
    })

    // Decrypt if necessary
    const data = record.encrypted 
      ? await this.decryptData(record.data)
      : record.data

    return data
  }

  /**
   * Delete specific user data (GDPR Right to be Forgotten)
   */
  async deleteUserData(userId: string, categories?: string[]): Promise<{
    deletedRecords: number
    anonymizedRecords: number
    errors: string[]
  }> {
    const result = {
      deletedRecords: 0,
      anonymizedRecords: 0,
      errors: []
    }

    try {
      const userRecords = await this.storage.findByUserId(userId, categories)
      
      for (const record of userRecords) {
        const rule = this.getRetentionRule(record.category)
        
        try {
          if (rule.legalHold) {
            // Cannot delete records under legal hold
            result.errors.push(`Record ${record.id} under legal hold, cannot delete`)
            continue
          }

          switch (rule.purgeMethod) {
            case 'hard_delete':
            case 'soft_delete':
              await this.storage.delete(record.id)
              result.deletedRecords++
              break
              
            case 'anonymize':
              await this.anonymizeRecord(record)
              result.anonymizedRecords++
              break
              
            case 'archive':
              await this.archiveRecord(record)
              await this.storage.delete(record.id)
              result.deletedRecords++
              break
          }

          // Log deletion
          await this.auditLogger.logDataEvent('user_data_deleted', {
            recordId: record.id,
            userId,
            category: record.category,
            method: rule.purgeMethod
          })

        } catch (error) {
          result.errors.push(`Failed to delete record ${record.id}: ${error}`)
        }
      }

      return result

    } catch (error) {
      result.errors.push(`Failed to delete user data: ${error}`)
      return result
    }
  }

  /**
   * Run automatic data purge based on retention policies
   */
  async runAutomaticPurge(): Promise<PurgeResult[]> {
    const results: PurgeResult[] = []
    
    for (const [category, rule] of Object.entries(this.policy)) {
      if (category === 'customCategories') continue
      
      const retentionRule = rule as RetentionRule
      if (!retentionRule.automaticPurge) continue

      const result = await this.purgeCategory(category, retentionRule)
      results.push(result)
    }

    // Process custom categories
    for (const [category, rule] of this.policy.customCategories.entries()) {
      if (!rule.automaticPurge) continue
      
      const result = await this.purgeCategory(category, rule)
      results.push(result)
    }

    return results
  }

  /**
   * Purge expired data for a specific category
   */
  private async purgeCategory(category: string, rule: RetentionRule): Promise<PurgeResult> {
    const result: PurgeResult = {
      category,
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsArchived: 0,
      recordsAnonymized: 0,
      errors: [],
      completedAt: new Date(),
      nextScheduledPurge: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
    }

    try {
      const expiredRecords = await this.storage.findExpired(category)
      result.recordsProcessed = expiredRecords.length

      for (const record of expiredRecords) {
        try {
          // Skip records under legal hold
          if (record.legalHold) {
            continue
          }

          // Check if manual review is required
          if (rule.reviewRequired) {
            await this.queueForReview(record)
            continue
          }

          // Process based on purge method
          switch (rule.purgeMethod) {
            case 'hard_delete':
              await this.storage.delete(record.id)
              result.recordsDeleted++
              break

            case 'soft_delete':
              await this.storage.softDelete(record.id)
              result.recordsDeleted++
              break

            case 'anonymize':
              await this.anonymizeRecord(record)
              result.recordsAnonymized++
              break

            case 'archive':
              await this.archiveRecord(record)
              await this.storage.delete(record.id)
              result.recordsArchived++
              break
          }

          // Log purge action
          await this.auditLogger.logDataEvent('data_purged', {
            recordId: record.id,
            category,
            method: rule.purgeMethod,
            purgeDate: new Date()
          })

        } catch (error) {
          result.errors.push(`Failed to purge record ${record.id}: ${error}`)
        }
      }

    } catch (error) {
      result.errors.push(`Failed to purge category ${category}: ${error}`)
    }

    return result
  }

  /**
   * Anonymize a data record
   */
  private async anonymizeRecord(record: DataRecord): Promise<void> {
    const anonymizedData = await this.anonymizeData(record.data, record.category)
    
    const anonymizedRecord: DataRecord = {
      ...record,
      userId: undefined, // Remove user association
      data: anonymizedData,
      metadata: {
        ...record.metadata,
        anonymized: true,
        anonymizedAt: new Date().toISOString()
      }
    }

    await this.storage.update(anonymizedRecord)
  }

  /**
   * Anonymize data based on category
   */
  private async anonymizeData(data: any, category: string): Promise<any> {
    if (typeof data !== 'object') return '[ANONYMIZED]'

    const anonymized = { ...data }

    // Remove or hash personally identifiable information
    const piiFields = [
      'email', 'phone', 'address', 'name', 'firstName', 'lastName',
      'ssn', 'creditCard', 'ip', 'userId', 'username'
    ]

    for (const field of piiFields) {
      if (anonymized[field]) {
        anonymized[field] = this.hashValue(anonymized[field])
      }
    }

    // Category-specific anonymization
    switch (category) {
      case 'prompt_history':
        // Keep prompt structure but remove personal content
        if (anonymized.prompt) {
          anonymized.prompt = this.anonymizeText(anonymized.prompt)
        }
        break

      case 'user_profiles':
        // Keep demographic data but remove identifiers
        delete anonymized.email
        delete anonymized.name
        if (anonymized.birthDate) {
          anonymized.ageRange = this.getAgeRange(anonymized.birthDate)
          delete anonymized.birthDate
        }
        break
    }

    return anonymized
  }

  /**
   * Archive a data record to long-term storage
   */
  private async archiveRecord(record: DataRecord): Promise<void> {
    const archiveData = {
      ...record,
      archivedAt: new Date(),
      archiveReason: 'retention_policy'
    }

    // Store in archive storage (could be cold storage, tape, etc.)
    await this.storage.archive(archiveData)
    
    await this.auditLogger.logDataEvent('data_archived', {
      recordId: record.id,
      category: record.category,
      archiveDate: archiveData.archivedAt
    })
  }

  /**
   * Queue record for manual review
   */
  private async queueForReview(record: DataRecord): Promise<void> {
    const reviewItem = {
      recordId: record.id,
      category: record.category,
      createdAt: record.createdAt,
      retentionDate: record.retentionDate,
      reason: 'retention_policy_review',
      queuedAt: new Date(),
      status: 'pending'
    }

    await this.storage.queueForReview(reviewItem)
  }

  /**
   * Get retention rule for category
   */
  private getRetentionRule(category: string): RetentionRule {
    const rule = (this.policy as any)[category] || this.policy.customCategories.get(category)
    
    if (!rule) {
      throw new Error(`No retention rule found for category: ${category}`)
    }

    return rule
  }

  /**
   * Add custom retention rule
   */
  addCustomRetentionRule(category: string, rule: RetentionRule): void {
    this.policy.customCategories.set(category, rule)
  }

  /**
   * Schedule automatic purge
   */
  private scheduleAutomaticPurge(): void {
    // Run daily at 2 AM
    const scheduleTime = new Date()
    scheduleTime.setHours(2, 0, 0, 0)
    
    if (scheduleTime <= new Date()) {
      scheduleTime.setDate(scheduleTime.getDate() + 1)
    }

    const timeUntilRun = scheduleTime.getTime() - Date.now()
    
    setTimeout(() => {
      this.runAutomaticPurge().then(results => {
        console.log('Automatic purge completed:', results)
        
        // Schedule next run
        setInterval(() => {
          this.runAutomaticPurge()
        }, 24 * 60 * 60 * 1000) // Daily
      })
    }, timeUntilRun)
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<{
    totalRecords: number
    recordsByCategory: Record<string, number>
    expiredRecords: number
    legalHoldRecords: number
    encryptedRecords: number
    upcomingExpirations: Array<{
      category: string
      count: number
      expirationDate: Date
    }>
  }> {
    const stats = await this.storage.getStatistics()
    
    return {
      totalRecords: stats.totalRecords,
      recordsByCategory: stats.recordsByCategory,
      expiredRecords: stats.expiredRecords,
      legalHoldRecords: stats.legalHoldRecords,
      encryptedRecords: stats.encryptedRecords,
      upcomingExpirations: stats.upcomingExpirations
    }
  }

  /**
   * Utility methods
   */
  private generateRecordId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async encryptData(data: any): Promise<string> {
    // Implement encryption using the encryption key
    // This is a placeholder - use proper encryption in production
    return Buffer.from(JSON.stringify(data)).toString('base64')
  }

  private async decryptData(encryptedData: string): Promise<any> {
    // Implement decryption
    // This is a placeholder - use proper decryption in production
    return JSON.parse(Buffer.from(encryptedData, 'base64').toString())
  }

  private async calculateChecksum(data: any): Promise<string> {
    // Calculate checksum for data integrity
    const content = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  private hashValue(value: string): string {
    // Simple hash for anonymization
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `hash_${hash.toString(16)}`
  }

  private anonymizeText(text: string): string {
    // Remove potential PII from text while preserving structure
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
  }

  private getAgeRange(birthDate: string): string {
    const birth = new Date(birthDate)
    const age = new Date().getFullYear() - birth.getFullYear()
    
    if (age < 18) return 'under_18'
    if (age < 25) return '18_24'
    if (age < 35) return '25_34'
    if (age < 45) return '35_44'
    if (age < 55) return '45_54'
    if (age < 65) return '55_64'
    return '65_plus'
  }
}

/**
 * Data Storage Interface
 */
export interface DataStorage {
  store(record: DataRecord): Promise<void>
  retrieve(id: string): Promise<DataRecord | null>
  update(record: DataRecord): Promise<void>
  delete(id: string): Promise<void>
  softDelete(id: string): Promise<void>
  findByUserId(userId: string, categories?: string[]): Promise<DataRecord[]>
  findExpired(category?: string): Promise<DataRecord[]>
  archive(record: DataRecord): Promise<void>
  queueForReview(reviewItem: any): Promise<void>
  getStatistics(): Promise<any>
}

/**
 * Audit Logger for data operations
 */
class AuditLogger {
  async logDataEvent(event: string, details: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      source: 'data_retention_manager'
    }

    // Log to secure audit trail
    console.log('DATA AUDIT:', logEntry)
    
    // In production, this would go to a secure, immutable audit log
  }
}

/**
 * Express middleware for data retention compliance
 */
export function dataRetentionMiddleware(retentionManager: DataRetentionManager) {
  return (req: any, res: any, next: any) => {
    // Add retention manager to request for use in handlers
    req.retentionManager = retentionManager
    
    // Add helper methods
    req.storeWithRetention = async (category: string, data: any) => {
      return retentionManager.storeData(
        category,
        data,
        req.user?.id,
        req.sessionID,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        }
      )
    }

    next()
  }
}

/**
 * Default retention manager (would be configured based on deployment)
 */
export const defaultRetentionManager = new DataRetentionManager(
  {}, // Use default policy
  {} as DataStorage, // Would be actual storage implementation
  process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
)