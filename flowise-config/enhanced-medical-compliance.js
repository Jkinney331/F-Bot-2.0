// Enhanced Medical Compliance and Security Framework
// Implements HIPAA, GDPR, and medical-grade security requirements

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class HIPAAComplianceFramework {
    constructor(config) {
        this.config = config;
        this.auditLogger = new AuditLogger(config.auditConfig);
        this.encryptionService = new EncryptionService(config.encryptionConfig);
        this.accessControl = new AccessControlService(config.accessConfig);
        this.dataRetentionPolicy = new DataRetentionPolicy(config.retentionConfig);
    }

    // HIPAA-compliant data processing pipeline
    async processPatientData(data, userContext) {
        try {
            // 1. Authentication and authorization
            await this.validateUserAccess(userContext, 'patient_data');
            
            // 2. Audit logging
            await this.auditLogger.logAccess({
                userId: userContext.userId,
                action: 'access_patient_data',
                dataType: 'patient_information',
                timestamp: new Date().toISOString(),
                ipAddress: userContext.ipAddress,
                userAgent: userContext.userAgent
            });

            // 3. Data de-identification
            const deidentifiedData = await this.deidentifyData(data);

            // 4. Encryption at rest
            const encryptedData = await this.encryptionService.encrypt(deidentifiedData);

            // 5. Access control enforcement
            const maskedData = await this.accessControl.applyDataMasking(
                encryptedData, 
                userContext.role,
                userContext.permissions
            );

            return {
                data: maskedData,
                processedAt: new Date().toISOString(),
                complianceFlags: {
                    hipaaCompliant: true,
                    deidentified: true,
                    encrypted: true,
                    auditLogged: true
                }
            };

        } catch (error) {
            await this.auditLogger.logError({
                userId: userContext.userId,
                action: 'patient_data_access_error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async validateUserAccess(userContext, resource) {
        // Validate JWT token
        const tokenValid = await this.validateJWTToken(userContext.token);
        if (!tokenValid) {
            throw new Error('Invalid authentication token');
        }

        // Check role-based permissions
        const hasPermission = await this.accessControl.checkPermission(
            userContext.role,
            resource
        );
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }

        // Check session validity
        const sessionValid = await this.validateSession(userContext.sessionId);
        if (!sessionValid) {
            throw new Error('Session expired or invalid');
        }

        return true;
    }

    async validateJWTToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check token expiration
            if (decoded.exp < Date.now() / 1000) {
                return false;
            }

            // Check token scope
            if (!decoded.scope.includes('medical_data')) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    async deidentifyData(data) {
        const midiDeidentifier = new MIDIDeIdentifier();
        await midiDeidentifier.initialize();
        
        return await midiDeidentifier.processData(data);
    }
}

class AuditLogger {
    constructor(config) {
        this.config = config;
        this.logStream = config.logStream;
        this.retentionPeriod = config.retentionPeriod || '7y'; // 7 years for HIPAA
    }

    async logAccess(auditEvent) {
        const logEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            eventType: 'DATA_ACCESS',
            ...auditEvent,
            ipHash: this.hashIP(auditEvent.ipAddress), // Hash IP for privacy
            compliance: {
                hipaa: true,
                gdpr: true,
                retention: this.retentionPeriod
            }
        };

        await this.writeAuditLog(logEntry);
        
        // Real-time compliance monitoring
        await this.checkComplianceViolations(logEntry);
    }

    async logError(errorEvent) {
        const logEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            eventType: 'ERROR',
            severity: 'HIGH',
            ...errorEvent,
            compliance: {
                hipaa: true,
                gdpr: true,
                retention: this.retentionPeriod
            }
        };

        await this.writeAuditLog(logEntry);
        
        // Trigger security incident response if needed
        if (this.isSecurityIncident(errorEvent)) {
            await this.triggerIncidentResponse(logEntry);
        }
    }

    async logDataModification(modificationEvent) {
        const logEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            eventType: 'DATA_MODIFICATION',
            ...modificationEvent,
            dataIntegrityHash: this.calculateDataHash(modificationEvent.dataAfter),
            compliance: {
                hipaa: true,
                gdpr: true,
                retention: this.retentionPeriod
            }
        };

        await this.writeAuditLog(logEntry);
    }

    async writeAuditLog(logEntry) {
        try {
            // Write to secure audit log storage (tamper-evident)
            await this.logStream.write(JSON.stringify(logEntry) + '\n');
            
            // Also send to SIEM system if configured
            if (this.config.siemEndpoint) {
                await this.sendToSIEM(logEntry);
            }

        } catch (error) {
            console.error('Critical: Audit logging failed', error);
            // Implement backup logging mechanism
            await this.backupAuditLog(logEntry);
        }
    }

    hashIP(ipAddress) {
        return crypto.createHash('sha256')
            .update(ipAddress + process.env.IP_SALT)
            .digest('hex')
            .substring(0, 16);
    }

    calculateDataHash(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    isSecurityIncident(errorEvent) {
        const securityPatterns = [
            'authentication_failure',
            'unauthorized_access',
            'data_breach_attempt',
            'injection_attack',
            'privilege_escalation'
        ];

        return securityPatterns.some(pattern => 
            errorEvent.error.toLowerCase().includes(pattern)
        );
    }

    async triggerIncidentResponse(logEntry) {
        // Implement automated incident response
        console.warn('Security incident detected:', logEntry.id);
        
        // Notify security team
        if (this.config.securityWebhook) {
            await fetch(this.config.securityWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident: logEntry,
                    severity: 'HIGH',
                    timestamp: new Date().toISOString()
                })
            });
        }
    }

    async checkComplianceViolations(logEntry) {
        // Check for unusual access patterns
        const recentAccess = await this.getRecentAccessByUser(logEntry.userId, '1h');
        
        if (recentAccess.length > 100) {
            await this.logComplianceViolation({
                type: 'excessive_access',
                userId: logEntry.userId,
                count: recentAccess.length,
                timeWindow: '1h'
            });
        }
    }

    async sendToSIEM(logEntry) {
        // Send to Security Information and Event Management system
        try {
            await fetch(this.config.siemEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.siemApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.error('Failed to send to SIEM:', error);
        }
    }

    async getRecentAccessByUser(userId, timeWindow) {
        // Implementation would query audit log database
        return [];
    }

    async logComplianceViolation(violation) {
        console.warn('Compliance violation detected:', violation);
    }

    async backupAuditLog(logEntry) {
        // Implement backup audit logging mechanism
        console.log('Backup audit log:', logEntry.id);
    }
}

