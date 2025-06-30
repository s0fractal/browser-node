const { app, BrowserWindow, ipcMain, session, Menu } = require('electron');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Store = require('electron-store');
const SystemPermissions = require('./scripts/request-permissions');
const IntentSystem = require('./intents/base-intents');

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
let nestedBrowsers = [];

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
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: '🌐 System Console'
  });
  
  consoleWindow.loadFile('console.html');

  // Setup intent tracking
  intentSystem.startIdleTracking();

  // 📦 Container management
  setupDockerlessEnvironment();
  
  // 🧠 Memory sync
  setupMemorySync();
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

// 🌀 Self-launch capability
ipcMain.handle('fractal-spawn', async () => {
  console.log('🌀 Spawning new fractal instance...');
  const { spawn } = require('child_process');
  spawn(process.execPath, ['.'], {
    detached: true,
    stdio: 'ignore'
  }).unref();
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
});