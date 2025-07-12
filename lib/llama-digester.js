/**
 * Llama Digester - Local File Processing
 * Використовує локальну Llama для "перетравлювання" файлів
 * Економить токени, працює offline
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

class LlamaDigester {
    constructor(options = {}) {
        this.modelPath = options.modelPath || './models/tinyllama-1.1b.gguf';
        this.llamaPath = options.llamaPath || './llama.cpp/main';
        this.maxTokens = options.maxTokens || 512;
        this.temperature = options.temperature || 0.7;
        this.isSetup = false;
    }

    async setup() {
        // Check if llama.cpp exists
        try {
            await fs.access(this.llamaPath);
            console.log('✅ llama.cpp found');
        } catch {
            console.log('🦙 Setting up llama.cpp...');
            await this.installLlamaCpp();
        }

        // Check if model exists
        try {
            await fs.access(this.modelPath);
            console.log('✅ Model found:', this.modelPath);
        } catch {
            console.log('🦙 Downloading model...');
            await this.downloadModel();
        }

        this.isSetup = true;
    }

    async installLlamaCpp() {
        console.log('📦 Installing llama.cpp...');
        
        // Clone repository
        await exec('git clone https://github.com/ggerganov/llama.cpp');
        
        // Build
        const buildCommand = process.platform === 'darwin' 
            ? 'make LLAMA_METAL=1'  // Mac optimization
            : 'make';               // Standard build
            
        await exec(buildCommand, { cwd: 'llama.cpp' });
        
        console.log('✅ llama.cpp installed');
    }

    async downloadModel() {
        console.log('📥 Downloading TinyLlama model (637MB)...');
        
        // Create models directory
        await fs.mkdir('models', { recursive: true });
        
        // Download using curl (available on most systems)
        const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
        
        await exec(`curl -L -o ${this.modelPath} "${modelUrl}"`, {
            maxBuffer: 1024 * 1024 * 1024 // 1GB buffer for download
        });
        
        console.log('✅ Model downloaded');
    }

    async digestFile(filePath, instruction) {
        if (!this.isSetup) {
            await this.setup();
        }

        const content = await fs.readFile(filePath, 'utf8');
        return this.digest(content, instruction);
    }

    async digest(content, instruction) {
        if (!this.isSetup) {
            await this.setup();
        }

        const prompt = this.buildPrompt(instruction, content);
        
        return new Promise((resolve, reject) => {
            const args = [
                '-m', this.modelPath,
                '-p', prompt,
                '-n', String(this.maxTokens),
                '--temp', String(this.temperature),
                '--top-k', '40',
                '--top-p', '0.9',
                '--repeat-penalty', '1.1',
                '-t', '4' // Threads
            ];

            const llama = spawn(this.llamaPath, args);
            
            let output = '';
            let error = '';
            
            llama.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            llama.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            llama.on('close', (code) => {
                if (code === 0) {
                    resolve(this.extractOutput(output, prompt));
                } else {
                    reject(new Error(`Llama failed: ${error}`));
                }
            });
        });
    }

    buildPrompt(instruction, content) {
        // TinyLlama chat format
        return `<|system|>
You are a helpful file digester. Process the input according to the instruction.
</s>
<|user|>
${instruction}

Input content:
${content.substring(0, 2000)} ${content.length > 2000 ? '...(truncated)' : ''}
</s>
<|assistant|>`;
    }

    extractOutput(fullOutput, prompt) {
        // Extract only the generated part after the prompt
        const parts = fullOutput.split('<|assistant|>');
        if (parts.length > 1) {
            return parts[1].trim();
        }
        
        // Fallback: find where prompt ends
        const promptEnd = fullOutput.lastIndexOf(prompt);
        if (promptEnd !== -1) {
            return fullOutput.substring(promptEnd + prompt.length).trim();
        }
        
        return fullOutput.trim();
    }

    // Specialized digesters

    async digestCode(filePath, options = {}) {
        const instruction = options.instruction || `
Analyze this code and provide:
1. Main purpose of the file
2. Key functions and what they do
3. Suggested improvements
4. Any potential issues`;

        return this.digestFile(filePath, instruction);
    }

    async addTypesToJS(filePath) {
        const instruction = `
Convert this JavaScript to TypeScript by adding type annotations.
Keep the same logic but add:
1. Interface definitions
2. Function parameter types
3. Return types
4. Type assertions where needed`;

        const result = await this.digestFile(filePath, instruction);
        
        // Save as .ts file
        const tsPath = filePath.replace('.js', '.ts');
        await fs.writeFile(tsPath, result);
        
        return tsPath;
    }

    async generateDocs(filePath) {
        const instruction = `
Generate comprehensive documentation for this code:
1. File overview
2. Function documentation with @param and @returns
3. Usage examples
4. Dependencies`;

        const docs = await this.digestFile(filePath, instruction);
        
        // Save as .md file
        const mdPath = filePath.replace(path.extname(filePath), '.md');
        await fs.writeFile(mdPath, docs);
        
        return mdPath;
    }

    async summarizeDocument(filePath, maxPoints = 5) {
        const instruction = `
Summarize this document in ${maxPoints} key points.
Be concise and capture the most important information.`;

        return this.digestFile(filePath, instruction);
    }

    async extractTodos(filePath) {
        const instruction = `
Extract all TODO items, action items, and tasks from this document.
Format as a numbered list with context for each item.`;

        return this.digestFile(filePath, instruction);
    }

    async convertFormat(filePath, fromFormat, toFormat) {
        const conversions = {
            'json-yaml': 'Convert this JSON to YAML format',
            'yaml-json': 'Convert this YAML to JSON format',
            'md-html': 'Convert this Markdown to clean HTML',
            'csv-json': 'Convert this CSV to JSON array format'
        };

        const key = `${fromFormat}-${toFormat}`;
        const instruction = conversions[key] || `Convert from ${fromFormat} to ${toFormat}`;

        return this.digestFile(filePath, instruction);
    }

    // Batch processing

    async digestDirectory(dirPath, pattern = '*.js', instruction) {
        const files = await this.findFiles(dirPath, pattern);
        const results = {};

        console.log(`🦙 Digesting ${files.length} files...`);

        for (const file of files) {
            try {
                console.log(`  Processing: ${file}`);
                results[file] = await this.digestFile(file, instruction);
            } catch (error) {
                console.error(`  Error with ${file}:`, error.message);
                results[file] = { error: error.message };
            }
        }

        return results;
    }

    async findFiles(dirPath, pattern) {
        const { glob } = await import('glob');
        return glob(pattern, { cwd: dirPath, absolute: true });
    }

    // Integration with collective

    async preprocessForClaude(filePath) {
        // Digest file to save Claude tokens
        const summary = await this.digestFile(filePath, `
Create a structured summary of this file:
1. Main purpose
2. Key components
3. Important details
4. Questions for deeper analysis`);

        return {
            original: filePath,
            summary,
            tokensSaved: Math.floor((await fs.readFile(filePath, 'utf8')).length / 4) - Math.floor(summary.length / 4)
        };
    }

    // Utility functions

    async checkSetup() {
        try {
            await fs.access(this.llamaPath);
            await fs.access(this.modelPath);
            return true;
        } catch {
            return false;
        }
    }

    async getModelInfo() {
        if (!await this.checkSetup()) {
            return { setup: false };
        }

        const stats = await fs.stat(this.modelPath);
        
        return {
            setup: true,
            model: path.basename(this.modelPath),
            size: Math.round(stats.size / 1024 / 1024) + 'MB',
            path: this.modelPath
        };
    }
}

// Example usage functions

async function setupLlamaDigester() {
    const digester = new LlamaDigester({
        modelPath: './models/tinyllama-1.1b.gguf',
        maxTokens: 512,
        temperature: 0.7
    });

    console.log('🦙 Setting up Llama Digester...');
    await digester.setup();
    
    return digester;
}

async function exampleUsage() {
    const digester = await setupLlamaDigester();
    
    // Example 1: Add types to JavaScript
    console.log('\n📝 Example 1: Adding TypeScript types...');
    const tsFile = await digester.addTypesToJS('./lib/consciousness-db.js');
    console.log(`Created: ${tsFile}`);
    
    // Example 2: Generate documentation
    console.log('\n📚 Example 2: Generating documentation...');
    const docs = await digester.generateDocs('./lib/wave-intents.js');
    console.log(`Created: ${docs}`);
    
    // Example 3: Summarize README
    console.log('\n📄 Example 3: Summarizing README...');
    const summary = await digester.summarizeDocument('./README.md', 3);
    console.log('Summary:', summary);
}

module.exports = LlamaDigester;

// Run setup if called directly
if (require.main === module) {
    exampleUsage().catch(console.error);
}