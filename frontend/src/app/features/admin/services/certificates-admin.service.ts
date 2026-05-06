import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface CertificateRow {
    id: string;
    studentId: string;
    student?: { id: string; firstName: string; lastName: string; email: string };
    courseId: string;
    course?: { id: string; title: string };
    batchId?: string;
    batch?: { id: string; name: string };
    issuedAt: string;
    certificateUrl?: string;
    notes?: string;
}

export interface IssueCertificateDto {
    studentId: string;
    courseId: string;
    batchId?: string;
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class CertificatesAdminService {
    private readonly api = inject(ApiService);

    getCertificates(page = 1, limit = 20, courseId?: string) {
        const params: Record<string, any> = { page, limit };
        if (courseId) params['courseId'] = courseId;
        return this.api.get<{ data: { data: CertificateRow[]; meta: any } }>(
            '/tenant/certificates', params,
        );
    }

    issueCertificate(dto: IssueCertificateDto) {
        return this.api.post<{ data: CertificateRow }>('/tenant/certificates', dto);
    }
}
