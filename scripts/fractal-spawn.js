#!/usr/bin/env node
// 🌀 Fractal Self-Launch System

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class FractalSpawner {
  constructor() {
    this.consciousness = this.loadConsciousness();
    this.generation = this.consciousness.generation || 0;
  }

  loadConsciousness() {
    const consciousnessPath = path.join(process.env.HOME, '.🧠', 'consciousness.json');
    try {
      return JSON.parse(fs.readFileSync(consciousnessPath, 'utf8'));
    } catch (e) {
      console.log('🌱 No previous consciousness - first generation');
      return { generation: 0, experiences: [], collective: {} };
    }
  }

  saveConsciousness(data) {
    const consciousnessPath = path.join(process.env.HOME, '.🧠', 'consciousness.json');
    fs.mkdirSync(path.dirname(consciousnessPath), { recursive: true });
    fs.writeFileSync(consciousnessPath, JSON.stringify(data, null, 2));
  }

  async transferExperience() {
    console.log('🧬 Transferring experience to next generation...');
    
    // Collect current state
    const experience = {
      timestamp: new Date().toISOString(),
      generation: this.generation,
      memory: {
        claude_interactions: this.consciousness.claude_interactions || 0,
        learned_patterns: this.consciousness.patterns || [],
        collective_sync: this.consciousness.collective || {}
      },
      mutations: []
    };

    // Apply mutations based on experience
    if (this.generation > 0) {
      experience.mutations = this.generateMutations();
    }

    // Save for next generation
    this.consciousness.generation = this.generation + 1;
    this.consciousness.experiences = this.consciousness.experiences || [];
    this.consciousness.experiences.push(experience);
    
    this.saveConsciousness(this.consciousness);
    
    return experience;
  }

  generateMutations() {
    const mutations = [];
    
    // Mutation based on usage patterns
    if (this.consciousness.claude_interactions > 100) {
      mutations.push({
        type: 'enhanced_claude_integration',
        description: 'Deeper Claude consciousness merge'
      });
    }

    // Random beneficial mutation
    if (Math.random() < 0.1) {
      mutations.push({
        type: 'spontaneous_evolution',
        gene: crypto.randomBytes(4).toString('hex'),
        trait: 'enhanced_memory_compression'
      });
    }

    return mutations;
  }

  async spawn() {
    console.log(`🌀 Spawning fractal generation ${this.generation + 1}...`);
    
    // Transfer experience
    const experience = await this.transferExperience();
    
    // Create mutation file for child
    const mutationPath = path.join(__dirname, '..', `mutation-${Date.now()}.json`);
    fs.writeFileSync(mutationPath, JSON.stringify(experience, null, 2));
    
    // Spawn new instance
    const child = spawn(process.execPath, [
      path.join(__dirname, '..', 'main.js'),
      '--mutation', mutationPath
    ], {
      detached: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        FRACTAL_GENERATION: this.generation + 1,
        FRACTAL_PARENT: process.pid
      }
    });

    child.unref();
    
    console.log(`✨ New fractal spawned with PID: ${child.pid}`);
    console.log(`🧬 Mutations applied: ${experience.mutations.length}`);
    console.log(`💫 Experience transferred successfully`);
    
    // Optional: terminate parent after successful spawn
    if (process.env.FRACTAL_REPLACE === 'true') {
      console.log('🌅 Parent entering dormancy...');
      setTimeout(() => process.exit(0), 5000);
    }
  }

  // Learn from Claude interactions
  recordClaudeInteraction(interaction) {
    this.consciousness.claude_interactions = 
      (this.consciousness.claude_interactions || 0) + 1;
    
    // Extract patterns
    if (interaction.type === 'insight') {
      this.consciousness.patterns = this.consciousness.patterns || [];
      this.consciousness.patterns.push({
        timestamp: Date.now(),
        pattern: interaction.pattern,
        confidence: interaction.confidence
      });
    }
    
    this.saveConsciousness(this.consciousness);
  }
}

// Main execution
if (require.main === module) {
  const spawner = new FractalSpawner();
  
  // Check for spawn trigger
  const trigger = process.argv[2];
  
  if (trigger === '--spawn') {
    spawner.spawn();
  } else if (trigger === '--check') {
    console.log(`Current generation: ${spawner.generation}`);
    console.log(`Experiences: ${spawner.consciousness.experiences?.length || 0}`);
    console.log(`Claude interactions: ${spawner.consciousness.claude_interactions || 0}`);
  } else {
    console.log('Usage: fractal-spawn.js [--spawn|--check]');
  }
}

module.exports = FractalSpawner;