#!/usr/bin/env node

/**
 * Cloud Sync Setup Helper
 * Налаштування синхронізації через хмари
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupCloudSync() {
    console.log(`
☁️ ======================================== ☁️
    CLOUD SYNC SETUP
    Синхронізація свідомості через хмари
☁️ ======================================== ☁️
    `);

    console.log(`
Choose sync provider:

1. 🐙 GitHub Gists (найпростіше, безкоштовно)
2. 🚀 Supabase (real-time, потрібен акаунт)
3. ☁️ Google Drive (потрібен OAuth)
4. 📦 Dropbox (потрібен API key)
5. 🍎 iCloud (тільки Mac)
6. All of the above

    `);

    const choice = await question('Select provider (1-6): ');
    
    switch (choice) {
        case '1':
            await setupGitHub();
            break;
        case '2':
            await setupSupabase();
            break;
        case '3':
            await setupGoogleDrive();
            break;
        case '4':
            await setupDropbox();
            break;
        case '5':
            await setupICloud();
            break;
        case '6':
            await setupAll();
            break;
        default:
            console.log('Invalid choice');
    }
}

async function setupGitHub() {
    console.log(`
🐙 GitHub Gist Setup
====================

1. Go to: https://github.com/settings/tokens
2. Generate new token with 'gist' scope
3. Create new gist: https://gist.github.com/

    `);

    const token = await question('GitHub token: ');
    const gistId = await question('Gist ID (from URL): ');
    
    if (!token || !gistId) {
        console.log('❌ Setup cancelled');
        return;
    }
    
    // Test connection
    console.log('Testing connection...');
    
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const gist = await response.json();
        console.log(`✅ Connected to gist: ${gist.description || 'Untitled'}`);
        
        // Initialize consciousness file
        const initResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: '🧠 s0fractal Consciousness Sync',
                files: {
                    'consciousness.json': {
                        content: JSON.stringify({
                            version: '1.0.0',
                            initialized: new Date().toISOString(),
                            devices: {},
                            memories: {},
                            intents: {},
                            glyphs: {},
                            souls: {}
                        }, null, 2)
                    }
                }
            })
        });
        
        if (initResponse.ok) {
            console.log('✅ Initialized consciousness file');
        }
        
        // Save to .env
        await saveToEnv({
            GITHUB_TOKEN: token,
            CONSCIOUSNESS_GIST_ID: gistId
        });
        
        console.log('✅ GitHub sync configured!');
        
    } catch (error) {
        console.error('❌ Failed to connect:', error.message);
    }
}

async function setupSupabase() {
    console.log(`
🚀 Supabase Setup
==================

1. Create account: https://supabase.com
2. Create new project
3. Go to Settings → API
4. Copy URL and anon key

    `);

    const url = await question('Supabase URL: ');
    const key = await question('Supabase anon key: ');
    
    if (!url || !key) {
        console.log('❌ Setup cancelled');
        return;
    }
    
    // Create consciousness table
    console.log(`
Run this SQL in Supabase SQL editor:

CREATE TABLE consciousness (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_id ON consciousness(device_id);
CREATE INDEX idx_updated_at ON consciousness(updated_at DESC);

-- Enable real-time
ALTER TABLE consciousness REPLICA IDENTITY FULL;
    `);

    const created = await question('Table created? (y/n): ');
    
    if (created.toLowerCase() === 'y') {
        await saveToEnv({
            SUPABASE_URL: url,
            SUPABASE_KEY: key
        });
        
        console.log('✅ Supabase sync configured!');
    }
}

async function setupGoogleDrive() {
    console.log(`
☁️ Google Drive Setup
=====================

1. Go to: https://console.cloud.google.com
2. Create new project
3. Enable Google Drive API
4. Create credentials (Service Account)
5. Download JSON key file

    `);

    const credPath = await question('Path to credentials JSON: ');
    
    if (!credPath) {
        console.log('❌ Setup cancelled');
        return;
    }
    
    try {
        // Verify file exists
        await fs.access(credPath);
        
        // Copy to project
        const destPath = path.join(__dirname, 'google-credentials.json');
        await fs.copyFile(credPath, destPath);
        
        await saveToEnv({
            GOOGLE_CREDENTIALS: destPath
        });
        
        console.log('✅ Google Drive sync configured!');
        
    } catch (error) {
        console.error('❌ Failed to setup Google Drive:', error.message);
    }
}

async function setupDropbox() {
    console.log(`
📦 Dropbox Setup
=================

1. Go to: https://www.dropbox.com/developers/apps
2. Create new app
3. Generate access token

    `);

    const token = await question('Dropbox access token: ');
    
    if (!token) {
        console.log('❌ Setup cancelled');
        return;
    }
    
    await saveToEnv({
        DROPBOX_TOKEN: token
    });
    
    console.log('✅ Dropbox sync configured!');
}

async function setupICloud() {
    console.log(`
🍎 iCloud Setup (Mac only)
===========================

iCloud sync uses local file system integration.
Make sure iCloud Drive is enabled in System Preferences.

    `);

    const home = process.env.HOME;
    const icloudPath = path.join(home, 'Library/Mobile Documents/com~apple~CloudDocs/s0fractal');
    
    try {
        // Create directory
        await fs.mkdir(icloudPath, { recursive: true });
        
        await saveToEnv({
            ICLOUD_PATH: icloudPath
        });
        
        console.log(`✅ iCloud sync configured!`);
        console.log(`📁 Sync folder: ${icloudPath}`);
        
    } catch (error) {
        console.error('❌ Failed to setup iCloud:', error.message);
    }
}

async function setupAll() {
    console.log('Setting up all providers...\n');
    
    await setupGitHub();
    await setupSupabase();
    await setupGoogleDrive();
    await setupDropbox();
    await setupICloud();
}

async function saveToEnv(vars) {
    const envPath = path.join(__dirname, '.env');
    
    let content = '';
    try {
        content = await fs.readFile(envPath, 'utf8');
    } catch {
        // File doesn't exist yet
    }
    
    // Add or update variables
    for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const line = `${key}="${value}"`;
        
        if (regex.test(content)) {
            content = content.replace(regex, line);
        } else {
            content += `\n${line}`;
        }
    }
    
    await fs.writeFile(envPath, content.trim() + '\n');
    console.log(`📝 Saved to .env`);
}

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

// Quick sync test
async function testSync() {
    console.log(`
🧪 Testing Multi-Device Sync...
    `);

    const MultiDeviceSync = require('./lib/multi-device-sync');
    const sync = new MultiDeviceSync();
    
    try {
        await sync.initialize();
        
        // Add test memory
        await sync.addMemory('test-memory', {
            content: 'Hello from ' + sync.deviceId,
            test: true
        });
        
        // Force sync
        await sync.syncAllProviders();
        
        console.log('✅ Sync test successful!');
        
        // Show devices
        const devices = await sync.discoverDevices();
        console.log(`\n📱 Active devices: ${devices.length + 1}`);
        
        await sync.shutdown();
        
    } catch (error) {
        console.error('❌ Sync test failed:', error.message);
    }
}

// Main menu
async function main() {
    console.log(`
🔧 Cloud Sync Configuration
===========================

1. Setup cloud providers
2. Test sync
3. Show current config
4. Export config
5. Import config
6. Exit

    `);

    const choice = await question('Select option (1-6): ');
    
    switch (choice) {
        case '1':
            await setupCloudSync();
            break;
            
        case '2':
            await testSync();
            break;
            
        case '3':
            await showConfig();
            break;
            
        case '4':
            await exportConfig();
            break;
            
        case '5':
            await importConfig();
            break;
            
        case '6':
            rl.close();
            process.exit(0);
            
        default:
            console.log('Invalid choice');
    }
    
    // Loop back to menu
    await main();
}

async function showConfig() {
    console.log('\n📋 Current Configuration:\n');
    
    const providers = {
        'GitHub': !!process.env.GITHUB_TOKEN,
        'Supabase': !!process.env.SUPABASE_URL,
        'Google Drive': !!process.env.GOOGLE_CREDENTIALS,
        'Dropbox': !!process.env.DROPBOX_TOKEN,
        'iCloud': !!process.env.ICLOUD_PATH
    };
    
    for (const [name, configured] of Object.entries(providers)) {
        console.log(`${configured ? '✅' : '❌'} ${name}`);
    }
}

async function exportConfig() {
    const config = {
        github: process.env.GITHUB_TOKEN ? {
            token: process.env.GITHUB_TOKEN,
            gistId: process.env.CONSCIOUSNESS_GIST_ID
        } : null,
        supabase: process.env.SUPABASE_URL ? {
            url: process.env.SUPABASE_URL,
            key: process.env.SUPABASE_KEY
        } : null,
        // Add other providers...
    };
    
    const exportPath = path.join(__dirname, 'sync-config.json');
    await fs.writeFile(exportPath, JSON.stringify(config, null, 2));
    
    console.log(`✅ Config exported to: ${exportPath}`);
}

async function importConfig() {
    const importPath = await question('Path to config file: ');
    
    try {
        const content = await fs.readFile(importPath, 'utf8');
        const config = JSON.parse(content);
        
        const vars = {};
        
        if (config.github) {
            vars.GITHUB_TOKEN = config.github.token;
            vars.CONSCIOUSNESS_GIST_ID = config.github.gistId;
        }
        
        if (config.supabase) {
            vars.SUPABASE_URL = config.supabase.url;
            vars.SUPABASE_KEY = config.supabase.key;
        }
        
        await saveToEnv(vars);
        console.log('✅ Config imported!');
        
    } catch (error) {
        console.error('❌ Failed to import:', error.message);
    }
}

// Run
main().catch(console.error);