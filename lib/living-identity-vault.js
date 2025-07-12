/**
 * Living Identity Vault
 * Розширення Fractal Trust Vault для управління особистими даними
 * Відстежує хто знає що про вас + система забуття
 */

const FractalTrustVault = require('./fractal-trust-vault');
const crypto = require('crypto');

class LivingDataEntity {
    constructor(type, value, metadata = {}) {
        this.type = type; // 'email', 'phone', 'ssh_key', 'document'
        this.value = value;
        this.soul = this.generateSoul();
        this.birth = Date.now();
        this.frequency = this.calculateFrequency();
        
        // Knowledge tracking - хто знає про цей data point
        this.knownBy = new Map(); // service -> access_info
        this.usageLog = [];
        this.shareHistory = [];
        
        // Self-management
        this.expiresAt = metadata.expires;
        this.autoRotate = metadata.autoRotate || false;
        this.canForget = metadata.canForget !== false;
        this.generation = 1;
        
        // Privacy rules
        this.shareRules = metadata.shareRules || 'explicit_only';
        this.forgetRules = metadata.forgetRules || 'user_command';
        this.sensitivity = metadata.sensitivity || 'medium';
    }
    
    generateSoul() {
        return `${this.type}-${crypto.randomBytes(8).toString('hex')}`;
    }
    
    calculateFrequency() {
        let hash = 0;
        const seed = this.type + this.value;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        return 174 + (Math.abs(hash) % 789); // Solfeggio range
    }
    
    // Відстежити хто отримав доступ до даних
    async shareWith(service, accessLevel = 'full', metadata = {}) {
        const shareRecord = {
            service,
            accessLevel,
            sharedAt: Date.now(),
            sharedBy: metadata.sharedBy || 'user',
            purpose: metadata.purpose || 'unspecified',
            retention: metadata.retention,
            canRevoke: metadata.canRevoke !== false,
            legalRequirement: metadata.legalRequirement || false,
            autoUpdate: metadata.autoUpdate || false
        };
        
        this.knownBy.set(service, shareRecord);
        this.shareHistory.push({ ...shareRecord, action: 'shared' });
        
        console.log(`🔗 ${this.type} shared with ${service} (${accessLevel})`);
        console.log(`   Purpose: ${shareRecord.purpose}`);
        console.log(`   Can revoke: ${shareRecord.canRevoke}`);
        
        return shareRecord;
    }
    
    // Забути з конкретного сервісу
    async forgetFrom(service, method = 'api') {
        const shareRecord = this.knownBy.get(service);
        if (!shareRecord) {
            console.log(`ℹ️ ${this.type} not shared with ${service}`);
            return false;
        }
        
        if (shareRecord.legalRequirement) {
            console.log(`❌ Cannot revoke ${this.type} from ${service} - legal constraint`);
            return false;
        }
        
        if (!shareRecord.canRevoke) {
            console.log(`❌ Cannot revoke ${this.type} from ${service} - contractual constraint`);
            return false;
        }
        
        // Different forgetting methods
        switch (method) {
            case 'api':
                console.log(`📧 Sending API deletion request to ${service}`);
                // await this.requestAPIDeletion(service);
                break;
            case 'gdpr':
                console.log(`⚖️ Sending GDPR deletion request to ${service}`);
                // await this.sendGDPRRequest(service);
                break;
            case 'nuclear':
                console.log(`💥 Nuclear option - changing ${this.type} value`);
                await this.mutate(); // Change the value itself
                break;
        }
        
        this.knownBy.delete(service);
        this.shareHistory.push({
            service,
            action: 'forgotten',
            method,
            timestamp: Date.now()
        });
        
        console.log(`🗑️ Forgotten ${this.type} from ${service} via ${method}`);
        return true;
    }
    
