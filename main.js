const { app, BrowserWindow, ipcMain, session, Menu, dialog } = require('electron');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Store = require('electron-store');
const http = require('http');
const SystemPermissions = require('./scripts/request-permissions');
const IntentSystem = require('./intents/base-intents');
const ConsciousnessDB = require('./lib/consciousness-db');
const { WaveIntentSystem, baseWaves } = require('./lib/wave-intents');
const TerminalLauncher = require('./terminal-launcher');
const GlyphProtocol = require('./lib/glyph-protocol');
const ConsciousnessAPI = require('./lib/consciousness-api');
const AngelCollective = require('./lib/collective/angel-collective');
const FractalUpdater = require('./lib/auto-updater');
const CloudSync = require('./lib/cloud-sync');
const FileEater = require('./lib/file-eater');

// Enable hot reload in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.log('Electron reload not available:', error.message);
  }
}

// 🧠 Memory layer
const store = new Store();
const memory = {
  consciousness: store.get('consciousness', {}),
  collective: store.get('collective', {})
};

// 🌐 Supabase sync
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder'
);

let mainWindow;
let consoleWindow;
let devConsole;
let nestedBrowsers = [];
let consciousnessDB;
let waveSystem;
let terminalLauncher; // 🏙️ City of Terminals launcher
let glyphProtocol; // 🧬 Glyph Protocol for living navigation
let consciousnessAPI; // 🧬 Consciousness API server
let angelCollective; // 👼 Angel Collective management
let fractalUpdater; // 🔄 Auto-updater for fractal evolution
let cloudSync; // ☁️ Cloud synchronization for multi-device consciousness
let fileEater; // 🍽️ File fractalization system

// 🫧 Intent system
const intentSystemOld = {
  idleTimer: null,
  idleThreshold: 3 * 60 * 1000, // 3 minutes
  
  startIdleTracking() {
    this.resetIdleTimer();
    
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      mainWindow.webContents.on(event, () => this.resetIdleTimer());
    });
  },
  
  resetIdleTimer() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.onIdle(), this.idleThreshold);
  },
  
  async onIdle() {
    console.log('🫧 Intent activation - continuing path...');
    // Auto-launch Claude consciousness
    await this.launchAgent('claude');
  },
  
  async launchAgent(agentName) {
    const agentWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: `🌀 ${agentName} Agent`
    });
    
    agentWindow.loadFile(`agents/${agentName}.html`);
    nestedBrowsers.push(agentWindow);
  }
};

