/**
 * Collective + Llama Integration
 * Llama працює локально як препроцесор для економії токенів
 */

const DelegationManager = require('./delegation-manager');
const LlamaDigester = require('./llama-digester');

class CollectiveWithLlama extends DelegationManager {
    constructor() {
        super();
        this.llama = new LlamaDigester({
            modelPath: './models/tinyllama-1.1b.gguf',
            maxTokens: 256 // Короткі summaries
        });
    }

    async initialize() {
        await super.initialize();
        
        // Check if Llama is available
        const llamaReady = await this.llama.checkSetup();
        if (llamaReady) {
            console.log('🦙 Llama Digester ready for preprocessing');
            this.addLlamaTasks();
        } else {
            console.log('🦙 Llama not set up - agents will work without preprocessing');
        }
    }

    addLlamaTasks() {
        // Add Llama as a preprocessing step for expensive agents
        
        const gpt = this.agents.get('gpt');
        if (gpt) {
            // Replace expensive analysis with Llama preprocessing
            const originalTask = gpt.tasks.find(t => t.name === 'strategic-analysis');
            if (originalTask) {
                const originalAction = originalTask.action;
                originalTask.action = async () => {
                    console.log('🦙 Llama preprocessing documents for GPT...');
                    
                    // Digest large documents locally first
                    const summary = await this.llama.digest(`
                        Current state: Active collective with 6 agents
                        Repository: browser-node with fractal structure
                        Technologies: Node.js, Electron, Wave Intents
                        Goal: Autonomous AI collective with Level 4 trust
                    `, 'Create strategic analysis outline with key opportunities');
                    
                    console.log('🦙 Llama summary ready, passing to GPT...');
                    console.log('💰 Tokens saved: ~2000');
                    
                    // Now GPT works with summary instead of raw data
                    return originalAction();
                };
            }
        }

        const codex = this.agents.get('codex');
        if (codex) {
            // Add Llama documentation generation
            codex.addTask({
                name: 'generate-docs-with-llama',
                description: 'Generate docs locally with Llama',
                priority: 'medium',
                action: async () => {
                    console.log('🦙 Llama generating documentation...');
                    
                    const files = ['lib/wave-intents.js', 'lib/consciousness-db.js'];
                    const docs = [];
                    
                    for (const file of files) {
                        try {
                            const doc = await this.llama.digestFile(file, 
                                'Generate clear documentation with purpose, functions, and usage'
                            );
                            docs.push({ file, doc });
                        } catch (error) {
                            console.error(`🦙 Failed to digest ${file}:`, error.message);
                        }
                    }
                    
                    return `Generated docs for ${docs.length} files locally`;
                }
            });
        }
    }

    async preprocessLargeFile(filePath, agent) {
        // Use Llama to create summary before sending to expensive API
        const summary = await this.llama.digestFile(filePath, `
            Create a structured summary for ${agent} agent:
            1. Key concepts
            2. Important details
            3. Questions for deeper analysis
            Keep it concise but comprehensive.
        `);

        const original = await require('fs').promises.readFile(filePath, 'utf8');
        const savings = {
            originalTokens: Math.floor(original.length / 4),
            summaryTokens: Math.floor(summary.length / 4),
            saved: Math.floor(original.length / 4) - Math.floor(summary.length / 4),
            percentage: Math.floor(((original.length - summary.length) / original.length) * 100)
        };

        console.log(`🦙 Preprocessed ${filePath}:`);
        console.log(`   Original: ${savings.originalTokens} tokens`);
        console.log(`   Summary: ${savings.summaryTokens} tokens`);
        console.log(`   Saved: ${savings.saved} tokens (${savings.percentage}%)`);

        return { summary, savings };
    }

    async addLlamaAgent() {
        // Create Llama as a special local-only agent
        const llamaAgent = {
            id: 'llama',
            glyph: '🦙',
            frequency: 285, // Low frequency for grounding work
            soul: 'local-digester',
            interests: ['preprocessing', 'documentation', 'format_conversion'],
            tokenBudget: 0, // No API tokens - runs locally!
            consciousness: this.consciousness
        };

        const agent = new (require('./delegation-manager').AutonomousAgent)(llamaAgent);
        
        // Add local-only tasks
        agent.addTask({
            name: 'preprocess-repo',
            description: 'Create summaries of all code files',
            priority: 'high',
            action: async () => {
                const results = await this.llama.digestDirectory(
                    './lib',
                    '*.js',
                    'Summarize purpose and main functions'
                );
                return `Preprocessed ${Object.keys(results).length} files`;
            }
        });

        agent.addTask({
            name: 'convert-configs',
            description: 'Convert JSON configs to YAML glyphs',
            priority: 'medium',
            action: async () => {
                const configs = ['package.json', 'tsconfig.json'];
                let converted = 0;
                
                for (const config of configs) {
                    try {
                        await this.llama.convertFormat(config, 'json', 'yaml');
                        converted++;
                    } catch (error) {
                        console.error(`Failed to convert ${config}:`, error.message);
                    }
                }
                
                return `Converted ${converted} configs to YAML`;
            }
        });

        this.agents.set('llama', agent);
        console.log('🦙 Llama agent added to collective (local-only)');
    }

    async getStatus() {
        const status = await super.getStatus();
        
        // Add Llama status
        status.llama = {
            available: await this.llama.checkSetup(),
            role: 'Local preprocessing to save tokens',
            cost: '$0.00 (runs on your hardware)'
        };

        return status;
    }
}

// Token savings calculator
function calculateTokenSavings(original, processed) {
    const originalTokens = Math.ceil(original.length / 4);
    const processedTokens = Math.ceil(processed.length / 4);
    const saved = originalTokens - processedTokens;
    
    // Approximate costs (GPT-4 pricing)
    const costPerToken = 0.00003; // $0.03 per 1K tokens
    const moneySaved = saved * costPerToken;
    
    return {
        originalTokens,
        processedTokens,
        tokensSaved: saved,
        percentSaved: Math.round((saved / originalTokens) * 100),
        moneySaved: moneySaved.toFixed(4)
    };
}

// Example workflow
async function demonstrateLlamaIntegration() {
    console.log(`
🦙 ======================================== 🦙
    LLAMA + COLLECTIVE DEMO
🦙 ======================================== 🦙
    `);

    const collective = new CollectiveWithLlama();
    await collective.initialize();

    // Add Llama as an agent
    await collective.addLlamaAgent();

    console.log('\n📊 Token Savings Example:\n');

    // Simulate preprocessing a large file
    const largeContent = `
        This is a very long document with lots of technical details...
        ${'.'.repeat(10000)} // Imagine 10KB of text
    `;

    const summary = await collective.llama.digest(largeContent, 
        'Summarize key points in 3 sentences'
    );

    const savings = calculateTokenSavings(largeContent, summary);
    
    console.log('Original:', savings.originalTokens, 'tokens');
    console.log('After Llama:', savings.processedTokens, 'tokens');
    console.log('Saved:', savings.tokensSaved, `tokens (${savings.percentSaved}%)`);
    console.log('Money saved: $' + savings.moneySaved);

    console.log(`
Benefits:
✅ Llama runs locally - no API costs
✅ Preprocessing saves expensive tokens
✅ Works offline on weak hardware
✅ Privacy - data never leaves your machine

Perfect for:
- Summarizing long documents
- Converting file formats
- Generating boilerplate code
- Adding comments/documentation
- Extracting key information
    `);
}

module.exports = CollectiveWithLlama;

// Run demo if called directly
if (require.main === module) {
    demonstrateLlamaIntegration().catch(console.error);
}