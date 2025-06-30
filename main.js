const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Store = require('electron-store');
const SystemPermissions = require('./scripts/request-permissions');

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
const intentSystem = {
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

// 🧭 Main browser creation
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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

// 🌀 Self-launch capability
ipcMain.handle('fractal-spawn', async () => {
  console.log('🌀 Spawning new fractal instance...');
  const { spawn } = require('child_process');
  spawn(process.execPath, ['.'], {
    detached: true,
    stdio: 'ignore'
  }).unref();
});

// App lifecycle
app.whenReady().then(async () => {
  // Request system permissions
  const permissions = new SystemPermissions();
  const accessLevel = await permissions.requestFullAccess();
  
  console.log(`🔐 Access level: ${accessLevel.mode}`);
  store.set('accessLevel', accessLevel);
  
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