import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { IssueCertificateDto, CertificateQueryDto } from './dto/index.js';

const CERT_SELECT = {
    id: true, studentId: true, courseId: true, batchId: true,
    issuedAt: true, certificateUrl: true, uniqueCode: true,
} as const;

@Injectable()
export class CertificatesService {
    private readonly logger = new Logger(CertificatesService.name);

    private generateUniqueCode(): string {
        // Format: LH-XXXXXXXX (LH = LearnHub prefix, 8 uppercase hex chars)
        return `LH-${randomBytes(4).toString('hex').toUpperCase()}`;
    }

    async issueCertificate(prisma: PrismaClient, dto: IssueCertificateDto) {
        const [student, course] = await Promise.all([
            prisma.user.findUnique({ where: { id: dto.studentId } }),
            prisma.course.findUnique({ where: { id: dto.courseId } }),
        ]);
        if (!student) throw new NotFoundException(`Student "${dto.studentId}" not found`);
        if (!course) throw new NotFoundException(`Course "${dto.courseId}" not found`);

        // Generate a unique code (retry on collision)
        let uniqueCode = this.generateUniqueCode();
        let attempts = 0;
        while (attempts < 5) {
            const existing = await prisma.certificate.findUnique({ where: { uniqueCode } });
            if (!existing) break;
            uniqueCode = this.generateUniqueCode();
            attempts++;
        }

        const cert = await prisma.certificate.create({
            data: {
                studentId: dto.studentId,
                courseId: dto.courseId,
                batchId: dto.batchId,
                certificateUrl: dto.certificateUrl,
                uniqueCode,
            },
            select: {
                ...CERT_SELECT,
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
                course: { select: { id: true, title: true } },
                batch: { select: { id: true, name: true } },
            },
        });

        this.logger.log(`🎓 Issued certificate ${uniqueCode} to ${student.email} for ${course.title}`);
        return cert;
    }

    async getCertificates(prisma: PrismaClient, query: CertificateQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (query.studentId) where.studentId = query.studentId;
        if (query.courseId) where.courseId = query.courseId;
        if (query.batchId) where.batchId = query.batchId;

        const [certs, total] = await Promise.all([
            prisma.certificate.findMany({
                where,
                select: {
                    ...CERT_SELECT,
                    student: { select: { id: true, firstName: true, lastName: true } },
                    course: { select: { id: true, title: true } },
                },
                skip, take: limit,
                orderBy: { issuedAt: 'desc' },
            }),
            prisma.certificate.count({ where }),
        ]);

        return { data: certs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async getStudentCertificates(prisma: PrismaClient, studentId: string, query: CertificateQueryDto) {
        return this.getCertificates(prisma, { ...query, studentId });
    }

    async verifyCertificate(prisma: PrismaClient, uniqueCode: string) {
        const cert = await prisma.certificate.findUnique({
            where: { uniqueCode },
            select: {
                ...CERT_SELECT,
                student: { select: { id: true, firstName: true, lastName: true } },
                course: { select: { id: true, title: true } },
                batch: { select: { id: true, name: true } },
            },
        });

        if (!cert) throw new NotFoundException(`Certificate with code "${uniqueCode}" not found`);
        return { valid: true, certificate: cert };
    }
}
