/**
 * LearnHub — Master Database Seed Script
 *
 * Seeds the master database with:
 * 1. Default subscription plans (Starter, Professional, Enterprise)
 * 2. A platform super admin account
 *
 * Run: npx tsx src/prisma/seed.ts
 *
 * NOTE: Requires MASTER_DATABASE_URL in .env
 */
import { PrismaClient } from '../../generated/master/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables
import 'dotenv/config';

const masterUrl = process.env.MASTER_DATABASE_URL;
if (!masterUrl) {
    console.error('❌ MASTER_DATABASE_URL is not set in .env');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString: masterUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding master database...\n');

    // ----------------------------------------------------------------
    // 1. Seed Subscription Plans
    // ----------------------------------------------------------------
    console.log('📋 Creating subscription plans...');

    const starterPlan = await prisma.plan.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Starter',
            maxStudents: 100,
            maxTeachers: 5,
            maxCourses: 10,
            priceLkr: 2500.00,
            featuresJson: {
                attendance: true,
                assignments: true,
                onlineExams: false,
                certificates: false,
                smsNotifications: false,
                customBranding: false,
            },
            isActive: true,
        },
    });
    console.log(`  ✅ ${starterPlan.name} — LKR ${starterPlan.priceLkr}/month`);

    const proPlan = await prisma.plan.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'Professional',
            maxStudents: 500,
            maxTeachers: 20,
            maxCourses: 50,
            priceLkr: 7500.00,
            featuresJson: {
                attendance: true,
                assignments: true,
                onlineExams: true,
                certificates: true,
                smsNotifications: true,
                customBranding: false,
            },
            isActive: true,
        },
    });
    console.log(`  ✅ ${proPlan.name} — LKR ${proPlan.priceLkr}/month`);

    const enterprisePlan = await prisma.plan.upsert({
        where: { id: '00000000-0000-0000-0000-000000000003' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'Enterprise',
            maxStudents: 5000,
            maxTeachers: 100,
            maxCourses: 200,
            priceLkr: 25000.00,
            featuresJson: {
                attendance: true,
                assignments: true,
                onlineExams: true,
                certificates: true,
                smsNotifications: true,
                customBranding: true,
                prioritySupport: true,
                apiAccess: true,
            },
            isActive: true,
        },
    });
    console.log(`  ✅ ${enterprisePlan.name} — LKR ${enterprisePlan.priceLkr}/month`);

    // ----------------------------------------------------------------
    // 2. Seed Platform Super Admin
    // ----------------------------------------------------------------
    console.log('\n👤 Creating platform super admin...');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@learnhub.lk';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'LearnHub@2025';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.platformAdmin.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            firstName: 'Platform',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
        },
    });
    console.log(`  ✅ ${admin.email} (${admin.role})`);

    console.log('\n🎉 Master database seeded successfully!');
}

main()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
