import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimetableSlot {
    id: string;
    batchId: string;
    batch?: { id: string; name: string };
    dayOfWeek: DayOfWeek;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    subject?: string;
    room?: string;
    meetLink?: string;
}

export interface CreateSlotDto {
    batchId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subject?: string;
    room?: string;
    meetLink?: string;
}

@Injectable({ providedIn: 'root' })
export class TimetableAdminService {
    private readonly api = inject(ApiService);

    /** Returns slots grouped by day: { [day: number]: TimetableSlot[] } */
    getBatchTimetable(batchId: string) {
        return this.api.get<{ data: Record<string, TimetableSlot[]> }>(
            `/tenant/timetable/batch/${batchId}`,
        );
    }

    createSlot(dto: CreateSlotDto) {
        return this.api.post<{ data: TimetableSlot }>('/tenant/timetable', dto);
    }

    deleteSlot(id: string) {
        return this.api.delete<{ data: TimetableSlot }>(`/tenant/timetable/${id}`);
    }
}
