/**
 * LearnHub — Fees Service Unit Tests (Backend)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FeesService } from './fees.service';

const mockFee = {
    id: 'fee-1',
    studentId: 'student-1',
    batchId: 'batch-1',
    amount: 5000,
    status: 'PENDING',
    dueDate: new Date('2026-03-01'),
    notes: 'Monthly fee',
    createdAt: new Date(),
    updatedAt: new Date(),
};

const makePrisma = (overrides: any = {}) => ({
    fee: {
        create: jest.fn().mockResolvedValue(mockFee),
        findMany: jest.fn().mockResolvedValue([mockFee]),
        findUnique: jest.fn().mockResolvedValue(mockFee),
        update: jest.fn().mockResolvedValue({ ...mockFee, status: 'PAID' }),
        count: jest.fn().mockResolvedValue(1),
        ...overrides,
    },
});

describe('FeesService', () => {
    let svc: FeesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FeesService],
        }).compile();
        svc = module.get<FeesService>(FeesService);
    });

    it('should be defined', () => {
        expect(svc).toBeDefined();
    });

    describe('getFees()', () => {
        it('should return paginated fee rows', async () => {
            const prisma = makePrisma();
            const result = await svc.getFees(prisma, { page: 1, limit: 20 });
            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });
    });

    describe('createFee()', () => {
        it('should create and return a fee record', async () => {
            const prisma = makePrisma();
            const result = await svc.createFee(prisma, {
                studentId: 'student-1',
                amount: 5000,
                batchId: 'batch-1',
            } as any);
            expect(result.amount).toBe(5000);
            expect(prisma.fee.create).toHaveBeenCalled();
        });
    });

    describe('updateFeeStatus()', () => {
        it('should mark fee as PAID', async () => {
            const prisma = makePrisma();
            const result = await svc.updateFeeStatus(prisma, 'fee-1', { status: 'PAID' } as any);
            expect(result.status).toBe('PAID');
            expect(prisma.fee.update).toHaveBeenCalledWith({
                where: { id: 'fee-1' },
                data: { status: 'PAID' },
                include: expect.anything(),
            });
        });

        it('should throw NotFoundException when fee not found', async () => {
            const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(null) });
            await expect(
                svc.updateFeeStatus(prisma, 'nonexistent', { status: 'PAID' } as any),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
