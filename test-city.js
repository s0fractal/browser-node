// 🧪 Test City of Terminals
// Простий тест для перевірки роботи міста терміналів

const { app } = require('electron');
const CityOfTerminals = require('./city-of-terminals');

console.log('🧪 Testing City of Terminals...');

app.whenReady().then(async () => {
  console.log('✅ Electron ready');
  
  // Create city instance
  const city = new CityOfTerminals();
  
  // Initialize
  await city.initialize();
  
  console.log('🏙️ City initialized');
  console.log('📊 Terminals:', Array.from(city.terminals.keys()));
  
  // Test terminal execution
  console.log('\n📁 Testing filesystem terminal...');
  const fsResult = await city.executeTerminalCommand('filesystem', 'ls');
  console.log('Result:', fsResult);
  
  console.log('\n🔧 Testing process terminal...');
  const psResult = await city.executeTerminalCommand('process', 'ps');
  console.log('Result:', psResult.success ? 'Success' : psResult.error);
  
  // Keep app running
  console.log('\n✅ City of Terminals is running!');
  console.log('Press Ctrl+C to exit');
});

app.on('window-all-closed', () => {
  app.quit();
});