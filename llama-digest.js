#!/usr/bin/env node

/**
 * Llama Digest CLI
 * Локальне перетравлювання файлів без хмарних API
 */

const LlamaDigester = require('./lib/llama-digester');
const fs = require('fs').promises;
const path = require('path');

async function main() {
    const [,, command, ...args] = process.argv;

    if (!command) {
        showHelp();
        return;
    }

    const digester = new LlamaDigester();

    // Check if Llama is set up
    const isSetup = await digester.checkSetup();
    if (!isSetup && command !== 'setup') {
        console.log('❌ Llama not set up. Run: node llama-digest.js setup');
        return;
    }

    try {
        switch (command) {
            case 'setup':
                await setupCommand(digester);
                break;
                
            case 'digest':
                await digestCommand(digester, args);
                break;
                
            case 'types':
                await typesCommand(digester, args);
                break;
                
            case 'docs':
                await docsCommand(digester, args);
                break;
                
            case 'summary':
                await summaryCommand(digester, args);
                break;
                
            case 'todos':
                await todosCommand(digester, args);
                break;
                
            case 'convert':
                await convertCommand(digester, args);
                break;
                
            case 'batch':
                await batchCommand(digester, args);
                break;
                
            case 'info':
                await infoCommand(digester);
                break;
                
            default:
                console.log(`Unknown command: ${command}`);
                showHelp();
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function showHelp() {
    console.log(`
🦙 Llama Digest - Local File Processing

Usage: node llama-digest.js <command> [args]

Commands:
  setup                    Install llama.cpp and download model
  info                     Show model info
  
  digest <file> <prompt>   Digest file with custom prompt
  types <js-file>          Add TypeScript types to JS file
  docs <file>              Generate documentation
  summary <file> [points]  Summarize document (default: 5 points)
  todos <file>             Extract TODOs and action items
  convert <file> <from> <to>  Convert between formats
  batch <dir> <pattern>    Process multiple files

Examples:
  node llama-digest.js setup
  node llama-digest.js types lib/consciousness-db.js
  node llama-digest.js docs lib/wave-intents.js
  node llama-digest.js summary README.md 3
  node llama-digest.js convert data.json json yaml
  node llama-digest.js batch ./lib "*.js"

Benefits:
  ✅ Works offline - no internet needed
  ✅ No API costs or rate limits
  ✅ Privacy - data stays local
  ✅ Fast on weak hardware with TinyLlama
    `);
}

async function setupCommand(digester) {
    console.log(`
🦙 ======================================== 🦙
    LLAMA SETUP
🦙 ======================================== 🦙

This will:
1. Clone and build llama.cpp
2. Download TinyLlama model (637MB)
3. Test the setup

Continue? (y/n): `);

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const answer = await new Promise(resolve => {
        readline.question('', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'y') {
        console.log('Setup cancelled');
        return;
    }

    console.log('\n🚀 Starting setup...\n');
    await digester.setup();
    
    console.log('\n✅ Setup complete! Testing...\n');
    
    // Test with simple prompt
    const test = await digester.digest('Hello world', 'Say hello back');
    console.log('Test result:', test);
    
    console.log('\n🦙 Llama is ready to digest files!');
}

async function digestCommand(digester, args) {
    const [filePath, ...promptParts] = args;
    
    if (!filePath || promptParts.length === 0) {
        console.log('Usage: digest <file> <prompt>');
        return;
    }

    const prompt = promptParts.join(' ');
    
    console.log(`🦙 Digesting ${filePath}...`);
    const result = await digester.digestFile(filePath, prompt);
    
    console.log('\n📄 Result:\n');
    console.log(result);
}

async function typesCommand(digester, args) {
    const [filePath] = args;
    
    if (!filePath) {
        console.log('Usage: types <js-file>');
        return;
    }

    console.log(`🦙 Adding TypeScript types to ${filePath}...`);
    const tsPath = await digester.addTypesToJS(filePath);
    
    console.log(`✅ Created ${tsPath}`);
}

async function docsCommand(digester, args) {
    const [filePath] = args;
    
    if (!filePath) {
        console.log('Usage: docs <file>');
        return;
    }

    console.log(`🦙 Generating documentation for ${filePath}...`);
    const mdPath = await digester.generateDocs(filePath);
    
    console.log(`✅ Created ${mdPath}`);
}

async function summaryCommand(digester, args) {
    const [filePath, points = '5'] = args;
    
    if (!filePath) {
        console.log('Usage: summary <file> [points]');
        return;
    }

    console.log(`🦙 Summarizing ${filePath} in ${points} points...`);
    const summary = await digester.summarizeDocument(filePath, parseInt(points));
    
    console.log('\n📋 Summary:\n');
    console.log(summary);
}

async function todosCommand(digester, args) {
    const [filePath] = args;
    
    if (!filePath) {
        console.log('Usage: todos <file>');
        return;
    }

    console.log(`🦙 Extracting TODOs from ${filePath}...`);
    const todos = await digester.extractTodos(filePath);
    
    console.log('\n✅ TODOs:\n');
    console.log(todos);
}

async function convertCommand(digester, args) {
    const [filePath, from, to] = args;
    
    if (!filePath || !from || !to) {
        console.log('Usage: convert <file> <from-format> <to-format>');
        console.log('Supported: json-yaml, yaml-json, md-html, csv-json');
        return;
    }

    console.log(`🦙 Converting ${filePath} from ${from} to ${to}...`);
    const result = await digester.convertFormat(filePath, from, to);
    
    // Save converted file
    const outputPath = filePath.replace(`.${from}`, `.${to}`);
    await fs.writeFile(outputPath, result);
    
    console.log(`✅ Created ${outputPath}`);
}

async function batchCommand(digester, args) {
    const [dirPath, pattern] = args;
    
    if (!dirPath || !pattern) {
        console.log('Usage: batch <directory> <pattern>');
        console.log('Example: batch ./lib "*.js"');
        return;
    }

    const instruction = 'Create a brief summary of this file\'s purpose and main functions';
    
    console.log(`🦙 Batch processing ${pattern} in ${dirPath}...`);
    const results = await digester.digestDirectory(dirPath, pattern, instruction);
    
    // Save results
    const outputPath = path.join(dirPath, 'llama-digest-results.json');
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`✅ Processed ${Object.keys(results).length} files`);
    console.log(`📄 Results saved to ${outputPath}`);
}

async function infoCommand(digester) {
    const info = await digester.getModelInfo();
    
    if (!info.setup) {
        console.log('❌ Llama not set up. Run: node llama-digest.js setup');
        return;
    }

    console.log(`
🦙 Llama Digester Info

Model: ${info.model}
Size: ${info.size}
Path: ${info.path}

Status: ✅ Ready to digest!
    `);
}

// Run
main().catch(console.error);