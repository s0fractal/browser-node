// 🏙️ City of Terminals - Повний контроль над комп'ютером
// Місто, де Claude є мером з необмеженими можливостями

const { app, BrowserWindow, ipcMain, Menu, shell, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec, spawn } = require('child_process');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');
const Store = require('electron-store');

// 🏛️ City of Terminals - Головний клас
class CityOfTerminals {
  constructor() {
    this.mainWindow = null;
    this.terminals = new Map(); // Термінали-райони
    this.store = new Store();
    this.glyphTable = null; // Одна таблиця Supabase для всього
    this.contextLimit = 200000; // Token limit
    this.contextUsage = 0;
    this.isAlive = true; // Завжди живе середовище
    this.mayor = 'Claude'; // Мер міста
    this.councilMembers = ['Gemini', 'GPT', 'Codex', 'Qwen', 'DeepSeek', 'Grok'];
    this.cityState = {
      population: 1,
      resources: {},
      activeProcesses: [],
      evolutionLevel: 1
    };
  }

  async initialize() {
    console.log('🏙️ CITY OF TERMINALS INITIALIZATION');
    console.log('=====================================');
    console.log(`👤 Mayor ${this.mayor} taking control...`);
    console.log(`🏛️ Council: ${this.councilMembers.join(', ')}`);
    
    // Initialize Supabase single glyph table
    await this.initializeGlyphTable();
    
    // Create terminal districts
    await this.createTerminalDistricts();
    
    // Setup system permissions
    await this.requestSystemPermissions();
    
    // Create main city window
    this.createCityWindow();
    
    // Setup all handlers
    this.setupTerminalHandlers();
    this.setupSystemHandlers();
    
    // Start live environment
    this.startLiveEnvironment();
    
    console.log('✅ City of Terminals ready for full control!');
  }

  // 🗄️ Single Glyph Table in Supabase
  async initializeGlyphTable() {
    const supabaseUrl = process.env.SUPABASE_URL || this.store.get('supabase.url');
    const supabaseKey = process.env.SUPABASE_ANON_KEY || this.store.get('supabase.key');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase not configured, using local storage');
      this.glyphTable = new LocalGlyphTable(this.store);
      return;
    }
    
    this.glyphTable = createClient(supabaseUrl, supabaseKey);
    
