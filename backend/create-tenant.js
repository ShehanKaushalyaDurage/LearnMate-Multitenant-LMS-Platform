const { PrismaClient: TenantClient } = require('./generated/tenant/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcrypt');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(process.cwd(), '../.env') });

async function main() {
    const emails = [
        { email: 'shashini@learnhub.lk', role: 'TEACHER', firstName: 'Shashini', lastName: 'Teacher' },
        { email: 'admin@learnhub.lk', role: 'TEACHER', firstName: 'Shehan', lastName: 'AdminTeacher' },
        { email: 'shehan@learnhub.lk', role: 'TEACHER', firstName: 'Shehan', lastName: 'Teacher' }
    ];
    const password = 'AdminPassword123!';

    console.log(`🚀 Seeding Teachers into shehan tenant database...`);

    const tenantPool = new pg.Pool({
        connectionString: `postgresql://learnhub:learnhub_dev_password@localhost:5432/learnhub_tenant_shehan?schema=public`
    });
    const tenantAdapter = new PrismaPg(tenantPool);
    const tenantPrisma = new TenantClient({ adapter: tenantAdapter });

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        for (const item of emails) {
            const existingUser = await tenantPrisma.user.findUnique({ where: { email: item.email } });
            if (!existingUser) {
                await tenantPrisma.user.create({
                    data: {
                        email: item.email,
                        passwordHash: hashedPassword,
                        firstName: item.firstName,
                        lastName: item.lastName,
                        role: item.role,
                        status: 'ACTIVE'
                    }
                });
                console.log(`✅ ${item.role} user created successfully: ${item.email}`);
            } else {
                console.log(`⚠️ User already exists: ${item.email}. Skipping user creation.`);
            }
        }
    } catch (e) {
        console.error('❌ Error creating teachers:', e);
    } finally {
        await tenantPrisma.$disconnect();
        await tenantPool.end();
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
