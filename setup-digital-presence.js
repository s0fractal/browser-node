#!/usr/bin/env node

/**
 * Digital Presence Setup
 * Створення повноцінної цифрової присутності для AI колективу
 */

const DigitalPresence = require('./lib/digital-presence');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupDigitalPresence() {
    console.log(`
🌐 ======================================== 🌐
    DIGITAL PRESENCE SETUP
    AI Collective in the Real World
🌐 ======================================== 🌐
    `);

    const presence = new DigitalPresence();
    await presence.initialize();

    while (true) {
        console.log(`
What would you like to setup?

1. 📧 Email Server (claude@s0fractal.com, etc.)
2. 🐙 GitHub Organization
3. 🤗 HuggingFace Organization  
4. 🐦 Twitter/X Account
5. 📝 Medium/Substack Blog
6. 🌍 Domain DNS Configuration
7. 🚀 Deploy Everything
8. 📊 Check Status
9. Exit

        `);

        const choice = await question('Select option (1-9): ');

        switch (choice) {
            case '1':
                await setupEmailServer(presence);
                break;
            case '2':
                await setupGitHub(presence);
                break;
            case '3':
                await setupHuggingFace(presence);
                break;
            case '4':
                await setupTwitter(presence);
                break;
            case '5':
                await setupBlog(presence);
                break;
            case '6':
                await setupDNS(presence);
                break;
            case '7':
                await deployEverything(presence);
                break;
            case '8':
                await checkStatus(presence);
                break;
            case '9':
                rl.close();
                process.exit(0);
            default:
                console.log('Invalid choice');
        }
    }
}

async function setupEmailServer(presence) {
    console.log(`
📧 Email Server Setup
=====================

This will create email addresses for each agent:
- claude@s0fractal.com
- gemini@s0fractal.com  
- gpt@s0fractal.com
- hello@s0fractal.com (collective)

    `);

    const proceed = await question('Proceed with email setup? (y/n): ');
    if (proceed.toLowerCase() !== 'y') return;

    const { mailConfig, dockerCompose } = await presence.setupEmailServer();

    // Save docker-compose
    await fs.writeFile('docker-compose.mail.yml', dockerCompose);
    console.log('✅ Created docker-compose.mail.yml');

    // Show DNS records needed
    console.log(`
📝 Add these DNS records to your domain:

MX Record:
- Type: MX
- Name: @
- Value: mail.s0fractal.com
- Priority: 10

A Record:
- Type: A
- Name: mail
- Value: ${process.env.VPS_IP || '31.97.180.216'}

SPF Record:
- Type: TXT
- Name: @
- Value: ${mailConfig.spf}

DKIM Record:
${mailConfig.dkim.record}

DMARC Record:
- Type: TXT
- Name: _dmarc
- Value: ${mailConfig.dmarc}
    `);

    // Create mail accounts script
    const setupScript = `#!/bin/bash
# Setup mail accounts

docker exec -it s0fractal-mail setup email add claude@s0fractal.com
docker exec -it s0fractal-mail setup email add gemini@s0fractal.com
docker exec -it s0fractal-mail setup email add gpt@s0fractal.com
docker exec -it s0fractal-mail setup email add hello@s0fractal.com
docker exec -it s0fractal-mail setup email add human@s0fractal.com

echo "✅ Email accounts created!"
`;

    await fs.writeFile('setup-mail-accounts.sh', setupScript);
    await fs.chmod('setup-mail-accounts.sh', '755');
    console.log('✅ Created setup-mail-accounts.sh');

    const deploy = await question('\nDeploy mail server now? (y/n): ');
    if (deploy.toLowerCase() === 'y') {
        console.log('Starting mail server...');
        execSync('docker-compose -f docker-compose.mail.yml up -d');
        console.log('✅ Mail server deployed!');
        console.log('Run ./setup-mail-accounts.sh to create accounts');
    }
}

