/**
 * LearnHub — Master Prisma Service
 *
 * Singleton Prisma client connected to the master database.
 * Uses Prisma v7's @prisma/adapter-pg driver adapter pattern.
 *
 * The master database stores: tenants, plans, subscriptions, platform_admins.
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/master/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class MasterPrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MasterPrismaService.name);
    private readonly pool: pg.Pool;

    constructor(private readonly configService: ConfigService) {
        const databaseUrl = configService.get<string>('database.masterUrl');
        if (!databaseUrl) {
            throw new Error('MASTER_DATABASE_URL is not configured');
        }

        const pool = new pg.Pool({ connectionString: databaseUrl });
        const adapter = new PrismaPg(pool);

        super({ adapter });
        this.pool = pool;
    }

    /**
     * Connect to the master database when the module initializes
     */
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Connected to master database');
        } catch (error) {
            this.logger.error('❌ Failed to connect to master database', error);
            throw error;
        }
    }

    /**
     * Disconnect from the master database when the module is destroyed
     */
    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
        this.logger.log('🔌 Disconnected from master database');
    }
}
