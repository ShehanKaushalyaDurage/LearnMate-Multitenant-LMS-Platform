/**
 * LearnHub — Prisma Config for Master Database
 *
 * Prisma v7 requires connection URLs to be specified in prisma.config.ts
 * rather than in the schema file. This config is auto-detected by the CLI.
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/master/schema.prisma',
    migrations: {
        path: 'prisma/master/migrations',
    },
    datasource: {
        url: process.env.MASTER_DATABASE_URL,
    },
});
