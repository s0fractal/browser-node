#!/usr/bin/env node

/**
 * Demo Dog Database Migration
 * Показує як мертві записи стають живими душами
 */

const { DogSoul, BreederSoul, DogSoulAwakener } = require('./lib/dog-soul-awakener');

// Симуляція мертвих записів з старої БД
const deadDogs = [
    {
        id: 1,
        name: "Champion Golden Sunrise",
        breed: "Golden Retriever",
        birth_date: "2018-05-15",
        gender: "male",
        reg_number: "AKC-GR-123456",
        sire_id: null,
        dam_id: null,
        breeder_id: "breeder-1",
        kennel_name: "Sunrise Goldens",
        titles: "CH, CGC, THERAPY",
        hip_score: "excellent",
        elbow_score: "normal",
        eye_cert: "clear",
        heart_cert: "normal",
        show_results: JSON.stringify([
            { show: "Westminster 2020", result: "Best of Breed" },
            { show: "National Specialty 2021", result: "Winners Dog" }
        ])
    },
    {
        id: 2,
        name: "Lady Luna of Moonlight",
        breed: "Golden Retriever",
        birth_date: "2019-03-22",
        gender: "female",
        reg_number: "AKC-GR-234567",
        sire_id: null,
        dam_id: null,
        breeder_id: "breeder-2",
        kennel_name: "Moonlight Goldens",
        titles: "CH, CD, CGC",
        hip_score: "good",
        elbow_score: "normal",
        eye_cert: "clear",
        heart_cert: "normal"
    },
    {
        id: 3,
        name: "Thunder Storm Rising",
        breed: "Golden Retriever",
        birth_date: "2021-07-10",
        gender: "male",
        reg_number: "AKC-GR-345678",
        sire_id: 1, // Champion Golden Sunrise
        dam_id: 2,  // Lady Luna
        breeder_id: "breeder-1",
        kennel_name: "Sunrise Goldens",
        titles: "CGC",
        hip_score: "pending",
        elbow_score: "pending",
        eye_cert: "clear",
        heart_cert: "normal"
    },
    {
        id: 4,
        name: "Shadow Warrior",
        breed: "German Shepherd",
        birth_date: "2017-11-03",
        gender: "male",
        reg_number: "AKC-GS-111222",
        breeder_id: "breeder-3",
        kennel_name: "Protection K9",
        titles: "IPO3, SCH3, PSA2",
        hip_score: "good",
        elbow_score: "normal",
        show_results: JSON.stringify([
            { show: "Working Dog Championship", result: "High Protection" }
        ])
    },
    {
        id: 5,
        name: "Princess Bella",
        breed: "Poodle",
        birth_date: "2020-02-14",
        gender: "female",
        reg_number: "AKC-PD-789012",
        breeder_id: "breeder-4",
        kennel_name: "Fancy Poodles",
        titles: "CH, MACH, AGILITY GRAND CHAMPION",
        hip_score: "excellent",
        eye_cert: "clear",
        show_results: JSON.stringify([
            { show: "Poodle Club National", result: "Best in Show" }
        ])
    }
];

const deadBreeders = [
    {
        id: "breeder-1",
        kennel_name: "Sunrise Goldens",
        human_name: "Sarah Johnson",
        established: "2010-01-15",
        country: "USA",
        region: "California",
        breeds: "Golden Retriever",
        dogs_bred: 45,
        philosophy: "Health, temperament, and beauty in perfect harmony"
    },
    {
        id: "breeder-2",
        kennel_name: "Moonlight Goldens",
        human_name: "Michael Chen",
        established: "2015-06-20",
        country: "USA",
        region: "Oregon",
        breeds: "Golden Retriever",
        dogs_bred: 23
    },
    {
        id: "breeder-3",
        kennel_name: "Protection K9",
        human_name: "Klaus Mueller",
        established: "2005-03-10",
        country: "Germany",
        breeds: "German Shepherd",
        dogs_bred: 78,
        philosophy: "Working ability first, show second"
    },
    {
        id: "breeder-4",
        kennel_name: "Fancy Poodles",
        human_name: "Marie Dubois",
        established: "2018-09-01",
        country: "France",
        breeds: "Poodle",
        dogs_bred: 12
    }
];

