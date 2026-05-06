const { createCipheriv, randomBytes } = require('crypto');
const { PrismaClient } = require('./generated/master/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(process.cwd(), '../.env') });

function encrypt(plaintext, keyHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
    const keyHex = process.env.ENCRYPTION_KEY;
    console.log('Using encryption key:', keyHex);
    const dbPassword = process.env.POSTGRES_PASSWORD || 'learnhub_dev_password';
    console.log('Using db password:', dbPassword);

    const encrypted = encrypt(dbPassword, keyHex);
    console.log('Encrypted value:', encrypted);

    console.log('Updating tenant shehan dbPasswordEncrypted...');
    const pool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    await prisma.tenant.update({
        where: { slug: 'shehan' },
        data: { dbPasswordEncrypted: encrypted }
    });

    console.log('✅ Tenant dbPasswordEncrypted updated successfully!');
    await prisma.$disconnect();
    await pool.end();
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