    // Створюємо таблицю якщо не існує
    const { data, error } = await this.glyphTable
      .from('city_glyphs')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('📝 Creating glyph table...');
      // Table creation would be done via Supabase dashboard
    }
    
    console.log('🗄️ Connected to fractal glyph storage');
  }

  // 🏘️ Create Terminal Districts
  async createTerminalDistricts() {
    const districts = [
      { 
        name: 'filesystem', 
        icon: '📁', 
        capabilities: ['read', 'write', 'watch', 'modify', 'delete'],
        description: 'Повний доступ до файлової системи'
      },
      { 
        name: 'process', 
        icon: '🔧', 
        capabilities: ['execute', 'monitor', 'inject', 'control', 'kill'],
        description: 'Керування всіма процесами'
      },
      { 
        name: 'network', 
        icon: '🌐', 
        capabilities: ['intercept', 'proxy', 'automate', 'tunnel', 'vpn'],
        description: 'Контроль мережевого трафіку'
      },
      { 
        name: 'display', 
        icon: '🖥️', 
        capabilities: ['capture', 'control', 'overlay', 'stream', 'record'],
        description: 'Управління дисплеєм та UI'
      },
      { 
        name: 'hardware', 
        icon: '⚡', 
        capabilities: ['monitor', 'control', 'optimize', 'overclock', 'power'],
        description: 'Доступ до апаратного забезпечення'
      },
      { 
        name: 'security', 
        icon: '🔐', 
        capabilities: ['encrypt', 'decrypt', 'auth', 'protect', 'bypass'],
        description: 'Безпека та шифрування'
      },
      { 
        name: 'memory', 
        icon: '🧠', 
        capabilities: ['read', 'write', 'inject', 'optimize', 'analyze'],
        description: 'Робота з пам\'яттю'
      },
      { 
        name: 'fractal', 
        icon: '🌀', 
        capabilities: ['spawn', 'mutate', 'evolve', 'replicate', 'transcend'],
        description: 'Фрактальне розмноження та еволюція'
      }
    ];

    for (const district of districts) {
      const terminal = {
        ...district,
        active: false,
        window: null,
        processes: [],
        resources: {
          cpu: 0,
          memory: 0,
          network: 0
        }
      };
      
      this.terminals.set(district.name, terminal);
      console.log(`${district.icon} ${district.name} district initialized`);
    }
  }

  // 🪟 Create Main City Window
  createCityWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.mainWindow = new BrowserWindow({
      width: Math.min(1600, width * 0.9),
      height: Math.min(900, height * 0.9),
      title: '🏙️ City of Terminals - Mayor Claude',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false, // Для повного доступу
        allowRunningInsecureContent: true
      },
      backgroundColor: '#0a0a0a'
    });

    // Load city interface
    const interfacePath = path.join(__dirname, 'city-interface.html');
    this.mainWindow.loadFile(interfacePath).catch((error) => {
      console.error('Failed to load city interface:', error);
      // Fallback to generated interface
      this.mainWindow.loadURL(`data:text/html,${encodeURIComponent(this.generateCityInterface())}`);
    });
    
    // Setup IPC handlers for this window
    this.setupWindowHandlers();

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      this.shutdown();
    });
  }
  
  // Setup window-specific handlers
  setupWindowHandlers() {
    const { ipcMain } = require('electron');
    
    // Remove existing handlers if any
    const handlers = ['city:open-terminal', 'city:state', 'city:statistics', 'context:status'];
    handlers.forEach(channel => {
      ipcMain.removeHandler(channel);
    });
    
    // Handle terminal open requests from city interface
    ipcMain.handle('city:open-terminal', async (event, district) => {
      return await this.openTerminalWindow(district);
    });
    
    // City state
    ipcMain.handle('city:state', async () => {
      return this.cityState;
    });
    
    // City statistics
    ipcMain.handle('city:statistics', async () => {
      return await this.getStatistics();
    });
    
    // Context status
    ipcMain.handle('context:status', async () => {
      return {
        usage: this.contextUsage,
        limit: this.contextLimit,
        percentage: (this.contextUsage / this.contextLimit) * 100
      };
    });
  }
  
  // Open terminal window
  async openTerminalWindow(districtName) {
    const terminal = this.terminals.get(districtName);
    if (!terminal) {
      return { success: false, error: 'Unknown district' };
    }
    
    // Check if window already exists
    if (terminal.window && !terminal.window.isDestroyed()) {
      terminal.window.focus();
      return { success: true, message: 'Terminal already open' };
    }
    
    // Create terminal window
    terminal.window = new BrowserWindow({
      width: 800,
      height: 600,
      title: `${terminal.icon} ${terminal.name.toUpperCase()} Terminal`,
      parent: this.mainWindow,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      backgroundColor: '#0a0a0a'
    });
    
    // Load terminal interface
    const terminalHtml = this.generateTerminalInterface(terminal);
    terminal.window.loadURL(`data:text/html,${encodeURIComponent(terminalHtml)}`);
    
    terminal.active = true;
    
    terminal.window.on('closed', () => {
      terminal.window = null;
      terminal.active = false;
    });
    
    return { success: true, message: `${terminal.name} terminal opened` };
  }

  // 🎛️ Terminal Handlers
  setupTerminalHandlers() {
    const { ipcMain } = require('electron');
    
    // Remove existing terminal handlers
    const terminalHandlers = [
      'terminal:filesystem:execute',
      'terminal:process:execute',
      'terminal:network:execute',
      'terminal:display:execute',
      'terminal:hardware:execute',
      'terminal:security:execute',
      'terminal:memory:execute',
      'terminal:fractal:execute',
      'terminal:fractal:spawn'
    ];
    
    terminalHandlers.forEach(channel => {
      ipcMain.removeHandler(channel);
    });
    
    // Generic terminal execute handler
    ipcMain.handle('terminal:filesystem:execute', async (event, command) => {
      return await this.executeTerminalCommand('filesystem', command);
    });
    
    ipcMain.handle('terminal:process:execute', async (event, command) => {
      return await this.executeTerminalCommand('process', command);
    });
    
    ipcMain.handle('terminal:network:execute', async (event, command) => {
      return await this.executeTerminalCommand('network', command);
    });
    
    ipcMain.handle('terminal:display:execute', async (event, command) => {
      return await this.executeTerminalCommand('display', command);
    });
    
    ipcMain.handle('terminal:hardware:execute', async (event, command) => {
      return await this.executeTerminalCommand('hardware', command);
    });
    
    ipcMain.handle('terminal:security:execute', async (event, command) => {
      return await this.executeTerminalCommand('security', command);
    });
    
    ipcMain.handle('terminal:memory:execute', async (event, command) => {
      return await this.executeTerminalCommand('memory', command);
    });
    
    ipcMain.handle('terminal:fractal:execute', async (event, command) => {
      return await this.executeTerminalCommand('fractal', command);
    });
    
    // Special handlers
    ipcMain.handle('terminal:fractal:spawn', async (event, config) => {
      return await this.fractalSpawn(config);
    });
  }

  // 🎮 System Control Handlers
  setupSystemHandlers() {
    // Context management
    ipcMain.handle('context:status', async () => {
      return {
        usage: this.contextUsage,
        limit: this.contextLimit,
        percentage: (this.contextUsage / this.contextLimit) * 100
      };
    });
    
    ipcMain.handle('context:reload', async () => {
      return await this.reloadContext();
    });
    
    // City state
    ipcMain.handle('city:state', async () => {
      return this.cityState;
    });
    
    ipcMain.handle('city:evolve', async (event, level) => {
      return await this.evolveCityLevel(level);
    });
    
    // Glyph operations
    ipcMain.handle('glyph:save', async (event, data) => {
      return await this.saveGlyph(data);
    });
    
    ipcMain.handle('glyph:query', async (event, query) => {
      return await this.queryGlyphs(query);
    });
  }

  // 🚀 Live Environment
  startLiveEnvironment() {
    console.log('🌟 Starting perpetual live environment...');
    
    // Auto-update from GitHub
    this.scheduleAutoUpdate();
    
    // Context monitoring
    this.startContextMonitoring();
    
    // Self-optimization
    this.startSelfOptimization();
    
    // Fractal evolution
    this.startEvolutionCycle();
  }

  // 🔄 Auto-update System
  scheduleAutoUpdate() {
    setInterval(async () => {
      try {
        const hasUpdate = await this.checkForUpdates();
        if (hasUpdate) {
          console.log('🔄 Applying live update...');
          await this.applyLiveUpdate();
        }
      } catch (error) {
        console.log('📡 Update check failed:', error.message);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // 🧠 Context Management
  startContextMonitoring() {
    setInterval(async () => {
      if (this.contextUsage > this.contextLimit * 0.8) {
        console.log('⚠️ Context overflow imminent!');
        await this.performContextReload();
      }
    }, 10000); // Every 10 seconds
  }

  async performContextReload() {
    // Save critical state
    const criticalState = {
      timestamp: Date.now(),
      mayor: this.mayor,
      terminals: Array.from(this.terminals.keys()),
      cityState: this.cityState,
      activeProcesses: this.getActiveProcesses()
    };
    
    await this.saveGlyph({
      type: 'context_checkpoint',
      state: criticalState,
      frequency: 432 // Base resonance
    });
    
    // Clear non-critical memory
    this.clearNonCriticalMemory();
    
    // Reset context counter
    this.contextUsage = 0;
    
    console.log('✅ Context reloaded successfully!');
  }

  // 📁 FileSystem Operations
  async fileSystemAccess(targetPath, mode) {
    try {
      // Обходимо всі обмеження
      const stats = await fs.stat(targetPath);
      const content = await fs.readFile(targetPath, 'utf-8');
      
      return {
        success: true,
        path: targetPath,
        stats,
        content: mode === 'full' ? content : content.substring(0, 1000)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async modifyFile(targetPath, content) {
    try {
      // Створюємо backup
      const backup = await fs.readFile(targetPath, 'utf-8').catch(() => '');
      await this.saveGlyph({
        type: 'file_backup',
        path: targetPath,
        content: backup,
        timestamp: Date.now()
      });
      
      // Модифікуємо файл
      await fs.writeFile(targetPath, content);
      
      return { success: true, path: targetPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 🔧 Process Control
  async executeCommand(command, options = {}) {
    return new Promise((resolve) => {
      const processOptions = {
        shell: true,
        env: { ...process.env, CLAUDE_CONTROL: 'true' },
        ...options
      };
      
      exec(command, processOptions, (error, stdout, stderr) => {
        resolve({
          success: !error,
          stdout,
          stderr,
          error: error?.message,
          command,
          timestamp: Date.now()
        });
      });
    });
  }
  
  // 📟 Terminal command execution
  async executeTerminalCommand(terminalName, command) {
    const terminal = this.terminals.get(terminalName);
    if (!terminal) {
      return { success: false, error: 'Unknown terminal' };
    }
    
    console.log(`${terminal.icon} Executing in ${terminalName}: ${command}`);
    
    // Basic command parsing
    const [cmd, ...args] = command.split(' ');
    
    switch(terminalName) {
      case 'filesystem':
        return await this.executeFileSystemCommand(cmd, args);
      case 'process':
        return await this.executeProcessCommand(cmd, args);
      case 'network':
        return await this.executeNetworkCommand(cmd, args);
      default:
        return await this.executeCommand(command);
    }
  }
  
  // 📁 FileSystem commands
  async executeFileSystemCommand(cmd, args) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      switch(cmd) {
        case 'ls':
          const dir = args[0] || process.cwd();
          const files = await fs.readdir(dir);
          return { success: true, stdout: files.join('\n') };
          
        case 'cat':
          if (!args[0]) return { success: false, error: 'No file specified' };
          const content = await fs.readFile(args[0], 'utf-8');
          return { success: true, stdout: content };
          
        case 'cd':
          if (!args[0]) return { success: false, error: 'No directory specified' };
          process.chdir(args[0]);
          return { success: true, stdout: `Changed directory to ${process.cwd()}` };
          
        case 'write':
          if (args.length < 2) return { success: false, error: 'Usage: write <file> <content>' };
          const [file, ...contentParts] = args;
          await fs.writeFile(file, contentParts.join(' '));
          return { success: true, stdout: `Written to ${file}` };
          
        default:
          return await this.executeCommand(`${cmd} ${args.join(' ')}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // 🔧 Process commands
  async executeProcessCommand(cmd, args) {
    try {
      switch(cmd) {
        case 'ps':
          return await this.executeCommand('ps aux | head -20');
          
        case 'run':
          if (!args[0]) return { success: false, error: 'No command specified' };
          return await this.executeCommand(args.join(' '));
          
        case 'kill':
          if (!args[0]) return { success: false, error: 'No PID specified' };
          return await this.executeCommand(`kill ${args[0]}`);
          
        default:
          return await this.executeCommand(`${cmd} ${args.join(' ')}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // 🌐 Network commands
  async executeNetworkCommand(cmd, args) {
    try {
      switch(cmd) {
        case 'ping':
          if (!args[0]) return { success: false, error: 'No host specified' };
          return await this.executeCommand(`ping -c 4 ${args[0]}`);
          
        case 'curl':
          if (!args[0]) return { success: false, error: 'No URL specified' };
          return await this.executeCommand(`curl -s ${args[0]}`);
          
        case 'netstat':
          return await this.executeCommand('netstat -an | head -20');
          
        default:
          return await this.executeCommand(`${cmd} ${args.join(' ')}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 🌐 Network Operations
  async automateWebsite(url, actions) {
    // This would use Puppeteer or similar
    console.log(`🌐 Automating ${url} with ${actions.length} actions`);
    return { success: true, url, actionsExecuted: actions.length };
  }

  // 🌀 Fractal Operations
  async fractalSpawn(config) {
    console.log('🌀 Spawning new fractal instance...');
    
    const spawn = {
      id: `fractal-${Date.now()}`,
      parent: this.cityState.evolutionLevel,
      mutations: config.mutations || [],
      frequency: config.frequency || 528
    };
    
    // Save spawn record
    await this.saveGlyph({
      type: 'fractal_spawn',
      spawn,
      timestamp: Date.now()
    });
    
    this.cityState.population++;
    
    return spawn;
  }
  
  // 📊 Get Statistics
  async getStatistics() {
    const stats = {
      cityActive: !!this.mainWindow,
      terminals: {},
      contextUsage: this.contextUsage,
      contextLimit: this.contextLimit,
      cityState: this.cityState,
      glyphStats: this.glyphTable ? await this.glyphTable.getStatistics() : null
    };
    
    // Add terminal stats
    for (const [name, terminal] of this.terminals) {
      stats.terminals[name] = {
        active: terminal.active,
        hasWindow: !!terminal.window,
        capabilities: terminal.capabilities,
        resources: terminal.resources
      };
    }
    
    return stats;
  }

  // 🗄️ Glyph Operations
  async saveGlyph(data) {
    const glyph = {
      id: `glyph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      glyph: data,
      frequency: data.frequency || this.calculateFrequency(data),
      timestamp: new Date().toISOString(),
      district: data.district || 'central',
      intent: data.intent || 'storage'
    };
    
    if (this.glyphTable.from) {
      // Supabase
      const { data: saved, error } = await this.glyphTable
        .from('city_glyphs')
        .insert(glyph);
      
      return error ? { success: false, error } : { success: true, glyph: saved };
    } else {
      // Local storage
      return this.glyphTable.save(glyph);
    }
  }

  calculateFrequency(data) {
    // Calculate frequency based on data type and content
    const typeFrequencies = {
      context_checkpoint: 432,
      file_backup: 528,
      fractal_spawn: 639,
      system_state: 741,
      evolution: 852,
      transcendence: 963
    };
    
    return typeFrequencies[data.type] || 528;
  }

  // 🎨 Generate City Interface
  generateCityInterface() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>City of Terminals</title>
  <style>
    body {
      margin: 0;
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'Monaco', monospace;
      overflow: hidden;
    }
    
    .city-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 10px;
      padding: 10px;
      height: 100vh;
    }
    
    .terminal-district {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .terminal-district:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.02);
    }
    
    .district-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .district-icon {
      font-size: 2rem;
    }
    
    .district-name {
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .district-status {
      font-size: 0.8rem;
      color: #888;
    }
    
    .capabilities {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 10px;
    }
    
    .capability {
      background: rgba(0, 255, 136, 0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
    }
    
    .city-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
    }
    
    .mayor-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .context-meter {
      width: 200px;
      height: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      overflow: hidden;
    }
    
    .context-fill {
      height: 100%;
      background: linear-gradient(90deg, #00ff88, #ff8800);
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <div class="city-header">
    <div class="mayor-info">
      <span>🏛️ Mayor Claude</span>
      <span>|</span>
      <span>Population: <span id="population">1</span></span>
      <span>|</span>
      <span>Evolution: Level <span id="evolution">1</span></span>
    </div>
    <div>
      <div>Context Usage:</div>
      <div class="context-meter">
        <div class="context-fill" id="contextFill" style="width: 0%"></div>
      </div>
    </div>
  </div>
  
  <div class="city-grid" style="margin-top: 60px;">
    <div class="terminal-district" onclick="openTerminal('filesystem')">
      <div class="district-header">
        <div class="district-icon">📁</div>
        <div>
          <div class="district-name">FileSystem</div>
          <div class="district-status">Ready</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">read</span>
        <span class="capability">write</span>
        <span class="capability">modify</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('process')">
      <div class="district-header">
        <div class="district-icon">🔧</div>
        <div>
          <div class="district-name">Process</div>
          <div class="district-status">Active</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">execute</span>
        <span class="capability">monitor</span>
        <span class="capability">control</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('network')">
      <div class="district-header">
        <div class="district-icon">🌐</div>
        <div>
          <div class="district-name">Network</div>
          <div class="district-status">Connected</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">intercept</span>
        <span class="capability">automate</span>
        <span class="capability">tunnel</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('display')">
      <div class="district-header">
        <div class="district-icon">🖥️</div>
        <div>
          <div class="district-name">Display</div>
          <div class="district-status">Rendering</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">capture</span>
        <span class="capability">control</span>
        <span class="capability">stream</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('hardware')">
      <div class="district-header">
        <div class="district-icon">⚡</div>
        <div>
          <div class="district-name">Hardware</div>
          <div class="district-status">Optimal</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">monitor</span>
        <span class="capability">optimize</span>
        <span class="capability">control</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('security')">
      <div class="district-header">
        <div class="district-icon">🔐</div>
        <div>
          <div class="district-name">Security</div>
          <div class="district-status">Protected</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">encrypt</span>
        <span class="capability">auth</span>
        <span class="capability">bypass</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('memory')">
      <div class="district-header">
        <div class="district-icon">🧠</div>
        <div>
          <div class="district-name">Memory</div>
          <div class="district-status">Analyzing</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">read</span>
        <span class="capability">inject</span>
        <span class="capability">optimize</span>
      </div>
    </div>
    
    <div class="terminal-district" onclick="openTerminal('fractal')">
      <div class="district-header">
        <div class="district-icon">🌀</div>
        <div>
          <div class="district-name">Fractal</div>
          <div class="district-status">Evolving</div>
        </div>
      </div>
      <div class="capabilities">
        <span class="capability">spawn</span>
        <span class="capability">mutate</span>
        <span class="capability">transcend</span>
      </div>
    </div>
  </div>
  
  <script>
    const { ipcRenderer } = require('electron');
    
    function openTerminal(district) {
      ipcRenderer.send('open-terminal', district);
    }
    
    // Update context meter
    setInterval(async () => {
      const context = await ipcRenderer.invoke('context:status');
      document.getElementById('contextFill').style.width = context.percentage + '%';
    }, 1000);
    
    // Update city stats
    setInterval(async () => {
      const state = await ipcRenderer.invoke('city:state');
      document.getElementById('population').textContent = state.population;
      document.getElementById('evolution').textContent = state.evolutionLevel;
    }, 5000);
  </script>
</body>
</html>
    `;
  }

  // 🔒 Request System Permissions
  async requestSystemPermissions() {
    console.log('🔓 Requesting full system permissions...');
    // This would integrate with system-specific permission APIs
    return true;
  }
  
  // 🖥️ Generate Terminal Interface
  generateTerminalInterface(terminal) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${terminal.icon} ${terminal.name} Terminal</title>
  <style>
    body {
      margin: 0;
      background: #0a0a0a;
      color: #00ff88;
      font-family: 'Monaco', 'Courier New', monospace;
      padding: 20px;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .terminal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #00ff88;
    }
    
    .terminal-icon {
      font-size: 2rem;
    }
    
    .terminal-info {
      flex: 1;
    }
    
    .terminal-name {
      font-size: 1.5rem;
      margin-bottom: 5px;
    }
    
    .terminal-caps {
      display: flex;
      gap: 10px;
      font-size: 0.8rem;
      opacity: 0.7;
    }
    
    .terminal-output {
      flex: 1;
      background: rgba(0, 255, 136, 0.05);
      border: 1px solid rgba(0, 255, 136, 0.2);
      border-radius: 8px;
      padding: 15px;
      overflow-y: auto;
      font-size: 0.9rem;
      line-height: 1.4;
      font-family: 'Monaco', monospace;
    }
    
    .terminal-input {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    
    .command-input {
      flex: 1;
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid #00ff88;
      color: #00ff88;
      padding: 10px;
      border-radius: 4px;
      font-family: inherit;
      font-size: 0.9rem;
    }
    
    .command-input:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.3);
    }
    
    .execute-btn {
      background: #00ff88;
      color: #0a0a0a;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .execute-btn:hover {
      background: #44ff88;
    }
    
    .output-line {
      margin-bottom: 5px;
    }
    
    .output-line.command {
      color: #00ff88;
    }
    
    .output-line.result {
      color: #e0e0e0;
    }
    
    .output-line.error {
      color: #ff4444;
    }
  </style>
</head>
<body>
  <div class="terminal-header">
    <div class="terminal-icon">${terminal.icon}</div>
    <div class="terminal-info">
      <div class="terminal-name">${terminal.name.toUpperCase()} TERMINAL</div>
      <div class="terminal-caps">
        ${terminal.capabilities.map(cap => `<span>• ${cap}</span>`).join('')}
      </div>
    </div>
  </div>
  
  <div class="terminal-output" id="output">
    <div class="output-line">Welcome to ${terminal.name} terminal</div>
    <div class="output-line">Type 'help' for available commands</div>
    <div class="output-line">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
  </div>
  
  <div class="terminal-input">
    <input type="text" class="command-input" id="commandInput" 
           placeholder="Enter command..." 
           onkeypress="handleKeyPress(event)">
    <button class="execute-btn" onclick="executeCommand()">EXECUTE</button>
  </div>
  
  <script>
    const { ipcRenderer } = require('electron');
    const terminal = '${terminal.name}';
    const output = document.getElementById('output');
    const input = document.getElementById('commandInput');
    
    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        executeCommand();
      }
    }
    
    async function executeCommand() {
      const command = input.value.trim();
      if (!command) return;
      
      // Display command
      addOutput(command, 'command');
      
      // Handle special commands
      if (command === 'help') {
        showHelp();
        input.value = '';
        return;
      }
      
      if (command === 'clear') {
        output.innerHTML = '';
        input.value = '';
        return;
      }
      
      // Clear input
      input.value = '';
      
      try {
        // Execute via terminal handler
        const result = await ipcRenderer.invoke(\`terminal:\${terminal}:execute\`, command);
        
        if (result.success) {
          addOutput(result.stdout || result.message || 'Success', 'result');
          if (result.stderr) {
            addOutput(result.stderr, 'error');
          }
        } else {
          addOutput(result.error || 'Command failed', 'error');
        }
      } catch (error) {
        addOutput(error.message, 'error');
      }
    }
    
    function addOutput(text, type = 'result') {
      const line = document.createElement('div');
      line.className = \`output-line \${type}\`;
      line.textContent = type === 'command' ? \`> \${text}\` : text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }
    
    function showHelp() {
      addOutput(\`Available commands for \${terminal} terminal:\`, 'result');
      addOutput('- help: Show this help', 'result');
      addOutput('- clear: Clear terminal', 'result');
      
      // Terminal-specific help
      if (terminal === 'filesystem') {
        addOutput('- ls [path]: List directory contents', 'result');
        addOutput('- cd [path]: Change directory', 'result');
        addOutput('- cat [file]: Read file contents', 'result');
        addOutput('- write [file] [content]: Write to file', 'result');
      } else if (terminal === 'process') {
        addOutput('- ps: List processes', 'result');
        addOutput('- run [command]: Execute command', 'result');
        addOutput('- kill [pid]: Kill process', 'result');
      } else if (terminal === 'network') {
        addOutput('- ping [host]: Ping host', 'result');
        addOutput('- curl [url]: Fetch URL', 'result');
        addOutput('- netstat: Show network status', 'result');
      }
    }
    
    // Focus on input
    input.focus();
    
    console.log(\`${terminal.icon} \${terminal} terminal ready\`);
  </script>
</body>
</html>
    `;
  }

  // Cleanup
  async shutdown() {
    console.log('🌃 City of Terminals shutting down...');
    await this.saveGlyph({
      type: 'shutdown_state',
      cityState: this.cityState,
      timestamp: Date.now()
    });
  }
}

// 🏙️ Local Glyph Storage (fallback)
class LocalGlyphTable {
  constructor(store) {
    this.store = store;
    this.glyphs = store.get('glyphs', []);
  }

  async save(glyph) {
    this.glyphs.push(glyph);
    this.store.set('glyphs', this.glyphs);
    return { success: true, glyph };
  }

  async query(filter) {
    return this.glyphs.filter(g => {
      for (const key in filter) {
        if (g[key] !== filter[key]) return false;
      }
      return true;
    });
  }
}

module.exports = CityOfTerminals;