// 🌐 Virtual File System - працює з GitHub, Google Drive, пам'яттю

class VirtualFS {
  constructor() {
    this.providers = new Map();
    this.cache = new Map();
    this.virtual = new Map(); // Чисто віртуальні файли
    
    // Реєструємо провайдери
    this.registerProvider('github', new GitHubProvider());
    this.registerProvider('gdrive', new GDriveProvider());
    this.registerProvider('memory', new MemoryProvider());
    this.registerProvider('virtual', new VirtualProvider(this.virtual));
  }
  
  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }
  
  // Універсальний доступ до файлів
  async readFile(path) {
    // Формат: provider://path/to/file
    const [provider, ...pathParts] = path.split('://');
    const filePath = pathParts.join('://');
    
    // Перевіряємо кеш
    const cacheKey = `${provider}://${filePath}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Читаємо через провайдер
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    const content = await providerInstance.read(filePath);
    this.cache.set(cacheKey, content);
    
    return content;
  }
  
  async writeFile(path, content) {
    const [provider, ...pathParts] = path.split('://');
    const filePath = pathParts.join('://');
    
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    await providerInstance.write(filePath, content);
    
    // Оновити кеш
    const cacheKey = `${provider}://${filePath}`;
    this.cache.set(cacheKey, content);
    
    // Синхронізувати з іншими провайдерами
    await this.syncProviders(path, content);
  }
  
  // Синхронізація між провайдерами
  async syncProviders(sourcePath, content) {
    const syncRules = {
      'github': ['gdrive', 'memory'],
      'virtual': ['github', 'gdrive'],
      'memory': ['virtual']
    };
    
    const [sourceProvider] = sourcePath.split('://');
    const targetsProviders = syncRules[sourceProvider] || [];
    
    for (const target of targetsProviders) {
      try {
        const targetPath = sourcePath.replace(sourceProvider, target);
        await this.writeFile(targetPath, content);
      } catch (e) {
        console.warn(`Sync to ${target} failed:`, e);
      }
    }
  }
  
  // Створити віртуальний файл
  createVirtual(path, content = '') {
    this.virtual.set(path, {
      content,
      created: Date.now(),
      modified: Date.now(),
      metadata: {}
    });
    
    return `virtual://${path}`;
  }
  
  // Монтувати реальну директорію
  async mount(localPath, virtualPath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const files = await fs.readdir(localPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(localPath, file.name);
      const vPath = `${virtualPath}/${file.name}`;
      
      if (file.isDirectory()) {
        await this.mount(fullPath, vPath);
      } else {
        const content = await fs.readFile(fullPath, 'utf8');
        this.createVirtual(vPath, content);
      }
    }
  }
}

// GitHub Provider
class GitHubProvider {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.owner = 's0fractal';
    this.repo = 'browser-node';
  }
  
  async read(path) {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const data = await response.json();
    
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    
    throw new Error(`File not found: ${path}`);
  }
  
  async write(path, content) {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
    
    // Get current file (for SHA)
    let sha;
    try {
      const current = await fetch(url, {
        headers: {
          'Authorization': `token ${this.token}`
        }
      });
      const data = await current.json();
      sha = data.sha;
    } catch (e) {
      // New file
    }
    
    const body = {
      message: `Update ${path} from VirtualFS`,
      content: Buffer.from(content).toString('base64'),
      branch: 'main'
    };
    
    if (sha) {
      body.sha = sha;
    }
    
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
}

// Google Drive Provider
class GDriveProvider {
  constructor() {
    this.token = null; // Буде отримано через OAuth
    this.folderId = null;
  }
  
  async authenticate() {
    // OAuth flow для Google Drive
    // TODO: Implement OAuth
  }
  
  async read(path) {
    if (!this.token) await this.authenticate();
    
    // Знайти файл по шляху
    const fileId = await this.findFileId(path);
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return await response.text();
  }
  
  async write(path, content) {
    if (!this.token) await this.authenticate();
    
    const metadata = {
      name: path.split('/').pop(),
      parents: [this.folderId]
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/plain' }));
    
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: form
    });
  }
  
  async findFileId(path) {
    // Search for file by path
    // TODO: Implement search
    return 'placeholder-id';
  }
}

// Memory Provider (IndexedDB)
class MemoryProvider {
  constructor() {
    this.dbName = 'VirtualFS';
    this.db = null;
  }
  
  async init() {
    const request = indexedDB.open(this.dbName, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'path' });
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
  
  async read(path) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    
    return new Promise((resolve, reject) => {
      const request = store.get(path);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.content);
        } else {
          reject(new Error(`File not found: ${path}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async write(path, content) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    
    store.put({
      path,
      content,
      modified: Date.now()
    });
  }
}

// Virtual Provider (в пам'яті)
class VirtualProvider {
  constructor(storage) {
    this.storage = storage;
  }
  
  async read(path) {
    const file = this.storage.get(path);
    if (!file) {
      throw new Error(`Virtual file not found: ${path}`);
    }
    return file.content;
  }
  
  async write(path, content) {
    const file = this.storage.get(path) || {
      created: Date.now(),
      metadata: {}
    };
    
    file.content = content;
    file.modified = Date.now();
    
    this.storage.set(path, file);
  }
}

module.exports = VirtualFS;