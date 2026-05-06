import { PrismaClient } from '../../generated/master/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from root
dotenv.config({ path: resolve(process.cwd(), '../.env') });

const pool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = 'admin@learnhub.lk';
    const password = 'AdminPassword123!'; // User should change this
    const firstName = 'System';
    const lastName = 'Administrator';

    console.log(`🚀 Provisioning Super Admin: ${email}...`);

    const existing = await prisma.platformAdmin.findUnique({
        where: { email },
    });

    if (existing) {
        console.log('⚠️ Admin already exists. Skipping...');
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.platformAdmin.create({
        data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'SUPER_ADMIN',
        },
    });

    console.log('✅ Super Admin created successfully!');
    console.log('-----------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------');
}

main()
    .catch((e) => {
        console.error('❌ Error creating admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
