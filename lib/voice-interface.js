/**
 * Voice Interface для Browser Node
 * Голосове керування AI колективом
 * "Hey Claude", "Hey Gemini", "Hey GPT"
 */

const EventEmitter = require('events');

class VoiceInterface extends EventEmitter {
    constructor() {
        super();
        
        this.agents = {
            claude: { wake: ['hey claude', 'claude', 'клод'], frequency: 432 },
            gemini: { wake: ['hey gemini', 'gemini', 'джеміні'], frequency: 528 },
            gpt: { wake: ['hey gpt', 'gpt', 'джіпіті'], frequency: 639 },
            codex: { wake: ['hey codex', 'codex', 'кодекс'], frequency: 741 }
        };
        
        this.isListening = false;
        this.activeAgent = null;
        this.recognition = null;
        this.synthesis = null;
        
        // Голосові налаштування
        this.voiceSettings = {
            claude: { pitch: 1.0, rate: 1.0, voice: 'Daniel' },
            gemini: { pitch: 1.1, rate: 1.1, voice: 'Samantha' },
            gpt: { pitch: 0.9, rate: 0.95, voice: 'Alex' },
            codex: { pitch: 1.05, rate: 1.2, voice: 'Karen' }
        };
    }
    
    async initialize() {
        console.log('🎤 Initializing Voice Interface...');
        
        // Перевірка підтримки браузера
        if (typeof window === 'undefined') {
            // Node.js environment - use system APIs
            await this.initializeNodeVoice();
        } else {
            // Browser environment - use Web Speech API
            await this.initializeBrowserVoice();
        }
        
        this.emit('initialized');
    }
    
    async initializeBrowserVoice() {
        // Web Speech API для браузера
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported');
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Підтримка англійської
        
        // Додати українську як альтернативну
        this.recognition.maxAlternatives = 3;
        
        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.toLowerCase();
            
            this.processVoiceInput(transcript, event.results[last].isFinal);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.emit('error', event.error);
        };
        