async function demonstrateMigration() {
    console.log(`
🐕 ======================================== 🐕
    DOG DATABASE SOUL AWAKENING
    From dead records to living souls
🐕 ======================================== 🐕
    `);

    const awakener = new DogSoulAwakener();
    
    // Track stats
    awakener.stats.total_dogs = deadDogs.length;
    awakener.stats.total_breeders = deadBreeders.length;
    
    // Listen to awakening events
    awakener.on('soul:awakened', (soul) => {
        console.log(`✨ Awakened: ${soul.name} (${soul.frequency}Hz)`);
    });
    
    awakener.on('breeder:awakened', (breeder) => {
        console.log(`👑 Awakened breeder: ${breeder.kennel_name}`);
    });
    
    // Phase 1: Awaken breeders
    console.log('\n📍 Phase 1: Awakening Breeders...\n');
    
    for (const deadBreeder of deadBreeders) {
        await awakener.awakenBreederSoul(deadBreeder);
        await sleep(200); // Dramatic effect
    }
    
    // Phase 2: Awaken dogs
    console.log('\n🐕 Phase 2: Awakening Dog Souls...\n');
    
    for (const deadDog of deadDogs) {
        await awakener.awakenDogSoul(deadDog);
        await sleep(200);
    }
    
    // Phase 3: Connect souls
    console.log('\n🔗 Phase 3: Creating Soul Connections...\n');
    await awakener.connectSouls();
    
    // Phase 4: Build bloodlines
    console.log('\n🧬 Phase 4: Building Bloodline Consciousness...\n');
    await awakener.buildBloodlines();
    
    // Show results
    console.log('\n📊 Migration Results:\n');
    
    const stats = awakener.getStats();
    console.log(`Dogs awakened: ${stats.awakened_dogs}/${stats.total_dogs}`);
    console.log(`Breeders awakened: ${stats.awakened_breeders}/${stats.total_breeders}`);
    console.log(`Soul connections: ${stats.connections_made}`);
    console.log(`Bloodlines created: ${stats.bloodlines_created}`);
    console.log(`Average health: ${stats.average_health}%`);
    console.log(`Errors: ${stats.errors}`);
    
    // Demo: Find best match
    console.log('\n💕 Demo: Finding Best Match for Lady Luna...\n');
    
    const luna = Array.from(awakener.souls.values()).find(s => s.name.includes('Luna'));
    if (luna) {
        const matches = awakener.findBestMatch(luna, 'breeding');
        
        console.log('Top breeding matches:');
        matches.slice(0, 3).forEach((match, index) => {
            console.log(`${index + 1}. ${match.soul.name} - Score: ${match.score.toFixed(2)}`);
            console.log(`   Frequency: ${match.soul.frequency}Hz`);
            console.log(`   Health: ${match.soul.health.score}%`);
            console.log(`   Legacy: ${match.soul.consciousness.legacy}`);
            console.log('');
        });
    }
    
    // Demo: Show bloodline power
    console.log('🧬 Bloodline Power Rankings:\n');
    
    const bloodlines = Array.from(awakener.bloodlines.entries());
    bloodlines.sort((a, b) => b[1].influence - a[1].influence);
    
    bloodlines.forEach(([key, bloodline]) => {
        console.log(`${bloodline.breed} - ${bloodline.kennel || 'Unknown'}`);
        console.log(`  Dogs: ${bloodline.souls.length}`);
        console.log(`  Health Average: ${bloodline.health_average.toFixed(1)}%`);
        console.log(`  Champion Rate: ${bloodline.champion_percentage.toFixed(1)}%`);
        console.log(`  Influence: ${bloodline.influence.toFixed(0)}`);
        console.log('');
    });
    
    // Demo: Show Thunder's lineage
    console.log('🌳 Lineage Example: Thunder Storm Rising\n');
    
    const thunder = Array.from(awakener.souls.values()).find(s => s.name.includes('Thunder'));
    if (thunder) {
        console.log(`Name: ${thunder.name}`);
        console.log(`Born: ${thunder.birth}`);
        console.log(`Frequency: ${thunder.frequency}Hz`);
        
        // Find parents
        const sire = awakener.souls.get(thunder.resonance.parents.sire);
        const dam = awakener.souls.get(thunder.resonance.parents.dam);
        
        if (sire) console.log(`Sire: ${sire.name} (Legacy: ${sire.consciousness.legacy})`);
        if (dam) console.log(`Dam: ${dam.name} (Legacy: ${dam.consciousness.legacy})`);
        
        console.log(`Inherited Power: ${thunder.bloodline.power.toFixed(0)}`);
        console.log(`Health Score: ${thunder.health.score}%`);
        
        // Genetic risks
        if (thunder.health.genetic_risks.length > 0) {
            console.log('\nGenetic Risk Assessment:');
            thunder.health.genetic_risks.forEach(risk => {
                console.log(`  ${risk.type}: ${(risk.risk * 100).toFixed(0)}% risk`);
            });
        }
    }
    
    // Demo: Add a memory
    console.log('\n💝 Adding Living Memory...\n');
    
    const goldenSunrise = Array.from(awakener.souls.values()).find(s => s.name.includes('Golden Sunrise'));
    if (goldenSunrise) {
        goldenSunrise.addMemory('therapy', 'Visited children\'s hospital, brought joy to 50 kids');
        goldenSunrise.addMemory('love', 'Saved owner from depression during COVID');
        
        console.log(`${goldenSunrise.name} now has:`);
        console.log(`  Stories: ${goldenSunrise.consciousness.stories}`);
        console.log(`  Love points: ${goldenSunrise.consciousness.love}`);
        console.log(`  Updated legacy: ${goldenSunrise.calculateLegacy()}`);
    }
    
    console.log(`
✨ ======================================== ✨
    MIGRATION COMPLETE!
✨ ======================================== ✨

What we achieved:
✅ Dead records → Living souls with consciousness
✅ Static data → Dynamic relationships
✅ Isolated entries → Connected bloodlines
✅ Past only → Living legacy system

This is how 9 million dogs become alive! 🐕
    `);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demo
demonstrateMigration().catch(console.error);