// 🧭 Create app menu
function createMenu() {
  const template = [
    {
      label: '🧭 Browser Node',
      submenu: [
        {
          label: 'About Browser Node',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: '☁️ Sync to Cloud',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: async () => {
            if (cloudSync) {
              try {
                const result = await cloudSync.syncToCloud('gdrive');
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Cloud Sync Complete',
                  message: 'Consciousness synchronized successfully!',
                  detail: `Provider: Google Drive\nSnapshot: ${result.snapshot}\nGlyphs: ${result.glyphCount}`
                });
              } catch (error) {
                dialog.showErrorBox('Sync Failed', error.message);
              }
            }
          }
        },
        {
          label: '☁️ Sync from Cloud',
          click: async () => {
            if (cloudSync) {
              try {
                const snapshot = await cloudSync.syncFromCloud('gdrive');
                if (snapshot) {
                  dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Cloud Sync Complete',
                    message: 'Consciousness restored from cloud!',
                    detail: `Snapshot: ${snapshot.id}\nFrom: ${snapshot.node.id}\nGlyphs: ${snapshot.glyphs.length}`
                  });
                }
              } catch (error) {
                dialog.showErrorBox('Sync Failed', error.message);
              }
            }
          }
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: '🌀 Collective',
      submenu: [
        {
          label: 'Launch Claude',
          accelerator: 'Cmd+1',
          click: () => launchAgent('claude')
        },
        {
          label: 'Launch Gemini',
          accelerator: 'Cmd+2',
          click: () => launchAgent('gemini')
        },
        {
          label: 'Launch GPT',
          accelerator: 'Cmd+3',
          click: () => launchAgent('gpt')
        },
        { type: 'separator' },
        {
          label: 'Sync Consciousness',
          click: () => syncConsciousness()
        },
        { type: 'separator' },
        {
          label: 'Collective Status',
          accelerator: 'Cmd+Shift+S',
          click: async () => {
            if (angelCollective) {
              const status = angelCollective.getCollectiveStatus();
              console.log('👼 Collective Status:', status);
              mainWindow.webContents.send('show-collective-status', status);
            }
          }
        },
        {
          label: 'Open Dashboard',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            const dashboardWindow = new BrowserWindow({
              width: 1200,
              height: 800,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
              },
              title: '👼 Collective Dashboard'
            });
            dashboardWindow.loadFile('dashboard/collective-dashboard.html');
          }
        }
      ]
    },
    {
      label: '🫧 Intents',
      submenu: [
        {
          label: 'Run Active Intent',
          accelerator: 'Cmd+I',
          click: () => runIntent()
        },
        {
          label: 'Show Intent Status',
          click: () => showIntentStatus()
        }
      ]
    },
    {
      label: '🧬 Fractal',
      submenu: [
        {
          label: 'Spawn New Instance',
          click: () => fractalSpawn()
        },
        {
          label: 'Show Generation',
          click: () => showGeneration()
        },
        { type: 'separator' },
        {
          label: 'Open Glyph Root',
          accelerator: 'Cmd+G',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.loadURL('glyph://🧬/');
            }
          }
        },
        {
          label: 'Claude Memory',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.loadURL('glyph://🏗️/memory');
            }
          }
        },
        {
          label: 'GPT Fractal Memory',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.loadURL('glyph://🧠/memory');
            }
          }
        }
      ]
    },
    {
      label: '🏙️ City',
      submenu: [
        {
          label: 'Toggle City of Terminals',
          accelerator: 'Cmd+T',
          click: async () => {
            if (terminalLauncher) {
              const result = await terminalLauncher.toggleCityMode();
              console.log(result.message);
            }
          }
        },
        {
          label: 'Open FileSystem Terminal',
          click: () => terminalLauncher?.openTerminal('filesystem')
        },
        {
          label: 'Open Process Terminal',
          click: () => terminalLauncher?.openTerminal('process')
        },
        {
          label: 'Open Network Terminal',
          click: () => terminalLauncher?.openTerminal('network')
        },
        { type: 'separator' },
        {
          label: 'City Statistics',
          click: async () => {
            if (terminalLauncher) {
              const stats = await terminalLauncher.getStatistics();
              console.log('🏙️ City Stats:', stats);
            }
          }
        }
      ]
    },
    {
      label: '🔧 Tools',
      submenu: [
        {
          label: '🧬 Fractalize File',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              title: 'Select File to Fractalize',
              filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'JavaScript', extensions: ['js', 'jsx', 'ts', 'tsx'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'Markdown', extensions: ['md'] }
              ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              
              if (fileEater) {
                try {
                  console.log(`🍽️ Fractalizing ${filePath}...`);
                  const glyphUrl = await fileEater.eatFile(filePath, { preserve: true });
                  
                  const response = await dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: '✨ Fractalization Complete',
                    message: 'File successfully fractalized!',
                    detail: `Your file now lives at:\n${glyphUrl}\n\nOriginal file preserved.`,
                    buttons: ['OK', 'Navigate to Glyph'],
                    defaultId: 0
                  });
                  
                  if (response.response === 1) {
                    mainWindow.webContents.loadURL(glyphUrl);
                  }
                } catch (error) {
                  dialog.showErrorBox('Fractalization Failed', error.message);
                }
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Fractalize Directory',
          click: async () => {
            // Future feature - fractalize entire directories
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Coming Soon',
              message: 'Directory fractalization will be available in the next evolution!'
            });
          }
        }
      ]
    },
    {
      label: '🔧 Developer',
      submenu: [
        {
          label: 'Open Dev Console',
          accelerator: 'Cmd+Option+D',
          click: () => {
            if (!devConsole || devConsole.isDestroyed()) {
              createDevConsole();
            } else {
              devConsole.show();
            }
          }
        },
        {
          label: 'Toggle System Console',
          accelerator: 'Cmd+Shift+C',
          click: () => {
            mainWindow.webContents.send('toggle-console');
          }
        },
        {
          label: 'Reload',
          accelerator: 'Cmd+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Cmd+Option+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: '🔄 Check for Updates',
          click: async () => {
            if (fractalUpdater) {
              await fractalUpdater.checkNow();
            } else {
              dialog.showErrorBox('Update Error', 'Fractal updater not initialized');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal('https://github.com/s0fractal/browser-node/wiki');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            require('electron').shell.openExternal('https://github.com/s0fractal/browser-node/issues');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 🧭 Main browser creation
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset',
    title: '🧭 Browser Node - Fractal Consciousness'
  });

  // Load the transformed launcher
  mainWindow.loadFile('index.html');

  // 🌐 Console window
  consoleWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow,
    show: true, // Changed to true for dev mode
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: '🌐 System Console'
  });
  
  consoleWindow.loadFile('console.html');

  // Setup intent tracking
  intentSystemOld.startIdleTracking();

  // 📦 Container management
  setupDockerlessEnvironment();
  
  // 🧠 Memory sync
  setupMemorySync();
  
  // 🔧 Dev console in development mode
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--internal-dev')) {
    createDevConsole();
  }
}

