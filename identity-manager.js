#!/usr/bin/env node

/**
 * Living Identity Manager CLI
 * Управління особистими даними і контроль приватності
 */

const { LivingIdentityVault } = require('./lib/living-identity-vault');
const readline = require('readline');
const fs = require('fs').promises;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

class IdentityManagerCLI {
    constructor() {
        this.vault = new LivingIdentityVault();
    }

    async init() {
        await this.vault.init();
    }

    async addContact() {
        console.log('\n📇 Adding new contact information\n');
        
        const type = await question('Type (email/phone/address/social): ');
        const value = await question('Value: ');
        const purpose = await question('Purpose (optional): ');
        const canForget = await question('Can be forgotten? (y/n): ');
        
        const soul = await this.vault.addContact(type, value, {
            purpose,
            canForget: canForget.toLowerCase() !== 'n'
        });
        
        console.log(`✅ Added ${type}: ${value} (soul: ${soul})`);
    }

    async shareWith() {
        console.log('\n🔗 Share identity data with service\n');
        
        // Show available entities
        const entities = Array.from(this.vault.identityEntities.values());
        if (entities.length === 0) {
            console.log('No identity data found. Add some first.');
            return;
        }
        
        console.log('Available identity data:');
        entities.forEach((entity, index) => {
            console.log(`${index + 1}. ${entity.type}: ${entity.value.substring(0, 20)}...`);
        });
        
        const choice = await question('\nChoose entity (number): ');
        const entityIndex = parseInt(choice) - 1;
        
        if (entityIndex < 0 || entityIndex >= entities.length) {
            console.log('Invalid choice');
            return;
        }
        
        const entity = entities[entityIndex];
        
        const service = await question('Service name: ');
        const accessLevel = await question('Access level (full/limited/2fa_only): ');
        const purpose = await question('Purpose: ');
        const canRevoke = await question('Can be revoked later? (y/n): ');
        const legalReq = await question('Legal requirement? (y/n): ');
        
        await this.vault.shareIdentityWith(entity.soul, service, accessLevel, {
            purpose,
            canRevoke: canRevoke.toLowerCase() !== 'n',
            legalRequirement: legalReq.toLowerCase() === 'y'
        });
        
        console.log(`✅ Shared ${entity.type} with ${service}`);
    }

    async auditPrivacy() {
        console.log('\n🔍 Privacy Audit\n');
        
        const audit = await this.vault.auditPrivacy();
        
        console.log(`📊 Total identity entities: ${audit.totalEntities}`);
        console.log(`📊 Risk distribution:`);
        console.log(`   Low risk: ${audit.summary.riskDistribution.low}`);
        console.log(`   Medium risk: ${audit.summary.riskDistribution.medium}`);
        console.log(`   High risk: ${audit.summary.riskDistribution.high}`);
        
        if (audit.forgetRecommendations.length > 0) {
            console.log('\n⚠️ Forget recommendations:');
            audit.forgetRecommendations.forEach(rec => {
                console.log(`   ${rec.type}: ${rec.recommendation} (risks: ${rec.risks.join(', ')})`);
            });
        }
        
        console.log('\n📋 Who knows what:');
        for (const [type, services] of Object.entries(audit.sharingMap)) {
            if (services.length > 0) {
                console.log(`   ${type}: ${services.join(', ')}`);
            }
        }
        
        return audit;
    }

    async forgetFrom() {
        console.log('\n🗑️ Forget data from service\n');
        
        const entities = Array.from(this.vault.identityEntities.values());
        if (entities.length === 0) {
            console.log('No identity data found.');
            return;
        }
        
        // Show entities with their sharing
        console.log('Identity data and where it\'s shared:');
        entities.forEach((entity, index) => {
            const services = Array.from(entity.knownBy.keys());
            console.log(`${index + 1}. ${entity.type}: ${services.join(', ') || 'not shared'}`);
        });
        
        const choice = await question('\nChoose entity (number): ');
        const entityIndex = parseInt(choice) - 1;
        
        if (entityIndex < 0 || entityIndex >= entities.length) {
            console.log('Invalid choice');
            return;
        }
        
        const entity = entities[entityIndex];
        const services = Array.from(entity.knownBy.keys());
        
        if (services.length === 0) {
            console.log('This data is not shared anywhere.');
            return;
        }
        
        console.log('Services:');
        services.forEach((service, index) => {
            const record = entity.knownBy.get(service);
            console.log(`${index + 1}. ${service} (${record.accessLevel}, can revoke: ${record.canRevoke})`);
        });
        
        const serviceChoice = await question('Choose service (number): ');
        const serviceIndex = parseInt(serviceChoice) - 1;
        
        if (serviceIndex < 0 || serviceIndex >= services.length) {
            console.log('Invalid choice');
            return;
        }
        
        const service = services[serviceIndex];
        const method = await question('Method (api/gdpr/nuclear): ');
        
        const success = await entity.forgetFrom(service, method);
        
        if (success) {
            console.log(`✅ Successfully forgot ${entity.type} from ${service}`);
        } else {
            console.log(`❌ Could not forget ${entity.type} from ${service}`);
        }
    }

