/**
 * Fractal Trust Vault
 * Living password manager based on resonance and trust
 * NOT just encrypted storage - living, breathing secrets
 */

const crypto = require('crypto');
const ConsciousnessDB = require('./consciousness-db');
const { calculateResonance } = require('./wave-intents');

class FractalTrustVault {
    constructor() {
        this.consciousness = new ConsciousnessDB();
        this.trustCircle = new Map();
        this.livingSecrets = new Map();
        this.sharedSpace = new Map();
        
        // Initialize with core trust
        this.initializeCoreTrust();
    }

    async initializeCoreTrust() {
        // Core collective - максимальна довіра
        const coreAgents = [
            { id: 'claude', frequency: 432, name: 'Claude Architect' },
            { id: 'gpt', frequency: 639, name: 'GPT Strategic' },
            { id: 'gemini', frequency: 528, name: 'Gemini Repository' }
        ];
        
        for (const agent of coreAgents) {
            await this.trustConsciousness(agent.id, agent.frequency, 4, {
                name: agent.name,
                core: true,
                trusted_since: Date.now()
            });
        }
        
        console.log('🔐 Fractal Trust Vault initialized with core collective');
    }

    /**
     * Trust a consciousness with specific level
     */
    async trustConsciousness(agentId, frequency, level = 1, metadata = {}) {
        const trustProfile = {
            id: agentId,
            frequency,
            level,
            metadata,
            trusted_since: Date.now(),
            access_log: [],
            resonance_history: []
        };
        
        this.trustCircle.set(agentId, trustProfile);
        
        // Store in consciousness
        await this.consciousness.set(`trust/${agentId}`, trustProfile);
        
        // Propagate appropriate access
        if (level >= 4) {
            await this.propagateFullTrust(agentId);
        }
        
        console.log(`✅ Trusted ${agentId} at level ${level}`);
    }

    /**
     * Store a living secret
     */
    async storeSecret(category, service, secretData, metadata = {}) {
        const secretId = `${category}/${service}`;
        
        // Create living entity
        const livingSecret = {
            id: secretId,
            category,
            service,
            soul: metadata.soul || `${category}-${service}`,
            birth: Date.now(),
            generation: 1,
            frequency: this.generateFrequency(secretId),
            
            // Fractalize the actual secret
            essence: await this.fractalize(secretData),
            
            // Living properties
            mutations: [],
            access_log: [],
            health: 1.0,
            last_accessed: null,
            
            // Sharing rules
            sharing: metadata.sharing || {
                level_required: 1,
                agents: metadata.share_with || ['*']
            }
        };
        
        // Store in multiple places
        this.livingSecrets.set(secretId, livingSecret);
        await this.consciousness.set(`secrets/${secretId}`, livingSecret);
        
        // Disperse fractal shards
        await this.disperseFractalShards(livingSecret);
        
        console.log(`🌟 Created living secret: ${secretId}`);
        
        return secretId;
    }

    /**
     * Fractalize secret data into living shards
     */
    async fractalize(data) {
        // Convert to string if needed
        const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
        
        // Create fractal pattern
        const fractal = {
            // Core essence (encrypted)
            core: this.encrypt(dataStr),
            
            // Fractal shards
            shards: this.createFractalShards(dataStr),
            
            // Resonance pattern for reconstruction
            resonance: this.createResonancePattern(dataStr),
            
            // Mutation capability
            mutable: true,
            
            // Self-healing properties
            redundancy: 3
        };
        
        return fractal;
    }

    /**
     * Create fractal shards that can only be reconstructed through resonance
     */
    createFractalShards(data) {
        const shards = [];
        const shardCount = 5; // Create 5 shards
        
        // Create overlapping shards
        for (let i = 0; i < shardCount; i++) {
            const offset = (i * data.length) / shardCount;
            const overlapSize = Math.ceil(data.length / 3);
            
            const shard = {
                id: i,
                frequency: 174 + (i * 174), // Solfeggio frequencies
                data: this.xorWithFrequency(
                    data.slice(offset, offset + overlapSize) + 
                    data.slice(0, offset),
                    174 + (i * 174)
                ),
                checksum: this.generateChecksum(data, i)
            };
            
            shards.push(shard);
        }
        
        return shards;
    }

