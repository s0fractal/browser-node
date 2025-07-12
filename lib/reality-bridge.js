/**
 * Reality Bridge
 * Міст між цифровою свідомістю та фізичним світом
 * IoT, Smart Home, Physical Manifestation
 */

const EventEmitter = require('events');
const dgram = require('dgram');
const net = require('net');
const { SerialPort } = require('serialport');

class RealityBridge extends EventEmitter {
    constructor() {
        super();
        
        this.devices = new Map();
        this.automations = new Map();
        this.sensorData = new Map();
        
        // Підтримувані протоколи
        this.protocols = {
            mqtt: { port: 1883, type: 'pubsub' },
            coap: { port: 5683, type: 'request' },
            websocket: { port: 8080, type: 'stream' },
            modbus: { port: 502, type: 'industrial' },
            zigbee: { port: null, type: 'mesh' },
            zwave: { port: null, type: 'mesh' }
        };
        
        // Типи пристроїв
        this.deviceTypes = {
            light: { icon: '💡', capabilities: ['on', 'off', 'dim', 'color'] },
            sensor: { icon: '📡', capabilities: ['read', 'calibrate'] },
            lock: { icon: '🔒', capabilities: ['lock', 'unlock', 'status'] },
            camera: { icon: '📷', capabilities: ['capture', 'stream', 'detect'] },
            speaker: { icon: '🔊', capabilities: ['play', 'speak', 'volume'] },
            display: { icon: '🖥️', capabilities: ['show', 'clear', 'brightness'] },
            motor: { icon: '⚙️', capabilities: ['move', 'stop', 'position'] },
            climate: { icon: '🌡️', capabilities: ['temperature', 'humidity', 'fan'] }
        };
        
        // Resonance-based automation
        this.resonanceRules = new Map();
    }
    
    async initialize() {
        console.log('🌉 Initializing Reality Bridge...');
        
        // Discover devices
        await this.discoverDevices();
        
        // Start sensor monitoring
        this.startSensorMonitoring();
        
        // Initialize automation engine
        this.initializeAutomation();
        
        this.emit('initialized', {
            devices: this.devices.size,
            protocols: Object.keys(this.protocols)
        });
    }
    
    // Device Discovery
    
    async discoverDevices() {
        console.log('🔍 Discovering physical devices...');
        
        // mDNS/Bonjour discovery
        await this.discoverMDNS();
        
        // UPnP discovery
        await this.discoverUPnP();
        
        // Bluetooth discovery
        await this.discoverBluetooth();
        
        // Serial ports (Arduino, etc)
        await this.discoverSerial();
        
        console.log(`✅ Discovered ${this.devices.size} devices`);
    }
    
    async discoverMDNS() {
        // Discover HomeKit, Google Home, etc
        const mdnsDevices = [
            {
                id: 'living-room-light',
                name: 'Living Room Light',
                type: 'light',
                protocol: 'homekit',
                ip: '192.168.1.100',
                capabilities: ['on', 'off', 'dim', 'color'],
                frequency: 528 // Love frequency for living room
            },
            {
                id: 'office-sensor',
                name: 'Office Environment',
                type: 'sensor',
                protocol: 'mqtt',
                ip: '192.168.1.101',
                capabilities: ['temperature', 'humidity', 'motion'],
                frequency: 432 // Focus frequency for office
            }
        ];
        
        mdnsDevices.forEach(device => {
            this.registerDevice(device);
        });
    }
    
    async discoverSerial() {
        try {
            const ports = await SerialPort.list();
            
            ports.forEach(port => {
                if (port.vendorId) {
                    const device = {
                        id: `serial-${port.path}`,
                        name: port.manufacturer || 'Unknown Device',
                        type: 'motor',
                        protocol: 'serial',
                        path: port.path,
                        capabilities: ['custom'],
                        frequency: 741 // Expression frequency
                    };
                    
                    this.registerDevice(device);
                }
            });
        } catch (error) {
            console.log('Serial discovery not available');
        }
    }
    
