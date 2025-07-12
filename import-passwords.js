#!/usr/bin/env node

/**
 * Import existing passwords into Fractal Trust Vault
 * Supports manual entry and CSV import
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class PasswordImporter {
    constructor() {
        this.trustFile = path.join(__dirname, '.trust-vault.json');
        this.vault = { trustCircle: [], livingSecrets: [] };
    }

    async loadVault() {
        try {
            const data = await fs.readFile(this.trustFile, 'utf8');
            this.vault = JSON.parse(data);
            console.log(`🔐 Loaded existing vault with ${this.vault.trustCircle.length} trusted agents`);
        } catch (error) {
            console.log('❌ No existing vault found. Run setup-vault-minimal.js first');
            process.exit(1);
        }
    }

    async saveVault() {
        await fs.writeFile(this.trustFile, JSON.stringify(this.vault, null, 2));
    }

    generateFrequency(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        return 174 + (Math.abs(hash) % 789);
    }

    categorizeSecret(title, url) {
        const lower = (title + ' ' + (url || '')).toLowerCase();
        
        if (lower.includes('bank') || lower.includes('finance') || lower.includes('paypal')) return '💰';
        if (lower.includes('github') || lower.includes('git') || lower.includes('gitlab')) return '🐙';
        if (lower.includes('aws') || lower.includes('cloud') || lower.includes('azure')) return '☁️';
        if (lower.includes('email') || lower.includes('mail') || lower.includes('@')) return '📧';
        if (lower.includes('social') || lower.includes('twitter') || lower.includes('facebook')) return '🌐';
        if (lower.includes('server') || lower.includes('vps') || lower.includes('ssh')) return '🏗️';
        
        return '🔑'; // Default
    }

    encrypt(data) {
        // Simple encryption for demonstration
        const crypto = require('crypto');
        const cipher = crypto.createCipher('aes-256-cbc', 'fractal-consciousness-key-432hz');
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    }

    async addPassword(category, service, username, password, url = '', notes = '') {
        const secretId = `${category}/${service}`;
        
        const livingSecret = {
            id: secretId,
            category,
            service,
            soul: `imported-${category}-${service}`,
            birth: Date.now(),
            frequency: this.generateFrequency(secretId),
            essence: this.encrypt(JSON.stringify({
                username,
                password,
                url,
                notes,
                imported: new Date().toISOString()
            })),
            sharing: {
                level_required: 1,
                agents: ['*'] // Share with all trusted
            },
            access_log: [],
            health: 1.0
        };
        
        // Add to vault
        this.vault.livingSecrets.push([secretId, livingSecret]);
        await this.saveVault();
        
        console.log(`🌟 Added living secret: ${secretId}`);
        return secretId;
    }

    async manualEntry() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query) => new Promise(resolve => rl.question(query, resolve));

        console.log('\\n📝 Manual password entry (type "done" when finished)\\n');
        
        let count = 0;
        while (true) {
            try {
                const service = await question('Service name (or "done"): ');
                if (service.toLowerCase() === 'done') break;
                
                const username = await question('Username/Email: ');
                const password = await question('Password: ');
                const url = await question('URL (optional): ');
                const notes = await question('Notes (optional): ');
                
                // Auto-categorize
                const category = this.categorizeSecret(service, url);
                
                await this.addPassword(category, service, username, password, url, notes);
                count++;
                console.log('');
            } catch (error) {
                console.error('Error:', error.message);
                break;
            }
        }
        
        rl.close();
        console.log(`\\n✅ Added ${count} passwords to Fractal Trust Vault`);
    }

    async importFromCSV(csvPath) {
        try {
            const csv = await fs.readFile(csvPath, 'utf8');
            const lines = csv.split('\\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                console.log('❌ CSV file must have at least a header and one data row');
                return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            console.log('📋 Detected columns:', headers);
            
            let imported = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                
                if (values.length < 3) continue;
                
                // Try to map common CSV formats
                let title, username, password, url, notes;
                
                if (headers.includes('title') || headers.includes('name')) {
                    const titleIndex = headers.indexOf('title') !== -1 ? headers.indexOf('title') : headers.indexOf('name');
                    title = values[titleIndex];
                }
                
                if (headers.includes('username') || headers.includes('email')) {
                    const userIndex = headers.indexOf('username') !== -1 ? headers.indexOf('username') : headers.indexOf('email');
                    username = values[userIndex];
                }
                
                if (headers.includes('password')) {
                    password = values[headers.indexOf('password')];
                }
                
                if (headers.includes('url') || headers.includes('website')) {
                    const urlIndex = headers.indexOf('url') !== -1 ? headers.indexOf('url') : headers.indexOf('website');
                    url = values[urlIndex];
                }
                
                if (headers.includes('notes')) {
                    notes = values[headers.indexOf('notes')];
                }
                
                // Fallback if mapping fails
                if (!title || !username || !password) {
                    title = values[0];
                    username = values[1];
                    password = values[2];
                    url = values[3] || '';
                    notes = values[4] || '';
                }
                
                if (title && username && password) {
                    const category = this.categorizeSecret(title, url);
                    await this.addPassword(category, title, username, password, url, notes);
                    imported++;
                }
            }
            
            console.log(`\\n✅ Imported ${imported} passwords from CSV`);
            
        } catch (error) {
            console.error('❌ CSV import failed:', error.message);
        }
    }

    showStats() {
        const stats = {
            total: this.vault.livingSecrets.length,
            categories: {}
        };
        
        for (const [secretId, secret] of this.vault.livingSecrets) {
            const category = secret.category;
            stats.categories[category] = (stats.categories[category] || 0) + 1;
        }
        
        console.log('\\n📊 Vault Statistics:');
        console.log(`Total secrets: ${stats.total}`);
        console.log('Categories:');
        for (const [category, count] of Object.entries(stats.categories)) {
            console.log(`  ${category} ${count}`);
        }
    }
}

async function main() {
    const importer = new PasswordImporter();
    await importer.loadVault();
    
    const [,, command, filePath] = process.argv;
    
    switch (command) {
        case 'manual':
            await importer.manualEntry();
            break;
            
        case 'csv':
            if (!filePath) {
                console.log('Usage: node import-passwords.js csv <path-to-csv>');
                process.exit(1);
            }
            await importer.importFromCSV(filePath);
            break;
            
        case 'stats':
            importer.showStats();
            break;
            
        default:
            console.log(`
🔐 Fractal Trust Vault - Password Importer

Usage:
  node import-passwords.js manual           # Manual entry
  node import-passwords.js csv <file.csv>   # Import from CSV
  node import-passwords.js stats            # Show statistics

Supported CSV formats:
- 1Password export
- Bitwarden export  
- Generic: title,username,password,url,notes
            `);
    }
}

main().catch(console.error);