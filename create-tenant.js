const { PrismaClient: MasterClient } = require('./backend/generated/master/client');
const { PrismaClient: TenantClient } = require('./backend/generated/tenant/client');
const bcrypt = require('bcrypt');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(process.cwd(), '.env') });

const masterPrisma = new MasterClient();

async function main() {
    const slug = 'shehan';
    const email = 'shehankmusic@gmail.com';
    const password = 'AdminPassword123!';
    const firstName = 'Shehan';
    const lastName = 'Admin';

    console.log(`🚀 Creating tenant registry in master database...`);

    const existingTenant = await masterPrisma.tenant.findUnique({
        where: { slug }
    });

    let tenantId;
    if (existingTenant) {
        console.log('⚠️ Tenant already exists in master. Using it.');
        tenantId = existingTenant.id;
    } else {
        const tenant = await masterPrisma.tenant.create({
            data: {
                name: 'Shehan Institute',
                slug,
                dbName: 'learnhub_tenant_shehan',
                dbHost: 'localhost',
                dbPort: 5432,
                dbUser: 'learnhub',
                dbPasswordEncrypted: 'U2FsdGVkX1/X64lUfBptm9+h1Q7F8pYvF7U9j6vLp5g=', // arbitrary placeholder for script since encryption isn't strictly checked by our direct client
                status: 'ACTIVE',
            }
        });
        tenantId = tenant.id;
        console.log('✅ Tenant record created successfully!');
    }

    console.log('🚀 Running raw SQL migrations to the tenant database...');
    // Create the database directly using raw execute on master
    try {
        await masterPrisma.$executeRawUnsafe(`CREATE DATABASE "learnhub_tenant_shehan"`);
        console.log('✅ Created database learnhub_tenant_shehan');
    } catch (err) {
        console.log('⚠️ Database might already exist or creation failed:', err.message);
    }

    console.log('🚀 Creating tenant admin in tenant database...');
    // Connect to specific tenant database to create the admin user
    const tenantPrisma = new TenantClient({
        datasources: {
            db: {
                url: `postgresql://learnhub:learnhub_dev_password@localhost:5432/learnhub_tenant_shehan?schema=public`
            }
        }
    });

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const existingUser = await tenantPrisma.user.findUnique({ where: { email } });
        if (!existingUser) {
            await tenantPrisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    firstName,
                    lastName,
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }
            });
            console.log('✅ Tenant Admin user created successfully!');
        } else {
            console.log('⚠️ Tenant Admin user already exists. Skipping user creation.');
        }
    } catch (e) {
        console.error('❌ Error creating tenant admin:', e);
    } finally {
        await tenantPrisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await masterPrisma.$disconnect();
    });
