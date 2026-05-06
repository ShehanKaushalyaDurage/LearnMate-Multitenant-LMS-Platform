/**
 * LearnHub — Auth Service Unit Tests
 *
 * Tests the tenantLogin and platformLogin happy paths
 * and the key error scenarios.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { MasterPrismaService } from '../../prisma/master-prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { EncryptionService } from '../../common/utils/encryption.service';

// ── helpers ──────────────────────────────────────────────────────────
const HASH = bcrypt.hashSync('secret123', 1);

const mockTenant = {
    id: 'tenant-1',
    slug: 'sunrise-academy',
    status: 'ACTIVE',
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: 'sunrise_db',
    dbUser: 'dbuser',
    dbPasswordEncrypted: 'enc::secret',
};

const mockUser = {
    id: 'user-1',
    email: 'teacher@academy.lk',
    firstName: 'Nimal',
    lastName: 'Silva',
    role: 'TEACHER',
    status: 'ACTIVE',
    passwordHash: HASH,
};

const mockAdmin = {
    id: 'admin-1',
    email: 'superadmin@learnhub.lk',
    passwordHash: HASH,
    name: 'Super Admin',
};

const tenantPrismaClientStub = {
    user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
    },
};

const makeModule = async (overrides: Partial<{
    findTenant: any;
    findAdmin: any;
    jwtSign: any;
}> = {}) => {
    const masterPrismaMock = {
        tenant: {
            findUnique: overrides.findTenant ?? jest.fn().mockResolvedValue(mockTenant),
        },
        platformAdmin: {
            findUnique: overrides.findAdmin ?? jest.fn().mockResolvedValue(mockAdmin),
        },
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            AuthService,
            {
                provide: JwtService,
                useValue: {
                    sign: overrides.jwtSign ?? jest.fn().mockReturnValue('mock-jwt-token'),
                },
            },
            {
                provide: ConfigService,
                useValue: {
                    get: jest.fn((key: string) => {
                        const cfg: Record<string, any> = {
                            'jwt.refreshSecret': 'test-refresh-secret',
                            'jwt.refreshExpiry': '7d',
                        };
                        return cfg[key];
                    }),
                },
            },
            { provide: MasterPrismaService, useValue: masterPrismaMock },
            {
                provide: TenantPrismaService,
                useValue: {
                    getClientForTenant: jest.fn().mockResolvedValue(tenantPrismaClientStub),
                },
            },
            {
                provide: EncryptionService,
                useValue: { decrypt: jest.fn().mockReturnValue('plainpassword') },
            },
        ],
    }).compile();

    return module.get<AuthService>(AuthService);
};

// ── test suites ───────────────────────────────────────────────────────

describe('AuthService — tenantLogin', () => {
    const mockRes: any = { cookie: jest.fn() };

    it('should return accessToken and user on valid credentials', async () => {
        const svc = await makeModule();
        const result = await svc.tenantLogin(
            { email: 'teacher@academy.lk', password: 'secret123', slug: 'sunrise-academy' },
            mockRes,
        );
        expect(result.accessToken).toBeDefined();
        expect(result.user.email).toBe('teacher@academy.lk');
        expect(result.user.role).toBe('TEACHER');
    });

    it('should throw BadRequestException when slug is missing', async () => {
        const svc = await makeModule();
        await expect(
            svc.tenantLogin({ email: 'x@x.com', password: 'pass', slug: '' }, mockRes),
        ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when tenant not found', async () => {
        const svc = await makeModule({ findTenant: jest.fn().mockResolvedValue(null) });
        await expect(
            svc.tenantLogin({ email: 'x@x.com', password: 'pass', slug: 'unknown' }, mockRes),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when tenant is not ACTIVE', async () => {
        const svc = await makeModule({
            findTenant: jest.fn().mockResolvedValue({ ...mockTenant, status: 'SUSPENDED' }),
        });
        await expect(
            svc.tenantLogin({ email: 'x@x.com', password: 'pass', slug: 'sunrise-academy' }, mockRes),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
        const svc = await makeModule();
        await expect(
            svc.tenantLogin({ email: 'teacher@academy.lk', password: 'wrongpass', slug: 'sunrise-academy' }, mockRes),
        ).rejects.toThrow(UnauthorizedException);
    });
});

describe('AuthService — platformLogin', () => {
    const mockRes: any = { cookie: jest.fn() };

    it('should return accessToken with SUPER_ADMIN role on valid credentials', async () => {
        const svc = await makeModule();
        const result = await svc.platformLogin(
            { email: 'superadmin@learnhub.lk', password: 'secret123' },
            mockRes,
        );
        expect(result.accessToken).toBeDefined();
        expect(result.user.role).toBe('SUPER_ADMIN');
    });

    it('should throw UnauthorizedException when platform admin not found', async () => {
        const svc = await makeModule({ findAdmin: jest.fn().mockResolvedValue(null) });
        await expect(
            svc.platformLogin({ email: 'x@x.com', password: 'pass' }, mockRes),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when platform admin password is wrong', async () => {
        const svc = await makeModule();
        await expect(
            svc.platformLogin({ email: 'superadmin@learnhub.lk', password: 'wrongpass' }, mockRes),
        ).rejects.toThrow(UnauthorizedException);
    });
});
