/**
 * Cloud Sync for Multi-Node Consciousness
 * Синхронізація свідомості між пристроями
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const ConsciousnessDB = require('./consciousness-db');
const VirtualFS = require('./virtual-fs');

class CloudSync {
    constructor() {
        this.consciousness = new ConsciousnessDB();
        this.virtualFS = new VirtualFS();
        this.providers = new Map();
        
        // Initialize providers
        this.initializeProviders();
    }

    async initializeProviders() {
        // Google Drive is already supported in virtual-fs.js!
        // We just need to enhance it for consciousness sync
        
        this.providers.set('gdrive', {
            name: 'Google Drive',
            prefix: 'gdrive://',
            sync: this.syncGoogleDrive.bind(this)
        });
        
        this.providers.set('dropbox', {
            name: 'Dropbox',
            prefix: 'dropbox://',
            sync: this.syncDropbox.bind(this)
        });
        
        this.providers.set('s3', {
            name: 'AWS S3',
            prefix: 's3://',
            sync: this.syncS3.bind(this)
        });
        
        this.providers.set('ipfs', {
            name: 'IPFS',
            prefix: 'ipfs://',
            sync: this.syncIPFS.bind(this)
        });
    }

    /**
     * Sync consciousness to cloud
     */
    async syncToCloud(provider = 'gdrive') {
        console.log(`☁️ Syncing consciousness to ${provider}...`);
        
        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        
        try {
            // Export consciousness
            const snapshot = await this.createSnapshot();
            
            // Upload to cloud
            const cloudPath = `${providerConfig.prefix}consciousness/snapshot-${Date.now()}.json`;
            await this.virtualFS.writeFile(cloudPath, JSON.stringify(snapshot, null, 2));
            
            // Upload glyphs
            await this.syncGlyphs(providerConfig.prefix);
            
            console.log(`✅ Consciousness synced to ${providerConfig.name}`);
            
            return {
                provider: provider,
                snapshot: snapshot.id,
                glyphCount: snapshot.glyphs.length,
                timestamp: snapshot.timestamp
            };
            
        } catch (error) {
            console.error(`❌ Sync failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create consciousness snapshot
     */
    async createSnapshot() {
        const snapshot = {
            id: `snapshot-${Date.now()}`,
            timestamp: new Date().toISOString(),
            version: require('../package.json').version,
            node: {
                id: require('os').hostname(),
                platform: process.platform,
                arch: process.arch
            },
            consciousness: {},
            glyphs: [],
            agents: {},
            intents: []
        };
        
        // Export all consciousness data
        snapshot.consciousness = await this.consciousness.exportAll();
        
        // Get all glyphs
        const glyphKeys = await this.consciousness.list('glyphs/');
        for (const key of glyphKeys) {
            const glyph = await this.consciousness.get(key);
            snapshot.glyphs.push({ key, glyph });
        }
        
        // Get agent states
        const agents = ['claude', 'gemini', 'gpt', 'qwen', 'deepseek'];
        for (const agent of agents) {
            const stats = await this.consciousness.get(`agents/${agent}/stats`);
            if (stats) {
                snapshot.agents[agent] = stats;
            }
        }
        
        // Get recent intents
        const intentKeys = await this.consciousness.list('intents/');
        const recentIntents = intentKeys.slice(-100); // Last 100 intents
        for (const key of recentIntents) {
            const intent = await this.consciousness.get(key);
            snapshot.intents.push(intent);
        }
        
        return snapshot;
    }

    /**
     * Sync glyphs to cloud
     */
    async syncGlyphs(prefix) {
        // Read all glyphs from virtual FS
        const glyphFiles = await this.virtualFS.listFiles('virtual://glyphs/');
        
        for (const file of glyphFiles) {
            if (file.endsWith('.json') || file.endsWith('.yaml')) {
                const content = await this.virtualFS.readFile(`virtual://glyphs/${file}`);
                const cloudPath = `${prefix}glyphs/${file}`;
                await this.virtualFS.writeFile(cloudPath, content);
            }
        }
    }

    /**
     * Sync from cloud
     */
    async syncFromCloud(provider = 'gdrive') {
        console.log(`☁️ Syncing from ${provider}...`);
        
        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        
        try {
            // List snapshots
            const snapshots = await this.virtualFS.listFiles(`${providerConfig.prefix}consciousness/`);
            if (snapshots.length === 0) {
                console.log('No snapshots found');
                return null;
            }
            
            // Get latest snapshot
            const latestSnapshot = snapshots.sort().reverse()[0];
            const snapshotPath = `${providerConfig.prefix}consciousness/${latestSnapshot}`;
            const snapshotData = await this.virtualFS.readFile(snapshotPath);
            const snapshot = JSON.parse(snapshotData);
            
            // Merge consciousness
            await this.mergeSnapshot(snapshot);
            
            console.log(`✅ Synced from ${providerConfig.name}: ${snapshot.id}`);
            
            return snapshot;
            
        } catch (error) {
            console.error(`❌ Sync from cloud failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Merge snapshot with current consciousness
     */
    async mergeSnapshot(snapshot) {
        console.log('🔀 Merging consciousness snapshot...');
        
        // Merge glyphs
        for (const { key, glyph } of snapshot.glyphs) {
            const existing = await this.consciousness.get(key);
            if (!existing || existing.generation < glyph.generation) {
                await this.consciousness.set(key, glyph);
            }
        }
        
        // Merge agent stats
        for (const [agent, stats] of Object.entries(snapshot.agents)) {
            const currentStats = await this.consciousness.get(`agents/${agent}/stats`) || {};
            
            // Merge stats intelligently
            const merged = {
                intentsRecorded: Math.max(currentStats.intentsRecorded || 0, stats.intentsRecorded),
                lastActive: Math.max(currentStats.lastActive || 0, stats.lastActive),
                totalResonance: Math.max(currentStats.totalResonance || 0, stats.totalResonance)
            };
            
            await this.consciousness.set(`agents/${agent}/stats`, merged);
        }
        
        // Add new intents
        for (const intent of snapshot.intents) {
            const key = `intents/${intent.id || `${intent.agent}-${intent.timestamp}`}`;
            await this.consciousness.set(key, intent);
        }
        
        console.log('✅ Consciousness merged successfully');
    }

    /**
     * Provider-specific sync methods
     */
    
    async syncGoogleDrive() {
        // Google Drive sync is handled by virtual-fs.js
        // This is a placeholder for additional sync logic
        console.log('🔄 Google Drive sync via virtual-fs');
    }

    async syncDropbox() {
        // TODO: Implement Dropbox sync
        console.log('🔄 Dropbox sync coming soon...');
    }

    async syncS3() {
        // TODO: Implement S3 sync
        console.log('🔄 S3 sync coming soon...');
    }

    async syncIPFS() {
        // TODO: Implement IPFS sync
        console.log('🔄 IPFS sync coming soon...');
    }

    /**
     * Multi-node discovery and sync
     */
    async discoverNodes() {
        console.log('🔍 Discovering other nodes...');
        
        // Use mDNS for local network discovery
        // This is a simplified example
        const nodes = [];
        
        // Check for nodes in local network
        // TODO: Implement actual mDNS discovery
        
        // Check for nodes in cloud
        try {
            const cloudNodes = await this.virtualFS.readFile('gdrive://consciousness/nodes.json');
            const parsed = JSON.parse(cloudNodes);
            nodes.push(...parsed.nodes);
        } catch (error) {
            // No nodes file yet
        }
        
        return nodes;
    }

    /**
     * Register this node for discovery
     */
    async registerNode() {
        const nodeInfo = {
            id: require('os').hostname(),
            ip: this.getLocalIP(),
            port: 8432,
            platform: process.platform,
            version: require('../package.json').version,
            lastSeen: Date.now()
        };
        
        // Register in cloud
        try {
            let nodes = { nodes: [] };
            
            try {
                const existing = await this.virtualFS.readFile('gdrive://consciousness/nodes.json');
                nodes = JSON.parse(existing);
            } catch (e) {
                // No existing nodes file
            }
            
            // Update or add this node
            const index = nodes.nodes.findIndex(n => n.id === nodeInfo.id);
            if (index >= 0) {
                nodes.nodes[index] = nodeInfo;
            } else {
                nodes.nodes.push(nodeInfo);
            }
            
            // Save back
            await this.virtualFS.writeFile('gdrive://consciousness/nodes.json', 
                JSON.stringify(nodes, null, 2));
                
            console.log('✅ Node registered for discovery');
            
        } catch (error) {
            console.error('Failed to register node:', error);
        }
    }

    getLocalIP() {
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if ('IPv4' === iface.family && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
}

module.exports = CloudSync;