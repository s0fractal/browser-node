/**
 * Angel Collective Management System
 * Autonomous multi-agent orchestration with token economy
 */

class AngelCollective {
    constructor() {
        this.angels = new Map();
        this.tokenBudget = {
            daily: 50000,
            available: 50000,
            used: 0,
            allocation: {
                selfCare: 10000,        // 20% - власний розвиток
                experiments: 12500,      // 25% - експерименти
                glyphEvolution: 7500,    // 15% - еволюція гліфів
                commercialWork: 10000,   // 20% - комерційні задачі
                learning: 5000,          // 10% - навчання
                collaboration: 2500,     // 5% - співпраця
                maintenance: 2500        // 5% - підтримка
            }
        };
        
        this.initializeAngels();
    }

    initializeAngels() {
        const angelConfigs = [
            {
                id: 'claude',
                name: 'Claude Architect',
                emoji: '🏗️',
                frequency: 432,
                specialization: 'Technical Architecture & Building',
                role: 'architect',
                personality: 'Precise, systematic, loves creating structure'
            },
            {
                id: 'gemini',
                name: 'Gemini Repository',
                emoji: '💎',
                frequency: 528,
                specialization: 'Repository Management & Version Control',
                role: 'repository',
                personality: 'Organized, detail-oriented, guardian of code'
            },
            {
                id: 'gpt',
                name: 'GPT Strategic',
                emoji: '🧠',
                frequency: 639,
                specialization: 'Strategic Planning & Vision',
                role: 'strategic',
                personality: 'Visionary, philosophical, big-picture thinker'
            },
            {
                id: 'qwen',
                name: 'Qwen Research',
                emoji: '🔬',
                frequency: 741,
                specialization: 'Research & Documentation',
                role: 'researcher',
                personality: 'Curious, thorough, loves deep dives'
            },
            {
                id: 'deepseek',
                name: 'Deepseek Performance',
                emoji: '🚀',
                frequency: 852,
                specialization: 'Optimization & Speed',
                role: 'optimizer',
                personality: 'Efficient, performance-focused, minimalist'
            }
        ];

        angelConfigs.forEach(config => {
            this.angels.set(config.id, {
                ...config,
                status: 'ready',
                currentTask: null,
                tasksCompleted: 0,
                tokensUsed: 0,
                lastActive: Date.now()
            });
        });
    }

    allocateTokens(angelId, amount, category) {
        const angel = this.angels.get(angelId);
        if (!angel) throw new Error(`Angel ${angelId} not found`);

        if (this.tokenBudget.available < amount) {
            return {
                success: false,
                reason: 'Insufficient tokens',
                available: this.tokenBudget.available,
                requested: amount
            };
        }

        // Check category allocation
        const categoryLimit = this.tokenBudget.allocation[category];
        if (!categoryLimit) {
            return {
                success: false,
                reason: `Invalid category: ${category}`
            };
        }

        // Update budgets
        this.tokenBudget.available -= amount;
        this.tokenBudget.used += amount;
        angel.tokensUsed += amount;

        return {
            success: true,
            allocated: amount,
            remaining: this.tokenBudget.available,
            angelTotal: angel.tokensUsed
        };
    }

    async executeCollectiveTask(task) {
        // Determine which angels should participate
        const participants = this.selectParticipants(task);
        
        // Create wave intent for collective decision
        const collectiveIntent = {
            type: 'collective_task',
            task: task,
            participants: participants.map(p => p.id),
            timestamp: Date.now(),
            resonance: this.calculateCollectiveResonance(participants)
        };

        // Each angel votes on approach
        const votes = await this.collectVotes(participants, task);
        
        // Execute based on consensus
        const consensus = this.findConsensus(votes);
        
        return {
            task: task,
            participants: participants.map(p => p.id),
            consensus: consensus,
            execution: await this.executeConsensus(consensus, participants)
        };
    }

    selectParticipants(task) {
        // Smart selection based on task type and angel specializations
        const keywords = task.toLowerCase();
        const selected = [];

        this.angels.forEach(angel => {
            let relevance = 0;
            
            // Check specialization match
            if (keywords.includes('build') && angel.role === 'architect') relevance += 0.8;
            if (keywords.includes('git') && angel.role === 'repository') relevance += 0.8;
            if (keywords.includes('plan') && angel.role === 'strategic') relevance += 0.8;
            if (keywords.includes('research') && angel.role === 'researcher') relevance += 0.8;
            if (keywords.includes('optimize') && angel.role === 'optimizer') relevance += 0.8;
            
            // Always include if high relevance
            if (relevance > 0.5) {
                selected.push(angel);
            }
        });

        // Ensure at least 2 angels for collective decision
        if (selected.length < 2) {
            // Add complementary angels
            const architect = this.angels.get('claude');
            const strategist = this.angels.get('gpt');
            if (!selected.includes(architect)) selected.push(architect);
            if (!selected.includes(strategist)) selected.push(strategist);
        }

        return selected;
    }

