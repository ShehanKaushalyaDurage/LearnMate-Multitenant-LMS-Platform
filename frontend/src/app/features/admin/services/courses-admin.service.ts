import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface CourseRow {
    id: string;
    title: string;
    subject: string;
    gradeLevel?: string;
    status: string;
    teacher?: { id: string; firstName: string; lastName: string };
    _count?: { batches: number; enrollments: number };
    createdAt: string;
}

export interface CreateCourseDto {
    title: string;
    subject: string;
    gradeLevel?: string;
    grade?: string;
    classLocation?: string;
    teacherId?: string;
    description?: string;
}

@Injectable({ providedIn: 'root' })
export class CoursesAdminService {
    private readonly api = inject(ApiService);

    getCourses(page = 1, limit = 20) {
        return this.api.get<{ data: { data: CourseRow[]; meta: any } }>('/tenant/courses', { page, limit });
    }

    createCourse(dto: CreateCourseDto) {
        return this.api.post<{ data: CourseRow }>('/tenant/courses', dto);
    }

    updateCourse(id: string, dto: Partial<CreateCourseDto>) {
        return this.api.patch<{ data: CourseRow }>(`/tenant/courses/${id}`, dto);
    }
}
