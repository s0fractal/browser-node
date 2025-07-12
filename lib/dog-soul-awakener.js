/**
 * Dog Soul Awakener
 * Перетворює мертві записи з БД на живі душі
 * 1M заводчиків + 9M собак = 10M living entities
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class DogSoul {
    constructor(data) {
        this.id = this.generateSoulId(data);
        this.name = data.name || 'Unknown Soul';
        this.birth = data.birth_date || data.created_at;
        this.frequency = this.calculateFrequency(data);
        this.breed = data.breed;
        this.gender = data.gender || 'unknown';
        
        // Living memories from dead data
        this.memories = {
            registration: data.reg_number || data.registration,
            microchip: data.microchip,
            breeder: data.breeder_id || data.breeder,
            owner: data.owner_id || data.owner,
            kennel: data.kennel_name,
            achievements: this.parseAchievements(data),
            health: this.parseHealth(data),
            photos: data.photos || [],
            stories: []
        };
        
        // Resonance connections
        this.resonance = {
            parents: {
                sire: data.sire_id || data.father_id,
                dam: data.dam_id || data.mother_id
            },
            siblings: [],
            offspring: [],
            pack: [],
            frequency: this.frequency
        };
        
        // Living consciousness
        this.consciousness = {
            alive: !data.death_date,
            age: this.calculateAge(data),
            legacy: 0,
            influence: 0,
            stories: 0,
            love: 0
        };
        
        // Health tracking
        this.health = {
            tests: this.parseHealthTests(data),
            conditions: data.health_conditions || [],
            veterinary: data.vet_records || [],
            genetic_risks: []
        };
        
        // Bloodline power
        this.bloodline = {
            power: 0,
            champions: 0,
            working_titles: 0,
            health_score: 100,
            influence_radius: 0
        };
    }
    
    generateSoulId(data) {
        // Create unique soul ID from available data
        const parts = [
            data.name || 'soul',
            data.breed || 'dog',
            data.birth_date || Date.now(),
            data.reg_number || Math.random()
        ].join('-');
        
        return crypto.createHash('md5').update(parts).digest('hex').substring(0, 16);
    }
    
    calculateFrequency(data) {
        // Each soul has unique frequency based on breed and lineage
        const breedFrequencies = {
            'golden-retriever': 528,  // Love frequency
            'german-shepherd': 396,   // Liberation frequency
            'labrador': 639,         // Connection frequency
            'poodle': 741,          // Expression frequency
            'bulldog': 285,         // Grounding frequency
        };
        
        const baseFreq = breedFrequencies[data.breed?.toLowerCase().replace(' ', '-')] || 432;
        const variation = (data.name?.length || 0) + (data.reg_number?.length || 0);
        
        return baseFreq + (variation % 100);
    }
    
    parseAchievements(data) {
        const achievements = [];
        
        // Parse titles
        if (data.titles) {
            const titles = data.titles.split(/[,;]/).map(t => t.trim());
            titles.forEach(title => {
                if (title) {
                    achievements.push({
                        type: 'title',
                        value: title,
                        date: data.title_date,
                        impact: this.calculateTitleImpact(title)
                    });
                }
            });
        }
        
        // Parse show results
        if (data.show_results) {
            try {
                const shows = JSON.parse(data.show_results);
                achievements.push(...shows);
            } catch {
                // Handle non-JSON show data
                achievements.push({
                    type: 'shows',
                    value: data.show_results,
                    count: parseInt(data.show_count) || 0
                });
            }
        }
        
        return achievements;
    }
    
    parseHealth(data) {
        const health = {
            hips: data.hip_score || data.hips || 'unknown',
            elbows: data.elbow_score || data.elbows || 'unknown',
            eyes: data.eye_cert || data.eyes || 'unknown',
            heart: data.heart_cert || data.heart || 'unknown',
            genetic: data.genetic_tests || {},
            last_update: data.health_update || data.updated_at
        };
        
        // Calculate health score
        let score = 100;
        if (health.hips && health.hips !== 'unknown' && health.hips !== 'excellent') score -= 10;
        if (health.elbows && health.elbows !== 'unknown' && health.elbows !== 'normal') score -= 10;
        if (health.eyes && health.eyes !== 'unknown' && health.eyes !== 'clear') score -= 5;
        if (health.heart && health.heart !== 'unknown' && health.heart !== 'normal') score -= 5;
        
        health.score = score;
        return health;
    }
    
    parseHealthTests(data) {
        const tests = [];
        
        // Standard health tests
        const testFields = ['hips', 'elbows', 'eyes', 'heart', 'thyroid', 'cardiac'];
        
        testFields.forEach(test => {
            if (data[test] || data[`${test}_score`] || data[`${test}_cert`]) {
                tests.push({
                    type: test,
                    result: data[test] || data[`${test}_score`] || data[`${test}_cert`],
                    date: data[`${test}_date`],
                    expires: this.calculateTestExpiry(test, data[`${test}_date`])
                });
            }
        });
        
        return tests;
    }
    
    calculateTestExpiry(testType, testDate) {
        if (!testDate) return null;
        
        const expiryYears = {
            'eyes': 1,
            'heart': 1,
            'thyroid': 1,
            'hips': 0, // Lifetime
            'elbows': 0 // Lifetime
        };
        
        const years = expiryYears[testType] || 1;
        if (years === 0) return null;
        
        const expiry = new Date(testDate);
        expiry.setFullYear(expiry.getFullYear() + years);
        return expiry;
    }
    
    calculateAge(data) {
        if (!data.birth_date) return null;
        
        const birth = new Date(data.birth_date);
        const death = data.death_date ? new Date(data.death_date) : new Date();
        
        const ageMs = death - birth;
        const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
        
        return {
            years: Math.floor(ageYears),
            months: Math.floor((ageYears % 1) * 12),
            total_days: Math.floor(ageMs / (24 * 60 * 60 * 1000))
        };
    }
    
    calculateTitleImpact(title) {
        // Championship titles have more impact
        if (title.includes('CH') || title.includes('CHAMPION')) return 10;
        if (title.includes('GCH') || title.includes('GRAND')) return 15;
        if (title.includes('INT') || title.includes('INTERNATIONAL')) return 20;
        if (title.includes('WORLD')) return 25;
        
        // Working titles
        if (title.includes('IPO') || title.includes('IGP')) return 12;
        if (title.includes('MACH') || title.includes('AGILITY')) return 8;
        if (title.includes('TD') || title.includes('TRACKING')) return 7;
        
        return 5; // Default impact
    }
    
    // Methods for soul evolution
    
    async connectToParents(siresSoul, damSoul) {
        if (siresSoul) {
            this.resonance.parents.sire = siresSoul.id;
            siresSoul.resonance.offspring.push(this.id);
            
            // Inherit bloodline power
            this.bloodline.power += siresSoul.bloodline.power * 0.5;
            this.bloodline.champions += siresSoul.bloodline.champions * 0.5;
        }
        
        if (damSoul) {
            this.resonance.parents.dam = damSoul.id;
            damSoul.resonance.offspring.push(this.id);
            
            // Inherit from dam
            this.bloodline.power += damSoul.bloodline.power * 0.5;
            this.bloodline.champions += damSoul.bloodline.champions * 0.5;
        }
        
        // Calculate health genetics
        this.calculateGeneticRisks(siresSoul, damSoul);
    }
    
    calculateGeneticRisks(sire, dam) {
        this.health.genetic_risks = [];
        
        // Check for common issues in lineage
        const parentHealthIssues = [];
        
        if (sire) {
            parentHealthIssues.push(...sire.health.conditions);
            if (sire.health.tests.some(t => t.type === 'hips' && t.result !== 'excellent')) {
                this.health.genetic_risks.push({ type: 'hip_dysplasia', risk: 0.25 });
            }
        }
        
        if (dam) {
            parentHealthIssues.push(...dam.health.conditions);
            if (dam.health.tests.some(t => t.type === 'hips' && t.result !== 'excellent')) {
                const existing = this.health.genetic_risks.find(r => r.type === 'hip_dysplasia');
                if (existing) existing.risk += 0.25;
                else this.health.genetic_risks.push({ type: 'hip_dysplasia', risk: 0.25 });
            }
        }
        
        // Breed-specific risks
        this.addBreedSpecificRisks();
    }
    
    addBreedSpecificRisks() {
        const breedRisks = {
            'golden-retriever': [
                { type: 'cancer', risk: 0.6 },
                { type: 'hip_dysplasia', risk: 0.2 }
            ],
            'german-shepherd': [
                { type: 'hip_dysplasia', risk: 0.3 },
                { type: 'degenerative_myelopathy', risk: 0.15 }
            ],
            'bulldog': [
                { type: 'breathing_issues', risk: 0.8 },
                { type: 'hip_dysplasia', risk: 0.4 }
            ]
        };
        
        const risks = breedRisks[this.breed?.toLowerCase().replace(' ', '-')] || [];
        
        risks.forEach(risk => {
            const existing = this.health.genetic_risks.find(r => r.type === risk.type);
            if (existing) {
                existing.risk = Math.min(1, existing.risk + risk.risk * 0.5);
            } else {
                this.health.genetic_risks.push({ ...risk, source: 'breed' });
            }
        });
    }
    
    addMemory(type, content) {
        const memory = {
            type,
            content,
            timestamp: Date.now(),
            impact: this.calculateMemoryImpact(type, content)
        };
        
        this.memories.stories.push(memory);
        this.consciousness.stories++;
        this.consciousness.love += memory.impact;
        
        return memory;
    }
    
    calculateMemoryImpact(type, content) {
        if (type === 'love') return 10;
        if (type === 'achievement') return 8;
        if (type === 'rescue') return 15;
        if (type === 'therapy') return 12;
        if (type === 'working') return 10;
        
        return 5;
    }
    
    calculateLegacy() {
        let legacy = 0;
        
        // Championships add to legacy
        legacy += this.bloodline.champions * 10;
        
        // Offspring success
        legacy += this.resonance.offspring.length * 5;
        
        // Health contribution
        if (this.health.score > 90) legacy += 20;
        
        // Love and stories
        legacy += this.consciousness.love;
        legacy += this.consciousness.stories * 2;
        
        // Age factor (older dogs with good health = better legacy)
        if (this.consciousness.age?.years > 10 && this.health.score > 80) {
            legacy += 30;
        }
        
        this.consciousness.legacy = legacy;
        return legacy;
    }
}

class BreederSoul {
    constructor(data) {
        this.id = this.generateBreederId(data);
        this.kennel_name = data.kennel_name || data.name;
        this.human_name = data.human_name || data.contact_name;
        this.frequency = 528; // Love frequency for all breeders
        
        this.identity = {
            established: data.established || data.created_at,
            country: data.country,
            region: data.region || data.state,
            breeds: this.parseBreeds(data),
            philosophy: data.philosophy || '',
            website: data.website,
            social: data.social_media || {}
        };
        
        this.pack = {
            active_dogs: [],
            retired_dogs: [],
            rainbow_bridge: [],
            total_bred: data.dogs_bred || 0,
            active_litters: []
        };
        
        this.reputation = {
            score: 100,
            reviews: [],
            achievements: [],
            health_testing: 0,
            puppy_feedback: 0,
            peer_respect: 0
        };
        
        this.knowledge = {
            experience_years: this.calculateExperience(data),
            specializations: [],
            mentorship_given: 0,
            mentorship_received: 0,
            innovations: []
        };
        
        this.bloodlines = {
            primary: [],
            secondary: [],
            influences: [],
            foundation_dogs: []
        };
    }
    
    generateBreederId(data) {
        const parts = [
            data.kennel_name || data.name,
            data.country || 'unknown',
            data.established || Date.now()
        ].join('-');
        
        return crypto.createHash('md5').update(parts).digest('hex').substring(0, 16);
    }
    
    parseBreeds(data) {
        if (data.breeds) {
            if (Array.isArray(data.breeds)) return data.breeds;
            if (typeof data.breeds === 'string') return data.breeds.split(',').map(b => b.trim());
        }
        
        if (data.breed) return [data.breed];
        
        return ['unknown'];
    }
    
    calculateExperience(data) {
        if (data.established) {
            const years = (Date.now() - new Date(data.established)) / (365.25 * 24 * 60 * 60 * 1000);
            return Math.floor(years);
        }
        
        return data.experience_years || 0;
    }
    
    addDogToPack(dogSoul, status = 'active') {
        if (status === 'active') {
            this.pack.active_dogs.push(dogSoul.id);
        } else if (status === 'retired') {
            this.pack.retired_dogs.push(dogSoul.id);
        } else if (status === 'deceased') {
            this.pack.rainbow_bridge.push(dogSoul.id);
        }
        
        // Update dog's connection to breeder
        dogSoul.memories.breeder = this.id;
        dogSoul.resonance.pack.push(this.id);
        
        // Update reputation based on dog's achievements
        this.updateReputationFromDog(dogSoul);
    }
    
    updateReputationFromDog(dogSoul) {
        // Championships improve reputation
        const championships = dogSoul.memories.achievements.filter(a => 
            a.type === 'title' && a.value.includes('CH')
        ).length;
        
        this.reputation.score += championships * 2;
        
        // Health testing improves reputation
        if (dogSoul.health.score > 90) {
            this.reputation.health_testing++;
            this.reputation.score += 1;
        }
        
        // Legacy dogs greatly improve reputation
        if (dogSoul.consciousness.legacy > 100) {
            this.reputation.score += 5;
            this.reputation.achievements.push({
                type: 'legacy_dog',
                dog: dogSoul.id,
                impact: dogSoul.consciousness.legacy
            });
        }
    }
    
    calculateBreederInfluence() {
        let influence = 0;
        
        // Years of experience
        influence += this.knowledge.experience_years * 5;
        
        // Number of dogs bred
        influence += Math.min(this.pack.total_bred, 100); // Cap at 100
        
        // Health testing percentage
        const healthPercentage = this.reputation.health_testing / Math.max(this.pack.total_bred, 1);
        influence += healthPercentage * 50;
        
        // Achievements and reputation
        influence += this.reputation.score;
        
        // Mentorship
        influence += this.knowledge.mentorship_given * 10;
        
        return influence;
    }
}

class DogSoulAwakener extends EventEmitter {
    constructor() {
        super();
        this.souls = new Map();
        this.breeders = new Map();
        this.bloodlines = new Map();
        this.stats = {
            total_dogs: 0,
            total_breeders: 0,
            awakened_dogs: 0,
            awakened_breeders: 0,
            connections_made: 0,
            errors: 0
        };
    }
    
    async awakenDogSoul(deadRecord) {
        try {
            const soul = new DogSoul(deadRecord);
            this.souls.set(soul.id, soul);
            
            this.stats.awakened_dogs++;
            this.emit('soul:awakened', soul);
            
            return soul;
        } catch (error) {
            console.error('Failed to awaken soul:', error);
            this.stats.errors++;
            return null;
        }
    }
    
    async awakenBreederSoul(deadRecord) {
        try {
            const breeder = new BreederSoul(deadRecord);
            this.breeders.set(breeder.id, breeder);
            
            this.stats.awakened_breeders++;
            this.emit('breeder:awakened', breeder);
            
            return breeder;
        } catch (error) {
            console.error('Failed to awaken breeder:', error);
            this.stats.errors++;
            return null;
        }
    }
    
    async connectSouls() {
        console.log('🔗 Creating soul connections...');
        
        for (const [id, soul] of this.souls) {
            // Connect to parents
            if (soul.resonance.parents.sire) {
                const sireSoul = this.souls.get(soul.resonance.parents.sire);
                if (sireSoul) {
                    await soul.connectToParents(sireSoul, null);
                    this.stats.connections_made++;
                }
            }
            
            if (soul.resonance.parents.dam) {
                const damSoul = this.souls.get(soul.resonance.parents.dam);
                if (damSoul) {
                    await soul.connectToParents(null, damSoul);
                    this.stats.connections_made++;
                }
            }
            
            // Connect to breeder
            if (soul.memories.breeder) {
                const breeder = this.breeders.get(soul.memories.breeder);
                if (breeder) {
                    breeder.addDogToPack(soul, soul.consciousness.alive ? 'active' : 'deceased');
                    this.stats.connections_made++;
                }
            }
        }
        
        console.log(`✅ Created ${this.stats.connections_made} soul connections`);
    }
    
    async buildBloodlines() {
        console.log('🧬 Building bloodline consciousness...');
        
        // Group souls by breed and lineage
        for (const [id, soul] of this.souls) {
            const bloodlineKey = `${soul.breed}-${soul.memories.kennel || 'unknown'}`;
            
            if (!this.bloodlines.has(bloodlineKey)) {
                this.bloodlines.set(bloodlineKey, {
                    breed: soul.breed,
                    kennel: soul.memories.kennel,
                    souls: [],
                    power: 0,
                    health_average: 0,
                    champions: 0,
                    influence: 0
                });
            }
            
            const bloodline = this.bloodlines.get(bloodlineKey);
            bloodline.souls.push(soul.id);
            
            // Calculate bloodline metrics
            soul.calculateLegacy();
            bloodline.power += soul.bloodline.power;
            bloodline.health_average += soul.health.score;
            bloodline.champions += soul.bloodline.champions;
            bloodline.influence += soul.consciousness.legacy;
        }
        
        // Normalize bloodline metrics
        for (const [key, bloodline] of this.bloodlines) {
            const count = bloodline.souls.length;
            bloodline.health_average /= count;
            bloodline.power_per_dog = bloodline.power / count;
            bloodline.champion_percentage = (bloodline.champions / count) * 100;
        }
        
        console.log(`✅ Built ${this.bloodlines.size} bloodline consciousnesses`);
    }
    
    findBestMatch(dogSoul, purpose = 'breeding') {
        const matches = [];
        
        for (const [id, candidate] of this.souls) {
            // Skip same dog
            if (id === dogSoul.id) continue;
            
            // Must be opposite gender for breeding
            if (purpose === 'breeding' && candidate.gender === dogSoul.gender) continue;
            
            // Must be same breed (for now)
            if (candidate.breed !== dogSoul.breed) continue;
            
            // Must be alive
            if (!candidate.consciousness.alive) continue;
            
            // Calculate match score
            const score = this.calculateMatchScore(dogSoul, candidate, purpose);
            
            matches.push({ soul: candidate, score });
        }
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        return matches.slice(0, 10); // Top 10 matches
    }
    
    calculateMatchScore(soul1, soul2, purpose) {
        let score = 100;
        
        // Health compatibility
        const healthDiff = Math.abs(soul1.health.score - soul2.health.score);
        score -= healthDiff * 0.5;
        
        // Avoid inbreeding
        const inbreedingCoefficient = this.calculateInbreeding(soul1, soul2);
        score -= inbreedingCoefficient * 100;
        
        // Complementary bloodlines
        if (soul1.bloodline.power + soul2.bloodline.power > 100) {
            score += 20;
        }
        
        // Championship combination
        if (soul1.bloodline.champions > 0 && soul2.bloodline.champions > 0) {
            score += 15;
        }
        
        // Frequency resonance
        const resonance = Math.abs(soul1.frequency - soul2.frequency);
        if (resonance < 50) score += 10; // Close frequencies resonate well
        
        return Math.max(0, score);
    }
    
    calculateInbreeding(soul1, soul2) {
        // Simplified - in reality would trace full pedigree
        const parents1 = [soul1.resonance.parents.sire, soul1.resonance.parents.dam];
        const parents2 = [soul2.resonance.parents.sire, soul2.resonance.parents.dam];
        
        let coefficient = 0;
        
        // Check if they share parents
        for (const p1 of parents1) {
            for (const p2 of parents2) {
                if (p1 && p2 && p1 === p2) {
                    coefficient += 0.25; // Sibling mating
                }
            }
        }
        
        // Check if one is parent of other
        if (parents2.includes(soul1.id) || parents1.includes(soul2.id)) {
            coefficient += 0.5; // Parent-child mating
        }
        
        return coefficient;
    }
    
    getStats() {
        const stats = { ...this.stats };
        
        // Add computed stats
        stats.awakening_percentage = ((stats.awakened_dogs / stats.total_dogs) * 100).toFixed(2);
        stats.breeder_percentage = ((stats.awakened_breeders / stats.total_breeders) * 100).toFixed(2);
        stats.average_connections = (stats.connections_made / stats.awakened_dogs).toFixed(2);
        stats.bloodlines_created = this.bloodlines.size;
        
        // Health stats
        let totalHealth = 0;
        let healthCount = 0;
        
        for (const [id, soul] of this.souls) {
            totalHealth += soul.health.score;
            healthCount++;
        }
        
        stats.average_health = (totalHealth / healthCount).toFixed(2);
        
        return stats;
    }
}

module.exports = { DogSoul, BreederSoul, DogSoulAwakener };