import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface AttendanceRecord {
    id?: string;
    studentId: string;
    student?: { id: string; firstName: string; lastName: string };
    batchId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface BulkAttendanceDto {
    batchId: string;
    date: string;
    records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[];
}

@Injectable({ providedIn: 'root' })
export class AttendanceAdminService {
    private readonly api = inject(ApiService);

    getAttendance(batchId: string, date: string) {
        return this.api.get<{ data: AttendanceRecord[] }>(
            '/tenant/attendance', { batchId, date },
        );
    }

    markBulk(dto: BulkAttendanceDto) {
        return this.api.post<{ data: AttendanceRecord[] }>('/tenant/attendance/bulk', dto);
    }
}