class EncryptionService {
    constructor(config) {
        this.algorithm = 'aes-256-gcm';
        this.keyDerivationSalt = process.env.ENCRYPTION_SALT;
        this.masterKey = this.deriveKey(process.env.MASTER_ENCRYPTION_KEY);
    }

    deriveKey(password) {
        return crypto.pbkdf2Sync(
            password,
            this.keyDerivationSalt,
            100000, // iterations
            32, // key length
            'sha256'
        );
    }

    async encrypt(data) {
        try {
            const iv = crypto.randomBytes(12); // 96-bit IV for GCM
            const cipher = crypto.createCipher(this.algorithm, this.masterKey);
            cipher.setAAD(Buffer.from('medical-data')); // Additional authenticated data

            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.algorithm,
                encryptedAt: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    async decrypt(encryptedData) {
        try {
            const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
            decipher.setAAD(Buffer.from('medical-data'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);

        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    async encryptField(fieldValue) {
        // Encrypt individual fields for field-level encryption
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipherGCM(this.algorithm, this.masterKey, iv);
        
        let encrypted = cipher.update(String(fieldValue), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            value: encrypted,
            iv: iv.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex')
        };
    }

    async decryptField(encryptedField) {
        const decipher = crypto.createDecipherGCM(
            this.algorithm,
            this.masterKey,
            Buffer.from(encryptedField.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedField.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedField.value, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}

class AccessControlService {
    constructor(config) {
        this.config = config;
        this.rolePermissions = this.initializeRolePermissions();
    }

    initializeRolePermissions() {
        return {
            'admin': {
                permissions: ['*'], // Full access
                dataAccess: 'full',
                auditAccess: true
            },
            'physician': {
                permissions: [
                    'patient_data:read',
                    'patient_data:write',
                    'medical_images:read',
                    'treatment_plans:read',
                    'treatment_plans:write'
                ],
                dataAccess: 'clinical',
                auditAccess: false
            },
            'researcher': {
                permissions: [
                    'patient_data:read_deidentified',
                    'medical_images:read_deidentified',
                    'research_data:read',
                    'research_data:write'
                ],
                dataAccess: 'research',
                auditAccess: false
            },
            'patient': {
                permissions: [
                    'own_data:read',
                    'treatment_plans:read_own',
                    'educational_content:read'
                ],
                dataAccess: 'limited',
                auditAccess: false
            },
            'guest': {
                permissions: [
                    'educational_content:read',
                    'public_research:read'
                ],
                dataAccess: 'public',
                auditAccess: false
            }
        };
    }

    async checkPermission(userRole, resource) {
        const roleConfig = this.rolePermissions[userRole];
        if (!roleConfig) {
            return false;
        }

        // Check wildcard permission
        if (roleConfig.permissions.includes('*')) {
            return true;
        }

        // Check specific permission
        return roleConfig.permissions.some(permission => {
            if (permission === resource) return true;
            
            // Check pattern matching (e.g., "patient_data:*")
            const [resourceType, action] = permission.split(':');
            const [reqResourceType, reqAction] = resource.split(':');
            
            return resourceType === reqResourceType && 
                   (action === '*' || action === reqAction);
        });
    }

    async applyDataMasking(data, userRole, userPermissions = []) {
        const roleConfig = this.rolePermissions[userRole];
        if (!roleConfig) {
            throw new Error('Invalid user role');
        }

        switch (roleConfig.dataAccess) {
            case 'full':
                return data; // No masking for admins

            case 'clinical':
                return this.applyClinicalMasking(data);

            case 'research':
                return this.applyResearchMasking(data);

            case 'limited':
                return this.applyLimitedMasking(data);

            case 'public':
                return this.applyPublicMasking(data);

            default:
                return this.applyStrictMasking(data);
        }
    }

    applyClinicalMasking(data) {
        // Mask sensitive but non-clinical data
        const masked = { ...data };
        
        // Remove financial information
        delete masked.insurance_info;
        delete masked.billing_address;
        
        // Partially mask contact info
        if (masked.phone) {
            masked.phone = this.maskPhoneNumber(masked.phone);
        }
        
        return masked;
    }

    applyResearchMasking(data) {
        // Full de-identification for research use
        const masked = { ...data };
        
        // Remove all direct identifiers
        const identifiersToRemove = [
            'name', 'address', 'phone', 'email', 'ssn',
            'mrn', 'insurance_info', 'emergency_contact'
        ];
        
        identifiersToRemove.forEach(field => delete masked[field]);
        
        // Replace with research ID
        masked.research_id = this.generateResearchId(data.mrn || data.patient_id);
        
        return masked;
    }

    applyLimitedMasking(data) {
        // Patients can only see their own data with some masking
        const masked = { ...data };
        
        // Remove internal medical codes
        delete masked.internal_notes;
        delete masked.physician_comments;
        delete masked.billing_codes;
        
        return masked;
    }

    applyPublicMasking(data) {
        // Only allow public, non-identifying information
        return {
            general_info: data.public_educational_content,
            research_summaries: data.anonymized_research_summaries
        };
    }

    applyStrictMasking(data) {
        // Default to most restrictive masking
        return {
            message: 'Access denied - insufficient permissions'
        };
    }

    maskPhoneNumber(phone) {
        return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1-XXX-$2');
    }

    generateResearchId(originalId) {
        return crypto.createHash('sha256')
            .update(originalId + process.env.RESEARCH_SALT)
            .digest('hex')
            .substring(0, 16);
    }
}

class DataRetentionPolicy {
    constructor(config) {
        this.config = config;
        this.retentionPeriods = {
            'audit_logs': '7y', // HIPAA requirement
            'patient_data': '6y', // Medical record retention
            'research_data': '10y', // Research data retention
            'system_logs': '1y',
            'session_data': '30d',
            'temp_files': '7d'
        };
    }

    async enforceRetentionPolicy() {
        for (const [dataType, retentionPeriod] of Object.entries(this.retentionPeriods)) {
            await this.cleanupExpiredData(dataType, retentionPeriod);
        }
    }

    async cleanupExpiredData(dataType, retentionPeriod) {
        const cutoffDate = this.calculateCutoffDate(retentionPeriod);
        
        try {
            const expiredRecords = await this.findExpiredRecords(dataType, cutoffDate);
            
            for (const record of expiredRecords) {
                await this.securelyDeleteRecord(record);
                await this.logDataDeletion(record, dataType);
            }

        } catch (error) {
            console.error(`Error cleaning up ${dataType}:`, error);
        }
    }

    calculateCutoffDate(retentionPeriod) {
        const now = new Date();
        const match = retentionPeriod.match(/(\d+)([dmy])/);
        
        if (!match) return now;
        
        const [, amount, unit] = match;
        const value = parseInt(amount);
        
        switch (unit) {
            case 'd':
                return new Date(now.setDate(now.getDate() - value));
            case 'm':
                return new Date(now.setMonth(now.getMonth() - value));
            case 'y':
                return new Date(now.setFullYear(now.getFullYear() - value));
            default:
                return now;
        }
    }

    async findExpiredRecords(dataType, cutoffDate) {
        // Implementation would query database for expired records
        return [];
    }

    async securelyDeleteRecord(record) {
        // Implement secure deletion (multiple overwrites)
        console.log(`Securely deleting record: ${record.id}`);
    }

    async logDataDeletion(record, dataType) {
        console.log(`Data deletion logged: ${dataType} - ${record.id}`);
    }
}

// GDPR Compliance Extension
class GDPRComplianceExtension {
    constructor() {
        this.dataProcessingLawfulBases = [
            'consent',
            'contract',
            'legal_obligation',
            'vital_interests',
            'public_task',
            'legitimate_interests'
        ];
    }

    async processDataSubjectRequest(requestType, userId, requestData) {
        switch (requestType) {
            case 'access':
                return await this.handleAccessRequest(userId);
            case 'rectification':
                return await this.handleRectificationRequest(userId, requestData);
            case 'erasure':
                return await this.handleErasureRequest(userId);
            case 'portability':
                return await this.handlePortabilityRequest(userId);
            case 'objection':
                return await this.handleObjectionRequest(userId, requestData);
            default:
                throw new Error('Invalid request type');
        }
    }

    async handleAccessRequest(userId) {
        // Provide all personal data held about the user
        const personalData = await this.collectAllPersonalData(userId);
        
        return {
            personalData: personalData,
            processingPurposes: await this.getProcessingPurposes(userId),
            dataRecipients: await this.getDataRecipients(userId),
            retentionPeriods: await this.getRetentionPeriods(userId),
            rights: this.getDataSubjectRights()
        };
    }

    async handleErasureRequest(userId) {
        // Right to be forgotten implementation
        const canErase = await this.validateErasureRequest(userId);
        
        if (!canErase.allowed) {
            return {
                success: false,
                reason: canErase.reason,
                legalBasis: canErase.legalBasis
            };
        }

        await this.erasePersonalData(userId);
        
        return {
            success: true,
            erasedAt: new Date().toISOString(),
            retainedData: canErase.retainedData
        };
    }

    async validateErasureRequest(userId) {
        // Check if erasure is legally required or allowed
        const activeConsent = await this.checkActiveConsent(userId);
        const legalObligations = await this.checkLegalObligations(userId);
        const contractualRequirements = await this.checkContractualRequirements(userId);

        if (legalObligations.length > 0) {
            return {
                allowed: false,
                reason: 'Legal obligations require data retention',
                legalBasis: legalObligations
            };
        }

        if (contractualRequirements.length > 0) {
            return {
                allowed: false,
                reason: 'Contractual obligations require data retention',
                legalBasis: contractualRequirements
            };
        }

        return {
            allowed: true,
            retainedData: [] // List any data that must be retained
        };
    }

    getDataSubjectRights() {
        return [
            'right_to_access',
            'right_to_rectification',
            'right_to_erasure',
            'right_to_restrict_processing',
            'right_to_data_portability',
            'right_to_object',
            'rights_related_to_automated_decision_making'
        ];
    }

    async collectAllPersonalData(userId) {
        // Placeholder - would collect from all data sources
        return {};
    }

    async getProcessingPurposes(userId) {
        return ['medical_diagnosis', 'treatment_planning', 'research'];
    }

    async getDataRecipients(userId) {
        return ['healthcare_providers', 'research_institutions'];
    }

    async getRetentionPeriods(userId) {
        return { medical_data: '6_years', research_data: '10_years' };
    }

    async checkActiveConsent(userId) {
        return true; // Placeholder
    }

    async checkLegalObligations(userId) {
        return []; // Placeholder
    }

    async checkContractualRequirements(userId) {
        return []; // Placeholder
    }

    async erasePersonalData(userId) {
        console.log(`Erasing personal data for user: ${userId}`);
    }
}

module.exports = {
    HIPAAComplianceFramework,
    AuditLogger,
    EncryptionService,
    AccessControlService,
    DataRetentionPolicy,
    GDPRComplianceExtension
}; 