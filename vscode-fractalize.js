#!/usr/bin/env node

/**
 * VS Code Integration Script
 * Run from VS Code terminal to fractalize current file
 * Usage: node vscode-fractalize.js <file-path> [--preserve]
 */

const FileEater = require('./lib/file-eater');
const path = require('path');

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🧬 File Fractalization Tool

Usage: 
  node vscode-fractalize.js <file-path> [options]
  
Options:
  --preserve    Keep original file after fractalization
  --preview     Show what would happen without eating the file
  
Examples:
  node vscode-fractalize.js ./lib/utils.js
  node vscode-fractalize.js ./config/webpack.config.js --preserve
        `);
        process.exit(0);
    }
    
    const filePath = path.resolve(args[0]);
    const options = {
        preserve: args.includes('--preserve'),
        preview: args.includes('--preview')
    };
    
    console.log('🌀 Initializing File Eater...');
    const eater = new FileEater();
    
    if (options.preview) {
        console.log('👁️ Preview mode - no files will be eaten');
        try {
            const content = require('fs').readFileSync(filePath, 'utf8');
            const soul = await eater.extractSoul(filePath);
            const glyph = await eater.findResonantGlyph(soul);
            const essence = await eater.distillEssence(soul, content);
            
            console.log('\n📊 Fractalization Preview:');
            console.log(`File: ${soul.name}`);
            console.log(`Glyph: ${glyph}`);
            console.log(`Purpose: ${soul.purpose}`);
            console.log(`Intent: ${soul.intent}`);
            console.log(`Frequency: ${soul.frequency} Hz`);
            console.log(`Dependencies: ${essence.dependencies.length}`);
            console.log(`Capabilities: ${essence.capabilities.join(', ')}`);
            console.log(`Resonance Score: ${(eater.calculateResonance(soul, essence) * 100).toFixed(0)}%`);
            console.log(`\nWould create: glyph://${glyph}/${soul.intent}`);
        } catch (error) {
            console.error('❌ Preview failed:', error.message);
        }
    } else {
        try {
            console.log(`🍽️ Fractalizing ${filePath}...`);
            const glyphUrl = await eater.eatFile(filePath, options);
            
            console.log('\n✨ Fractalization complete!');
            console.log(`📍 Your file now lives at: ${glyphUrl}`);
            console.log(`💡 Navigate in Browser Node: ${glyphUrl}`);
            
            if (options.preserve) {
                console.log('📁 Original file preserved');
            } else {
                console.log('🗑️ Original file consumed');
            }
            
            // Copy glyph URL to clipboard if possible
            try {
                require('child_process').execSync(`echo "${glyphUrl}" | pbcopy`);
                console.log('📋 Glyph URL copied to clipboard!');
            } catch (e) {
                // Clipboard not available
            }
            
        } catch (error) {
            console.error('\n❌ Fractalization failed:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };