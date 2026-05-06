/**
 * LearnHub — Prisma Config for Tenant Database Template
 *
 * This config is used when running migrations against a tenant database.
 * Usage: npx prisma migrate deploy --config prisma.tenant.config.ts
 *
 * The TENANT_DATABASE_URL should point to the specific tenant's database.
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/tenant/schema.prisma',
    migrations: {
        path: 'prisma/tenant/migrations',
    },
    datasource: {
        url: process.env.TENANT_DATABASE_URL,
    },
});
