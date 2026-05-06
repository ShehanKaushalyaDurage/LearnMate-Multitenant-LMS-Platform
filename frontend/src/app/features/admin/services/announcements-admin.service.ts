import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface AnnouncementRow {
    id: string;
    title: string;
    body: string;
    targetType: 'ALL' | 'BATCH' | 'COURSE' | 'ROLE';
    targetId?: string;
    batch?: { id: string; name: string };
    createdBy: string;
    createdAt: string;
}

export interface CreateAnnouncementDto {
    title: string;
    body: string;
    targetType: 'ALL' | 'BATCH' | 'COURSE' | 'ROLE';
    targetId?: string;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementsAdminService {
    private readonly api = inject(ApiService);

    getAnnouncements(page = 1, limit = 20) {
        return this.api.get<{ data: { data: AnnouncementRow[]; meta: any } }>(
            '/tenant/announcements', { page, limit },
        );
    }

    createAnnouncement(dto: CreateAnnouncementDto) {
        return this.api.post<{ data: AnnouncementRow }>('/tenant/announcements', dto);
    }

    deleteAnnouncement(id: string) {
        return this.api.delete<{ message: string }>(`/tenant/announcements/${id}`);
    }
}