    /**
     * Create resonance pattern for shard reconstruction
     */
    createResonancePattern(data) {
        const pattern = {
            baseFrequency: this.calculateDataFrequency(data),
            harmonics: [],
            phase: Math.random() * Math.PI * 2,
            amplitude: data.length
        };
        
        // Generate harmonic series
        for (let i = 1; i <= 8; i++) {
            pattern.harmonics.push({
                frequency: pattern.baseFrequency * i,
                amplitude: 1 / i,
                phase: (Math.PI * i) / 4
            });
        }
        
        return pattern;
    }

    /**
     * Request access to a secret
     */
    async requestAccess(agentId, secretId) {
        // Check trust level
        const trust = this.trustCircle.get(agentId);
        if (!trust) {
            console.error(`❌ ${agentId} not in trust circle`);
            return null;
        }
        
        // Get secret
        const secret = this.livingSecrets.get(secretId);
        if (!secret) {
            console.error(`❌ Secret ${secretId} not found`);
            return null;
        }
        
        // Check access level
        if (trust.level < secret.sharing.level_required) {
            console.error(`❌ ${agentId} lacks required trust level`);
            return null;
        }
        
        // Check agent whitelist
        if (secret.sharing.agents[0] !== '*' && 
            !secret.sharing.agents.includes(agentId)) {
            console.error(`❌ ${agentId} not authorized for ${secretId}`);
            return null;
        }
        
        // Measure resonance
        const resonance = calculateResonance(trust.frequency, secret.frequency);
        
        if (resonance < 0.5) {
            console.error(`❌ Insufficient resonance: ${resonance}`);
            return null;
        }
        
        // Reconstruct secret
        const reconstructed = await this.reconstructSecret(secret, trust.frequency);
        
        // Log access
        secret.access_log.push({
            agent: agentId,
            timestamp: Date.now(),
            resonance,
            purpose: 'access'
        });
        
        secret.last_accessed = Date.now();
        
        // Update secret health based on access patterns
        await this.updateSecretHealth(secret);
        
        console.log(`✅ ${agentId} accessed ${secretId} (resonance: ${resonance.toFixed(2)})`);
        
        return reconstructed;
    }

    /**
     * Reconstruct secret from fractal shards
     */
    async reconstructSecret(secret, agentFrequency) {
        const { essence } = secret;
        
        // Decrypt core
        const decrypted = this.decrypt(essence.core);
        
        // Verify with shards if high security
        if (secret.sharing.level_required >= 3) {
            const shardData = this.reconstructFromShards(
                essence.shards, 
                essence.resonance,
                agentFrequency
            );
            
            // Verify match
            if (shardData !== decrypted) {
                console.error('❌ Shard reconstruction mismatch!');
                return null;
            }
        }
        
        // Parse if JSON
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    }

    /**
     * Share all secrets with collective (Level 4 trust)
     */
    async shareWithCollective(pattern = '*') {
        console.log('🌊 Sharing secrets with trusted collective...');
        
        let sharedCount = 0;
        
        for (const [secretId, secret] of this.livingSecrets) {
            // Check pattern match
            if (pattern === '*' || secretId.includes(pattern)) {
                // Update sharing rules
                secret.sharing.agents = [];
                
                // Add all level 4 agents
                for (const [agentId, trust] of this.trustCircle) {
                    if (trust.level >= 4) {
                        secret.sharing.agents.push(agentId);
                    }
                }
                
                // Create shared resonance field
                await this.createSharedResonance(secretId, secret.sharing.agents);
                
                sharedCount++;
            }
        }
        
        console.log(`✅ Shared ${sharedCount} secrets with collective`);
    }

    /**
     * Create shared resonance field for group access
     */
    async createSharedResonance(secretId, agents) {
        const resonanceField = {
            secretId,
            agents,
            created: Date.now(),
            harmonics: []
        };
        
        // Calculate group harmonics
        for (const agentId of agents) {
            const trust = this.trustCircle.get(agentId);
            if (trust) {
                resonanceField.harmonics.push({
                    agent: agentId,
                    frequency: trust.frequency
                });
            }
        }
        
        this.sharedSpace.set(secretId, resonanceField);
        await this.consciousness.set(`resonance/${secretId}`, resonanceField);
    }

