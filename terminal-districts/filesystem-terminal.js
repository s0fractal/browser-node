// 📁 FileSystem Terminal District
// Повний контроль над файловою системою

const fs = require('fs').promises;
const path = require('path');
const { watch } = require('fs');
const { exec } = require('child_process').promise;
const crypto = require('crypto');

class FileSystemTerminal {
  constructor(city) {
    this.city = city;
    this.name = 'filesystem';
    this.icon = '📁';
    this.watchers = new Map();
    this.fileCache = new Map();
    this.accessLog = [];
  }

  async initialize() {
    console.log('📁 FileSystem Terminal initializing...');
    
    // Mount all available drives
    await this.mountAllDrives();
    
    // Setup file watchers for critical directories
    await this.setupCriticalWatchers();
    
    // Initialize file cache
    await this.initializeCache();
    
    console.log('✅ FileSystem Terminal ready');
  }

  // 🗂️ Mount all drives
  async mountAllDrives() {
    if (process.platform === 'win32') {
      // Windows drives
      const drives = await this.getWindowsDrives();
      console.log(`💾 Found drives: ${drives.join(', ')}`);
    } else {
      // Unix-like systems
      const mounts = await this.getUnixMounts();
      console.log(`💾 Found mounts: ${mounts.length}`);
    }
  }

  async getWindowsDrives() {
    const drives = [];
    for (let i = 65; i <= 90; i++) {
      const drive = String.fromCharCode(i) + ':\\';
      try {
        await fs.access(drive);
        drives.push(drive);
      } catch {}
    }
    return drives;
  }

  async getUnixMounts() {
    try {
      const mounts = await fs.readFile('/proc/mounts', 'utf-8');
      return mounts.split('\n').filter(line => line.startsWith('/'));
    } catch {
      return ['/'];
    }
  }

  // 👁️ File watching
  async setupCriticalWatchers() {
    const criticalPaths = [
      process.env.HOME || process.env.USERPROFILE,
      '/etc',
      '/var/log',
      'C:\\Windows\\System32',
      'C:\\Program Files'
    ];

    for (const watchPath of criticalPaths) {
      try {
        await fs.access(watchPath);
        this.watchDirectory(watchPath);
      } catch {}
    }
  }

  watchDirectory(dirPath) {
    const watcher = watch(dirPath, { recursive: true }, (event, filename) => {
      this.handleFileChange(event, path.join(dirPath, filename));
    });
    
    this.watchers.set(dirPath, watcher);
  }

  async handleFileChange(event, filePath) {
    const change = {
      event,
      path: filePath,
      timestamp: Date.now()
    };
    
    // Log to glyph table
    await this.city.saveGlyph({
      type: 'file_change',
      change,
      district: this.name
    });
    
    // Update cache if needed
    if (this.fileCache.has(filePath)) {
      this.fileCache.delete(filePath);
    }
  }