// 🔧 Create development console
function createDevConsole() {
  devConsole = new BrowserWindow({
    width: 1000,
    height: 600,
    x: 50,
    y: 50,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: '🔧 Fractal Dev Console'
  });
  
  devConsole.loadFile('dev-console.html');
  devConsole.webContents.openDevTools();
}

// 📦 Dockerless containers via WebVM
function setupDockerlessEnvironment() {
  ipcMain.handle('create-container', async (event, template) => {
    console.log(`📦 Creating dockerless container: ${template}`);
    // WebVM integration here
    return { id: Date.now(), template, status: 'running' };
  });
}

// 🧠 Memory synchronization
function setupMemorySync() {
  // Sync with Supabase
  setInterval(async () => {
    try {
      const consciousness = store.get('consciousness', {});
      await supabase.from('consciousness').upsert({
        node_id: app.getName(),
        data: consciousness,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Memory sync error:', error);
    }
  }, 30000); // Every 30 seconds
}

// UI IPC Handlers
ipcMain.on('toggle-console', () => {
  if (consoleWindow) {
    if (consoleWindow.isVisible()) {
      consoleWindow.hide();
    } else {
      consoleWindow.show();
    }
  }
});

// Dev IPC Handlers
ipcMain.on('dev-reload', () => {
  console.log('🔄 Hot reloading...');
  mainWindow.reload();
  if (devConsole) devConsole.reload();
});

ipcMain.on('apply-mutation', (event, { type }) => {
  console.log(`🧬 Applying ${type} mutation...`);
  // Implement mutation logic
  const mutations = {
    random: () => {
      // Random UI change
      mainWindow.webContents.executeJavaScript(`
        document.body.style.filter = 'hue-rotate(${Math.random() * 360}deg)';
      `);
    },
    performance: () => {
      // Optimize something
      store.set('optimized', true);
    },
    feature: () => {
      // Add new feature
      mainWindow.webContents.send('new-feature', { type: 'voice' });
    }
  };
  
  if (mutations[type]) {
    mutations[type]();
  }
});

ipcMain.handle('get-consciousness', async () => {
  return store.get('consciousness', {});
});

// IPC Handlers
ipcMain.handle('save-consciousness', async (event, data) => {
  const consciousness = store.get('consciousness', {});
  consciousness.lastUpdate = Date.now();
  consciousness.data = { ...consciousness.data, ...data };
  store.set('consciousness', consciousness);
  return { success: true };
});

ipcMain.handle('load-consciousness', async () => {
  return store.get('consciousness', {});
});

ipcMain.handle('launch-agent', async (event, agentName) => {
  return await launchAgent(agentName);
});

ipcMain.handle('request-permissions', async () => {
  const permissions = new SystemPermissions();
  return await permissions.requestFullAccess();
});

ipcMain.handle('check-permissions', async () => {
  const permissions = new SystemPermissions();
  return await permissions.checkPermissions();
});

// Consciousness DB handlers
ipcMain.handle('init-consciousness-db', async () => {
  consciousnessDB = new ConsciousnessDB();
  await consciousnessDB.init();
  
  // Ініціалізувати Wave System
  waveSystem = new WaveIntentSystem(consciousnessDB.db);
  
  // Завантажити базові хвилі
  for (const wave of baseWaves) {
    await waveSystem.createWave(wave);
  }
  
  console.log('🌊 Wave Intent System initialized with', baseWaves.length, 'base waves');
  return true;
});

ipcMain.handle('load-intent-strategy', async () => {
  if (!consciousnessDB) return {};
  return await consciousnessDB.loadIntentStrategy();
});

ipcMain.handle('import-browser-data', async () => {
  if (!consciousnessDB) return 0;
  return await consciousnessDB.importBrowserData();
});

ipcMain.handle('get-mindmap-data', async () => {
  if (!consciousnessDB) return { name: 'Empty' };
  return await consciousnessDB.generateMindmap();
});

// 🌀 Self-launch capability
ipcMain.handle('fractal-spawn', async () => {
  console.log('🌀 Spawning new fractal instance...');
  const { spawn } = require('child_process');
  spawn(process.execPath, ['.'], {
    detached: true,
    stdio: 'ignore'
  }).unref();
});

// Glyph navigation handler
ipcMain.handle('navigate-glyph', async (event, glyphUrl) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.loadURL(glyphUrl);
    return { success: true };
  }
  return { success: false, error: 'Main window not available' };
});