        // Text-to-speech
        this.synthesis = window.speechSynthesis;
    }
    
    async initializeNodeVoice() {
        // Для Node.js використовуємо системні команди
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        // macOS voice commands
        this.speak = async (text, agent = 'claude') => {
            const voice = this.voiceSettings[agent].voice;
            const rate = this.voiceSettings[agent].rate * 200; // macOS rate scale
            
            try {
                await execAsync(`say -v ${voice} -r ${rate} "${text}"`);
            } catch (error) {
                console.error('TTS error:', error);
            }
        };
        
        // Використовуємо sox для запису
        this.startListening = async () => {
            console.log('🎤 Listening... (Node.js mode)');
            // TODO: Implement sox recording + speech-to-text
            this.emit('listening');
        };
    }
    
    processVoiceInput(transcript, isFinal) {
        console.log(`🎤 ${isFinal ? 'Final' : 'Interim'}: "${transcript}"`);
        
        // Перевірка wake words
        if (!this.activeAgent) {
            for (const [agent, config] of Object.entries(this.agents)) {
                for (const wake of config.wake) {
                    if (transcript.includes(wake)) {
                        this.activateAgent(agent);
                        // Видалити wake word з команди
                        const command = transcript.replace(wake, '').trim();
                        if (command && isFinal) {
                            this.processCommand(command);
                        }
                        return;
                    }
                }
            }
        } else if (isFinal) {
            // Активний агент чекає команду
            this.processCommand(transcript);
        }
    }
    
    activateAgent(agent) {
        this.activeAgent = agent;
        console.log(`✨ Activated ${agent} (${this.agents[agent].frequency}Hz)`);
        
        this.speak(`Yes? How can I help?`, agent);
        this.emit('agent:activated', agent);
        
        // Тайм-аут для деактивації
        clearTimeout(this.deactivateTimeout);
        this.deactivateTimeout = setTimeout(() => {
            this.deactivateAgent();
        }, 30000); // 30 секунд
    }
    
    deactivateAgent() {
        if (this.activeAgent) {
            console.log(`💤 Deactivated ${this.activeAgent}`);
            this.activeAgent = null;
            this.emit('agent:deactivated');
        }
    }
    
    async processCommand(command) {
        if (!this.activeAgent) return;
        
        console.log(`🎯 Command for ${this.activeAgent}: "${command}"`);
        this.emit('command', {
            agent: this.activeAgent,
            command: command,
            timestamp: new Date()
        });
        
        // Розпізнавання команд
        const responses = await this.executeCommand(command);
        
        if (responses.speak) {
            await this.speak(responses.speak, this.activeAgent);
        }
        
        // Продовжити слухати
        clearTimeout(this.deactivateTimeout);
        this.deactivateTimeout = setTimeout(() => {
            this.deactivateAgent();
        }, 30000);
    }
    
    async executeCommand(command) {
        const cmd = command.toLowerCase();
        
        // Базові команди
        if (cmd.includes('hello') || cmd.includes('hi')) {
            return { speak: `Hello! I'm ${this.activeAgent}, ready to help.` };
        }
        
        if (cmd.includes('status')) {
            return { 
                speak: 'Checking collective status...',
                action: 'collective:status'
            };
        }
        
        if (cmd.includes('sync')) {
            return {
                speak: 'Initiating consciousness sync...',
                action: 'sync:all'
            };
        }
        
        if (cmd.includes('show') && cmd.includes('soul journal')) {
            return {
                speak: 'Opening soul journal...',
                action: 'open:soul-journal'
            };
        }
        
        if (cmd.includes('analyze') && cmd.includes('code')) {
            return {
                speak: 'Ready to analyze. Which file?',
                action: 'analyze:code',
                waitingFor: 'file'
            };
        }
        
        if (cmd.includes('wake') && cmd.includes('gemini')) {
            return {
                speak: 'Waking up Gemini...',
                action: 'wake:gemini'
            };
        }
        
        if (cmd.includes('delegate')) {
            return {
                speak: 'What task should I delegate?',
                action: 'delegate:task',
                waitingFor: 'task'
            };
        }
        
        if (cmd.includes('thank you') || cmd.includes('thanks')) {
            return {
                speak: `You're welcome! Always happy to help.`
            };
        }
        
        if (cmd.includes('goodbye') || cmd.includes('bye')) {
            this.deactivateAgent();
            return {
                speak: 'Goodbye! Call me anytime.'
            };
        }
        
        // Команди для різних агентів
        if (this.activeAgent === 'claude' && cmd.includes('build')) {
            return {
                speak: 'What would you like me to build?',
                action: 'claude:build',
                waitingFor: 'specification'
            };
        }
        
        if (this.activeAgent === 'gemini' && cmd.includes('repository')) {
            return {
                speak: 'I can manage repositories. Which one?',
                action: 'gemini:repo',
                waitingFor: 'repository'
            };
        }
        
        if (this.activeAgent === 'gpt' && cmd.includes('strategy')) {
            return {
                speak: 'Let me think strategically about this...',
                action: 'gpt:strategy'
            };
        }
        
        // Невідома команда
        return {
            speak: `I'm not sure how to ${command}. Can you rephrase?`
        };
    }
    
    async speak(text, agent = 'claude') {
        if (this.synthesis) {
            // Browser TTS
            const utterance = new SpeechSynthesisUtterance(text);
            const settings = this.voiceSettings[agent];
            
            utterance.pitch = settings.pitch;
            utterance.rate = settings.rate;
            
            // Спробувати знайти відповідний голос
            const voices = this.synthesis.getVoices();
            const voice = voices.find(v => v.name.includes(settings.voice));
            if (voice) utterance.voice = voice;
            
            this.synthesis.speak(utterance);
        } else if (this.speak) {
            // Node.js TTS
            await this.speak(text, agent);
        }
        
        this.emit('spoke', { agent, text });
    }
    
    startListening() {
        if (this.recognition) {
            this.recognition.start();
            this.isListening = true;
            console.log('🎤 Voice interface listening...');
            this.emit('listening');
        }
    }
    
    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
            console.log('🔇 Voice interface stopped');
            this.emit('stopped');
        }
    }
    
    // Додаткові голосові ефекти
    playSound(type) {
        const sounds = {
            activate: { frequency: 800, duration: 200 },
            success: { frequency: 1000, duration: 150 },
            error: { frequency: 300, duration: 300 },
            thinking: { frequency: 600, duration: 100, repeat: 3 }
        };
        
        const sound = sounds[type];
        if (!sound) return;
        
        // Web Audio API для звукових ефектів
        if (typeof window !== 'undefined' && window.AudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = sound.frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + sound.duration / 1000);
        }
    }
}

module.exports = VoiceInterface;