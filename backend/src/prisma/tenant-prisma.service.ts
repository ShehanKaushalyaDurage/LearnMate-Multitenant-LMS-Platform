/**
 * LearnHub — Tenant Prisma Service
 *
 * Factory service that creates and caches PrismaClient instances per tenant.
 * Uses Prisma v7's @prisma/adapter-pg driver adapter pattern.
 *
 * HOW IT WORKS:
 * 1. Tenant middleware resolves the tenant from the subdomain
 * 2. This service receives the decrypted DB connection params
 * 3. Creates a new PrismaClient (or returns a cached one) for that tenant
 * 4. The client is attached to the request context via @TenantDb() decorator
 *
 * Connection pool management:
 * - Clients are cached by tenant ID to avoid reconnecting on every request
 * - Idle clients are disconnected after IDLE_TIMEOUT_MS to free resources
 * - Maximum MAX_CACHED_CLIENTS clients are kept in memory
 */
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/tenant/client';
import { Tenant } from '../../generated/master/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/** Configuration for a tenant database connection */
export interface TenantDbConfig {
    tenantId: string;
    dbHost: string;
    dbPort: number;
    dbName: string;
    dbUser: string;
    dbPassword: string; // Already decrypted
}

interface CachedClient {
    client: PrismaClient;
    pool: pg.Pool;
    lastUsed: number;
}

@Injectable()
export class TenantPrismaService implements OnModuleDestroy {
    private readonly logger = new Logger(TenantPrismaService.name);

    /** Cached Prisma clients keyed by tenant ID */
    private readonly clients = new Map<string, CachedClient>();

    /** Max number of cached tenant connections */
    private readonly MAX_CACHED_CLIENTS = 50;

    /** Idle timeout before disconnecting a cached client (15 minutes) */
    private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000;

    /** Cleanup interval handle */
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Periodically clean up idle connections every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanupIdleClients(), 5 * 60 * 1000);
    }

    /**
     * Get or create a PrismaClient for a specific tenant
     *
     * @param config - Tenant database connection configuration
     * @returns PrismaClient connected to the tenant's database
     */
    async getClientForTenant(config: TenantDbConfig): Promise<PrismaClient> {
        const { tenantId, dbHost, dbPort, dbName, dbUser, dbPassword } = config;

        // Check if we already have a cached client for this tenant
        const cached = this.clients.get(tenantId);
        if (cached) {
            cached.lastUsed = Date.now();
            return cached.client;
        }

        // Evict oldest client if we're at capacity
        if (this.clients.size >= this.MAX_CACHED_CLIENTS) {
            this.evictOldestClient();
        }

        // Build a pg.Pool with the tenant's connection config
        const pool = new pg.Pool({
            host: dbHost,
            port: dbPort,
            database: dbName,
            user: dbUser,
            password: dbPassword,
            max: 10, // Max connections per tenant pool
        });

        // Create the driver adapter with the pool
        const adapter = new PrismaPg(pool);

        // Create a new PrismaClient for this tenant
        const client = new PrismaClient({ adapter });

        // Connect to the tenant database
        await client.$connect();

        // Cache the client + pool
        this.clients.set(tenantId, {
            client,
            pool,
            lastUsed: Date.now(),
        });

        this.logger.log(`🔗 Connected to tenant database: ${dbName} (${tenantId})`);
        return client;
    }

    /**
     * Disconnect all cached clients on module destroy
     */
    async onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        const disconnectPromises = Array.from(this.clients.entries()).map(
            async ([tenantId, { client, pool }]) => {
                try {
                    await client.$disconnect();
                    await pool.end();
                    this.logger.log(`🔌 Disconnected tenant: ${tenantId}`);
                } catch (error) {
                    this.logger.error(`Failed to disconnect tenant ${tenantId}`, error);
                }
            },
        );

        await Promise.all(disconnectPromises);
        this.clients.clear();
        this.logger.log(`🔌 All tenant connections closed (${disconnectPromises.length} total)`);
    }

    /**
     * Remove and disconnect clients that have been idle too long
     */
    private async cleanupIdleClients() {
        const now = Date.now();
        const idleTenants: string[] = [];

        for (const [tenantId, { lastUsed }] of this.clients) {
            if (now - lastUsed > this.IDLE_TIMEOUT_MS) {
                idleTenants.push(tenantId);
            }
        }

        for (const tenantId of idleTenants) {
            const cached = this.clients.get(tenantId);
            if (cached) {
                try {
                    await cached.client.$disconnect();
                    await cached.pool.end();
                    this.clients.delete(tenantId);
                    this.logger.log(`🧹 Evicted idle tenant connection: ${tenantId}`);
                } catch (error) {
                    this.logger.error(`Failed to evict tenant ${tenantId}`, error);
                }
            }
        }
    }

    /**
     * Evict the oldest (least recently used) client to free a slot
     */
    private evictOldestClient() {
        let oldestId: string | null = null;
        let oldestTime = Infinity;

        for (const [tenantId, { lastUsed }] of this.clients) {
            if (lastUsed < oldestTime) {
                oldestTime = lastUsed;
                oldestId = tenantId;
            }
        }

        if (oldestId) {
            const cached = this.clients.get(oldestId);
            if (cached) {
                Promise.all([
                    cached.client.$disconnect(),
                    cached.pool.end(),
                ]).catch((err: unknown) => {
                    this.logger.error(`Failed to disconnect evicted tenant ${oldestId}`, err);
                });
                this.clients.delete(oldestId);
                this.logger.log(`♻️ Evicted LRU tenant connection: ${oldestId}`);
            }
        }
    }

    /**
     * Get current cache statistics (for monitoring)
     */
    getCacheStats() {
        return {
            activeConnections: this.clients.size,
            maxConnections: this.MAX_CACHED_CLIENTS,
            tenantIds: Array.from(this.clients.keys()),
        };
    }
}