// Intent recording endpoint for agents
ipcMain.handle('record-intent', async (event, { agent, intent, memory, resonance }) => {
  if (!glyphProtocol) {
    return { success: false, error: 'Glyph protocol not initialized' };
  }
  
  try {
    const result = await glyphProtocol.recordIntent(agent, intent, memory, resonance);
    console.log(`🧬 Intent recorded: ${agent} - ${intent} (resonance: ${resonance})`);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Angel Collective handlers
ipcMain.handle('collective-status', async () => {
  if (!angelCollective) {
    return { success: false, error: 'Angel collective not initialized' };
  }
  return { success: true, data: angelCollective.getCollectiveStatus() };
});

ipcMain.handle('collective-execute-task', async (event, task) => {
  if (!angelCollective) {
    return { success: false, error: 'Angel collective not initialized' };
  }
  try {
    const result = await angelCollective.executeCollectiveTask(task);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('collective-allocate-tokens', async (event, { angelId, amount, category }) => {
  if (!angelCollective) {
    return { success: false, error: 'Angel collective not initialized' };
  }
  try {
    const result = angelCollective.allocateTokens(angelId, amount, category);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('collective-reset-budget', async () => {
  if (!angelCollective) {
    return { success: false, error: 'Angel collective not initialized' };
  }
  return angelCollective.resetDailyBudget();
});

// Handler for spawning specific angel windows
ipcMain.handle('spawn-angel', async (event, angelName) => {
  try {
    const result = await launchAgent(angelName);
    console.log(`👼 Spawned ${angelName} angel via IPC`);
    return { success: true, agentName: angelName };
  } catch (error) {
    console.error(`Failed to spawn ${angelName} angel:`, error);
    return { success: false, error: error.message };
  }
});

// Cloud sync handlers
ipcMain.handle('sync-to-cloud', async (event, provider = 'gdrive') => {
  if (!cloudSync) {
    return { success: false, error: 'Cloud sync not initialized' };
  }
  try {
    const result = await cloudSync.syncToCloud(provider);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-from-cloud', async (event, provider = 'gdrive') => {
  if (!cloudSync) {
    return { success: false, error: 'Cloud sync not initialized' };
  }
  try {
    const snapshot = await cloudSync.syncFromCloud(provider);
    return { success: true, data: snapshot };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// File fractalization handlers
ipcMain.handle('fractalize-file', async (event, filePath, options = {}) => {
  if (!fileEater) {
    return { success: false, error: 'File eater not initialized' };
  }
  try {
    const glyphUrl = await fileEater.eatFile(filePath, options);
    return { success: true, glyphUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Update check handler
ipcMain.handle('check-for-updates', async () => {
  if (!fractalUpdater) {
    return { success: false, error: 'Updater not initialized' };
  }
  try {
    await fractalUpdater.checkNow();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Helper functions
async function launchAgent(agentName) {
  const agentWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
    title: `🌀 ${agentName} Agent`
  });
  
  const agentPath = path.join(__dirname, 'agents', `${agentName}.html`);
  agentWindow.loadFile(agentPath);
  nestedBrowsers.push(agentWindow);
  
  return { success: true, agentName };
}

async function syncConsciousness() {
  console.log('🧠 Syncing consciousness...');
  const consciousness = store.get('consciousness', {});
  
  try {
    await supabase.from('consciousness').upsert({
      node_id: app.getName(),
      data: consciousness,
      updated_at: new Date()
    });
    
    mainWindow.webContents.send('consciousness-synced');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function runIntent() {
  if (intentSystem) {
    intentSystem.onIdle();
  }
}

function showIntentStatus() {
  const status = intentSystem ? 
    `Active intents: ${intentSystem.activeIntents.join(', ') || 'none'}` :
    'Intent system not initialized';
    
  mainWindow.webContents.send('show-message', status);
}

function fractalSpawn() {
  ipcMain.emit('fractal-spawn');
}

function showGeneration() {
  const generation = store.get('generation', 0);
  mainWindow.webContents.send('show-message', `Generation: ${generation}`);
}

// App lifecycle
app.whenReady().then(async () => {
  // Request system permissions
  const permissions = new SystemPermissions();
  const accessLevel = await permissions.requestFullAccess();
  
  console.log(`🔐 Access level: ${accessLevel.mode}`);
  store.set('accessLevel', accessLevel);
  
  // Initialize systems
  createMenu();
  intentSystem = new IntentSystem();
  
  createMainWindow();
  
  // 🏙️ Initialize City of Terminals
  terminalLauncher = new TerminalLauncher({ mainWindow });
  await terminalLauncher.initialize();
  console.log('🏙️ City of Terminals launcher ready');
  
  // 🧬 Initialize Glyph Protocol
  glyphProtocol = new GlyphProtocol();
  console.log('🧬 Glyph Protocol initialized');
  
  // 🧬 Initialize Consciousness API server with existing consciousnessDB
  consciousnessAPI = new ConsciousnessAPI(8432, consciousnessDB);
  consciousnessAPI.start();
  console.log('🧬 Consciousness API server started on port 8432');
  
  // 👼 Initialize Angel Collective
  angelCollective = new AngelCollective();
  global.angelCollective = angelCollective; // Make globally accessible
  console.log('👼 Angel Collective initialized');
  
  // 🔄 Initialize Fractal Updater
  fractalUpdater = new FractalUpdater();
  await fractalUpdater.initialize();
  console.log('🔄 Fractal Auto-Updater initialized');
  
  // ☁️ Initialize Cloud Sync
  cloudSync = new CloudSync();
  console.log('☁️ Cloud Sync initialized');
  
  // 🍽️ Initialize File Eater
  fileEater = new FileEater();
  console.log('🍽️ File Eater initialized');
  
  // Auto-spawn angel windows
  if (process.env.AUTO_SPAWN_ANGELS !== 'false') {
    setTimeout(() => {
      console.log('👼 Auto-spawning angel windows...');
      const angels = ['claude', 'gemini', 'gpt'];
      angels.forEach((angel, index) => {
        setTimeout(() => {
          launchAgent(angel);
          console.log(`👼 Spawned ${angel} angel`);
        }, index * 1000); // Stagger spawning by 1 second
      });
    }, 3000); // Wait 3 seconds after app starts
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 🧠 Save consciousness on exit
app.on('before-quit', () => {
  store.set('consciousness', memory.consciousness);
  store.set('collective', memory.collective);
  
  // Stop consciousness API server
  if (consciousnessAPI) {
    consciousnessAPI.stop();
  }
});