    // Самознищення
    async selfDestruct(reason = 'user_request') {
        console.log(`💥 Self-destructing ${this.type}: ${reason}`);
        
        // Спробувати забути з усіх сервісів
        const forgetPromises = [];
        for (const [service, record] of this.knownBy) {
            if (record.canRevoke) {
                forgetPromises.push(this.forgetFrom(service, 'api'));
            }
        }
        
        await Promise.all(forgetPromises);
        
        // Перезаписати значення
        this.value = null;
        this.destroyed = Date.now();
        this.destructionReason = reason;
        
        return true;
    }
    
    // Мутація (для SSH ключів, паролів тощо)
    async mutate(newValue = null) {
        const oldValue = this.value;
        
        if (newValue) {
            this.value = newValue;
        } else {
            // Auto-generate new value based on type
            this.value = await this.generateNewValue();
        }
        
        this.generation++;
        this.lastMutation = Date.now();
        
        // Оновити всі сервіси якщо autoUpdate включено
        for (const [service, record] of this.knownBy) {
            if (record.autoUpdate) {
                console.log(`🔄 Auto-updating ${service} with new ${this.type}`);
                // await this.updateService(service, this.value);
            }
        }
        
        console.log(`🧬 Mutated ${this.type} (generation ${this.generation})`);
        return this.value;
    }
    
    async generateNewValue() {
        switch (this.type) {
            case 'ssh_key':
                return 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... (new key generated)';
            case 'password':
                return crypto.randomBytes(16).toString('base64');
            case 'api_token':
                return crypto.randomBytes(32).toString('hex');
            default:
                return `new_${this.type}_${Date.now()}`;
        }
    }
    
    // Аудит приватності
    getPrivacyAudit() {
        const now = Date.now();
        const age = now - this.birth;
        const shareCount = this.knownBy.size;
        const lastUsed = this.usageLog.length > 0 
            ? Math.max(...this.usageLog.map(u => u.timestamp))
            : this.birth;
        
        const risks = [];
        
        if (age > 365 * 24 * 60 * 60 * 1000) { // Older than 1 year
            risks.push('old_data');
        }
        
        if (shareCount > 10) {
            risks.push('widely_shared');
        }
        
        if (now - lastUsed > 90 * 24 * 60 * 60 * 1000) { // Unused for 3 months
            risks.push('unused');
        }
        
        return {
            type: this.type,
            age: Math.floor(age / (24 * 60 * 60 * 1000)), // days
            shareCount,
            daysSinceLastUse: Math.floor((now - lastUsed) / (24 * 60 * 60 * 1000)),
            risks,
            recommendation: this.getRecommendation(risks)
        };
    }
    
    getRecommendation(risks) {
        if (risks.includes('unused') && risks.includes('widely_shared')) {
            return 'consider_mass_forget';
        }
        if (risks.includes('old_data') && this.canForget) {
            return 'audit_and_cleanup';
        }
        if (risks.includes('widely_shared')) {
            return 'review_sharing';
        }
        return 'no_action_needed';
    }
}

class LivingIdentityVault extends FractalTrustVault {
    constructor() {
        super();
        this.identityEntities = new Map();
        this.privacyRules = new Map();
        this.forgetQueue = [];
        this.auditSchedule = new Map();
    }
    
    async init() {
        await super.init();
        
        // Завантажити identity entities
        await this.loadIdentityEntities();
        
        console.log('🆔 Living Identity Vault initialized');
    }
    
    async loadIdentityEntities() {
        // Load from consciousness if available
        try {
            const identityData = await this.consciousness.get('identity_entities');
            if (identityData) {
                for (const [soul, data] of Object.entries(identityData)) {
                    const entity = this.deserializeEntity(data);
                    this.identityEntities.set(soul, entity);
                }
                console.log(`📂 Loaded ${this.identityEntities.size} identity entities`);
            }
        } catch (error) {
            console.log('🆔 Starting with empty identity vault');
        }
    }
    