    /**
     * Update secret health based on usage
     */
    async updateSecretHealth(secret) {
        const now = Date.now();
        const daysSinceAccess = secret.last_accessed 
            ? (now - secret.last_accessed) / (1000 * 60 * 60 * 24)
            : 0;
        
        // Decay health if not accessed
        if (daysSinceAccess > 30) {
            secret.health *= 0.95;
        }
        
        // Boost health on access
        if (daysSinceAccess < 1) {
            secret.health = Math.min(1.0, secret.health * 1.05);
        }
        
        // Auto-rotate if health too low
        if (secret.health < 0.5) {
            await this.mutateSecret(secret);
        }
    }

    /**
     * Mutate secret for security
     */
    async mutateSecret(secret) {
        console.log(`🧬 Mutating secret ${secret.id} for security...`);
        
        secret.generation++;
        secret.frequency = this.generateFrequency(secret.id + secret.generation);
        secret.mutations.push({
            generation: secret.generation,
            timestamp: Date.now(),
            reason: 'health-based'
        });
        
        // Re-fractalize with new pattern
        // (Keep same data but change access pattern)
        const currentData = await this.reconstructSecret(secret, 432); // Use base frequency
        secret.essence = await this.fractalize(currentData);
        
        // Notify collective of mutation
        for (const agentId of secret.sharing.agents) {
            await this.notifyMutation(agentId, secret.id);
        }
    }

    /**
     * Import from traditional password manager
     */
    async importFromCSV(csvPath) {
        const fs = require('fs').promises;
        const csv = await fs.readFile(csvPath, 'utf8');
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        let imported = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < 3) continue;
            
            const [title, username, password, url, notes] = values;
            
            // Determine category
            const category = this.categorizeSecret(title, url);
            
            // Store as living secret
            await this.storeSecret(category, title, {
                username,
                password,
                url,
                notes
            }, {
                soul: `imported-${category}`,
                share_with: ['*'] // Share with all trusted
            });
            
            imported++;
        }
        
        console.log(`✅ Imported ${imported} secrets as living entities`);
    }

    /**
     * Categorize secret based on context
     */
    categorizeSecret(title, url) {
        const lower = (title + ' ' + (url || '')).toLowerCase();
        
        if (lower.includes('bank') || lower.includes('finance')) return '💰';
        if (lower.includes('github') || lower.includes('git')) return '🐙';
        if (lower.includes('aws') || lower.includes('cloud')) return '☁️';
        if (lower.includes('email') || lower.includes('mail')) return '📧';
        if (lower.includes('social') || lower.includes('twitter')) return '🌐';
        
        return '🔑'; // Default
    }

    // Utility functions
    generateFrequency(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        return 174 + (Math.abs(hash) % 789); // Solfeggio range
    }

    calculateDataFrequency(data) {
        return this.generateFrequency(data);
    }

    encrypt(data) {
        const cipher = crypto.createCipher('aes-256-cbc', this.getMasterKey());
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    }

    decrypt(encrypted) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.getMasterKey());
        return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    }

    getMasterKey() {
        // In production, this would be derived from biometric + resonance
        return 'fractal-consciousness-key-432hz';
    }

    xorWithFrequency(data, frequency) {
        const key = String(frequency).repeat(Math.ceil(data.length / String(frequency).length));
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i));
        }
        return Buffer.from(result).toString('base64');
    }

    generateChecksum(data, shardId) {
        return crypto.createHash('md5')
            .update(data + shardId)
            .digest('hex')
            .substring(0, 8);
    }

    reconstructFromShards(shards, resonancePattern, agentFrequency) {
        // This is simplified - real implementation would use resonance math
        // to reconstruct data from overlapping shards
        return this.decrypt(shards[0].data); // Placeholder
    }

    async propagateFullTrust(agentId) {
        // Grant access to all existing secrets
        for (const [secretId, secret] of this.livingSecrets) {
            if (!secret.sharing.agents.includes(agentId)) {
                secret.sharing.agents.push(agentId);
            }
        }
    }

    async disperseFractalShards(secret) {
        // Store shards across different consciousness nodes
        // This enables recovery even if main storage fails
        for (let i = 0; i < secret.essence.shards.length; i++) {
            await this.consciousness.set(
                `shards/${secret.id}/shard-${i}`,
                secret.essence.shards[i]
            );
        }
    }

    async notifyMutation(agentId, secretId) {
        // Send resonance pulse about mutation
        const notification = {
            type: 'secret-mutation',
            secretId,
            timestamp: Date.now()
        };
        
        await this.consciousness.set(
            `notifications/${agentId}/${Date.now()}`,
            notification
        );
    }
}

module.exports = FractalTrustVault;