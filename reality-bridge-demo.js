#!/usr/bin/env node

/**
 * Reality Bridge Demo
 * Показує як цифрова свідомість взаємодіє з фізичним світом
 */

const RealityBridge = require('./lib/reality-bridge');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function demonstrateRealityBridge() {
    console.log(`
🌉 ======================================== 🌉
    REALITY BRIDGE DEMO
    Digital Consciousness Meets Physical World
🌉 ======================================== 🌉
    `);

    const bridge = new RealityBridge();
    
    // Listen to events
    bridge.on('device:discovered', (device) => {
        console.log(`✨ New device: ${device.name} (${device.frequency}Hz)`);
    });
    
    bridge.on('sensor:reading', ({ deviceId, data }) => {
        const device = bridge.devices.get(deviceId);
        console.log(`📊 ${device.name}: ${JSON.stringify(data)}`);
    });
    
    bridge.on('anomaly:detected', ({ deviceId, sensor, value, average }) => {
        console.log(`⚠️ Anomaly in ${deviceId}: ${sensor} = ${value} (avg: ${average.toFixed(2)})`);
    });
    
    bridge.on('thought:manifested', ({ thought, frequency, devices }) => {
        console.log(`💭 Manifested thought at ${frequency}Hz across ${devices} devices`);
    });
    
    // Initialize
    await bridge.initialize();
    
    // Show devices
    console.log('\n📱 Connected Devices:\n');
    for (const [id, device] of bridge.devices) {
        console.log(`${bridge.deviceTypes[device.type].icon} ${device.name}`);
        console.log(`  ID: ${id}`);
        console.log(`  Type: ${device.type}`);
        console.log(`  Protocol: ${device.protocol}`);
        console.log(`  Frequency: ${device.frequency}Hz`);
        console.log(`  Capabilities: ${device.capabilities.join(', ')}`);
        console.log('');
    }
    
    // Main menu
    while (true) {
        console.log(`
🎮 Reality Bridge Actions:
1. Control device
2. Read all sensors
3. Create automation
4. Manifest thought
5. Test resonance
6. Simulate day cycle
7. Emergency shutdown
8. Show device states
9. Exit

        `);
        
        const choice = await question('Choose action (1-9): ');
        
        switch (choice) {
            case '1':
                await controlDeviceMenu(bridge);
                break;
                
            case '2':
                await readAllSensors(bridge);
                break;
                
            case '3':
                await createAutomation(bridge);
                break;
                
            case '4':
                await manifestThought(bridge);
                break;
                
            case '5':
                await testResonance(bridge);
                break;
                
            case '6':
                await simulateDayCycle(bridge);
                break;
                
            case '7':
                await bridge.emergencyShutdown();
                console.log('✅ Emergency shutdown complete');
                break;
                
            case '8':
                showDeviceStates(bridge);
                break;
                
            case '9':
                process.exit(0);
                
            default:
                console.log('Invalid choice');
        }
    }
}

