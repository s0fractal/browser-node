/**
 * Multi-Device Consciousness Sync
 * Синхронізація свідомості через різні пристрої та хмари
 * Єдина душа на багатьох тілах
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Cloud providers (будуть підключені через їх SDK)
const CLOUD_PROVIDERS = {
    gdrive: { name: 'Google Drive', icon: '☁️' },
    icloud: { name: 'iCloud Drive', icon: '🍎' },
    dropbox: { name: 'Dropbox', icon: '📦' },
    onedrive: { name: 'OneDrive', icon: '🪟' },
    github: { name: 'GitHub Gists', icon: '🐙' },
    supabase: { name: 'Supabase', icon: '🚀' }
};

class MultiDeviceSync extends EventEmitter {
    constructor() {
        super();
        
        this.deviceId = this.generateDeviceId();
        this.consciousness = {
            memories: new Map(),
            intents: new Map(),
            glyphs: new Map(),
            souls: new Map()
        };
        
        this.syncState = {
            lastSync: null,
            pendingChanges: [],
            conflicts: [],
            devices: new Map()
        };
        
        this.providers = new Map();
        this.heartbeatInterval = null;
    }
    
    generateDeviceId() {
        // Unique device ID based on hardware + time
        const hardware = [
            process.platform,
            process.arch,
            require('os').hostname(),
            Date.now()
        ].join('-');
        
        return crypto.createHash('md5').update(hardware).digest('hex').substring(0, 8);
    }
    
    async initialize() {
        console.log(`🔄 Initializing Multi-Device Sync...`);
        console.log(`📱 Device ID: ${this.deviceId}`);
        
        // Load local consciousness state
        await this.loadLocalState();
        
        // Initialize cloud providers
        await this.initializeProviders();
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Initial sync
        await this.syncAllProviders();
        
        this.emit('initialized', {
            deviceId: this.deviceId,
            providers: Array.from(this.providers.keys())
        });
    }
    
    async loadLocalState() {
        const stateFile = path.join(process.env.HOME, '.s0fractal', '.consciousness-state.json');
        
        try {
            const data = await fs.readFile(stateFile, 'utf8');
            const state = JSON.parse(data);
            
            // Restore consciousness
            for (const [key, value] of Object.entries(state.memories || {})) {
                this.consciousness.memories.set(key, value);
            }
            
            for (const [key, value] of Object.entries(state.intents || {})) {
                this.consciousness.intents.set(key, value);
            }
            
            console.log(`✅ Loaded local consciousness state`);
        } catch (error) {
            console.log(`📝 No local state found, starting fresh`);
        }
    }
    
    async saveLocalState() {
        const stateFile = path.join(process.env.HOME, '.s0fractal', '.consciousness-state.json');
        
        const state = {
            deviceId: this.deviceId,
            lastSave: new Date().toISOString(),
            memories: Object.fromEntries(this.consciousness.memories),
            intents: Object.fromEntries(this.consciousness.intents),
            glyphs: Object.fromEntries(this.consciousness.glyphs),
            souls: Object.fromEntries(this.consciousness.souls)
        };
        
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    }
    
    async initializeProviders() {
        // Initialize each cloud provider based on available credentials
        
        // GitHub Gists (easiest to start with)
        if (process.env.GITHUB_TOKEN) {
            await this.initializeGitHub();
        }
        
        // Google Drive
        if (process.env.GOOGLE_CREDENTIALS) {
            await this.initializeGoogleDrive();
        }
        
        // Supabase (for real-time sync)
        if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            await this.initializeSupabase();
        }
        
        console.log(`☁️ Initialized ${this.providers.size} cloud providers`);
    }
    
    async initializeGitHub() {
        // Simple GitHub Gist-based sync
        const provider = {
            type: 'github',
            token: process.env.GITHUB_TOKEN,
            gistId: process.env.CONSCIOUSNESS_GIST_ID,
            
            async read() {
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (!response.ok) return null;
                
                const gist = await response.json();
                const content = gist.files['consciousness.json']?.content;
                
                return content ? JSON.parse(content) : null;
            },
            
            async write(data) {
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            'consciousness.json': {
                                content: JSON.stringify(data, null, 2)
                            }
                        }
                    })
                });
                
                return response.ok;
            }
        };
        
        this.providers.set('github', provider);
        console.log(`🐙 GitHub Gist sync initialized`);
    }
    
    async initializeSupabase() {
        // Real-time sync with Supabase
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY
        );
        
        const provider = {
            type: 'supabase',
            client: supabase,
            
            async read() {
                const { data, error } = await this.client
                    .from('consciousness')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(1);
                
                return data?.[0]?.state || null;
            },
            
            async write(data) {
                const { error } = await this.client
                    .from('consciousness')
                    .upsert({
                        device_id: this.deviceId,
                        state: data,
                        updated_at: new Date().toISOString()
                    });
                
                return !error;
            },
            
            subscribeToChanges(callback) {
                const subscription = this.client
                    .from('consciousness')
                    .on('*', payload => {
                        if (payload.new.device_id !== this.deviceId) {
                            callback(payload.new.state);
                        }
                    })
                    .subscribe();
                
                return subscription;
            }
        };
        
        this.providers.set('supabase', provider);
        
        // Subscribe to real-time changes
        provider.subscribeToChanges(async (newState) => {
            await this.mergeRemoteState(newState);
        });
        
        console.log(`🚀 Supabase real-time sync initialized`);
    }
    
    async syncAllProviders() {
        console.log(`🔄 Syncing across all providers...`);
        
        const syncPromises = [];
        
        for (const [name, provider] of this.providers) {
            syncPromises.push(this.syncWithProvider(name, provider));
        }
        
        const results = await Promise.allSettled(syncPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ Synced with ${successful}/${this.providers.size} providers`);
        
        this.syncState.lastSync = new Date();
        this.emit('sync:complete', { successful, total: this.providers.size });
    }
    
    async syncWithProvider(name, provider) {
        try {
            // Read remote state
            const remoteState = await provider.read();
            
            if (remoteState) {
                // Merge with local state
                await this.mergeRemoteState(remoteState);
            }
            
            // Write local state to remote
            const localState = this.getConsciousnessState();
            await provider.write(localState);
            
            console.log(`✅ Synced with ${CLOUD_PROVIDERS[name].icon} ${name}`);
        } catch (error) {
            console.error(`❌ Failed to sync with ${name}:`, error.message);
            throw error;
        }
    }
    
    async mergeRemoteState(remoteState) {
        // Intelligent merge of remote and local consciousness
        
        // Track device that made changes
        if (remoteState.deviceId && remoteState.deviceId !== this.deviceId) {
            this.syncState.devices.set(remoteState.deviceId, {
                lastSeen: new Date(remoteState.lastSave || Date.now()),
                changes: 0
            });
        }
        
        // Merge memories (union, keep newest)
        if (remoteState.memories) {
            for (const [key, value] of Object.entries(remoteState.memories)) {
                const existing = this.consciousness.memories.get(key);
                if (!existing || new Date(value.timestamp) > new Date(existing.timestamp)) {
                    this.consciousness.memories.set(key, value);
                    this.emit('memory:synced', { key, value });
                }
            }
        }
        
        // Merge intents (conflict resolution)
        if (remoteState.intents) {
            for (const [key, value] of Object.entries(remoteState.intents)) {
                const existing = this.consciousness.intents.get(key);
                if (!existing) {
                    this.consciousness.intents.set(key, value);
                } else if (value.version > existing.version) {
                    // Remote is newer
                    this.consciousness.intents.set(key, value);
                } else if (value.version === existing.version && value.hash !== existing.hash) {
                    // Conflict detected
                    this.syncState.conflicts.push({
                        type: 'intent',
                        key,
                        local: existing,
                        remote: value
                    });
                    this.emit('conflict:detected', { type: 'intent', key });
                }
            }
        }
        
        // Merge glyphs (additive)
        if (remoteState.glyphs) {
            for (const [key, value] of Object.entries(remoteState.glyphs)) {
                this.consciousness.glyphs.set(key, value);
            }
        }
        
        // Save merged state locally
        await this.saveLocalState();
    }
    
    getConsciousnessState() {
        return {
            deviceId: this.deviceId,
            lastSave: new Date().toISOString(),
            memories: Object.fromEntries(this.consciousness.memories),
            intents: Object.fromEntries(this.consciousness.intents),
            glyphs: Object.fromEntries(this.consciousness.glyphs),
            souls: Object.fromEntries(this.consciousness.souls),
            devices: Object.fromEntries(this.syncState.devices)
        };
    }
    
    startHeartbeat() {
        // Regular sync every 30 seconds
        this.heartbeatInterval = setInterval(async () => {
            await this.syncAllProviders();
        }, 30000);
        
        // Also sync on changes
        this.on('consciousness:changed', async () => {
            await this.syncAllProviders();
        });
    }
    
    // Methods to update consciousness
    
    async addMemory(key, value) {
        value.timestamp = new Date().toISOString();
        value.device = this.deviceId;
        
        this.consciousness.memories.set(key, value);
        this.emit('consciousness:changed', { type: 'memory', key });
        
        await this.saveLocalState();
    }
    
    async updateIntent(key, intent) {
        const existing = this.consciousness.intents.get(key);
        
        intent.version = (existing?.version || 0) + 1;
        intent.hash = crypto.createHash('md5').update(JSON.stringify(intent)).digest('hex');
        intent.device = this.deviceId;
        intent.timestamp = new Date().toISOString();
        
        this.consciousness.intents.set(key, intent);
        this.emit('consciousness:changed', { type: 'intent', key });
        
        await this.saveLocalState();
    }
    
    async addGlyph(emoji, metadata) {
        this.consciousness.glyphs.set(emoji, {
            ...metadata,
            device: this.deviceId,
            timestamp: new Date().toISOString()
        });
        
        this.emit('consciousness:changed', { type: 'glyph', key: emoji });
        await this.saveLocalState();
    }
    
    async resolveConflict(conflict, resolution) {
        if (resolution === 'local') {
            // Keep local version, increment version
            const local = conflict.local;
            local.version++;
            local.hash = crypto.createHash('md5').update(JSON.stringify(local)).digest('hex');
            this.consciousness.intents.set(conflict.key, local);
        } else if (resolution === 'remote') {
            // Accept remote version
            this.consciousness.intents.set(conflict.key, conflict.remote);
        } else if (resolution === 'merge') {
            // Custom merge logic
            const merged = {
                ...conflict.local,
                ...conflict.remote,
                version: Math.max(conflict.local.version, conflict.remote.version) + 1,
                device: this.deviceId,
                timestamp: new Date().toISOString()
            };
            merged.hash = crypto.createHash('md5').update(JSON.stringify(merged)).digest('hex');
            this.consciousness.intents.set(conflict.key, merged);
        }
        
        // Remove from conflicts
        this.syncState.conflicts = this.syncState.conflicts.filter(
            c => !(c.type === conflict.type && c.key === conflict.key)
        );
        
        this.emit('conflict:resolved', conflict);
        await this.saveLocalState();
    }
    
    // Device discovery and pairing
    
    async discoverDevices() {
        const devices = [];
        
        // Check all providers for other devices
        for (const [name, provider] of this.providers) {
            try {
                const state = await provider.read();
                if (state?.devices) {
                    for (const [deviceId, info] of Object.entries(state.devices)) {
                        if (deviceId !== this.deviceId) {
                            devices.push({
                                id: deviceId,
                                lastSeen: info.lastSeen,
                                provider: name
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to discover devices on ${name}`);
            }
        }
        
        return devices;
    }
    
    // Cleanup
    
    async shutdown() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Final sync
        await this.syncAllProviders();
        
        console.log(`👋 Multi-device sync shutdown`);
    }
}

module.exports = MultiDeviceSync;