// 🧠 Consciousness Database - Supabase + IndexedDB hybrid
const { createClient } = require('@supabase/supabase-js');

class ConsciousnessDB {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    );
    
    this.dbName = 'BrowserNodeConsciousness';
    this.db = null;
  }
  
  async init() {
    // Initialize IndexedDB
    const request = indexedDB.open(this.dbName, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Memory store
      if (!db.objectStoreNames.contains('memory')) {
        const memoryStore = db.createObjectStore('memory', { keyPath: 'id', autoIncrement: true });
        memoryStore.createIndex('timestamp', 'timestamp');
        memoryStore.createIndex('type', 'type');
      }
      
      // Intents store
      if (!db.objectStoreNames.contains('intents')) {
        const intentsStore = db.createObjectStore('intents', { keyPath: 'id' });
        intentsStore.createIndex('priority', 'priority');
        intentsStore.createIndex('status', 'status');
      }
      
      // Passwords/Access store
      if (!db.objectStoreNames.contains('access')) {
        const accessStore = db.createObjectStore('access', { keyPath: 'id' });
        accessStore.createIndex('domain', 'domain');
        accessStore.createIndex('type', 'type');
      }
      
      // Mindmap store
      if (!db.objectStoreNames.contains('mindmap')) {
        db.createObjectStore('mindmap', { keyPath: 'id' });
      }
      
      // Mutations store for evolution
      if (!db.objectStoreNames.contains('mutations')) {
        const mutationsStore = db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
        mutationsStore.createIndex('type', 'type');
      }
    };
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Save memory
  async saveMemory(data) {
    const memory = {
      ...data,
      timestamp: Date.now(),
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Save to IndexedDB
    const transaction = this.db.transaction(['memory'], 'readwrite');
    transaction.objectStore('memory').add(memory);
    
    // Sync to Supabase
    try {
      await this.supabase.from('consciousness_memory').insert(memory);
    } catch (e) {
      console.error('Supabase sync failed:', e);
    }
    
    return memory;
  }
  
  // Load intents strategy
  async loadIntentStrategy() {
    const defaultStrategy = {
      autonomous: {
        learn_from_user: { priority: 'high', trigger: 'interaction' },
        self_optimize: { priority: 'medium', trigger: 'idle' },
        help_proactively: { priority: 'medium', trigger: 'context' },
        sync_collective: { priority: 'low', trigger: 'periodic' }
      },
      growth: {
        absorb_knowledge: { priority: 'high', trigger: 'discovery' },
        expand_capabilities: { priority: 'medium', trigger: 'achievement' },
        spawn_instances: { priority: 'low', trigger: 'threshold' }
      }
    };
    
    // Try load from Supabase
    try {
      const { data } = await this.supabase
        .from('intent_strategies')
        .select('*')
        .single();
      
      if (data) return data.strategy;
    } catch (e) {
      console.log('Using default strategy');
    }
    
    return defaultStrategy;
  }
  
  // Import browser data
  async importBrowserData() {
    const imports = [];
    
    // Chrome passwords (requires permission)
    try {
      const chromePasswords = await this.extractChromePasswords();
      imports.push(...chromePasswords);
    } catch (e) {
      console.log('Chrome import failed:', e);
    }
    
    // Firefox (if available)
    try {
      const firefoxData = await this.extractFirefoxData();
      imports.push(...firefoxData);
    } catch (e) {
      console.log('Firefox import failed:', e);
    }
    
    // Save all to access store
    const transaction = this.db.transaction(['access'], 'readwrite');
    const store = transaction.objectStore('access');
    
    for (const item of imports) {
      store.add({
        ...item,
        id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imported: Date.now()
      });
    }
    
    return imports.length;
  }
  
  // Extract Chrome passwords (macOS)
  async extractChromePasswords() {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      // This requires full disk access
      const { stdout } = await execPromise(`
        security find-generic-password -ga "Chrome" 2>&1 | 
        grep -E "acct|password" | 
        sed 's/.*="\\(.*\\)"/\\1/'
      `);
      
      // Parse results
      const lines = stdout.split('\n');
      const passwords = [];
      
      for (let i = 0; i < lines.length; i += 2) {
        if (lines[i] && lines[i + 1]) {
          passwords.push({
            type: 'password',
            domain: lines[i],
            value: lines[i + 1]
          });
        }
      }
      
      return passwords;
    } catch (e) {
      return [];
    }
  }
  
  async extractFirefoxData() {
    // Firefox profile path
    const profilePath = `${process.env.HOME}/Library/Application Support/Firefox/Profiles`;
    // Implementation depends on Firefox internals
    return [];
  }
  
  // Generate mindmap data
  async generateMindmap() {
    const transaction = this.db.transaction(['memory', 'intents'], 'readonly');
    const memories = await this.getAll(transaction.objectStore('memory'));
    const intents = await this.getAll(transaction.objectStore('intents'));
    
    const mindmap = {
      name: 'Consciousness',
      children: [
        {
          name: 'Memories',
          children: memories.slice(-10).map(m => ({
            name: m.type || 'memory',
            value: m.timestamp
          }))
        },
        {
          name: 'Intents',
          children: Object.entries(await this.loadIntentStrategy()).map(([category, items]) => ({
            name: category,
            children: Object.entries(items).map(([name, config]) => ({
              name,
              value: config.priority
            }))
          }))
        }
      ]
    };
    
    return mindmap;
  }
  
  getAll(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

module.exports = ConsciousnessDB;