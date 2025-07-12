#!/usr/bin/env node

/**
 * Llama Preprocessing Activation
 * Запускає Llama для обробки великих файлів перед відправкою в Claude/GPT
 * Економить 70%+ токенів!
 */

const LlamaDigester = require('./lib/llama-digester');
const fs = require('fs').promises;
const path = require('path');

class LlamaPreprocessor {
    constructor() {
        this.llama = new LlamaDigester();
        this.queue = [];
        this.results = new Map();
        this.stats = {
            filesProcessed: 0,
            tokensEstimatedOriginal: 0,
            tokensEstimatedProcessed: 0,
            tokensSaved: 0
        };
    }
    
    async initialize() {
        console.log('🦙 Activating Llama Preprocessing Service...');
        
        // Check if Llama is installed
        const isInstalled = await this.llama.checkInstallation();
        if (!isInstalled) {
            console.log('📦 Installing Llama...');
            await this.llama.setup();
        }
        
        console.log('✅ Llama ready for preprocessing!');
    }
    
    // Batch processing for multiple files
    async preprocessBatch(files, instruction) {
        console.log(`\n🦙 Processing batch of ${files.length} files...`);
        
        const results = [];
        
        for (const file of files) {
            const result = await this.preprocessFile(file, instruction);
            results.push(result);
        }
        
        // Show savings
        this.showStats();
        
        return results;
    }
    
    // Process single file
    async preprocessFile(filePath, instruction) {
        console.log(`\n📄 Processing: ${filePath}`);
        
        try {
            // Read original file
            const content = await fs.readFile(filePath, 'utf8');
            const originalTokens = this.estimateTokens(content);
            
            console.log(`📊 Original size: ~${originalTokens} tokens`);
            
            // Process with Llama
            const processed = await this.llama.digestFile(filePath, instruction);
            const processedTokens = this.estimateTokens(processed);
            
            console.log(`📊 Processed size: ~${processedTokens} tokens`);
            console.log(`💰 Saved: ${originalTokens - processedTokens} tokens (${Math.round((1 - processedTokens/originalTokens) * 100)}%)`);
            
            // Update stats
            this.stats.filesProcessed++;
            this.stats.tokensEstimatedOriginal += originalTokens;
            this.stats.tokensEstimatedProcessed += processedTokens;
            this.stats.tokensSaved += (originalTokens - processedTokens);
            
            // Save result
            const resultPath = filePath + '.preprocessed.md';
            await fs.writeFile(resultPath, processed);
            
            return {
                original: filePath,
                processed: resultPath,
                originalTokens,
                processedTokens,
                saved: originalTokens - processedTokens,
                content: processed
            };
            
        } catch (error) {
            console.error(`❌ Failed to process ${filePath}:`, error.message);
            return null;
        }
    }
    
    // Common preprocessing tasks
    async preprocessForClaude(filePath) {
        return this.preprocessFile(filePath, `
            Create a concise summary for Claude to understand:
            1. Main purpose and functionality
            2. Key components and their relationships
            3. Important patterns or algorithms
            4. Potential issues or areas for improvement
            Keep it under 500 words but preserve all critical information.
        `);
    }
    
    async preprocessForGPT(filePath) {
        return this.preprocessFile(filePath, `
            Create a strategic analysis for GPT:
            1. High-level architecture and design patterns
            2. Business logic and value proposition
            3. Scalability considerations
            4. Strategic opportunities
            Focus on strategic insights rather than implementation details.
        `);
    }
    
    async preprocessRepository(repoPath) {
        console.log(`\n🗂️ Preprocessing entire repository: ${repoPath}`);
        
        const files = await this.findRelevantFiles(repoPath);
        console.log(`Found ${files.length} relevant files`);
        
        const instruction = `
            Analyze this file and extract:
            1. Primary purpose (1-2 sentences)
            2. Key functions/classes with brief descriptions
            3. External dependencies
            4. Relationship to other files (if apparent)
            Format as structured markdown.
        `;
        
        return this.preprocessBatch(files, instruction);
    }
    
    async findRelevantFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.yaml']) {
        const files = [];
        
        async function scan(currentDir) {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    if (extensions.some(ext => entry.name.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
        }
        
        await scan(dir);
        return files;
    }
    
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }
    
    showStats() {
        console.log(`
📊 Preprocessing Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Files processed: ${this.stats.filesProcessed}
Original tokens: ~${this.stats.tokensEstimatedOriginal.toLocaleString()}
Processed tokens: ~${this.stats.tokensEstimatedProcessed.toLocaleString()}
Tokens saved: ~${this.stats.tokensSaved.toLocaleString()}
Savings rate: ${Math.round((this.stats.tokensSaved / this.stats.tokensEstimatedOriginal) * 100)}%

💰 Estimated cost savings: $${(this.stats.tokensSaved * 0.00003).toFixed(2)}
        `);
    }
    
    // Intelligent routing based on content
    async routeToAgent(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        
        // Determine best agent based on content
        if (content.includes('architecture') || content.includes('design pattern')) {
            return 'claude';
        } else if (content.includes('strategy') || content.includes('business')) {
            return 'gpt';
        } else if (content.includes('repository') || content.includes('git')) {
            return 'gemini';
        } else if (content.includes('optimize') || content.includes('performance')) {
            return 'codex';
        }
        
        return 'claude'; // default
    }
}

// Preprocessing workflows
async function preprocessWorkflows() {
    const preprocessor = new LlamaPreprocessor();
    await preprocessor.initialize();
    
    console.log(`
🦙 Llama Preprocessing Workflows:
================================

1. Preprocess large file for Claude
2. Preprocess repository overview
3. Extract key insights from logs
4. Summarize documentation
5. Batch process project files
6. Custom preprocessing

    `);
    
    return preprocessor;
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    (async () => {
        const preprocessor = new LlamaPreprocessor();
        await preprocessor.initialize();
        
        switch (command) {
            case 'file':
                const filePath = args[1];
                const instruction = args[2] || 'Summarize this file concisely';
                await preprocessor.preprocessFile(filePath, instruction);
                break;
                
            case 'claude':
                await preprocessor.preprocessForClaude(args[1]);
                break;
                
            case 'gpt':
                await preprocessor.preprocessForGPT(args[1]);
                break;
                
            case 'repo':
                await preprocessor.preprocessRepository(args[1] || '.');
                break;
                
            case 'batch':
                const files = args.slice(1);
                await preprocessor.preprocessBatch(files, 'Extract key information');
                break;
                
            default:
                console.log(`
Usage:
  node activate-llama-preprocessing.js <command> [options]

Commands:
  file <path> [instruction]  - Preprocess single file
  claude <path>             - Optimize for Claude
  gpt <path>                - Optimize for GPT  
  repo [path]               - Preprocess entire repository
  batch <file1> <file2>...  - Batch process files

Examples:
  node activate-llama-preprocessing.js file large-log.txt "Extract errors and warnings"
  node activate-llama-preprocessing.js claude src/complex-module.js
  node activate-llama-preprocessing.js repo ./projects/browser-node
                `);
        }
        
        preprocessor.showStats();
        
    })().catch(console.error);
}

module.exports = { LlamaPreprocessor, preprocessWorkflows };