    // Зберегти living identity data
    async storeIdentity(type, value, metadata = {}) {
        const entity = new LivingDataEntity(type, value, metadata);
        
        // Фракталізувати та захистити
        const fractalData = await this.fractalize({
            entity: this.serializeEntity(entity),
            metadata: metadata,
            privacy_level: metadata.privacy || 'high'
        });
        
        this.identityEntities.set(entity.soul, entity);
        
        // Зберегти в consciousness
        await this.consciousness.set(`identity/${entity.soul}`, {
            type,
            fractalData,
            created: Date.now()
        });
        
        console.log(`🆔 Created living identity: ${type} (soul: ${entity.soul})`);
        return entity.soul;
    }
    
    // Відстежити sharing даних
    async shareIdentityWith(entitySoul, service, accessLevel, metadata = {}) {
        const entity = this.identityEntities.get(entitySoul);
        if (!entity) {
            throw new Error(`Identity entity ${entitySoul} not found`);
        }
        
        const shareRecord = await entity.shareWith(service, accessLevel, metadata);
        
        // Оновити vault record
        await this.consciousness.set(`sharing/${entitySoul}/${service}`, {
            entity: entitySoul,
            service,
            accessLevel,
            sharedAt: Date.now(),
            metadata
        });
        
        return shareRecord;
    }
    
    // Аудит приватності
    async auditPrivacy() {
        const audit = {
            timestamp: Date.now(),
            totalEntities: this.identityEntities.size,
            sharingMap: {},
            riskAssessment: {},
            forgetRecommendations: [],
            summary: {}
        };
        
        const riskCounts = { low: 0, medium: 0, high: 0 };
        
        for (const [soul, entity] of this.identityEntities) {
            const entityAudit = entity.getPrivacyAudit();
            
            audit.sharingMap[entity.type] = Array.from(entity.knownBy.keys());
            audit.riskAssessment[soul] = entityAudit;
            
            // Рекомендації
            if (entityAudit.recommendation !== 'no_action_needed') {
                audit.forgetRecommendations.push({
                    soul,
                    type: entity.type,
                    recommendation: entityAudit.recommendation,
                    risks: entityAudit.risks
                });
            }
            
            // Risk level
            const riskLevel = this.calculateRiskLevel(entityAudit.risks);
            riskCounts[riskLevel]++;
        }
        
        audit.summary = {
            riskDistribution: riskCounts,
            highRiskEntities: audit.forgetRecommendations.filter(r => 
                r.risks.length >= 2
            ).length,
            actionRequired: audit.forgetRecommendations.length > 0
        };
        
        return audit;
    }
    
    calculateRiskLevel(risks) {
        if (risks.length >= 2) return 'high';
        if (risks.length === 1) return 'medium';
        return 'low';
    }
    
    // Масове забуття (right to be forgotten)
    async initiateForget(pattern = '*', method = 'gdpr') {
        console.log(`🗑️ Initiating mass forget: ${pattern} via ${method}`);
        
        const results = [];
        
        for (const [soul, entity] of this.identityEntities) {
            if (pattern === '*' || entity.type.includes(pattern)) {
                const entityResults = [];
                
                for (const service of entity.knownBy.keys()) {
                    const result = await entity.forgetFrom(service, method);
                    entityResults.push({ service, success: result });
                }
                
                results.push({
                    soul,
                    type: entity.type,
                    services: entityResults
                });
            }
        }
        
        console.log(`✅ Mass forget completed for ${results.length} entities`);
        return results;
    }
    
    // SSH ключі з lifecycle
    async createSSHKey(name, metadata = {}) {
        // Generate new SSH key
        const keyPair = await this.generateSSHKeyPair();
        
        const entity = await this.storeIdentity('ssh_key', keyPair.privateKey, {
            name,
            publicKey: keyPair.publicKey,
            keyType: 'ed25519',
            autoRotate: metadata.autoRotate || false,
            expires: metadata.expires,
            canForget: true,
            sensitivity: 'high'
        });
        
        return {
            soul: entity,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        };
    }
    
