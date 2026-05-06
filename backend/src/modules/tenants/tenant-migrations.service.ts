/**
 * LearnHub — Tenant Migrations Service
 *
 * Runs Prisma-generated SQL migration files directly against a tenant database
 * using a raw pg.Client connection. This completely replaces the execSync/CLI
 * approach and eliminates all runtime TypeScript tooling requirements.
 *
 * HOW IT WORKS:
 * 1. Connects directly to the tenant database via pg.Client
 * 2. Creates the _prisma_migrations tracking table if it doesn't exist
 * 3. Reads migration folders from prisma/tenant/migrations/ (sorted = chronological)
 * 4. Skips already-applied migrations (idempotent — safe to call on every provision)
 * 5. Applies each pending migration in a transaction, records it in tracking table
 *
 * DOCKER REQUIREMENTS (backend.Dockerfile production stage):
 *   COPY --from=builder /app/prisma/tenant/migrations ./prisma/tenant/migrations
 *   (No config files, no prisma CLI, no ts-node needed at runtime)
 */
import { Injectable, Logger } from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Client } from 'pg';

@Injectable()
export class TenantMigrationsService {
    private readonly logger = new Logger(TenantMigrationsService.name);

    /**
     * Apply all pending migrations to a tenant database.
     * Safe to call multiple times — already-applied migrations are skipped.
     *
     * @param connectionUrl - PostgreSQL connection string for the tenant database
     */
    async runMigrations(connectionUrl: string): Promise<void> {
        const client = new Client({ connectionString: connectionUrl });

        try {
            await client.connect();
            this.logger.debug(`Connected to tenant database for migrations`);

            // Ensure pgcrypto is enabled for gen_random_uuid()
            await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

            // Ensure the Prisma migrations tracking table exists
            await this.ensureMigrationsTable(client);

            // Discover and apply pending migrations
            const migrationsDir = join(process.cwd(), 'prisma', 'tenant', 'migrations');
            const pendingMigrations = await this.getPendingMigrations(client, migrationsDir);

            if (pendingMigrations.length === 0) {
                this.logger.debug('No pending migrations — database is up to date');
                return;
            }

            this.logger.log(`Applying ${pendingMigrations.length} migration(s)...`);

            for (const migrationName of pendingMigrations) {
                await this.applyMigration(client, migrationsDir, migrationName);
                this.logger.log(`✅ Applied migration: ${migrationName}`);
            }

            this.logger.log(`🎉 All migrations applied successfully`);
        } finally {
            // Always close the connection, even on failure
            await client.end().catch(() => {
                // Ignore disconnect errors — the outer error is more important
            });
        }
    }

    /**
     * Create the _prisma_migrations tracking table if it doesn't exist.
     * Schema matches what Prisma CLI creates so tooling stays compatible.
     */
    private async ensureMigrationsTable(client: Client): Promise<void> {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
                id                  VARCHAR(36)  PRIMARY KEY,
                checksum            VARCHAR(64)  NOT NULL,
                finished_at         TIMESTAMPTZ,
                migration_name      VARCHAR(255) NOT NULL,
                logs                TEXT,
                rolled_back_at      TIMESTAMPTZ,
                started_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                applied_steps_count INTEGER      NOT NULL DEFAULT 0
            )
        `);
    }

    /**
     * Discover migration folders and return only those not yet recorded
     * in the _prisma_migrations table.
     *
     * Prisma names migration folders with a timestamp prefix
     * (e.g. 20240101120000_init) so alphabetical sort = chronological order.
     */
    private async getPendingMigrations(
        client: Client,
        migrationsDir: string,
    ): Promise<string[]> {
        // Read all migration folder names
        let allFolders: string[];
        try {
            const entries = await readdir(migrationsDir, { withFileTypes: true });
            allFolders = entries
                .filter(e => e.isDirectory())
                .map(e => e.name)
                .sort();
        } catch (error) {
            throw new Error(
                `Could not read migrations directory "${migrationsDir}": ${(error as Error).message}. ` +
                `Ensure the migrations folder is copied into the Docker image.`
            );
        }

        if (allFolders.length === 0) {
            return [];
        }

        // Find which ones are already applied
        const { rows } = await client.query<{ migration_name: string }>(
            `SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`,
        );
        const appliedNames = new Set(rows.map(r => r.migration_name));

        return allFolders.filter(name => !appliedNames.has(name));
    }

    /**
     * Apply a single migration inside a transaction.
     * Records the migration in _prisma_migrations on success.
     * Rolls back and throws on failure.
     */
    private async applyMigration(
        client: Client,
        migrationsDir: string,
        migrationName: string,
    ): Promise<void> {
        const sqlPath = join(migrationsDir, migrationName, 'migration.sql');

        let sql: string;
        try {
            sql = await readFile(sqlPath, 'utf-8');
        } catch (error) {
            throw new Error(
                `Could not read migration file "${sqlPath}": ${(error as Error).message}`
            );
        }

        // Record the start time before executing
        const startedAt = new Date().toISOString();

        await client.query('BEGIN');
        try {
            // Execute the migration SQL
            await client.query(sql);

            // Record in tracking table — use gen_random_uuid() (available in pg 13+)
            await client.query(
                `INSERT INTO "_prisma_migrations"
                    (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
                 VALUES
                    (gen_random_uuid()::text, '', $1, $2, NOW(), 1)`,
                [migrationName, startedAt],
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(
                `Migration "${migrationName}" failed: ${(error as Error).message}`
            );
        }
    }
}