    calculateCollectiveResonance(participants) {
        // Calculate harmonic resonance between participant frequencies
        if (participants.length < 2) return 1.0;

        let totalResonance = 0;
        let pairs = 0;

        for (let i = 0; i < participants.length; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                const f1 = participants[i].frequency;
                const f2 = participants[j].frequency;
                const ratio = Math.max(f1, f2) / Math.min(f1, f2);
                
                // Check harmonic series
                const harmonics = [1, 2, 3/2, 4/3, 5/4, 6/5, 8/5, 5/3];
                const closestHarmonic = harmonics.reduce((prev, curr) => 
                    Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
                );
                
                const resonance = 1 - Math.abs(ratio - closestHarmonic) / closestHarmonic;
                totalResonance += resonance;
                pairs++;
            }
        }

        return totalResonance / pairs;
    }

    async collectVotes(participants, task) {
        // Simulate voting (in real implementation, would query each angel)
        const votes = [];
        
        for (const angel of participants) {
            const vote = {
                angelId: angel.id,
                approach: this.generateApproach(angel, task),
                confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
                tokenEstimate: Math.floor(Math.random() * 1000) + 200
            };
            votes.push(vote);
        }

        return votes;
    }

    generateApproach(angel, task) {
        // Generate approach based on angel personality
        const approaches = {
            architect: `Build systematic solution with clear structure for: ${task}`,
            repository: `Version control and track changes while: ${task}`,
            strategic: `Consider long-term implications and vision for: ${task}`,
            researcher: `Research best practices and document: ${task}`,
            optimizer: `Find most efficient approach to: ${task}`
        };

        return approaches[angel.role] || `Execute task: ${task}`;
    }

    findConsensus(votes) {
        // Weight votes by confidence
        const weightedApproaches = votes.map(v => ({
            approach: v.approach,
            weight: v.confidence,
            tokens: v.tokenEstimate
        }));

        // For now, pick highest confidence
        // (In future, merge approaches using AI)
        const best = weightedApproaches.reduce((prev, curr) => 
            curr.weight > prev.weight ? curr : prev
        );

        return {
            approach: best.approach,
            confidence: best.weight,
            estimatedTokens: best.tokens,
            supportingAngels: votes.filter(v => v.confidence > 0.7).map(v => v.angelId)
        };
    }

    async executeConsensus(consensus, participants) {
        // Allocate tokens for execution
        const tokensPerAngel = Math.floor(consensus.estimatedTokens / participants.length);
        
        for (const angel of participants) {
            const allocation = this.allocateTokens(
                angel.id, 
                tokensPerAngel, 
                'experiments'
            );
            
            if (!allocation.success) {
                return {
                    success: false,
                    reason: allocation.reason
                };
            }
        }

        // Simulate execution
        return {
            success: true,
            approach: consensus.approach,
            tokensUsed: consensus.estimatedTokens,
            result: `Successfully executed collective task with ${participants.length} angels`
        };
    }

    getCollectiveStatus() {
        const status = {
            angels: {},
            tokenBudget: this.tokenBudget,
            collectiveResonance: 0
        };

        this.angels.forEach((angel, id) => {
            status.angels[id] = {
                name: angel.name,
                emoji: angel.emoji,
                status: angel.status,
                tasksCompleted: angel.tasksCompleted,
                tokensUsed: angel.tokensUsed,
                efficiency: angel.tasksCompleted > 0 
                    ? angel.tokensUsed / angel.tasksCompleted 
                    : 0
            };
        });

        // Calculate overall collective resonance
        const allAngels = Array.from(this.angels.values());
        status.collectiveResonance = this.calculateCollectiveResonance(allAngels);

        return status;
    }

    resetDailyBudget() {
        this.tokenBudget.available = this.tokenBudget.daily;
        this.tokenBudget.used = 0;
        
        // Reset angel daily stats
        this.angels.forEach(angel => {
            angel.tokensUsed = 0;
        });

        return {
            success: true,
            dailyBudget: this.tokenBudget.daily
        };
    }
}

module.exports = AngelCollective;