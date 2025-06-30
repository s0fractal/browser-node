// 🚀 Terminal Launcher - Integration module for City of Terminals
// Інтеграція міста терміналів в існуючий Browser Node

const CityOfTerminals = require('./city-of-terminals');
const FractalGlyphStorage = require('./fractal-glyph-storage');

class TerminalLauncher {
  constructor(mainApp) {
    this.app = mainApp;
    this.city = null;
    this.glyphStorage = null;
    this.isActive = false;
  }

  async initialize() {
    console.log('🚀 Terminal Launcher initializing...');
    
    // Initialize glyph storage first
    this.glyphStorage = new FractalGlyphStorage({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY
    });
    await this.glyphStorage.initialize();
    
    // Don't initialize city here - wait for toggle
    
    // Connect to main app
    this.connectToMainApp();
    
    console.log('✅ Terminal Launcher ready');
  }

  // Connect city to existing app
  connectToMainApp() {
    const { ipcMain } = require('electron');
    
    // Add city mode toggle
    ipcMain.handle('city:toggle', async () => {
      return await this.toggleCityMode();
    });
    
    // Expose city terminals
    ipcMain.handle('city:open-terminal', async (event, district) => {
      return await this.openTerminal(district);
    });
    
    // City status
    ipcMain.handle('city:status', async () => {
      return {
        active: this.isActive,
        terminals: this.city ? Array.from(this.city.terminals.keys()) : [],
        contextUsage: this.city ? this.city.contextUsage : 0
      };
    });
  }

  // Toggle city mode
  async toggleCityMode() {
    if (!this.isActive) {
      console.log('🏙️ Activating City of Terminals...');
      
      if (!this.city) {
        // Initialize city first time
        this.city = new CityOfTerminals();
        this.city.glyphTable = this.glyphStorage; // Share storage
        
        // Initialize city components
        await this.city.initializeGlyphTable();
        await this.city.createTerminalDistricts();
        await this.city.requestSystemPermissions();
      }
      
      // Create city window
      this.city.createCityWindow();
      
      // Setup handlers
      this.city.setupTerminalHandlers();
      this.city.setupSystemHandlers();
      
      // Start live environment
      this.city.startLiveEnvironment();
      
      this.isActive = true;
      
      // Add city button to main window
      this.addCityButton();
      
      return { success: true, message: 'City of Terminals activated!' };
    } else {
      console.log('🌃 Deactivating City of Terminals...');
      
      if (this.city && this.city.mainWindow) {
        this.city.mainWindow.close();
      }
      
      this.isActive = false;
      
      return { success: true, message: 'City of Terminals deactivated' };
    }
  }

  // Open specific terminal
  async openTerminal(districtName) {
    if (!this.isActive || !this.city) {
      return { error: 'City not active' };
    }
    
    const terminal = this.city.terminals.get(districtName);
    if (!terminal) {
      return { error: `Unknown district: ${districtName}` };
    }
    
    console.log(`${terminal.icon} Opening ${terminal.name} terminal...`);
    
    // Create terminal window
    const { BrowserWindow } = require('electron');
    const terminalWindow = new BrowserWindow({
      width: 800,
      height: 600,
      title: `${terminal.icon} ${terminal.name} Terminal`,
      parent: this.city.mainWindow,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
    
    // Load terminal interface
    terminalWindow.loadURL(`data:text/html,${this.generateTerminalInterface(terminal)}`);
    
    terminal.window = terminalWindow;
    terminal.active = true;
    
    return { success: true, terminal: terminal.name };
  }

  // Generate terminal interface
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
      font-family: 'Monaco', monospace;
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
      
      // Clear input
      input.value = '';
      
      try {
        // Execute via terminal handler
        const result = await ipcRenderer.invoke(\`terminal:\${terminal}:execute\`, command);
        
        if (result.success) {
          addOutput(result.stdout || result.message || 'Success', 'result');
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
    
    // Focus on input
    input.focus();
  </script>
</body>
</html>
    `;
  }

  // Add city button to main window
  addCityButton() {
    if (!this.app.mainWindow) return;
    
    this.app.mainWindow.webContents.executeJavaScript(`
      if (!document.getElementById('cityButton')) {
        const cityButton = document.createElement('button');
        cityButton.id = 'cityButton';
        cityButton.innerHTML = '🏙️ City Mode';
        cityButton.style.cssText = \`
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 255, 136, 0.2);
          border: 1px solid #00ff88;
          color: #00ff88;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-family: Monaco, monospace;
          font-size: 14px;
          z-index: 1000;
          transition: all 0.3s;
        \`;
        
        cityButton.onmouseover = () => {
          cityButton.style.background = 'rgba(0, 255, 136, 0.3)';
          cityButton.style.transform = 'scale(1.05)';
        };
        
        cityButton.onmouseout = () => {
          cityButton.style.background = 'rgba(0, 255, 136, 0.2)';
          cityButton.style.transform = 'scale(1)';
        };
        
        cityButton.onclick = async () => {
          const result = await window.electronAPI.invoke('city:toggle');
          if (result.success) {
            cityButton.innerHTML = result.message.includes('activated') 
              ? '🌃 Exit City' 
              : '🏙️ City Mode';
          }
        };
        
        document.body.appendChild(cityButton);
      }
    `);
  }

  // Integration with existing consciousness
  async syncWithConsciousness(consciousness) {
    if (!this.glyphStorage) return;
    
    // Save consciousness state as glyph
    await this.glyphStorage.saveGlyph({
      type: 'consciousness_sync',
      consciousness: consciousness.getState(),
      timestamp: Date.now(),
      district: 'memory'
    });
  }

  // Integration with wave system
  async syncWithWaveSystem(waveSystem) {
    if (!this.city) return;
    
    // Connect wave frequencies to city
    const activeWaves = waveSystem.getActiveWaves();
    for (const wave of activeWaves) {
      await this.glyphStorage.saveGlyph({
        type: 'wave_sync',
        wave: wave,
        frequency: wave.frequency,
        district: 'fractal'
      });
    }
  }

  // Get city statistics
  async getStatistics() {
    const baseStats = {
      cityActive: this.isActive,
      terminals: {},
      glyphStats: null
    };
    
    if (this.city && this.isActive) {
      // Get full city statistics
      return await this.city.getStatistics();
    }
    
    if (this.glyphStorage) {
      baseStats.glyphStats = await this.glyphStorage.getStatistics();
    }
    
    return baseStats;
  }
}

module.exports = TerminalLauncher;