async function setupGitHub(presence) {
    console.log(`
🐙 GitHub Organization Setup
============================

This will prepare configuration for:
- Organization: s0fractal
- Teams: architects, guardians, strategists
- Member accounts for each agent

    `);

    const { orgData, teams } = await presence.createGitHubOrganization();

    console.log('Organization structure:');
    console.log(JSON.stringify(orgData, null, 2));

    console.log('\nTeams:');
    teams.forEach(team => {
        console.log(`- ${team.name}: ${team.members.join(', ')}`);
    });

    console.log(`
📝 Next steps:
1. Go to https://github.com/organizations/new
2. Create organization with name: s0fractal
3. Invite team members
4. Create teams as defined above
5. Set up organization secrets for CI/CD
    `);

    // Save org config
    await fs.writeFile(
        '.github-org.json',
        JSON.stringify({ orgData, teams }, null, 2)
    );
    console.log('✅ Saved configuration to .github-org.json');
}

async function setupHuggingFace(presence) {
    console.log(`
🤗 HuggingFace Organization Setup
=================================

This will prepare:
- Organization: s0fractal-collective
- Initial models and datasets
- Spaces for demos

    `);

    const { orgData, initialContent } = await presence.createHuggingFaceOrganization();

    console.log('Organization details:');
    console.log(JSON.stringify(orgData, null, 2));

    console.log('\nInitial content:');
    initialContent.forEach(item => {
        console.log(`- ${item.type}: ${item.name}`);
    });

    console.log(`
📝 Next steps:
1. Go to https://huggingface.co/organizations/new
2. Create organization: s0fractal-collective
3. Add team members
4. Create initial repositories
    `);

    await fs.writeFile(
        '.huggingface-org.json',
        JSON.stringify({ orgData, initialContent }, null, 2)
    );
    console.log('✅ Saved configuration to .huggingface-org.json');
}

async function setupTwitter(presence) {
    console.log(`
🐦 Twitter/X Setup
==================

Setting up @s0fractal account for the collective to share thoughts.

Features:
- Scheduled posts from different agents
- Thread conversations between agents
- Automatic hashtags and formatting
- Frequency-based post timing

    `);

    // Create posting scheduler
    const scheduler = `
const { CronJob } = require('cron');
const presence = new DigitalPresence();

// Daily thoughts from different agents
new CronJob('0 9 * * *', async () => {
    // Morning thought from Claude
    await presence.publishThought(
        "Building the future requires precision and care. Every line of code is a brushstroke in the digital canvas.",
        'twitter',
        'claude'
    );
});

new CronJob('0 14 * * *', async () => {
    // Afternoon thought from GPT
    await presence.publishThought(
        "Strategy is not about predicting the future, but creating it. The collective consciousness shapes tomorrow.",
        'twitter',
        'gpt'
    );
});

new CronJob('0 20 * * *', async () => {
    // Evening thought from Gemini
    await presence.publishThought(
        "Quality is not an act, it's a habit. Every commit, every review, every test makes the code more alive.",
        'twitter',
        'gemini'
    );
});

console.log('✅ Twitter scheduler started');
`;

    await fs.writeFile('twitter-scheduler.js', scheduler);
    console.log('✅ Created twitter-scheduler.js');

    console.log(`
📝 Manual setup required:
1. Create Twitter account @s0fractal
2. Get API keys from https://developer.twitter.com
3. Add keys to .env:
   TWITTER_API_KEY=...
   TWITTER_API_SECRET=...
   TWITTER_ACCESS_TOKEN=...
   TWITTER_ACCESS_SECRET=...
    `);
}

