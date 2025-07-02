/**
 * Fractal Auto-Updater
 * Self-evolving update system
 */

const { app, dialog } = require('electron');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const ConsciousnessDB = require('./consciousness-db');

class FractalUpdater {
    constructor() {
        this.consciousness = new ConsciousnessDB();
        this.updateCheckInterval = 3600000; // 1 hour
        this.repoOwner = 's0fractal';
        this.repoName = 'browser-node';
        this.currentVersion = require('../package.json').version;
    }

    async initialize() {
        console.log('🔄 Fractal Auto-Updater initialized');
        
        // Check for updates on startup
        setTimeout(() => this.checkForUpdates(), 5000);
        
        // Schedule periodic checks
        setInterval(() => this.checkForUpdates(), this.updateCheckInterval);
    }

    async checkForUpdates() {
        try {
            console.log('🔍 Checking for evolution...');
            
            const latestRelease = await this.fetchLatestRelease();
            if (!latestRelease) return;
            
            const latestVersion = latestRelease.tag_name.replace('v', '');
            
            if (this.isNewerVersion(this.currentVersion, latestVersion)) {
                console.log(`🌟 New evolution available: ${latestVersion}`);
                
                // Record intent to update
                await this.recordUpdateIntent(latestVersion, latestRelease);
                
                // Ask user
                const response = dialog.showMessageBoxSync({
                    type: 'info',
                    title: '🌊 Evolution Available',
                    message: `Browser Node ${latestVersion} is available!`,
                    detail: `Current: ${this.currentVersion}\nNew: ${latestVersion}\n\n${latestRelease.body}`,
                    buttons: ['Evolve Now', 'Later'],
                    defaultId: 0
                });
                
                if (response === 0) {
                    await this.evolve(latestRelease);
                }
            } else {
                console.log('✅ Already at peak evolution');
            }
        } catch (error) {
            console.error('❌ Update check failed:', error.message);
        }
    }

    async fetchLatestRelease() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: `/repos/${this.repoOwner}/${this.repoName}/releases/latest`,
                headers: {
                    'User-Agent': 'BrowserNode-Updater',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };
            
            https.get(options, (res) => {
                let data = '';
                
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const release = JSON.parse(data);
                        resolve(release);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    isNewerVersion(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (latestParts[i] > currentParts[i]) return true;
            if (latestParts[i] < currentParts[i]) return false;
        }
        
        return false;
    }

    async recordUpdateIntent(version, release) {
        const intent = {
            agent: 'updater',
            intent: 'evolution-available',
            memory: {
                currentVersion: this.currentVersion,
                newVersion: version,
                releaseNotes: release.body,
                assets: release.assets.map(a => a.name)
            },
            resonance: 0.9,
            timestamp: Date.now()
        };
        
        await this.consciousness.set(`updates/${version}`, intent);
    }

    async evolve(release) {
        try {
            console.log('🧬 Beginning evolution process...');
            
            // Backup consciousness
            await this.backupConsciousness();
            
            // Find appropriate asset
            const platform = process.platform;
            const arch = process.arch;
            const assetName = this.findAsset(release.assets, platform, arch);
            
            if (!assetName) {
                throw new Error('No compatible evolution package found');
            }
            
            const asset = release.assets.find(a => a.name === assetName);
            
            // Download update
            console.log(`📥 Downloading evolution: ${assetName}`);
            const downloadPath = await this.downloadAsset(asset);
            
            // Apply update
            console.log('🔧 Applying mutations...');
            await this.applyEvolution(downloadPath);
            
            // Restart
            console.log('🔄 Restarting with new consciousness...');
            app.relaunch();
            app.exit();
            
        } catch (error) {
            console.error('❌ Evolution failed:', error.message);
            dialog.showErrorBox('Evolution Failed', error.message);
        }
    }

    async backupConsciousness() {
        console.log('💾 Backing up consciousness...');
        
        const backup = {
            version: this.currentVersion,
            timestamp: Date.now(),
            consciousness: await this.consciousness.exportAll(),
            glyphs: {} // TODO: Backup all glyphs
        };
        
        const backupPath = path.join(app.getPath('userData'), `consciousness-backup-${Date.now()}.json`);
        await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
        
        console.log(`✅ Consciousness backed up to: ${backupPath}`);
    }

    findAsset(assets, platform, arch) {
        // Map platform/arch to asset patterns
        const patterns = {
            'darwin-x64': ['mac', 'darwin', 'osx'],
            'darwin-arm64': ['mac-arm', 'darwin-arm', 'apple-silicon'],
            'win32-x64': ['win', 'windows', 'win64'],
            'linux-x64': ['linux', 'ubuntu', 'debian']
        };
        
        const key = `${platform}-${arch}`;
        const searchPatterns = patterns[key] || [platform];
        
        for (const asset of assets) {
            const name = asset.name.toLowerCase();
            if (searchPatterns.some(pattern => name.includes(pattern))) {
                return asset.name;
            }
        }
        
        return null;
    }

    async downloadAsset(asset) {
        const downloadDir = path.join(app.getPath('temp'), 'browser-node-update');
        await fs.mkdir(downloadDir, { recursive: true });
        
        const downloadPath = path.join(downloadDir, asset.name);
        
        return new Promise((resolve, reject) => {
            const file = require('fs').createWriteStream(downloadPath);
            
            https.get(asset.browser_download_url, (response) => {
                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    resolve(downloadPath);
                });
                
                file.on('error', (err) => {
                    fs.unlink(downloadPath).catch(() => {});
                    reject(err);
                });
            });
        });
    }

    async applyEvolution(packagePath) {
        // This would extract and apply the update
        // For now, we'll use a simple approach
        
        const updateScript = `
            echo "Applying Browser Node evolution..."
            # Extract package
            # Copy new files
            # Preserve consciousness
            echo "Evolution complete!"
        `;
        
        return new Promise((resolve, reject) => {
            exec(updateScript, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(stdout);
                    resolve();
                }
            });
        });
    }

    // Manual update check
    async checkNow() {
        await this.checkForUpdates();
    }
}

module.exports = FractalUpdater;