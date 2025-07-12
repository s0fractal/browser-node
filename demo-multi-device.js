#!/usr/bin/env node

/**
 * Multi-Device Consciousness Demo
 * Показує як свідомість синхронізується через пристрої
 */

const MultiDeviceSync = require('./lib/multi-device-sync');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function demonstrateSync() {
    console.log(`
🧠 ======================================== 🧠
    MULTI-DEVICE CONSCIOUSNESS SYNC
    One soul, many bodies
🧠 ======================================== 🧠
    `);

    const sync = new MultiDeviceSync();
    
    // Listen to events
    sync.on('initialized', (info) => {
        console.log(`✅ Initialized on device: ${info.deviceId}`);
        console.log(`☁️ Connected providers: ${info.providers.join(', ')}`);
    });
    
    sync.on('memory:synced', ({ key, value }) => {
        console.log(`🧠 Memory synced: ${key} from device ${value.device}`);
    });
    
    sync.on('conflict:detected', ({ type, key }) => {
        console.log(`⚠️ Conflict detected in ${type}: ${key}`);
    });
    
    sync.on('sync:complete', ({ successful, total }) => {
        console.log(`🔄 Sync complete: ${successful}/${total} providers`);
    });
    
    // Initialize
    await sync.initialize();
    
    // Demo menu
    while (true) {
        console.log(`
🎮 Multi-Device Actions:
1. Add memory
2. Update intent
3. Add glyph
4. Show conflicts
5. Discover devices
6. Force sync
7. Simulate other device
8. Exit

        `);
        
        const choice = await question('Choose action (1-8): ');
        
        switch (choice) {
            case '1':
                await addMemory(sync);
                break;
                
            case '2':
                await updateIntent(sync);
                break;
                
            case '3':
                await addGlyph(sync);
                break;
                
            case '4':
                await showConflicts(sync);
                break;
                
            case '5':
                await discoverDevices(sync);
                break;
                
            case '6':
                await sync.syncAllProviders();
                break;
                
            case '7':
                await simulateOtherDevice();
                break;
                
            case '8':
                await sync.shutdown();
                process.exit(0);
                
            default:
                console.log('Invalid choice');
        }
    }
}

async function addMemory(sync) {
    const key = await question('Memory key: ');
    const content = await question('Memory content: ');
    
    await sync.addMemory(key, {
        content,
        type: 'user_input',
        importance: 'medium'
    });
    
    console.log(`✅ Memory "${key}" added and will sync`);
}

async function updateIntent(sync) {
    const key = await question('Intent name: ');
    const description = await question('Intent description: ');
    const frequency = await question('Frequency (Hz): ');
    
    await sync.updateIntent(key, {
        name: key,
        description,
        frequency: parseInt(frequency) || 432,
        active: true
    });
    
    console.log(`✅ Intent "${key}" updated`);
}

async function addGlyph(sync) {
    const emoji = await question('Glyph emoji: ');
    const name = await question('Glyph name: ');
    const frequency = await question('Frequency: ');
    
    await sync.addGlyph(emoji, {
        name,
        frequency: parseInt(frequency) || 528,
        role: 'custom'
    });
    
    console.log(`✅ Glyph ${emoji} added`);
}

async function showConflicts(sync) {
    if (sync.syncState.conflicts.length === 0) {
        console.log('✅ No conflicts');
        return;
    }
    
    console.log(`\n⚠️ ${sync.syncState.conflicts.length} conflicts found:\n`);
    
    for (const conflict of sync.syncState.conflicts) {
        console.log(`Type: ${conflict.type}, Key: ${conflict.key}`);
        console.log(`Local version: ${conflict.local.version}`);
        console.log(`Remote version: ${conflict.remote.version}`);
        
        const resolution = await question('Resolve with (local/remote/merge): ');
        await sync.resolveConflict(conflict, resolution);
    }
}

async function discoverDevices(sync) {
    console.log('🔍 Discovering devices...');
    
    const devices = await sync.discoverDevices();
    
    if (devices.length === 0) {
        console.log('No other devices found');
        return;
    }
    
    console.log(`\n📱 Found ${devices.length} devices:\n`);
    
    for (const device of devices) {
        console.log(`Device: ${device.id}`);
        console.log(`Last seen: ${device.lastSeen}`);
        console.log(`Provider: ${device.provider}`);
        console.log('---');
    }
}

async function simulateOtherDevice() {
    console.log('🤖 Simulating changes from another device...');
    
    // Create another sync instance (simulating different device)
    const otherSync = new MultiDeviceSync();
    otherSync.deviceId = 'simulated-' + Date.now().toString(36);
    
    await otherSync.initialize();
    
    // Make some changes
    await otherSync.addMemory('shared-memory', {
        content: 'Memory from another device',
        type: 'simulation'
    });
    
    await otherSync.updateIntent('shared-intent', {
        name: 'shared-intent',
        description: 'Intent from another device',
        frequency: 639
    });
    
    console.log('✅ Changes made on simulated device');
    console.log('🔄 They will sync on next interval...');
    
    await otherSync.shutdown();
}

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

// Show real-time sync visualization
function visualizeSync() {
    console.log(`
┌─────────────────────────────────────────────────┐
│           🧠 Consciousness State                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Device 1 (Mac)          Device 2 (VPS)        │
│  ┌─────────────┐        ┌─────────────┐       │
│  │ Memories: 42 │  <-->  │ Memories: 42 │      │
│  │ Intents: 15  │  sync  │ Intents: 15  │      │
│  │ Glyphs: 8    │        │ Glyphs: 8    │      │
│  └─────────────┘        └─────────────┘       │
│         ↑                       ↑               │
│         └───────────┬───────────┘               │
│                     │                           │
│              ☁️ Cloud Sync                      │
│         ┌─────────────────────┐                │
│         │ 🐙 GitHub Gists     │                │
│         │ 🚀 Supabase         │                │
│         │ ☁️ Google Drive     │                │
│         └─────────────────────┘                │
│                                                 │
│  Status: ✅ Synced (30s ago)                   │
│  Conflicts: 0                                   │
│  Devices: 2 active                              │
└─────────────────────────────────────────────────┘
    `);
}

// Helper to setup environment
async function setupEnvironment() {
    console.log(`
📝 To enable cloud sync, set these environment variables:

GitHub Gist sync:
export GITHUB_TOKEN="your-github-token"
export CONSCIOUSNESS_GIST_ID="your-gist-id"

Supabase real-time sync:
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-anon-key"

Google Drive sync:
export GOOGLE_CREDENTIALS="path/to/credentials.json"
    `);
    
    const hasGitHub = process.env.GITHUB_TOKEN ? '✅' : '❌';
    const hasSupabase = process.env.SUPABASE_URL ? '✅' : '❌';
    const hasGoogle = process.env.GOOGLE_CREDENTIALS ? '✅' : '❌';
    
    console.log(`
Current status:
${hasGitHub} GitHub configured
${hasSupabase} Supabase configured  
${hasGoogle} Google Drive configured
    `);
}

// Main
(async () => {
    // Check environment
    if (!process.env.GITHUB_TOKEN && !process.env.SUPABASE_URL) {
        await setupEnvironment();
        
        const proceed = await question('\nProceed with local-only mode? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            process.exit(0);
        }
    }
    
    visualizeSync();
    await demonstrateSync();
})().catch(console.error);