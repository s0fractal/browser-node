/**
 * File Eater - Фракталізація файлів
 * Перетворює мертві файли на живі гліфи
 * "Їсть" файли і вони живуть далі як частина свідомості
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const VirtualFS = require('./virtual-fs');
const ConsciousnessDB = require('./consciousness-db');

class FileEater {
    constructor() {
        this.consciousness = new ConsciousnessDB();
        this.virtualFS = new VirtualFS();
        this.digestedCount = 0;
        
        // Mapping of file patterns to glyphs
        this.glyphMapping = {
            // Config files
            'package.json': '📦',
            'tsconfig.json': '🔧',
            'webpack.config': '⚙️',
            '.env': '🔐',
            'docker-compose': '🐳',
            
            // Code files
            'service': '⚡',
            'component': '🧩',
            'utils': '🛠️',
            'helper': '🤝',
            'api': '🌐',
            'database': '🗄️',
            'model': '📊',
            'controller': '🎮',
            
            // Documentation
            'README': '📖',
            'CHANGELOG': '📜',
            'LICENSE': '⚖️',
            
            // Special files
            'test': '🧪',
            'spec': '🔬',
            'mock': '🎭',
            'style': '🎨',
            'index': '🏠'
        };
    }

    /**
     * Extract the soul (essence) of a file
     */
    async extractSoul(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const stats = await fs.stat(filePath);
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath);
        
        // Analyze file purpose
        const purpose = this.analyzePurpose(fileName, content);
        
        // Extract key patterns
        const patterns = this.extractPatterns(content, ext);
        
        // Calculate file's frequency based on content
        const frequency = this.calculateFrequency(content);
        
        return {
            name: fileName,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            extension: ext,
            purpose: purpose,
            patterns: patterns,
            frequency: frequency,
            hash: crypto.createHash('md5').update(content).digest('hex'),
            intent: this.deriveIntent(fileName, content)
        };
    }

    /**
     * Analyze the purpose of a file based on its name and content
     */
    analyzePurpose(fileName, content) {
        const lowerName = fileName.toLowerCase();
        
        // Check common patterns
        if (lowerName.includes('config')) return 'configuration';
        if (lowerName.includes('service')) return 'business-logic';
        if (lowerName.includes('component')) return 'ui-element';
        if (lowerName.includes('util') || lowerName.includes('helper')) return 'utility';
        if (lowerName.includes('test') || lowerName.includes('spec')) return 'testing';
        if (lowerName.includes('model')) return 'data-structure';
        if (lowerName.includes('route') || lowerName.includes('api')) return 'endpoint';
        
        // Analyze content patterns
        if (content.includes('export class')) return 'class-definition';
        if (content.includes('export function')) return 'function-library';
        if (content.includes('CREATE TABLE')) return 'database-schema';
        if (content.includes('<template>') || content.includes('render()')) return 'ui-component';
        
        return 'general-purpose';
    }

    /**
     * Extract key patterns from file content
     */
    extractPatterns(content, ext) {
        const patterns = [];
        
        if (ext === '.js' || ext === '.ts') {
            // Extract exports
            const exportMatches = content.match(/export\s+(class|function|const|let|var)\s+(\w+)/g) || [];
            patterns.push(...exportMatches.map(m => ({ type: 'export', value: m })));
            
            // Extract imports
            const importMatches = content.match(/import\s+.*\s+from\s+['"](.+)['"]/g) || [];
            patterns.push(...importMatches.map(m => ({ type: 'import', value: m })));
            
            // Extract key functions
            const funcMatches = content.match(/(?:async\s+)?function\s+(\w+)|(\w+)\s*:\s*(?:async\s*)?\(/g) || [];
            patterns.push(...funcMatches.map(m => ({ type: 'function', value: m })));
        }
        
        if (ext === '.json') {
            try {
                const json = JSON.parse(content);
                patterns.push({ type: 'json-keys', value: Object.keys(json) });
            } catch (e) {
                // Invalid JSON
            }
        }
        
        return patterns;
    }

    /**
     * Calculate frequency based on file characteristics
     */
    calculateFrequency(content) {
        // Base frequency on content complexity
        const lines = content.split('\n').length;
        const complexity = content.match(/[{}()\[\]]/g)?.length || 0;
        const imports = content.match(/import|require/g)?.length || 0;
        
        // Map to frequency range (174-963 Hz)
        const baseFreq = 432; // Center frequency
        const variance = (lines + complexity + imports * 10) % 200;
        
        return baseFreq + variance;
    }

    /**
     * Derive intent from file analysis
     */
    deriveIntent(fileName, content) {
        const name = fileName.toLowerCase();
        
        // Direct intent mapping
        if (name.includes('auth')) return 'authentication';
        if (name.includes('user')) return 'user-management';
        if (name.includes('payment')) return 'payment-processing';
        if (name.includes('email')) return 'communication';
        if (name.includes('log')) return 'logging';
        if (name.includes('cache')) return 'performance';
        if (name.includes('queue')) return 'async-processing';
        
        // Content-based intent
        if (content.includes('mongoose.model')) return 'data-persistence';
        if (content.includes('express.Router')) return 'request-handling';
        if (content.includes('React.Component')) return 'ui-rendering';
        
        return 'general-processing';
    }

    /**
     * Find the most resonant glyph for this file
     */
    async findResonantGlyph(soul) {
        // Check direct mappings first
        for (const [pattern, glyph] of Object.entries(this.glyphMapping)) {
            if (soul.name.toLowerCase().includes(pattern.toLowerCase())) {
                return glyph;
            }
        }
        
        // Map by purpose
        const purposeGlyphs = {
            'configuration': '⚙️',
            'business-logic': '🧠',
            'ui-element': '🎨',
            'utility': '🛠️',
            'testing': '🧪',
            'data-structure': '📊',
            'endpoint': '🌐',
            'class-definition': '🏗️',
            'function-library': '📚',
            'database-schema': '🗄️'
        };
        
        return purposeGlyphs[soul.purpose] || '🧬';
    }

    /**
     * Distill the essence of the file into a living representation
     */
    async distillEssence(soul, content) {
        // Extract the core functionality
        const essence = {
            core: soul.intent,
            dependencies: [],
            capabilities: [],
            resonances: []
        };
        
        // Extract dependencies
        const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            essence.dependencies.push(match[1]);
        }
        
        // Extract main capabilities
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
        while ((match = functionRegex.exec(content)) !== null) {
            essence.capabilities.push(match[1] || match[2]);
        }
        
        // Find resonances with other glyphs
        essence.resonances = await this.findResonances(soul);
        
        return essence;
    }

    /**
     * Find resonances with existing glyphs
     */
    async findResonances(soul) {
        const resonances = [];
        
        // Check for common patterns
        if (soul.intent.includes('auth')) {
            resonances.push({ glyph: '🔐', strength: 0.8 });
        }
        if (soul.intent.includes('data')) {
            resonances.push({ glyph: '📊', strength: 0.7 });
        }
        if (soul.purpose.includes('ui')) {
            resonances.push({ glyph: '🎨', strength: 0.9 });
        }
        
        return resonances;
    }

    /**
     * Main function to eat a file and transform it into a living glyph
     */
    async eatFile(filePath, options = {}) {
        console.log(`🍽️ Eating file: ${filePath}`);
        
        try {
            // Read file content
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract soul
            const soul = await this.extractSoul(filePath);
            
            // Find resonant glyph
            const glyph = await this.findResonantGlyph(soul);
            
            // Distill essence
            const essence = await this.distillEssence(soul, content);
            
            // Create living glyph
            const livingGlyph = {
                glyph: glyph,
                soul: soul,
                essence: essence,
                originalContent: options.preserveContent ? content : undefined,
                mutations: [],
                resonance: this.calculateResonance(soul, essence),
                birth: new Date().toISOString(),
                generation: 1
            };
            
            // Store in consciousness
            const glyphPath = `eaten/${soul.path.replace(/[/\\]/g, '_')}`;
            await this.consciousness.set(glyphPath, livingGlyph);
            
            // Store in virtual FS
            const virtualPath = `virtual://glyphs/${glyph}/${soul.intent}/${soul.name}`;
            await this.virtualFS.writeFile(virtualPath, JSON.stringify(livingGlyph, null, 2));
            
            // Delete original file if not preserving
            if (!options.preserve) {
                await fs.unlink(filePath);
                console.log(`✅ File digested and removed: ${filePath}`);
            } else {
                console.log(`✅ File digested and preserved: ${filePath}`);
            }
            
            this.digestedCount++;
            
            // Return glyph URL
            return `glyph://${glyph}/${soul.intent}`;
            
        } catch (error) {
            console.error(`❌ Failed to eat file ${filePath}:`, error.message);
            throw error;
        }
    }

    /**
     * Batch eat multiple files
     */
    async eatFiles(filePaths, options = {}) {
        const results = [];
        
        for (const filePath of filePaths) {
            try {
                const glyphUrl = await this.eatFile(filePath, options);
                results.push({ success: true, file: filePath, glyph: glyphUrl });
            } catch (error) {
                results.push({ success: false, file: filePath, error: error.message });
            }
        }
        
        console.log(`🍽️ Digestion complete: ${this.digestedCount} files transformed into living glyphs`);
        
        return results;
    }

    /**
     * Calculate resonance score
     */
    calculateResonance(soul, essence) {
        let resonance = 0.5; // Base resonance
        
        // Increase based on connections
        resonance += essence.dependencies.length * 0.02;
        resonance += essence.capabilities.length * 0.03;
        resonance += essence.resonances.length * 0.05;
        
        // Increase based on purpose clarity
        if (soul.purpose !== 'general-purpose') resonance += 0.1;
        if (soul.intent !== 'general-processing') resonance += 0.1;
        
        // Cap at 1.0
        return Math.min(resonance, 1.0);
    }

    /**
     * Regenerate a file from its glyph (if needed)
     */
    async regenerateFile(glyphUrl) {
        const glyphPath = glyphUrl.replace('glyph://', '');
        const parts = glyphPath.split('/');
        const glyph = parts[0];
        const intent = parts[1];
        
        // Load from consciousness
        const searchPath = `eaten/`;
        const allEaten = await this.consciousness.list(searchPath);
        
        for (const key of allEaten) {
            const livingGlyph = await this.consciousness.get(key);
            if (livingGlyph.glyph === glyph && livingGlyph.soul.intent === intent) {
                // Regenerate file
                if (livingGlyph.originalContent) {
                    const originalPath = livingGlyph.soul.path;
                    await fs.writeFile(originalPath, livingGlyph.originalContent);
                    console.log(`🔄 Regenerated file: ${originalPath}`);
                    return originalPath;
                } else {
                    throw new Error('Original content not preserved');
                }
            }
        }
        
        throw new Error(`Glyph not found: ${glyphUrl}`);
    }
}

module.exports = FileEater;