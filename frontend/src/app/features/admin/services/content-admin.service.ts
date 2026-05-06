import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export type ContentType = 'VIDEO' | 'PDF' | 'DOCUMENT' | 'LINK';

export interface ContentItem {
    id: string;
    courseId: string;
    batchId?: string;
    title: string;
    type: ContentType;
    url?: string;
    bunnyVideoId?: string;
    orderIndex: number;
    isVisible: boolean;
    createdAt: string;
}

export interface CreateContentDto {
    courseId: string;
    batchId?: string;
    title: string;
    type: ContentType;
    url?: string;
    bunnyVideoId?: string;
    orderIndex?: number;
    isVisible?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContentAdminService {
    private readonly api = inject(ApiService);

    getContent(courseId: string, page = 1, limit = 50, type?: ContentType) {
        const params: Record<string, any> = { page, limit };
        if (type) params['type'] = type;
        return this.api.get<{ data: ContentItem[]; meta: any }>(`/tenant/content/courses/${courseId}`, params);
    }

    createContent(dto: CreateContentDto) {
        return this.api.post<{ data: ContentItem }>('/tenant/content', dto);
    }

    updateContent(id: string, dto: Partial<CreateContentDto>) {
        return this.api.patch<{ data: ContentItem }>(`/tenant/content/${id}`, dto);
    }

    deleteContent(id: string) {
        return this.api.delete<{ message: string }>(`/tenant/content/${id}`);
    }
}
