import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { CertificatesService } from './certificates.service.js';
import { IssueCertificateDto, CertificateQueryDto } from './dto/index.js';
import { TenantDb, Roles, Public, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/certificates')
export class CertificatesController {
    constructor(private readonly certificatesService: CertificatesService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    async issue(@TenantDb() prisma: any, @Body() dto: IssueCertificateDto) {
        return this.certificatesService.issueCertificate(prisma, dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findAll(@TenantDb() prisma: any, @Query() query: CertificateQueryDto) {
        return this.certificatesService.getCertificates(prisma, query);
    }

    @Get('my')
    @Roles(UserRole.STUDENT)
    async myCertificates(
        @TenantDb() prisma: any,
        @Query() query: CertificateQueryDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.certificatesService.getStudentCertificates(prisma, user.sub, query);
    }

    /** Public endpoint — anyone with the code can verify */
    @Get('verify/:code')
    @Public()
    async verify(@TenantDb() prisma: any, @Param('code') code: string) {
        return this.certificatesService.verifyCertificate(prisma, code);
    }
}
