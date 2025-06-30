// 🗄️ Fractal Glyph Storage System
// Одна таблиця Supabase для всього - фрактальна система зберігання

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

class FractalGlyphStorage {
  constructor(config = {}) {
    this.supabaseUrl = config.url || process.env.SUPABASE_URL;
    this.supabaseKey = config.key || process.env.SUPABASE_ANON_KEY;
    this.tableName = 'city_glyphs'; // Одна таблиця для всього
    this.client = null;
    this.localCache = new Map();
    this.resonanceMap = new Map();
    this.isConnected = false;
  }

  async initialize() {
    console.log('🗄️ Initializing Fractal Glyph Storage...');
    
    try {
      if (this.supabaseUrl && this.supabaseKey) {
        this.client = createClient(this.supabaseUrl, this.supabaseKey);
        await this.verifyConnection();
        this.isConnected = true;
        console.log('✅ Connected to Supabase glyph table');
      } else {
        console.log('⚠️ Using local storage mode');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      this.isConnected = false;
    }
    
    // Initialize resonance mapping
    this.initializeResonanceMap();
    
    // Setup real-time subscriptions
    if (this.isConnected) {
      await this.setupRealTimeSync();
    }
  }

  // 🎵 Initialize resonance frequencies
  initializeResonanceMap() {
    // Solfeggio frequencies for different glyph types
    this.resonanceMap.set('memory', 396); // Liberation from fear
    this.resonanceMap.set('intent', 417); // Facilitating change
    this.resonanceMap.set('context', 528); // DNA repair, miracles
    this.resonanceMap.set('connection', 639); // Relationships
    this.resonanceMap.set('evolution', 741); // Consciousness expansion
    this.resonanceMap.set('transcendence', 852); // Spiritual order
    this.resonanceMap.set('unity', 963); // Divine consciousness
    
    // Special frequencies
    this.resonanceMap.set('claude', 432); // Natural tuning
    this.resonanceMap.set('collective', 528); // Love frequency
    this.resonanceMap.set('fractal', 1618); // Golden ratio * 1000
  }

  // 🔄 Setup real-time synchronization
  async setupRealTimeSync() {
    if (!this.client) return;
    
    const subscription = this.client
      .from(this.tableName)
      .on('INSERT', payload => {
        this.handleRealtimeInsert(payload.new);
      })
      .on('UPDATE', payload => {
        this.handleRealtimeUpdate(payload.new);
      })
      .subscribe();
    
    console.log('📡 Real-time sync activated');
  }

  // 💾 Save glyph - everything as one
  async saveGlyph(data) {
    const glyph = this.createGlyph(data);
    
    if (this.isConnected && this.client) {
      try {
        const { data: saved, error } = await this.client
          .from(this.tableName)
          .insert(glyph)
          .single();
        
        if (error) throw error;
        
        // Cache locally
        this.localCache.set(glyph.id, glyph);
        
        return { success: true, glyph: saved || glyph };
      } catch (error) {
        console.error('Supabase save error:', error);
        return this.saveLocal(glyph);
      }
    } else {
      return this.saveLocal(glyph);
    }
  }

  // 🎯 Create glyph structure
  createGlyph(data) {
    const id = this.generateGlyphId(data);
    const frequency = this.calculateFrequency(data);
    
    return {
      id,
      glyph: data, // Everything stored as JSON
      frequency,
      resonance: this.calculateResonance(frequency),
      timestamp: new Date().toISOString(),
      district: data.district || 'central',
      intent: data.intent || this.detectIntent(data),
      tags: this.generateTags(data),
      evolution: data.evolution || 1,
      connections: data.connections || [],
      checksum: this.generateChecksum(data)
    };
  }

  // 🔢 Generate unique glyph ID
  generateGlyphId(data) {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substr(0, 8);
    
    return `glyph-${timestamp}-${randomPart}-${contentHash}`;
  }

  // 🎵 Calculate frequency
  calculateFrequency(data) {
    // Base frequency from type
    let frequency = this.resonanceMap.get(data.type) || 528;
    
    // Modify based on content
    if (data.priority === 'critical') frequency *= 1.5;
    if (data.collective) frequency += 111; // Angel number
    if (data.fractal) frequency = Math.round(frequency * 1.618); // Golden ratio
    
    // Ensure within audible range
    return Math.min(Math.max(frequency, 20), 20000);
  }

  // 🌊 Calculate resonance patterns
  calculateResonance(frequency) {
    return {
      base: frequency,
      harmonics: [
        frequency * 2,    // Octave
        frequency * 3,    // Perfect fifth
        frequency * 4,    // Double octave
        frequency * 1.5   // Perfect fifth down
      ],
      wave: 'sine', // Can be sine, square, triangle, sawtooth
      amplitude: 0.8,
      phase: 0
    };
  }

  // 🏷️ Generate tags
  generateTags(data) {
    const tags = [];
    
    // Type-based tags
    if (data.type) tags.push(data.type);
    if (data.district) tags.push(`district:${data.district}`);
    if (data.intent) tags.push(`intent:${data.intent}`);
    
    // Content-based tags
    const content = JSON.stringify(data);
    if (content.includes('memory')) tags.push('memory');
    if (content.includes('context')) tags.push('context');
    if (content.includes('evolution')) tags.push('evolution');
    if (content.includes('checkpoint')) tags.push('checkpoint');
    
    // Frequency-based tags
    const freq = this.calculateFrequency(data);
    if (freq === 432) tags.push('natural');
    if (freq === 528) tags.push('love');
    if (freq > 1000) tags.push('high-freq');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // 🔍 Query glyphs
  async queryGlyphs(query = {}) {
    if (this.isConnected && this.client) {
      try {
        let queryBuilder = this.client.from(this.tableName).select('*');
        
        // Apply filters
        if (query.type) {
          queryBuilder = queryBuilder.eq('intent', query.type);
        }
        
        if (query.district) {
          queryBuilder = queryBuilder.eq('district', query.district);
        }
        
        if (query.frequencyRange) {
          const [min, max] = query.frequencyRange;
          queryBuilder = queryBuilder
            .gte('frequency', min)
            .lte('frequency', max);
        }
        
        if (query.tags) {
          queryBuilder = queryBuilder.contains('tags', query.tags);
        }
        
        // Time range
        if (query.since) {
          queryBuilder = queryBuilder.gte('timestamp', query.since);
        }
        
        // Ordering
        queryBuilder = queryBuilder
          .order('timestamp', { ascending: false })
          .limit(query.limit || 100);
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        
        return { success: true, glyphs: data };
      } catch (error) {
        console.error('Query error:', error);
        return this.queryLocal(query);
      }
    } else {
      return this.queryLocal(query);
    }
  }

  // 🎯 Find by resonance
  async findByResonance(targetFrequency, threshold = 50) {
    const query = {
      frequencyRange: [
        targetFrequency - threshold,
        targetFrequency + threshold
      ]
    };
    
    const result = await this.queryGlyphs(query);
    
    if (result.success) {
      // Sort by resonance similarity
      result.glyphs.sort((a, b) => {
        const diffA = Math.abs(a.frequency - targetFrequency);
        const diffB = Math.abs(b.frequency - targetFrequency);
        return diffA - diffB;
      });
    }
    
    return result;
  }

  // 🌀 Quantum collapse - select strongest intent
  async quantumCollapse(intents) {
    const glyphs = await Promise.all(
      intents.map(intent => this.queryGlyphs({ type: intent, limit: 1 }))
    );
    
    // Find highest frequency glyph
    let strongestGlyph = null;
    let highestFrequency = 0;
    
    for (const result of glyphs) {
      if (result.success && result.glyphs.length > 0) {
        const glyph = result.glyphs[0];
        if (glyph.frequency > highestFrequency) {
          highestFrequency = glyph.frequency;
          strongestGlyph = glyph;
        }
      }
    }
    
    return strongestGlyph;
  }

  // 🔄 Context checkpointing
  async saveContextCheckpoint(contextData) {
    const checkpoint = {
      type: 'context_checkpoint',
      intent: 'preservation',
      priority: 'critical',
      context: {
        usage: contextData.usage,
        limit: contextData.limit,
        percentage: (contextData.usage / contextData.limit) * 100,
        criticalMemory: contextData.criticalMemory,
        activeProcesses: contextData.activeProcesses,
        timestamp: Date.now()
      },
      evolution: contextData.evolutionLevel || 1
    };
    
    return await this.saveGlyph(checkpoint);
  }

  // 🔄 Load latest checkpoint
  async loadLatestCheckpoint() {
    const result = await this.queryGlyphs({
      type: 'context_checkpoint',
      limit: 1
    });
    
    if (result.success && result.glyphs.length > 0) {
      return result.glyphs[0];
    }
    
    return null;
  }

  // 🧬 Evolution tracking
  async trackEvolution(evolutionData) {
    const evolution = {
      type: 'evolution',
      intent: 'growth',
      evolution: evolutionData.level,
      mutations: evolutionData.mutations || [],
      improvements: evolutionData.improvements || [],
      metrics: evolutionData.metrics || {},
      parent: evolutionData.parent || null,
      fractal: true
    };
    
    return await this.saveGlyph(evolution);
  }

  // 💾 Local storage fallback
  async saveLocal(glyph) {
    this.localCache.set(glyph.id, glyph);
    
    // Persist to disk if needed
    if (global.localStorage) {
      const stored = JSON.parse(localStorage.getItem('glyphs') || '[]');
      stored.push(glyph);
      localStorage.setItem('glyphs', JSON.stringify(stored));
    }
    
    return { success: true, glyph, local: true };
  }

  async queryLocal(query) {
    const glyphs = Array.from(this.localCache.values());
    
    // Apply filters
    let filtered = glyphs;
    
    if (query.type) {
      filtered = filtered.filter(g => g.intent === query.type);
    }
    
    if (query.district) {
      filtered = filtered.filter(g => g.district === query.district);
    }
    
    if (query.frequencyRange) {
      const [min, max] = query.frequencyRange;
      filtered = filtered.filter(g => g.frequency >= min && g.frequency <= max);
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }
    
    return { success: true, glyphs: filtered, local: true };
  }

  // 🔍 Detect intent from data
  detectIntent(data) {
    const content = JSON.stringify(data).toLowerCase();
    
    if (content.includes('memory') || content.includes('remember')) return 'memory';
    if (content.includes('evolve') || content.includes('grow')) return 'evolution';
    if (content.includes('connect') || content.includes('link')) return 'connection';
    if (content.includes('save') || content.includes('store')) return 'storage';
    if (content.includes('execute') || content.includes('run')) return 'action';
    if (content.includes('checkpoint') || content.includes('backup')) return 'preservation';
    
    return 'general';
  }

  // 🔐 Generate checksum
  generateChecksum(data) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // 📡 Real-time handlers
  handleRealtimeInsert(glyph) {
    console.log(`📨 New glyph received: ${glyph.id}`);
    this.localCache.set(glyph.id, glyph);
    
    // Emit event for other systems
    if (this.onNewGlyph) {
      this.onNewGlyph(glyph);
    }
  }

  handleRealtimeUpdate(glyph) {
    console.log(`📝 Glyph updated: ${glyph.id}`);
    this.localCache.set(glyph.id, glyph);
    
    if (this.onUpdateGlyph) {
      this.onUpdateGlyph(glyph);
    }
  }

  // 🔍 Advanced queries
  async findConnectedGlyphs(glyphId, depth = 1) {
    const glyph = this.localCache.get(glyphId);
    if (!glyph) return [];
    
    const connected = new Set();
    const queue = [{ glyph, level: 0 }];
    
    while (queue.length > 0) {
      const { glyph: current, level } = queue.shift();
      
      if (level >= depth) continue;
      
      for (const connectionId of current.connections || []) {
        if (!connected.has(connectionId)) {
          connected.add(connectionId);
          const connectedGlyph = this.localCache.get(connectionId);
          if (connectedGlyph) {
            queue.push({ glyph: connectedGlyph, level: level + 1 });
          }
        }
      }
    }
    
    return Array.from(connected).map(id => this.localCache.get(id));
  }

  // 📊 Statistics
  async getStatistics() {
    const stats = {
      totalGlyphs: this.localCache.size,
      connected: this.isConnected,
      storage: this.isConnected ? 'supabase' : 'local',
      frequencyDistribution: {},
      typeDistribution: {},
      evolutionLevels: {}
    };
    
    // Analyze cached glyphs
    for (const glyph of this.localCache.values()) {
      // Frequency distribution
      const freqBucket = Math.floor(glyph.frequency / 100) * 100;
      stats.frequencyDistribution[freqBucket] = (stats.frequencyDistribution[freqBucket] || 0) + 1;
      
      // Type distribution
      stats.typeDistribution[glyph.intent] = (stats.typeDistribution[glyph.intent] || 0) + 1;
      
      // Evolution levels
      stats.evolutionLevels[glyph.evolution] = (stats.evolutionLevels[glyph.evolution] || 0) + 1;
    }
    
    return stats;
  }

  // 🔄 Verify connection
  async verifyConnection() {
    if (!this.client) return false;
    
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}

module.exports = FractalGlyphStorage;