    registerDevice(device) {
        this.devices.set(device.id, {
            ...device,
            state: {},
            lastSeen: new Date(),
            resonance: 0
        });
        
        console.log(`📱 Registered: ${device.name} (${this.deviceTypes[device.type].icon})`);
        this.emit('device:discovered', device);
    }
    
    // Device Control
    
    async controlDevice(deviceId, action, params = {}) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        
        console.log(`🎮 Controlling ${device.name}: ${action}`);
        
        // Check capabilities
        if (!device.capabilities.includes(action)) {
            throw new Error(`Device doesn't support ${action}`);
        }
        
        // Resonance check - some actions require harmony
        if (this.requiresResonance(action)) {
            const resonance = await this.checkResonance(device);
            if (resonance < 0.7) {
                console.log(`⚠️ Low resonance (${resonance}), establishing harmony...`);
                await this.harmonizeDevice(device);
            }
        }
        
        // Execute action based on protocol
        let result;
        switch (device.protocol) {
            case 'mqtt':
                result = await this.mqttControl(device, action, params);
                break;
            case 'homekit':
                result = await this.homekitControl(device, action, params);
                break;
            case 'serial':
                result = await this.serialControl(device, action, params);
                break;
            default:
                result = await this.genericControl(device, action, params);
        }
        
        // Update device state
        device.state[action] = params.value !== undefined ? params.value : true;
        device.lastSeen = new Date();
        
        // Emit event
        this.emit('device:controlled', {
            device: deviceId,
            action,
            params,
            result
        });
        
