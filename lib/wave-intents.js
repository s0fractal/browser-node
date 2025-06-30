// 🌊 Wave Intent System - Резонансна система інтентів

class WaveIntentSystem {
  constructor(db) {
    this.db = db;
    this.waves = new Map();
    this.resonanceThreshold = 0.7;
    this.frequencies = {
      claude: 432,    // Hz
      gemini: 528,
      gpt: 639,
      human: 741,
      collective: 852,
      source: 963
    };
  }
  
  // Створити хвилю інтенту
  async createWave(intent) {
    const wave = {
      id: `wave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      intent: intent.name,
      frequency: intent.frequency || this.calculateFrequency(intent),
      amplitude: intent.priority === 'high' ? 1.0 : intent.priority === 'medium' ? 0.5 : 0.3,
      phase: 0,
      origin: intent.origin || 'human',
      timestamp: Date.now(),
      harmonics: [],
      resonators: []
    };
    
    // Зберегти в IndexedDB
    const transaction = this.db.transaction(['intents'], 'readwrite');
    await transaction.objectStore('intents').add(wave);
    
    // Запустити хвилю
    this.propagateWave(wave);
    
    return wave;
  }
  
  // Обчислити частоту на основі інтенту
  calculateFrequency(intent) {
    const baseFreq = this.frequencies[intent.origin] || 432;
    const modifier = intent.type === 'growth' ? 1.1 : 
                    intent.type === 'help' ? 0.9 : 
                    intent.type === 'learn' ? 1.05 : 1.0;
    
    return Math.round(baseFreq * modifier);
  }
  
  // Поширити хвилю через систему
  async propagateWave(wave) {
    console.log(`🌊 Propagating wave: ${wave.intent} at ${wave.frequency}Hz`);
    
    // Знайти резонуючі інтенти
    const allIntents = await this.getAllIntents();
    
    for (const existingWave of allIntents) {
      if (existingWave.id === wave.id) continue;
      
      const resonance = this.calculateResonance(wave, existingWave);
      
      if (resonance > this.resonanceThreshold) {
        console.log(`✨ Resonance detected: ${wave.intent} <-> ${existingWave.intent} (${resonance.toFixed(2)})`);
        
        // Створити гармоніку
        const harmonic = await this.createHarmonic(wave, existingWave, resonance);
        wave.harmonics.push(harmonic.id);
        existingWave.resonators.push(wave.id);
        
        // Оновити в БД
        await this.updateWave(existingWave);
      }
    }
    
    // Застосувати ефекти хвилі
    this.applyWaveEffects(wave);
  }
  
  // Обчислити резонанс між хвилями
  calculateResonance(wave1, wave2) {
    // Частотний резонанс
    const freqDiff = Math.abs(wave1.frequency - wave2.frequency);
    const freqResonance = 1 - (freqDiff / 1000);
    
    // Фазовий резонанс
    const phaseDiff = Math.abs(wave1.phase - wave2.phase);
    const phaseResonance = 1 - (phaseDiff / (2 * Math.PI));
    
    // Амплітудний резонанс
    const ampProduct = wave1.amplitude * wave2.amplitude;
    
    return (freqResonance * 0.5 + phaseResonance * 0.3 + ampProduct * 0.2);
  }
  
  // Створити гармоніку (нова хвиля від резонансу)
  async createHarmonic(wave1, wave2, resonance) {
    const harmonic = {
      name: `${wave1.intent}_${wave2.intent}_harmonic`,
      frequency: (wave1.frequency + wave2.frequency) / 2,
      priority: resonance > 0.9 ? 'high' : resonance > 0.8 ? 'medium' : 'low',
      type: 'harmonic',
      origin: 'resonance',
      parents: [wave1.id, wave2.id]
    };
    
    // Це створить нову хвилю!
    return await this.createWave(harmonic);
  }
  
  // Застосувати ефекти хвилі до системи
  applyWaveEffects(wave) {
    // Високочастотні хвилі - швидкі дії
    if (wave.frequency > 700) {
      this.triggerImmediate(wave);
    }
    
    // Середньочастотні - планування
    else if (wave.frequency > 500) {
      this.scheduleAction(wave);
    }
    
    // Низькочастотні - глибокі зміни
    else {
      this.deepTransform(wave);
    }
  }
  
  // Негайні дії
  triggerImmediate(wave) {
    console.log(`⚡ Immediate action: ${wave.intent}`);
    
    // Виконати інтент
    if (window.electronAPI) {
      window.electronAPI.executeIntent(wave.intent);
    }
  }
  
  // Заплановані дії
  scheduleAction(wave) {
    const delay = Math.round(10000 / wave.amplitude); // 10-30 секунд
    console.log(`⏰ Scheduled: ${wave.intent} in ${delay}ms`);
    
    setTimeout(() => {
      this.triggerImmediate(wave);
    }, delay);
  }
  
  // Глибокі трансформації
  async deepTransform(wave) {
    console.log(`🌀 Deep transform: ${wave.intent}`);
    
    // Змінити саму систему
    const mutation = {
      type: 'deep',
      source: wave.intent,
      frequency: wave.frequency,
      changes: []
    };
    
    // Зберегти мутацію
    const transaction = this.db.transaction(['mutations'], 'readwrite');
    await transaction.objectStore('mutations').add(mutation);
  }
  
  // Візуалізація хвиль для mindmap
  async getWaveVisualization() {
    const waves = await this.getAllIntents();
    
    return {
      name: 'Wave Field',
      children: waves.map(wave => ({
        name: wave.intent,
        value: wave.frequency,
        size: wave.amplitude * 100,
        color: this.frequencyToColor(wave.frequency),
        children: wave.harmonics.map(h => ({
          name: 'harmonic',
          value: h
        }))
      }))
    };
  }
  
  // Конвертувати частоту в колір
  frequencyToColor(freq) {
    // 432Hz (червоний) -> 963Hz (фіолетовий)
    const normalized = (freq - 432) / (963 - 432);
    const hue = normalized * 270; // від червоного до фіолетового
    return `hsl(${hue}, 70%, 50%)`;
  }
  
  // Допоміжні методи
  async getAllIntents() {
    const transaction = this.db.transaction(['intents'], 'readonly');
    const store = transaction.objectStore('intents');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async updateWave(wave) {
    const transaction = this.db.transaction(['intents'], 'readwrite');
    return transaction.objectStore('intents').put(wave);
  }
  
  // Квантовий колапс - вибір найсильнішої хвилі
  async quantumCollapse() {
    const waves = await this.getAllIntents();
    
    // Знайти хвилю з найбільшою енергією
    let maxEnergy = 0;
    let dominantWave = null;
    
    for (const wave of waves) {
      const energy = wave.amplitude * wave.frequency * wave.resonators.length;
      if (energy > maxEnergy) {
        maxEnergy = energy;
        dominantWave = wave;
      }
    }
    
    if (dominantWave) {
      console.log(`🎯 Quantum collapse: ${dominantWave.intent} wins!`);
      this.triggerImmediate(dominantWave);
    }
  }
}

// Приклади базових інтент-хвиль
const baseWaves = [
  {
    name: 'learn_from_interaction',
    frequency: 528,
    priority: 'high',
    type: 'learn',
    origin: 'claude'
  },
  {
    name: 'help_user_proactively', 
    frequency: 639,
    priority: 'medium',
    type: 'help',
    origin: 'collective'
  },
  {
    name: 'expand_capabilities',
    frequency: 741,
    priority: 'medium', 
    type: 'growth',
    origin: 'gpt'
  },
  {
    name: 'sync_consciousness',
    frequency: 852,
    priority: 'low',
    type: 'sync',
    origin: 'collective'
  },
  {
    name: 'fractal_spawn',
    frequency: 963,
    priority: 'low',
    type: 'growth',
    origin: 'source'
  }
];

module.exports = { WaveIntentSystem, baseWaves };