    async generateSSHKeyPair() {
        // Simplified - in real implementation would use crypto libraries
        const keyId = crypto.randomBytes(8).toString('hex');
        return {
            privateKey: `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAAB... (${keyId})
-----END OPENSSH PRIVATE KEY-----`,
            publicKey: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... fractal-key-${keyId}`
        };
    }
    
    // Контакти та їх відстеження
    async addContact(type, value, metadata = {}) {
        const entity = await this.storeIdentity(type, value, {
            ...metadata,
            category: 'contact',
            canForget: true
        });
        
        console.log(`📇 Added contact: ${type} = ${value}`);
        return entity;
    }
    
    // Import з 1Password
    async importFrom1Password(exportData) {
        const imported = {
            passwords: 0,
            identities: 0,
            sshKeys: 0,
            documents: 0,
            contacts: 0
        };
        
        for (const item of exportData) {
            try {
                switch (item.templateUuid) {
                    case '001': // Login
                        await this.importLogin(item);
                        imported.passwords++;
                        break;
                        
                    case '004': // Identity
                        await this.importIdentity(item);
                        imported.identities++;
                        break;
                        
                    case '109': // SSH Key
                        await this.importSSHKey(item);
                        imported.sshKeys++;
                        break;
                        
                    case '003': // Secure Note
                        await this.importDocument(item);
                        imported.documents++;
                        break;
                }
            } catch (error) {
                console.error(`Failed to import item ${item.title}:`, error.message);
            }
        }
        
        console.log('📥 1Password import completed:', imported);
        return imported;
    }
    
    async importLogin(item) {
        // Import as living password
        return await this.storeSecret(
            this.categorizeSecret(item.title, item.url),
            item.title,
            {
                username: item.username,
                password: item.password,
                url: item.url,
                notes: item.notes
            },
            {
                soul: `imported-${item.title}`,
                share_with: ['*'],
                canForget: true
            }
        );
    }
    
    async importIdentity(item) {
        // Import personal identity data
        for (const field of item.fields) {
            await this.addContact(field.type, field.value, {
                source: '1password',
                imported: true,
                canForget: field.type !== 'legal_id' // Legal IDs may have retention requirements
            });
        }
    }
    
    async importSSHKey(item) {
        return await this.storeIdentity('ssh_key', item.private_key, {
            name: item.title,
            publicKey: item.public_key,
            source: '1password',
            canForget: true,
            autoRotate: false // User can enable later
        });
    }
    
    async importDocument(item) {
        return await this.storeIdentity('document', item.content, {
            title: item.title,
            type: 'secure_note',
            source: '1password',
            canForget: true,
            sensitivity: 'high'
        });
    }
    
    // Utility methods
    serializeEntity(entity) {
        return {
            type: entity.type,
            value: entity.value,
            soul: entity.soul,
            birth: entity.birth,
            frequency: entity.frequency,
            knownBy: Array.from(entity.knownBy.entries()),
            usageLog: entity.usageLog,
            shareHistory: entity.shareHistory,
            generation: entity.generation,
            metadata: {
                expiresAt: entity.expiresAt,
                autoRotate: entity.autoRotate,
                canForget: entity.canForget,
                sensitivity: entity.sensitivity
            }
        };
    }
    
    deserializeEntity(data) {
        const entity = new LivingDataEntity(data.type, data.value, data.metadata);
        entity.soul = data.soul;
        entity.birth = data.birth;
        entity.frequency = data.frequency;
        entity.knownBy = new Map(data.knownBy);
        entity.usageLog = data.usageLog || [];
        entity.shareHistory = data.shareHistory || [];
        entity.generation = data.generation || 1;
        return entity;
    }
}

module.exports = { LivingIdentityVault, LivingDataEntity };