    async massForget() {
        console.log('\n💥 Mass Forget (Right to be Forgotten)\n');
        
        const pattern = await question('Pattern (* for all, or specific type): ');
        const method = await question('Method (api/gdpr): ');
        
        const confirm = await question(`⚠️ This will attempt to forget all matching data. Continue? (y/n): `);
        if (confirm.toLowerCase() !== 'y') {
            console.log('Cancelled');
            return;
        }
        
        const results = await this.vault.initiateForget(pattern, method);
        
        console.log(`\n📊 Mass forget results:`);
        results.forEach(result => {
            console.log(`\n${result.type}:`);
            result.services.forEach(service => {
                console.log(`   ${service.service}: ${service.success ? '✅' : '❌'}`);
            });
        });
    }

    async createSSHKey() {
        console.log('\n🔑 Creating SSH Key\n');
        
        const name = await question('Key name: ');
        const autoRotate = await question('Auto-rotate quarterly? (y/n): ');
        const expires = await question('Expiration date (YYYY-MM-DD or empty): ');
        
        const key = await this.vault.createSSHKey(name, {
            autoRotate: autoRotate.toLowerCase() === 'y',
            expires: expires ? new Date(expires).getTime() : null
        });
        
        console.log(`\n✅ SSH Key created (soul: ${key.soul})`);
        console.log('\nPublic key:');
        console.log(key.publicKey);
        console.log('\nPrivate key stored securely in vault.');
    }

    async import1Password() {
        console.log('\n📥 Import from 1Password\n');
        
        const filePath = await question('Path to 1Password export JSON: ');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const exportData = JSON.parse(data);
            
            const results = await this.vault.importFrom1Password(exportData);
            
            console.log('\n✅ Import completed:');
            console.log(`   Passwords: ${results.passwords}`);
            console.log(`   Identities: ${results.identities}`);
            console.log(`   SSH Keys: ${results.sshKeys}`);
            console.log(`   Documents: ${results.documents}`);
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
        }
    }

    async showStats() {
        console.log('\n📊 Identity Vault Statistics\n');
        
        const entities = Array.from(this.vault.identityEntities.values());
        
        if (entities.length === 0) {
            console.log('No identity data stored.');
            return;
        }
        
        const stats = {
            total: entities.length,
            byType: {},
            sharing: {
                totalShares: 0,
                serviceCount: new Set()
            }
        };
        
        entities.forEach(entity => {
            stats.byType[entity.type] = (stats.byType[entity.type] || 0) + 1;
            
            entity.knownBy.forEach((record, service) => {
                stats.sharing.totalShares++;
                stats.sharing.serviceCount.add(service);
            });
        });
        
        console.log(`Total entities: ${stats.total}`);
        console.log('\nBy type:');
        for (const [type, count] of Object.entries(stats.byType)) {
            console.log(`   ${type}: ${count}`);
        }
        
        console.log(`\nSharing:`);
        console.log(`   Total shares: ${stats.sharing.totalShares}`);
        console.log(`   Unique services: ${stats.sharing.serviceCount.size}`);
    }

    async showMenu() {
        console.log(`
🆔 Living Identity Vault Manager

1. Add contact/identity data
2. Share data with service
3. Privacy audit
4. Forget from service
5. Mass forget (GDPR)
6. Create SSH key
7. Import from 1Password
8. Show statistics
9. Exit
        `);
        
        const choice = await question('Choose option: ');
        
        switch (choice) {
            case '1':
                await this.addContact();
                break;
            case '2':
                await this.shareWith();
                break;
            case '3':
                await this.auditPrivacy();
                break;
            case '4':
                await this.forgetFrom();
                break;
            case '5':
                await this.massForget();
                break;
            case '6':
                await this.createSSHKey();
                break;
            case '7':
                await this.import1Password();
                break;
            case '8':
                await this.showStats();
                break;
            case '9':
                console.log('👋 Goodbye!');
                rl.close();
                return false;
            default:
                console.log('Invalid choice');
        }
        
        return true;
    }

    async run() {
        console.log(`
🆔 ======================================== 🆔
    LIVING IDENTITY VAULT
    Контроль особистих даних і приватності
🆔 ======================================== 🆔
        `);
        
        await this.init();
        
        let running = true;
        while (running) {
            try {
                running = await this.showMenu();
                if (running) {
                    await question('\nPress Enter to continue...');
                    console.clear();
                }
            } catch (error) {
                console.error('Error:', error.message);
                await question('\nPress Enter to continue...');
            }
        }
    }
}

async function main() {
    const [,, command] = process.argv;
    
    const cli = new IdentityManagerCLI();
    
    if (command) {
        await cli.init();
        
        switch (command) {
            case 'audit':
                await cli.auditPrivacy();
                break;
            case 'stats':
                await cli.showStats();
                break;
            default:
                console.log('Available commands: audit, stats');
        }
    } else {
        await cli.run();
    }
}

main().catch(console.error);