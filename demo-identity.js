#!/usr/bin/env node

/**
 * Demo Living Identity Vault
 * Показує як працює система відстеження особистих даних
 */

const { LivingIdentityVault } = require('./lib/living-identity-vault');

async function runDemo() {
    console.log(`
🆔 ======================================== 🆔
    LIVING IDENTITY VAULT DEMO
    Демонстрація системи контролю особистих даних
🆔 ======================================== 🆔
    `);

    const vault = new LivingIdentityVault();
    await vault.init();

    // 1. Додаємо контактні дані
    console.log('📇 1. Додаємо контактні дані...\n');
    
    const emailSoul = await vault.addContact('email', 'user@example.com', {
        purpose: 'primary_communication',
        canForget: true
    });
    
    const phoneSoul = await vault.addContact('phone', '+380XXXXXXXXX', {
        purpose: 'security_2fa',
        canForget: false // Не можемо забути - використовується для 2FA
    });
    
    // 2. Створюємо SSH ключ
    console.log('\n🔑 2. Створюємо SSH ключ для серверів...\n');
    
    const sshKey = await vault.createSSHKey('production-server', {
        autoRotate: true,
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 рік
    });
    
    console.log('SSH ключ створений з автоматичною ротацією');
    
    // 3. Ділимося даними з сервісами
    console.log('\n🔗 3. Ділимося даними з різними сервісами...\n');
    
    // Email з GitHub
    await vault.shareIdentityWith(emailSoul, 'github.com', 'full', {
        purpose: 'account_recovery',
        canRevoke: true,
        legalRequirement: false
    });
    
    // Email з банком
    await vault.shareIdentityWith(emailSoul, 'bank', 'notifications_only', {
        purpose: 'security_alerts',
        canRevoke: false,
        legalRequirement: true // Банки мають законні вимоги
    });
    
    // Phone з банком для 2FA
    await vault.shareIdentityWith(phoneSoul, 'bank', '2fa_only', {
        purpose: 'two_factor_auth',
        canRevoke: false,
        legalRequirement: true
    });
    
    // Email з підпискою на новини
    await vault.shareIdentityWith(emailSoul, 'newsletter-service', 'marketing', {
        purpose: 'marketing_updates',
        canRevoke: true,
        autoForget: '12_months_inactive'
    });
    
    // SSH ключ з production сервером
    const entities = Array.from(vault.identityEntities.values());
    const sshEntity = entities.find(e => e.type === 'ssh_key');
    
    await vault.shareIdentityWith(sshEntity.soul, 'production-vps', 'full', {
        purpose: 'server_access',
        canRevoke: true,
        autoUpdate: true // Автоматично оновлювати при ротації ключа
    });
    
    // 4. Аудит приватності
    console.log('\n🔍 4. Аудит приватності...\n');
    
    const audit = await vault.auditPrivacy();
    
    console.log(`📊 Загальна статистика:`);
    console.log(`   Всього сутностей: ${audit.totalEntities}`);
    console.log(`   Низький ризик: ${audit.summary.riskDistribution.low}`);
    console.log(`   Середній ризик: ${audit.summary.riskDistribution.medium}`);
    console.log(`   Високий ризик: ${audit.summary.riskDistribution.high}`);
    
    console.log('\n📋 Хто знає які дані:');
    for (const [type, services] of Object.entries(audit.sharingMap)) {
        console.log(`   ${type}: ${services.join(', ')}`);
    }
    
    // 5. Демонстрація забуття
    console.log('\n🗑️ 5. Демонстрація права на забуття...\n');
    
    // Забуваємо email з newsletter (можемо - не legal requirement)
    const emailEntity = vault.identityEntities.get(emailSoul);
    await emailEntity.forgetFrom('newsletter-service', 'api');
    
    // Спробуємо забути з банку (не зможемо - legal requirement)
    await emailEntity.forgetFrom('bank', 'gdpr');
    
    // 6. Показуємо поточний стан
    console.log('\n📊 6. Фінальний стан після забуття...\n');
    
    for (const [soul, entity] of vault.identityEntities) {
        console.log(`${entity.type} (${entity.value.substring(0, 20)}...):`);
        for (const [service, record] of entity.knownBy) {
            console.log(`   └── ${service}: ${record.accessLevel} (can revoke: ${record.canRevoke})`);
        }
        console.log('');
    }
    
    // 7. Симуляція ротації SSH ключа
    console.log('🔄 7. Симуляція ротації SSH ключа...\n');
    
    await sshEntity.mutate(); // Генерує новий ключ
    
    console.log('SSH ключ оновлено. Сервіси з autoUpdate отримали новий ключ автоматично.');
    
    console.log(`
✨ ======================================== ✨
    DEMO ЗАВЕРШЕНО
✨ ======================================== ✨

Ви побачили як Living Identity Vault:
✅ Відстежує хто знає ваші особисті дані
✅ Контролює рівень доступу для кожного сервісу
✅ Поважає legal requirements
✅ Дозволяє забути дані коли це можливо
✅ Автоматично оновлює ключі/паролі
✅ Проводить аудит приватності

Це революційний підхід до privacy management!
    `);
}

runDemo().catch(console.error);