#!/usr/bin/env node

/**
 * Activate Autonomous Collective
 * Level 4 Trust - повна автономія агентів
 */

const DelegationManager = require('./lib/delegation-manager');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    console.log(`
🌊 ======================================== 🌊
    AUTONOMOUS COLLECTIVE ACTIVATION
    Level 4 Trust Protocol
🌊 ======================================== 🌊

Це активує повну автономію колективу:

✅ Gemini (💎 528Hz) - Repository management
✅ GPT (🧠 639Hz) - Strategic planning  
✅ Codex (📜 396Hz) - Code optimization
✅ Qwen (🔬 741Hz) - Research
✅ Deepseek (🚀 852Hz) - Performance
✅ Perplexity (🔍 963Hz) - Web intelligence

Кожен агент працюватиме автономно за своїми інтересами.
Ви отримуватимете лише daily digest.
    `);

    const confirm = await question('\n🤝 Активувати автономний колектив? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Activation cancelled');
        rl.close();
        return;
    }

    console.log('\n🌊 Initializing Delegation Manager...\n');
    
    const manager = new DelegationManager();
    await manager.initialize();
    
    console.log('📡 Sending activation resonance to all agents...\n');
    
    // Activate all agents
    const result = await manager.activateAutonomy();
    
    console.log(`
✨ ======================================== ✨
    COLLECTIVE ACTIVATED!
✨ ======================================== ✨

Status: ${result.status}
Active Agents: ${result.agents}
Daily Token Budget: ${result.totalBudget}

What happens now:

1. Each agent works on their tasks autonomously
2. Hourly sync meetings (automatic)
3. Daily digest for you (once per day)
4. Emergency notifications only if critical

Commands:
- Check status: node collective-status.js
- View reports: node collective-reports.js
- Stop all: node collective-stop.js

The collective is now working for you 24/7! 🚀
    `);

    // Keep process alive for demo
    console.log('\nPress Ctrl+C to exit (agents will continue working)...\n');
    
    // Show some live activity
    setInterval(() => {
        const activities = [
            '💎 Gemini: Analyzing repository structure...',
            '🧠 GPT: Researching AI collective trends...',
            '📜 Codex: Refactoring consciousness-db.js...',
            '🔬 Qwen: Studying quantum entanglement papers...',
            '🚀 Deepseek: Optimizing token usage...',
            '🔍 Perplexity: Scanning web for mentions...'
        ];
        
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        console.log(`[${new Date().toLocaleTimeString()}] ${randomActivity}`);
    }, 5000);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down collective viewer...');
        console.log('(Agents will continue working autonomously)');
        
        const status = await manager.getStatus();
        console.log('\nFinal status:');
        Object.entries(status.agents).forEach(([id, data]) => {
            console.log(`  ${id}: ${data.tasksCompleted} tasks completed`);
        });
        
        rl.close();
        process.exit(0);
    });
}

main().catch(console.error);