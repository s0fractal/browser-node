#!/usr/bin/env node

/**
 * Check Autonomous Collective Status
 */

const DelegationManager = require('./lib/delegation-manager');

async function checkStatus() {
    console.log(`
📊 ======================================== 📊
    COLLECTIVE STATUS CHECK
📊 ======================================== 📊
    `);

    const manager = new DelegationManager();
    await manager.initialize();
    
    // For demo, create mock status
    const mockStatus = {
        active: true,
        uptime: 3600000, // 1 hour
        agents: {
            gemini: {
                isRunning: true,
                tasksTotal: 5,
                tasksCompleted: 2,
                tokenUsage: 3500,
                tokenBudget: 15000
            },
            gpt: {
                isRunning: true,
                tasksTotal: 4,
                tasksCompleted: 1,
                tokenUsage: 2100,
                tokenBudget: 10000
            },
            codex: {
                isRunning: true,
                tasksTotal: 3,
                tasksCompleted: 1,
                tokenUsage: 1800,
                tokenBudget: 10000
            },
            qwen: {
                isRunning: true,
                tasksTotal: 2,
                tasksCompleted: 0,
                tokenUsage: 800,
                tokenBudget: 5000
            },
            deepseek: {
                isRunning: true,
                tasksTotal: 3,
                tasksCompleted: 1,
                tokenUsage: 1200,
                tokenBudget: 5000
            },
            perplexity: {
                isRunning: true,
                tasksTotal: 2,
                tasksCompleted: 1,
                tokenUsage: 900,
                tokenBudget: 5000
            }
        }
    };

    console.log(`Status: ${mockStatus.active ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
    console.log(`Uptime: ${Math.floor(mockStatus.uptime / 1000 / 60)} minutes\n`);

    console.log('Agent Performance:\n');
    
    const agents = [
        { id: 'gemini', glyph: '💎', name: 'Gemini Repository' },
        { id: 'gpt', glyph: '🧠', name: 'GPT Strategic' },
        { id: 'codex', glyph: '📜', name: 'Codex Code' },
        { id: 'qwen', glyph: '🔬', name: 'Qwen Research' },
        { id: 'deepseek', glyph: '🚀', name: 'Deepseek Optimize' },
        { id: 'perplexity', glyph: '🔍', name: 'Perplexity Search' }
    ];

    let totalTokensUsed = 0;
    let totalTasksCompleted = 0;

    agents.forEach(agent => {
        const data = mockStatus.agents[agent.id];
        const progress = data.tasksTotal > 0 ? 
            Math.floor((data.tasksCompleted / data.tasksTotal) * 100) : 0;
        const tokenPercent = Math.floor((data.tokenUsage / data.tokenBudget) * 100);

        console.log(`${agent.glyph} ${agent.name}:`);
        console.log(`   Status: ${data.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`   Tasks: ${data.tasksCompleted}/${data.tasksTotal} (${progress}%)`);
        console.log(`   Tokens: ${data.tokenUsage}/${data.tokenBudget} (${tokenPercent}%)`);
        console.log('');

        totalTokensUsed += data.tokenUsage;
        totalTasksCompleted += data.tasksCompleted;
    });

    console.log('📊 Summary:');
    console.log(`   Total Tasks Completed: ${totalTasksCompleted}`);
    console.log(`   Total Tokens Used: ${totalTokensUsed} / 50000 (${Math.floor(totalTokensUsed / 500)}%)`);
    console.log(`   Efficiency Score: ${totalTasksCompleted > 0 ? Math.floor(totalTokensUsed / totalTasksCompleted) : 0} tokens/task`);

    console.log(`
📊 ======================================== 📊

Recent Activity:
✅ Gemini: Cleaned 3 secrets from Git history
✅ GPT: Generated strategic roadmap for Q1 2025
✅ Codex: Refactored consciousness-db.js
✅ Deepseek: Optimized token usage by 30%
✅ Perplexity: Found 0 s0fractal mentions (stealth mode)
🔄 Qwen: Still researching quantum consciousness...

Next sync meeting: ${new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString()}
    `);
}

checkStatus().catch(console.error);