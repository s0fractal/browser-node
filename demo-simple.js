#!/usr/bin/env node

/**
 * Simplified Demo of Living Identity Concept
 * Показує концепцію без складних залежностей
 */

class SimpleLivingEntity {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        this.soul = `${type}-${Date.now()}`;
        this.birth = Date.now();
        this.knownBy = new Map(); // service -> access_info
        this.shareHistory = [];
    }

    shareWith(service, accessLevel, metadata = {}) {
        const record = {
            service,
            accessLevel,
            sharedAt: Date.now(),
            purpose: metadata.purpose || 'unspecified',
            canRevoke: metadata.canRevoke !== false,
            legalRequirement: metadata.legalRequirement || false
        };

        this.knownBy.set(service, record);
        this.shareHistory.push({ ...record, action: 'shared' });

        console.log(`🔗 ${this.type} shared with ${service} (${accessLevel})`);
        console.log(`   Purpose: ${record.purpose}`);
        console.log(`   Can revoke: ${record.canRevoke}`);
        
        return record;
    }

    forgetFrom(service, method = 'api') {
        const record = this.knownBy.get(service);
        if (!record) {
            console.log(`ℹ️ ${this.type} not shared with ${service}`);
            return false;
        }

        if (record.legalRequirement) {
            console.log(`❌ Cannot revoke ${this.type} from ${service} - legal constraint`);
            return false;
        }

        if (!record.canRevoke) {
            console.log(`❌ Cannot revoke ${this.type} from ${service} - contractual constraint`);
            return false;
        }

        this.knownBy.delete(service);
        this.shareHistory.push({
            service,
            action: 'forgotten',
            method,
            timestamp: Date.now()
        });

        console.log(`🗑️ Forgotten ${this.type} from ${service} via ${method}`);
        return true;
    }

    getPrivacyAudit() {
        const now = Date.now();
        const age = now - this.birth;
        const shareCount = this.knownBy.size;

        const risks = [];
        if (age > 365 * 24 * 60 * 60 * 1000) risks.push('old_data');
        if (shareCount > 5) risks.push('widely_shared');

        return {
            type: this.type,
            age: Math.floor(age / (24 * 60 * 60 * 1000)), // days
            shareCount,
            risks,
            services: Array.from(this.knownBy.keys())
        };
    }
}

async function runDemo() {
    console.log(`
🆔 ======================================== 🆔
    LIVING IDENTITY VAULT DEMO
    Демонстрація контролю особистих даних
🆔 ======================================== 🆔
    `);

    // 1. Створюємо живі дані
    console.log('📇 1. Створюємо живі особисті дані...\n');
    
    const email = new SimpleLivingEntity('email', 'user@example.com');
    const phone = new SimpleLivingEntity('phone', '+380XXXXXXXXX');
    const sshKey = new SimpleLivingEntity('ssh_key', 'ssh-ed25519 AAAAC3NzaC1...');

    // 2. Ділимося з сервісами
    console.log('\n🔗 2. Ділимося даними з різними сервісами...\n');
    
    email.shareWith('github.com', 'full', {
        purpose: 'account_recovery',
        canRevoke: true
    });
    
    email.shareWith('bank', 'notifications_only', {
        purpose: 'security_alerts',
        canRevoke: false,
        legalRequirement: true
    });
    
    email.shareWith('newsletter-service', 'marketing', {
        purpose: 'marketing_updates',
        canRevoke: true
    });
    
    phone.shareWith('bank', '2fa_only', {
        purpose: 'two_factor_auth',
        canRevoke: false,
        legalRequirement: true
    });
    
    sshKey.shareWith('production-vps', 'full', {
        purpose: 'server_access',
        canRevoke: true
    });

    // 3. Показуємо поточний стан
    console.log('\n📊 3. Поточний стан даних...\n');
    
    const entities = [email, phone, sshKey];
    
    entities.forEach(entity => {
        console.log(`${entity.type} (${entity.value.substring(0, 30)}...):`);
        for (const [service, record] of entity.knownBy) {
            console.log(`   └── ${service}: ${record.accessLevel} (can revoke: ${record.canRevoke})`);
        }
        console.log('');
    });

    // 4. Аудит приватності
    console.log('🔍 4. Аудит приватності...\n');
    
    entities.forEach(entity => {
        const audit = entity.getPrivacyAudit();
        console.log(`${audit.type}:`);
        console.log(`   Age: ${audit.age} days`);
        console.log(`   Shared with: ${audit.shareCount} services`);
        console.log(`   Risks: ${audit.risks.join(', ') || 'none'}`);
        console.log(`   Services: ${audit.services.join(', ')}`);
        console.log('');
    });

    // 5. Демонстрація забуття
    console.log('🗑️ 5. Демонстрація права на забуття...\n');
    
    // Забуваємо email з newsletter (можемо)
    console.log('Спроба забути email з newsletter-service:');
    email.forgetFrom('newsletter-service', 'api');
    
    console.log('\nСпроба забути email з банку:');
    email.forgetFrom('bank', 'gdpr');
    
    console.log('\nСпроба забути phone з банку:');
    phone.forgetFrom('bank', 'gdpr');

    // 6. Фінальний стан
    console.log('\n📊 6. Фінальний стан після забуття...\n');
    
    entities.forEach(entity => {
        console.log(`${entity.type}:`);
        for (const [service, record] of entity.knownBy) {
            console.log(`   └── ${service}: ${record.accessLevel}`);
        }
        console.log('');
    });

    // 7. Історія дій
    console.log('📜 7. Історія дій з особистими даними...\n');
    
    entities.forEach(entity => {
        if (entity.shareHistory.length > 0) {
            console.log(`${entity.type} history:`);
            entity.shareHistory.forEach(action => {
                const date = new Date(action.timestamp || action.sharedAt).toLocaleString();
                console.log(`   ${date}: ${action.action} with ${action.service}`);
            });
            console.log('');
        }
    });

    console.log(`
✨ ======================================== ✨
    КОНЦЕПЦІЯ ПРОДЕМОНСТРОВАНА
✨ ======================================== ✨

Ключові особливості Living Identity Vault:

🎯 ВІДСТЕЖЕННЯ:
   ✓ Кожен фрагмент особистих даних знає де він живе
   ✓ Записує всі sharing і forgetting операції
   ✓ Розуміє свої права і обмеження

🔒 КОНТРОЛЬ:
   ✓ Різні рівні доступу для різних сервісів
   ✓ Поважає legal requirements
   ✓ Дозволяє забуття коли це можливо

🔍 АУДИТ:
   ✓ Показує хто знає що про вас
   ✓ Виявляє ризики privacy
   ✓ Рекомендує дії для покращення

🗑️ ЗАБУТТЯ:
   ✓ Право на забуття (GDPR Article 17)
   ✓ Різні методи (API, GDPR requests, nuclear)
   ✓ Автоматичне забуття за умовами

Це майбутнє privacy management!
    `);
}

runDemo().catch(console.error);