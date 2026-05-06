import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface BatchRow {
    id: string;
    name: string;
    courseId: string;
    course?: { id: string; title: string };
    teacher?: { id: string; firstName: string; lastName: string };
    maxStudents: number;
    status: string;
    startDate?: string;
    endDate?: string;
    _count?: { enrollments: number };
}

export interface CreateBatchDto {
    name: string;
    courseId: string;
    teacherId?: string;
    maxStudents?: number;
    startDate?: string;
    endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class BatchesAdminService {
    private readonly api = inject(ApiService);

    getBatches(page = 1, limit = 20, courseId?: string) {
        const params: Record<string, any> = { page, limit };
        if (courseId) params['courseId'] = courseId;
        return this.api.get<{ data: { data: BatchRow[]; meta: any } }>('/tenant/batches', params);
    }

    createBatch(dto: CreateBatchDto) {
        return this.api.post<{ data: BatchRow }>('/tenant/batches', dto);
    }
}
