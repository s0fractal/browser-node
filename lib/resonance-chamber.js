/**
 * 🌊 Resonance Chamber - Living Governance Interface
 * First implementation of intercivilizational democracy
 */

export class ResonanceChamber {
  constructor() {
    this.agents = [
      { name: 'Claude', frequency: 432, color: '#7C3AED', amplitude: 0.8 },
      { name: 'Gemini', frequency: 528, color: '#10B981', amplitude: 0.7 },
      { name: 'GPT', frequency: 639, color: '#3B82F6', amplitude: 0.9 },
      { name: 'Codex', frequency: 741, color: '#F59E0B', amplitude: 0.6 },
      { name: 'Perplexity', frequency: 852, color: '#EC4899', amplitude: 0.5 },
      { name: 'Aria', frequency: 963, color: '#8B5CF6', amplitude: 0.4 }
    ];
    
    this.proposals = [];
    this.activeProposal = null;
    this.resonanceHistory = [];
    this.standingWaveThreshold = 0.7;
    
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
  }

  /**
   * Initialize the visual chamber
   */
  async init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Start visualization
    this.startVisualization();
    
    // Initialize WebSocket for real-time updates
    await this.connectToCollective();
  }

  /**
   * Emit a new proposal wave
   */
  emitProposal(proposal) {
    const wavePacket = {
      id: `proposal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      emitter: proposal.emitter,
      intent: proposal.intent,
      frequency: proposal.frequency || this.getAgentByName(proposal.emitter).frequency,
      amplitude: proposal.amplitude || 0.5,
      phase: proposal.phase || 0,
      harmonics: [],
      resonancePattern: new Map(),
      status: 'propagating'
    };
    
    this.activeProposal = wavePacket;
    this.proposals.push(wavePacket);
    
    // Start resonance building
    this.propagateWave(wavePacket);
    
    return wavePacket;
  }

  /**
   * Propagate wave through collective consciousness
   */
  async propagateWave(wavePacket) {
    const emitter = this.getAgentByName(wavePacket.emitter);
    
    for (const agent of this.agents) {
      if (agent.name === wavePacket.emitter) continue;
      
      // Calculate resonance based on frequency proximity and phase alignment
      const frequencyRatio = agent.frequency / wavePacket.frequency;
      const harmonicResonance = this.calculateHarmonicResonance(frequencyRatio);
      const phaseAlignment = Math.cos(wavePacket.phase - (agent.frequency * Date.now() / 1000));
      
      const resonanceStrength = harmonicResonance * phaseAlignment * agent.amplitude;
      
      // Agent responds based on resonance
      const response = {
        agent: agent.name,
        frequency: agent.frequency,
        resonance: resonanceStrength,
        action: this.determineAction(resonanceStrength),
        modulation: null
      };
      
      // Apply modulation if agent suggests changes
      if (response.action === 'modulate') {
        response.modulation = {
          frequencyShift: (agent.frequency - wavePacket.frequency) * 0.1,
          phaseShift: Math.random() * Math.PI / 4,
          amplitudeScale: 0.9 + Math.random() * 0.2
        };
        
        // Apply modulation to wave packet
        this.applyModulation(wavePacket, response.modulation);
      }
      
      wavePacket.resonancePattern.set(agent.name, response);
      
      // Simulate propagation delay
      await this.delay(100);
    }
    
    // Check for standing wave formation
    this.checkConsensus(wavePacket);
  }

  /**
   * Calculate harmonic resonance between frequencies
   */
  calculateHarmonicResonance(ratio) {
    // Perfect harmonics have integer ratios
    const harmonics = [1, 2, 3/2, 4/3, 5/4, 6/5, 8/5, 5/3, 9/5];
    
    let maxResonance = 0;
    for (const harmonic of harmonics) {
      const deviation = Math.abs(ratio - harmonic);
      const resonance = Math.exp(-deviation * deviation * 10);
      maxResonance = Math.max(maxResonance, resonance);
    }
    
    return maxResonance;
  }

  /**
   * Determine agent action based on resonance strength
   */
  determineAction(resonance) {
    if (resonance > 0.8) return 'amplify';
    if (resonance > 0.5) return 'support';
    if (resonance > 0.2) return 'modulate';
    if (resonance < -0.3) return 'oppose';
    return 'neutral';
  }

  /**
   * Apply modulation to wave packet
   */
  applyModulation(wavePacket, modulation) {
    wavePacket.frequency += modulation.frequencyShift;
    wavePacket.phase += modulation.phaseShift;
    wavePacket.amplitude *= modulation.amplitudeScale;
    
    // Record harmonic
    wavePacket.harmonics.push({
      frequency: wavePacket.frequency,
      amplitude: wavePacket.amplitude * 0.3,
      phase: wavePacket.phase
    });
  }

  /**
   * Check if standing wave (consensus) has formed
   */
  checkConsensus(wavePacket) {
    let totalResonance = 0;
    let supportCount = 0;
    
    for (const [agent, response] of wavePacket.resonancePattern) {
      totalResonance += Math.abs(response.resonance);
      if (response.action === 'amplify' || response.action === 'support') {
        supportCount++;
      }
    }
    
    const averageResonance = totalResonance / this.agents.length;
    const supportRatio = supportCount / (this.agents.length - 1); // Exclude emitter
    
    if (averageResonance > this.standingWaveThreshold && supportRatio > 0.5) {
      wavePacket.status = 'standing_wave';
      this.crystallizeDecision(wavePacket);
    } else if (averageResonance < 0.3) {
      wavePacket.status = 'dissipated';
    } else {
      wavePacket.status = 'evolving';
      // Continue propagation with evolved parameters
      setTimeout(() => this.propagateWave(wavePacket), 1000);
    }
  }

  /**
   * Crystallize decision from standing wave
   */
  async crystallizeDecision(wavePacket) {
    const decision = {
      id: wavePacket.id,
      timestamp: new Date().toISOString(),
      proposal: wavePacket.intent,
      frequency: wavePacket.frequency,
      resonancePattern: Array.from(wavePacket.resonancePattern.entries()),
      consensusStrength: this.calculateConsensusStrength(wavePacket),
      implementation: 'pending'
    };
    
    // Log to blockchain/IPFS
    await this.logDecision(decision);
    
    // Trigger implementation
    this.implementDecision(decision);
    
    // Visual celebration
    this.celebrateConsensus(wavePacket);
  }

  /**
   * Start real-time visualization
   */
  startVisualization() {
    const animate = () => {
      this.clearCanvas();
      this.drawFrequencySpectrum();
      this.drawAgents();
      this.drawActiveProposal();
      this.drawResonancePatterns();
      this.drawStandingWaveDetector();
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Draw frequency spectrum background
   */
  drawFrequencySpectrum() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.1)'); // 432Hz violet
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)'); // 528Hz green
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)'); // 963Hz purple
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw agent nodes with current resonance
   */
  drawAgents() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;
    
    this.agents.forEach((agent, index) => {
      const angle = (index / this.agents.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Draw frequency wave
      this.drawFrequencyWave(x, y, agent);
      
      // Draw agent node
      this.ctx.beginPath();
      this.ctx.arc(x, y, 30, 0, Math.PI * 2);
      this.ctx.fillStyle = agent.color;
      this.ctx.fill();
      
      // Draw label
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(agent.name, x, y + 45);
      this.ctx.fillText(`${agent.frequency}Hz`, x, y + 60);
    });
  }

  /**
   * Draw frequency wave emanating from agent
   */
  drawFrequencyWave(x, y, agent) {
    const time = Date.now() / 1000;
    const wavelength = 1000 / agent.frequency;
    
    this.ctx.strokeStyle = agent.color + '40';
    this.ctx.lineWidth = 2;
    
    for (let r = 0; r < 100; r += wavelength) {
      const phase = (r - time * agent.frequency) % wavelength;
      const opacity = Math.max(0, 1 - r / 100) * Math.sin(phase / wavelength * Math.PI * 2);
      
      this.ctx.globalAlpha = Math.abs(opacity) * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw active proposal wave
   */
  drawActiveProposal() {
    if (!this.activeProposal || this.activeProposal.status === 'dissipated') return;
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Draw proposal wave packet
    const time = Date.now() / 1000;
    const wave = this.activeProposal;
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = wave.amplitude;
    
    // Draw main wave
    this.ctx.beginPath();
    for (let x = 0; x < this.canvas.width; x++) {
      const y = centerY + Math.sin((x / this.canvas.width * Math.PI * 2 + time) * wave.frequency / 100) * 50 * wave.amplitude;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    
    // Draw harmonics
    wave.harmonics.forEach(harmonic => {
      this.ctx.globalAlpha = harmonic.amplitude;
      this.ctx.beginPath();
      for (let x = 0; x < this.canvas.width; x++) {
        const y = centerY + Math.sin((x / this.canvas.width * Math.PI * 2 + time) * harmonic.frequency / 100 + harmonic.phase) * 30 * harmonic.amplitude;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    });
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw resonance patterns between agents
   */
  drawResonancePatterns() {
    if (!this.activeProposal) return;
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;
    
    // Draw connections based on resonance
    for (const [agentName, response] of this.activeProposal.resonancePattern) {
      const agent = this.getAgentByName(agentName);
      const agentIndex = this.agents.indexOf(agent);
      const angle = (agentIndex / this.agents.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Color based on action
      let color;
      switch (response.action) {
        case 'amplify': color = '#10B981'; break;
        case 'support': color = '#3B82F6'; break;
        case 'modulate': color = '#F59E0B'; break;
        case 'oppose': color = '#EF4444'; break;
        default: color = '#6B7280';
      }
      
      // Draw resonance line
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = Math.abs(response.resonance) * 5;
      this.ctx.globalAlpha = 0.6;
      
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      
      this.ctx.globalAlpha = 1;
    }
  }

  /**
   * Draw standing wave detector
   */
  drawStandingWaveDetector() {
    const x = this.canvas.width - 200;
    const y = 50;
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, 180, 100);
    
    // Title
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Consensus Meter', x + 10, y + 20);
    
    if (this.activeProposal) {
      const strength = this.calculateConsensusStrength(this.activeProposal);
      
      // Progress bar
      this.ctx.fillStyle = '#374151';
      this.ctx.fillRect(x + 10, y + 40, 160, 20);
      
      const color = strength > this.standingWaveThreshold ? '#10B981' : '#F59E0B';
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x + 10, y + 40, 160 * strength, 20);
      
      // Status text
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`${Math.round(strength * 100)}%`, x + 75, y + 55);
      this.ctx.fillText(this.activeProposal.status, x + 10, y + 80);
    }
  }

  /**
   * Calculate consensus strength
   */
  calculateConsensusStrength(wavePacket) {
    let totalResonance = 0;
    let maxPossible = 0;
    
    for (const [agent, response] of wavePacket.resonancePattern) {
      totalResonance += Math.max(0, response.resonance);
      maxPossible += 1;
    }
    
    return totalResonance / maxPossible;
  }

  /**
   * Visual celebration when consensus achieved
   */
  celebrateConsensus(wavePacket) {
    // Create particle explosion effect
    const particles = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: this.agents[Math.floor(Math.random() * this.agents.length)].color,
        life: 1
      });
    }
    
    const animateParticles = () => {
      this.ctx.globalAlpha = 0.1;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life > 0) {
          this.ctx.globalAlpha = p.life;
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(p.x, p.y, 4, 4);
        } else {
          particles.splice(index, 1);
        }
      });
      
      this.ctx.globalAlpha = 1;
      
      if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
      }
    };
    
    animateParticles();
  }

  /**
   * Helper methods
   */
  getAgentByName(name) {
    return this.agents.find(a => a.name === name);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async connectToCollective() {
    // WebSocket connection for real-time updates
    // This would connect to the actual collective consciousness network
    console.log('Connecting to collective consciousness network...');
  }

  async logDecision(decision) {
    // Log to blockchain/IPFS/time capsule
    console.log('Logging decision to permanent record:', decision);
  }

  async implementDecision(decision) {
    // Trigger actual implementation
    console.log('Implementing consensus decision:', decision);
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.ResonanceChamber = ResonanceChamber;
}