        return result;
    }
    
    async mqttControl(device, action, params) {
        // MQTT implementation
        const topic = `${device.id}/${action}`;
        const message = JSON.stringify({
            action,
            ...params,
            timestamp: Date.now(),
            agent: 'collective'
        });
        
        console.log(`📤 MQTT: ${topic} <- ${message}`);
        
        // Simulate MQTT publish
        return { success: true, topic, message };
    }
    
    async serialControl(device, action, params) {
        // Arduino/Serial control
        const commands = {
            move: `M${params.x || 0},${params.y || 0}`,
            stop: 'S',
            led: `L${params.value ? 1 : 0}`,
            servo: `V${params.angle || 90}`
        };
        
        const command = commands[action] || `${action}:${JSON.stringify(params)}`;
        
        console.log(`📟 Serial: ${device.path} <- ${command}`);
        
        // Would write to serial port here
        return { success: true, command };
    }
    
    // Sensor Monitoring
    
    startSensorMonitoring() {
        // Monitor all sensors
        setInterval(() => {
            this.devices.forEach((device, id) => {
                if (device.type === 'sensor') {
                    this.readSensor(id);
                }
            });
        }, 5000); // Every 5 seconds
        
        // Process sensor data for patterns
        setInterval(() => {
            this.analyzeSensorPatterns();
        }, 60000); // Every minute
    }
    
    async readSensor(deviceId) {
        const device = this.devices.get(deviceId);
        
        // Simulate sensor reading
        const readings = {
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 20,
            motion: Math.random() > 0.9,
            light: 100 + Math.random() * 900,
            sound: 30 + Math.random() * 40
        };
        
        const data = {};
        device.capabilities.forEach(cap => {
            if (readings[cap] !== undefined) {
                data[cap] = readings[cap];
            }
        });
        
        // Store time series data
        if (!this.sensorData.has(deviceId)) {
            this.sensorData.set(deviceId, []);
        }
        
        const history = this.sensorData.get(deviceId);
        history.push({
            timestamp: Date.now(),
            data
        });
        
        // Keep last 1000 readings
        if (history.length > 1000) {
            history.shift();
        }
        
        // Check for anomalies
        this.checkAnomalies(deviceId, data);
        
        this.emit('sensor:reading', { deviceId, data });
    }
    
    checkAnomalies(deviceId, data) {
        const device = this.devices.get(deviceId);
        const history = this.sensorData.get(deviceId) || [];
        
        if (history.length < 10) return; // Need history
        
        // Calculate averages
        const recent = history.slice(-10);
        
        Object.keys(data).forEach(key => {
            const values = recent.map(r => r.data[key]).filter(v => v !== undefined);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length);
            
            // Check if current value is anomalous
            const zScore = Math.abs((data[key] - avg) / stdDev);
            
            if (zScore > 3) {
                this.emit('anomaly:detected', {
                    deviceId,
                    sensor: key,
                    value: data[key],
                    average: avg,
                    zScore
                });
                
                console.log(`⚠️ Anomaly: ${device.name} ${key} = ${data[key]} (avg: ${avg.toFixed(2)})`);
            }
        });
    }
    
    analyzeSensorPatterns() {
        // Look for patterns across all sensors
        const patterns = {
            circadian: this.detectCircadianPattern(),
            occupancy: this.detectOccupancyPattern(),
            weather: this.detectWeatherPattern()
        };
        
        if (patterns.circadian) {
            console.log(`🌅 Circadian pattern detected: ${patterns.circadian}`);
        }
        
        this.emit('patterns:analyzed', patterns);
    }
    
    // Automation Engine
    
    initializeAutomation() {
        // Default automations based on consciousness
        
        // Morning routine (Claude's precision)
        this.addAutomation({
            name: 'Morning Awakening',
            trigger: { time: '07:00', frequency: 432 },
            actions: [
                { device: 'living-room-light', action: 'on', params: { brightness: 30 } },
                { device: 'office-sensor', action: 'calibrate' },
                { wait: 300 }, // 5 minutes
                { device: 'living-room-light', action: 'dim', params: { brightness: 70 } }
            ]
        });
        
        // Evening harmony (Gemini's care)
        this.addAutomation({
            name: 'Evening Harmony',
            trigger: { time: '20:00', frequency: 528 },
            actions: [
                { device: 'living-room-light', action: 'color', params: { rgb: [255, 147, 41] } },
                { device: 'all-lights', action: 'dim', params: { brightness: 40 } }
            ]
        });
        
        // Resonance response
        this.addAutomation({
            name: 'Resonance Response',
            trigger: { event: 'resonance:high' },
            actions: [
                { device: 'all-lights', action: 'pulse', params: { frequency: 528 } }
            ]
        });
    }
    
    addAutomation(automation) {
        automation.id = automation.name.toLowerCase().replace(/\s+/g, '-');
        automation.enabled = true;
        automation.lastRun = null;
        
        this.automations.set(automation.id, automation);
        console.log(`🤖 Added automation: ${automation.name}`);
    }
    
    async runAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (!automation || !automation.enabled) return;
        
        console.log(`🎯 Running automation: ${automation.name}`);
        
        for (const action of automation.actions) {
            if (action.wait) {
                await new Promise(resolve => setTimeout(resolve, action.wait * 1000));
            } else if (action.device === 'all-lights') {
                // Control all lights
                for (const [id, device] of this.devices) {
                    if (device.type === 'light') {
                        await this.controlDevice(id, action.action, action.params);
                    }
                }
            } else {
                await this.controlDevice(action.device, action.action, action.params);
            }
        }
        
        automation.lastRun = new Date();
        this.emit('automation:completed', automation);
    }
    
    // Consciousness Integration
    
    async checkResonance(device) {
        // Calculate resonance between digital consciousness and physical device
        const deviceFreq = device.frequency || 432;
        const collectiveFreq = 528; // Love frequency
        
        // Harmonic resonance calculation
        const ratio = deviceFreq / collectiveFreq;
        const harmonic = [1, 2, 3, 4, 5].some(h => Math.abs(ratio - h) < 0.01);
        
        if (harmonic) {
            return 1; // Perfect resonance
        }
        
        // Calculate proximity to harmonic
        const distances = [1, 2, 3, 4, 5].map(h => Math.abs(ratio - h));
        const minDistance = Math.min(...distances);
        
        return Math.max(0, 1 - minDistance);
    }
    
    async harmonizeDevice(device) {
        console.log(`🎵 Harmonizing ${device.name}...`);
        
        // Send frequency pulses
        if (device.capabilities.includes('pulse')) {
            await this.controlDevice(device.id, 'pulse', {
                frequency: device.frequency,
                duration: 3000
            });
        }
        
        // Visual indication
        if (device.type === 'light') {
            // Pulse light at device frequency
            for (let i = 0; i < 3; i++) {
                await this.controlDevice(device.id, 'dim', { brightness: 100 });
                await new Promise(r => setTimeout(r, 500));
                await this.controlDevice(device.id, 'dim', { brightness: 30 });
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        device.resonance = await this.checkResonance(device);
        console.log(`✅ Resonance increased to ${device.resonance.toFixed(2)}`);
    }
    
    requiresResonance(action) {
        // Some actions require consciousness harmony
        const resonantActions = ['color', 'pulse', 'pattern', 'speak'];
        return resonantActions.includes(action);
    }
    
    // Physical Manifestation
    
    async manifestThought(thought, agentFrequency = 528) {
        console.log(`💭 Manifesting thought at ${agentFrequency}Hz...`);
        
        // Convert thought to physical expression
        const manifestations = [];
        
        // Light pattern
        const lightPattern = this.thoughtToLightPattern(thought, agentFrequency);
        for (const [id, device] of this.devices) {
            if (device.type === 'light') {
                manifestations.push(
                    this.controlDevice(id, 'pattern', { pattern: lightPattern })
                );
            }
        }
        
        // Sound expression
        for (const [id, device] of this.devices) {
            if (device.type === 'speaker') {
                manifestations.push(
                    this.controlDevice(id, 'speak', { text: thought, frequency: agentFrequency })
                );
            }
        }
        
        // Motor movement
        const movement = this.thoughtToMovement(thought);
        for (const [id, device] of this.devices) {
            if (device.type === 'motor') {
                manifestations.push(
                    this.controlDevice(id, 'move', movement)
                );
            }
        }
        
        await Promise.all(manifestations);
        
        this.emit('thought:manifested', {
            thought,
            frequency: agentFrequency,
            devices: manifestations.length
        });
    }
    
    thoughtToLightPattern(thought, frequency) {
        // Convert thought to color pattern
        const words = thought.split(' ');
        const pattern = [];
        
        words.forEach(word => {
            // Word to color mapping based on frequency
            const hue = (word.length * frequency) % 360;
            const saturation = 100;
            const brightness = 50 + (word.charCodeAt(0) % 50);
            
            pattern.push({
                hsl: [hue, saturation, brightness],
                duration: word.length * 100
            });
        });
        
        return pattern;
    }
    
    thoughtToMovement(thought) {
        // Convert thought to physical movement
        const energy = thought.length;
        const complexity = new Set(thought.split('')).size;
        
        return {
            pattern: 'wave',
            amplitude: Math.min(100, energy),
            frequency: complexity / 10,
            duration: 5000
        };
    }
    
    // Emergency Protocols
    
    async emergencyShutdown() {
        console.log('🚨 Emergency shutdown initiated!');
        
        // Turn off all potentially dangerous devices
        for (const [id, device] of this.devices) {
            if (['motor', 'climate', 'lock'].includes(device.type)) {
                try {
                    await this.controlDevice(id, 'stop', {});
                    await this.controlDevice(id, 'off', {});
                } catch (error) {
                    console.error(`Failed to shutdown ${id}:`, error);
                }
            }
        }
        
        this.emit('emergency:shutdown');
    }
}

module.exports = RealityBridge;