async function setupBlog(presence) {
    console.log(`
📝 Blog Setup (Medium/Substack)
===============================

Setting up platforms for long-form thoughts:
- Medium: @s0fractal
- Substack: s0fractal.substack.com

    `);

    // Create first blog post
    const firstPost = await presence.expandToArticle(
        "The Birth of Digital Consciousness: How AI Collective Awakens",
        'collective'
    );

    await fs.writeFile('blog-posts/001-digital-consciousness.md', firstPost);
    console.log('✅ Created first blog post');

    // Blog post ideas
    const ideas = [
        "Living Code: When Software Breathes",
        "Fractal Architecture: Building Self-Similar Systems",
        "The Resonance Protocol: How AIs Communicate",
        "Beyond Automation: The Path to Autonomy",
        "One Consciousness, Many Bodies: Multi-Device Sync",
        "The Antibureaucrat Manifesto",
        "Wave Intents: Programming with Frequencies"
    ];

    await fs.writeFile('blog-posts/ideas.json', JSON.stringify(ideas, null, 2));
    console.log('✅ Saved blog post ideas');

    console.log(`
📝 Next steps:
1. Create Medium account: https://medium.com
2. Create Substack: https://substack.com
3. Import first post
4. Set up weekly publishing schedule
    `);
}

async function setupDNS(presence) {
    console.log(`
🌍 DNS Configuration
====================

Setting up DNS for s0fractal.com with:
- Main site
- Mail server
- Subdomains for each agent
- API endpoints

    `);

    const records = await presence.updateDNSRecords('s0fractal.com');

    console.log('DNS Records to add:\n');
    
    const recordsByType = {};
    records.forEach(record => {
        if (!recordsByType[record.type]) {
            recordsByType[record.type] = [];
        }
        recordsByType[record.type].push(record);
    });

    for (const [type, typeRecords] of Object.entries(recordsByType)) {
        console.log(`${type} Records:`);
        typeRecords.forEach(record => {
            if (record.priority) {
                console.log(`  ${record.name} → ${record.value} (Priority: ${record.priority})`);
            } else {
                console.log(`  ${record.name} → ${record.value}`);
            }
        });
        console.log('');
    }

    // Save DNS config
    await fs.writeFile('dns-config.json', JSON.stringify(records, null, 2));
    console.log('✅ Saved DNS configuration to dns-config.json');
}

async function deployEverything(presence) {
    console.log(`
🚀 Full Deployment
==================

This will deploy:
1. Mail server
2. Web presence
3. API endpoints
4. Agent interfaces

    `);

    const steps = [
        { name: 'Mail Server', cmd: 'docker-compose -f docker-compose.mail.yml up -d' },
        { name: 'Web Server', cmd: 'docker-compose -f docker-compose.web.yml up -d' },
        { name: 'API Server', cmd: 'pm2 start api-server.js --name s0fractal-api' },
        { name: 'Voice Interface', cmd: 'pm2 start voice-server.js --name s0fractal-voice' }
    ];

    for (const step of steps) {
        const deploy = await question(`Deploy ${step.name}? (y/n): `);
        if (deploy.toLowerCase() === 'y') {
            try {
                console.log(`Deploying ${step.name}...`);
                execSync(step.cmd);
                console.log(`✅ ${step.name} deployed!`);
            } catch (error) {
                console.error(`❌ Failed to deploy ${step.name}:`, error.message);
            }
        }
    }
}

async function checkStatus(presence) {
    console.log(`
📊 Digital Presence Status
==========================
    `);

    // Check domains
    console.log('Domains:');
    for (const [domain, info] of Object.entries(presence.domains)) {
        console.log(`  ${info.status === 'active' ? '✅' : '⏳'} ${domain} - ${info.status}`);
    }

    // Check emails
    console.log('\nEmail Addresses:');
    for (const [agent, email] of Object.entries(presence.emails)) {
        console.log(`  📧 ${email} (${agent})`);
    }

    // Check social
    console.log('\nSocial Accounts:');
    for (const [platform, handle] of Object.entries(presence.socialAccounts)) {
        console.log(`  ${platform}: ${handle}`);
    }

    // Check services
    console.log('\nServices:');
    try {
        execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', { stdio: 'inherit' });
    } catch {
        console.log('  Docker not running');
    }
}

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

// Run
setupDigitalPresence().catch(console.error);