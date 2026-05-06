import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface FeeRow {
    id: string;
    studentId: string;
    student?: { id: string; firstName: string; lastName: string; email: string };
    batchId?: string;
    batch?: { id: string; name: string };
    amount: number;
    dueDate?: string;
    paidDate?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
    notes?: string;
    createdAt: string;
}

export interface CreateFeeDto {
    studentId: string;
    batchId?: string;
    amount: number;
    dueDate?: string;
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class FeesAdminService {
    private readonly api = inject(ApiService);

    getFees(page = 1, limit = 20, batchId?: string) {
        const params: Record<string, any> = { page, limit };
        if (batchId) params['batchId'] = batchId;
        return this.api.get<{ data: { data: FeeRow[]; meta: any } }>('/tenant/fees', params);
    }

    createFee(dto: CreateFeeDto) {
        return this.api.post<{ data: FeeRow }>('/tenant/fees', dto);
    }

    updateStatus(id: string, status: string) {
        return this.api.patch<{ data: FeeRow }>(`/tenant/fees/${id}`, { status });
    }
}