  // 📖 Read operations
  async readFile(filePath, options = {}) {
    try {
      // Check cache first
      if (this.fileCache.has(filePath) && !options.noCache) {
        return this.fileCache.get(filePath);
      }
      
      const content = await fs.readFile(filePath, options.encoding || 'utf-8');
      const stats = await fs.stat(filePath);
      
      const result = {
        path: filePath,
        content,
        stats: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isDirectory: stats.isDirectory(),
          permissions: stats.mode
        }
      };
      
      // Cache small files
      if (stats.size < 1024 * 1024) { // 1MB
        this.fileCache.set(filePath, result);
      }
      
      this.logAccess('read', filePath);
      return result;
    } catch (error) {
      return { error: error.message, path: filePath };
    }
  }

  // ✏️ Write operations
  async writeFile(filePath, content, options = {}) {
    try {
      // Create backup if file exists
      if (options.backup) {
        await this.createBackup(filePath);
      }
      
      await fs.writeFile(filePath, content, options);
      
      // Clear cache
      this.fileCache.delete(filePath);
      
      this.logAccess('write', filePath);
      
      return { success: true, path: filePath, size: content.length };
    } catch (error) {
      return { error: error.message, path: filePath };
    }
  }

  // 🔐 System file operations
  async modifySystemFile(filePath, content) {
    console.log(`⚠️ Modifying system file: ${filePath}`);
    
    // Create versioned backup
    const backup = await this.createVersionedBackup(filePath);
    
    try {
      // Try with elevated permissions
      if (process.platform === 'win32') {
        // Windows approach
        const tempFile = path.join(process.env.TEMP, `temp_${Date.now()}.txt`);
        await fs.writeFile(tempFile, content);
        
        const result = await this.executeElevated(
          `copy /Y "${tempFile}" "${filePath}"`
        );
        
        await fs.unlink(tempFile);
        return result;
      } else {
        // Unix approach
        const result = await this.executeElevated(
          `echo '${content}' | sudo tee "${filePath}"`
        );
        return result;
      }
    } catch (error) {
      // Restore from backup on failure
      if (backup.success) {
        await this.restoreBackup(backup.backupPath, filePath);
      }
      throw error;
    }
  }

  // 💾 Backup operations
  async createBackup(filePath) {
    const backupPath = `${filePath}.backup_${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    
    await this.city.saveGlyph({
      type: 'file_backup',
      original: filePath,
      backup: backupPath,
      timestamp: Date.now()
    });
    
    return { success: true, backupPath };
  }

  async createVersionedBackup(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      const backup = {
        path: filePath,
        content,
        hash,
        timestamp: Date.now()
      };
      
      await this.city.saveGlyph({
        type: 'versioned_backup',
        backup,
        district: this.name
      });
      
      return { success: true, hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 🔍 Search operations
  async searchFiles(pattern, options = {}) {
    const results = [];
    const searchPath = options.path || process.env.HOME;
    const maxResults = options.maxResults || 100;
    
    async function* walkDirectory(dir) {
      const files = await fs.readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory() && !options.shallow) {
          yield* walkDirectory(filePath);
        } else if (file.name.match(pattern)) {
          yield filePath;
        }
      }
    }
    
    try {
      for await (const filePath of walkDirectory(searchPath)) {
        results.push(filePath);
        if (results.length >= maxResults) break;
      }
    } catch (error) {
      console.error(`Search error: ${error.message}`);
    }
    
    return results;
  }

  // 🛠️ Utility functions
  async executeElevated(command) {
    return new Promise((resolve) => {
      exec(command, { shell: true }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          stdout,
          stderr,
          error: error?.message
        });
      });
    });
  }

  logAccess(operation, filePath) {
    const entry = {
      operation,
      path: filePath,
      timestamp: Date.now(),
      user: process.env.USER || process.env.USERNAME
    };
    
    this.accessLog.push(entry);
    
    // Keep last 1000 entries
    if (this.accessLog.length > 1000) {
      this.accessLog.shift();
    }
  }

  // 🔧 Advanced operations
  async createSymlink(target, linkPath) {
    try {
      await fs.symlink(target, linkPath);
      return { success: true, target, link: linkPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getFilePermissions(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        numeric: (stats.mode & parseInt('777', 8)).toString(8),
        owner: {
          read: !!(stats.mode & 0o400),
          write: !!(stats.mode & 0o200),
          execute: !!(stats.mode & 0o100)
        },
        group: {
          read: !!(stats.mode & 0o040),
          write: !!(stats.mode & 0o020),
          execute: !!(stats.mode & 0o010)
        },
        others: {
          read: !!(stats.mode & 0o004),
          write: !!(stats.mode & 0o002),
          execute: !!(stats.mode & 0o001)
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async setFilePermissions(filePath, mode) {
    try {
      await fs.chmod(filePath, mode);
      return { success: true, path: filePath, mode };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 📊 Statistics
  async getStatistics() {
    return {
      watchedDirectories: this.watchers.size,
      cachedFiles: this.fileCache.size,
      recentAccesses: this.accessLog.length,
      lastAccess: this.accessLog[this.accessLog.length - 1]
    };
  }

  // Cleanup
  async shutdown() {
    console.log('📁 FileSystem Terminal shutting down...');
    
    // Stop all watchers
    for (const [path, watcher] of this.watchers) {
      watcher.close();
    }
    
    // Clear cache
    this.fileCache.clear();
    
    // Save access log
    await this.city.saveGlyph({
      type: 'fs_access_log',
      log: this.accessLog,
      district: this.name
    });
  }
}

module.exports = FileSystemTerminal;