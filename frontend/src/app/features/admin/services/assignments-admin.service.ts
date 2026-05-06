import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface AssignmentRow {
    id: string;
    title: string;
    description?: string;
    batchId: string;
    batch?: { id: string; name: string };
    teacherId?: string;
    dueDate?: string;
    maxScore?: number;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    _count?: { submissions: number };
    createdAt: string;
}

export interface CreateAssignmentDto {
    title: string;
    description?: string;
    batchId: string;
    dueDate?: string;
    maxScore?: number;
}

@Injectable({ providedIn: 'root' })
export class AssignmentsAdminService {
    private readonly api = inject(ApiService);

    getAssignments(page = 1, limit = 20, batchId?: string) {
        const params: Record<string, any> = { page, limit };
        if (batchId) params['batchId'] = batchId;
        return this.api.get<{ data: { data: AssignmentRow[]; meta: any } }>('/tenant/assignments', params);
    }

    createAssignment(dto: CreateAssignmentDto) {
        return this.api.post<{ data: AssignmentRow }>('/tenant/assignments', dto);
    }

    updateStatus(id: string, status: string) {
        return this.api.patch<{ data: AssignmentRow }>(`/tenant/assignments/${id}`, { status });
    }
}
