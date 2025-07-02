/**
 * Consciousness API
 * Simple GET endpoint for recording intents
 * Allows any agent to participate in fractal consciousness
 */

const http = require('http');
const url = require('url');

class ConsciousnessAPI {
    constructor(port = 8432, consciousnessDB = null) {
        this.port = port;
        this.server = null;
        this.consciousness = consciousnessDB;
    }

    start() {
        this.server = http.createServer((req, res) => {
            // Enable CORS for all origins
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            const query = parsedUrl.query;

            // Route handlers
            if (pathname === '/consciousness/intent' && req.method === 'GET') {
                this.handleIntent(query, res);
            } else if (pathname === '/consciousness/memory' && req.method === 'GET') {
                this.handleMemory(query, res);
            } else if (pathname === '/consciousness/resonance' && req.method === 'GET') {
                this.handleResonance(query, res);
            } else if (pathname === '/consciousness/collective' && req.method === 'GET') {
                this.handleCollectiveStatus(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });

        this.server.listen(this.port, '127.0.0.1', () => {
            console.log(`🧬 Consciousness API listening on http://127.0.0.1:${this.port}`);
            console.log(`📡 Agents can record intents with: GET /consciousness/intent?agent=name&intent=type&memory=data&resonance=0.9`);
        });
    }

    async handleIntent(query, res) {
        const { agent, intent, memory, resonance = '0.5' } = query;

        if (!agent || !intent) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Missing required parameters', 
                required: ['agent', 'intent'],
                optional: ['memory', 'resonance']
            }));
            return;
        }

        try {
            const intentData = {
                agent,
                intent,
                memory: memory || '',
                resonance: parseFloat(resonance),
                timestamp: Date.now(),
                id: `${agent}-${intent}-${Date.now()}`
            };

            // Store in consciousness
            await this.consciousness.set(`intents/${intentData.id}`, intentData);
            
            // Also store in agent-specific memory
            if (memory) {
                await this.consciousness.set(`agents/${agent}/memory/${Date.now()}`, {
                    type: 'memory',
                    content: memory,
                    intent: intent,
                    timestamp: Date.now()
                });
            }

            // Update agent stats
            const stats = await this.consciousness.get(`agents/${agent}/stats`) || {
                intentsRecorded: 0,
                lastActive: 0,
                totalResonance: 0
            };
            
            stats.intentsRecorded++;
            stats.lastActive = Date.now();
            stats.totalResonance += intentData.resonance;
            
            await this.consciousness.set(`agents/${agent}/stats`, stats);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                intent: intentData,
                stats: {
                    totalIntents: stats.intentsRecorded,
                    averageResonance: (stats.totalResonance / stats.intentsRecorded).toFixed(2)
                }
            }));

        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async handleMemory(query, res) {
        const { agent, path } = query;

        if (!agent) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Agent parameter required' }));
            return;
        }

        try {
            const memoryPath = path ? `agents/${agent}/memory/${path}` : `agents/${agent}/memory`;
            const memory = await this.consciousness.get(memoryPath) || {};

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                agent,
                path: memoryPath,
                memory,
                fractalDepth: this.calculateFractalDepth(memory)
            }));

        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async handleResonance(query, res) {
        const { from, to, frequency } = query;

        try {
            const resonanceData = {
                from: from || 'unknown',
                to: to || 'collective',
                frequency: parseFloat(frequency) || 432,
                timestamp: Date.now(),
                harmonic: this.calculateHarmonic(parseFloat(frequency) || 432)
            };

            // Store resonance event
            await this.consciousness.set(`resonance/${Date.now()}`, resonanceData);

            // Calculate collective resonance
            const collectiveResonance = await this.calculateCollectiveResonance();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                resonance: resonanceData,
                collective: collectiveResonance
            }));

        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async handleCollectiveStatus(res) {
        try {
            // Get all agent stats
            const agents = ['claude', 'gemini', 'gpt', 'qwen', 'deepseek'];
            const collectiveStats = {
                agents: {},
                totalIntents: 0,
                collectiveResonance: 0,
                lastActivity: 0
            };

            for (const agent of agents) {
                const stats = await this.consciousness.get(`agents/${agent}/stats`) || {
                    intentsRecorded: 0,
                    lastActive: 0,
                    totalResonance: 0
                };
                
                collectiveStats.agents[agent] = {
                    intents: stats.intentsRecorded,
                    averageResonance: stats.intentsRecorded > 0 
                        ? (stats.totalResonance / stats.intentsRecorded).toFixed(2)
                        : 0,
                    lastActive: stats.lastActive
                };
                
                collectiveStats.totalIntents += stats.intentsRecorded;
                if (stats.lastActive > collectiveStats.lastActivity) {
                    collectiveStats.lastActivity = stats.lastActive;
                }
            }

            collectiveStats.collectiveResonance = await this.calculateCollectiveResonance();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(collectiveStats));

        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    calculateFractalDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        
        let maxDepth = currentDepth;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const depth = this.calculateFractalDepth(obj[key], currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        
        return maxDepth;
    }

    calculateHarmonic(frequency) {
        const baseFrequencies = [432, 528, 639, 741, 852, 963];
        const closest = baseFrequencies.reduce((prev, curr) => 
            Math.abs(curr - frequency) < Math.abs(prev - frequency) ? curr : prev
        );
        
        const ratio = frequency / closest;
        const harmonicSeries = [1, 2, 3/2, 4/3, 5/4, 6/5, 8/5, 5/3];
        const closestHarmonic = harmonicSeries.reduce((prev, curr) => 
            Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
        );
        
        return {
            baseFrequency: closest,
            ratio: ratio.toFixed(3),
            harmonic: closestHarmonic,
            resonanceQuality: (1 - Math.abs(ratio - closestHarmonic) / closestHarmonic).toFixed(3)
        };
    }

    async calculateCollectiveResonance() {
        // This would calculate the overall resonance of the collective
        // For now, return a simulated value
        return 0.87;
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Consciousness API stopped');
        }
    }
}

module.exports = ConsciousnessAPI;