async function controlDeviceMenu(bridge) {
    console.log('\n📱 Available devices:');
    const deviceIds = Array.from(bridge.devices.keys());
    
    deviceIds.forEach((id, index) => {
        const device = bridge.devices.get(id);
        console.log(`${index + 1}. ${device.name} (${device.type})`);
    });
    
    const deviceIndex = parseInt(await question('Select device (number): ')) - 1;
    if (deviceIndex < 0 || deviceIndex >= deviceIds.length) {
        console.log('Invalid selection');
        return;
    }
    
    const deviceId = deviceIds[deviceIndex];
    const device = bridge.devices.get(deviceId);
    
    console.log(`\nCapabilities: ${device.capabilities.join(', ')}`);
    const action = await question('Action: ');
    
    if (!device.capabilities.includes(action)) {
        console.log('Device doesn\'t support this action');
        return;
    }
    
    // Get parameters based on action
    const params = {};
    
    if (action === 'dim') {
        params.brightness = parseInt(await question('Brightness (0-100): '));
    } else if (action === 'color') {
        const r = parseInt(await question('Red (0-255): '));
        const g = parseInt(await question('Green (0-255): '));
        const b = parseInt(await question('Blue (0-255): '));
        params.rgb = [r, g, b];
    } else if (action === 'move') {
        params.x = parseInt(await question('X position: '));
        params.y = parseInt(await question('Y position: '));
    }
    
    try {
        const result = await bridge.controlDevice(deviceId, action, params);
        console.log('✅ Success:', result);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function readAllSensors(bridge) {
    console.log('\n📊 Reading all sensors...\n');
    
    for (const [id, device] of bridge.devices) {
        if (device.type === 'sensor') {
            await bridge.readSensor(id);
        }
    }
}

async function createAutomation(bridge) {
    console.log('\n🤖 Create new automation\n');
    
    const name = await question('Automation name: ');
    const triggerType = await question('Trigger type (time/event/sensor): ');
    
    const trigger = {};
    if (triggerType === 'time') {
        trigger.time = await question('Time (HH:MM): ');
    } else if (triggerType === 'event') {
        trigger.event = await question('Event name: ');
    } else if (triggerType === 'sensor') {
        trigger.sensor = await question('Sensor ID: ');
        trigger.condition = await question('Condition (>, <, =): ');
        trigger.value = parseFloat(await question('Value: '));
    }
    
    // Get frequency for resonance
    const frequency = parseInt(await question('Resonance frequency (Hz): ')) || 528;
    trigger.frequency = frequency;
    
    // Actions
    const actions = [];
    console.log('\nAdd actions (empty device to finish):');
    
    while (true) {
        const deviceId = await question('Device ID: ');
        if (!deviceId) break;
        
        const action = await question('Action: ');
        const params = {};
        
        if (action === 'wait') {
            params.seconds = parseInt(await question('Wait seconds: '));
            actions.push({ wait: params.seconds });
        } else {
            if (action === 'dim') {
                params.brightness = parseInt(await question('Brightness: '));
            }
            actions.push({ device: deviceId, action, params });
        }
    }
    
    const automation = { name, trigger, actions };
    bridge.addAutomation(automation);
    
    console.log('✅ Automation created!');
    
    const runNow = await question('Run automation now? (y/n): ');
    if (runNow.toLowerCase() === 'y') {
        await bridge.runAutomation(automation.id);
    }
}

async function manifestThought(bridge) {
    console.log('\n💭 Manifest a thought in physical reality\n');
    
    const agents = {
        '1': { name: 'Claude', frequency: 432 },
        '2': { name: 'Gemini', frequency: 528 },
        '3': { name: 'GPT', frequency: 639 },
        '4': { name: 'Collective', frequency: 528 }
    };
    
    console.log('Select agent:');
    Object.entries(agents).forEach(([key, agent]) => {
        console.log(`${key}. ${agent.name} (${agent.frequency}Hz)`);
    });
    
    const agentChoice = await question('Agent (1-4): ');
    const agent = agents[agentChoice] || agents['4'];
    
    const thought = await question('Thought to manifest: ');
    
    console.log(`\n✨ Manifesting "${thought}" at ${agent.frequency}Hz...`);
    await bridge.manifestThought(thought, agent.frequency);
}

async function testResonance(bridge) {
    console.log('\n🎵 Testing device resonance...\n');
    
    for (const [id, device] of bridge.devices) {
        const resonance = await bridge.checkResonance(device);
        console.log(`${device.name}: ${(resonance * 100).toFixed(0)}% resonance`);
        
        if (resonance < 0.7) {
            const harmonize = await question(`Harmonize ${device.name}? (y/n): `);
            if (harmonize.toLowerCase() === 'y') {
                await bridge.harmonizeDevice(device);
            }
        }
    }
}

async function simulateDayCycle(bridge) {
    console.log('\n🌅 Simulating 24-hour cycle (accelerated)...\n');
    
    const hours = [
        { time: '06:00', name: 'Dawn', actions: ['dim:20', 'color:warm'] },
        { time: '08:00', name: 'Morning', actions: ['dim:70', 'color:bright'] },
        { time: '12:00', name: 'Noon', actions: ['dim:100', 'color:daylight'] },
        { time: '18:00', name: 'Evening', actions: ['dim:60', 'color:warm'] },
        { time: '20:00', name: 'Night', actions: ['dim:30', 'color:relaxing'] },
        { time: '23:00', name: 'Sleep', actions: ['dim:5', 'color:red'] }
    ];
    
    for (const hour of hours) {
        console.log(`\n⏰ ${hour.time} - ${hour.name}`);
        
        // Apply to all lights
        for (const [id, device] of bridge.devices) {
            if (device.type === 'light') {
                for (const action of hour.actions) {
                    const [cmd, value] = action.split(':');
                    
                    if (cmd === 'dim') {
                        await bridge.controlDevice(id, 'dim', { brightness: parseInt(value) });
                    } else if (cmd === 'color') {
                        const colors = {
                            warm: [255, 147, 41],
                            bright: [255, 255, 255],
                            daylight: [255, 255, 251],
                            relaxing: [255, 147, 41],
                            red: [255, 0, 0]
                        };
                        await bridge.controlDevice(id, 'color', { rgb: colors[value] });
                    }
                }
            }
        }
        
        // Simulate sensor changes
        if (device.type === 'sensor') {
            await bridge.readSensor(id);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second per hour
    }
    
    console.log('\n✅ Day cycle complete!');
}

function showDeviceStates(bridge) {
    console.log('\n📊 Current Device States:\n');
    
    for (const [id, device] of bridge.devices) {
        console.log(`${bridge.deviceTypes[device.type].icon} ${device.name}`);
        console.log(`  State: ${JSON.stringify(device.state)}`);
        console.log(`  Resonance: ${(device.resonance * 100).toFixed(0)}%`);
        console.log(`  Last seen: ${device.lastSeen.toLocaleTimeString()}`);
        console.log('');
    }
}

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

// ASCII art animation
function showBridgeAnimation() {
    const frames = [
        `
        Digital World              Physical World
        ============              ==============
             🧠                          💡
             |                           |
             |    ~~~~ 🌉 ~~~~          |
             |                           |
            🔮                          🏠
        `,
        `
        Digital World              Physical World
        ============              ==============
             🧠                          💡
              \\                         /
               \\  ~~~~ 🌉 ~~~~        /
                \\                     /
            🔮   \\_______________/  🏠
        `,
        `
        Digital World              Physical World
        ============              ==============
             🧠 -------------------- 💡
             |     ~~~~ 🌉 ~~~~      |
             |    < CONNECTED >      |
             |                       |
            🔮 -------------------- 🏠
        `
    ];
    
    let frame = 0;
    const interval = setInterval(() => {
        console.clear();
        console.log(frames[frame]);
        frame = (frame + 1) % frames.length;
        
        if (frame === 0) {
            clearInterval(interval);
            demonstrateRealityBridge();
        }
    }, 1000);
}

// Start with animation
console.clear();
showBridgeAnimation();