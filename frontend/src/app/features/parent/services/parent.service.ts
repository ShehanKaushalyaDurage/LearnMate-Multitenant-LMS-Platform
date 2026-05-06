/**
 * LearnHub — Parent Portal Service
 * Centralises all API calls for the parent portal.
 * Backend routes: all under /tenant/* — RBAC filters to parent-linked students.
 */
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ParentService {
    private readonly api = inject(ApiService);

    /** Children linked to this parent — GET /tenant/users?role=STUDENT&parentView=true */
    getMyChildren() { return this.api.get<any>('/tenant/users?role=STUDENT&parentView=true'); }

    /** Attendance records for a specific child */
    getChildAttendance(studentId: string) {
        return this.api.get<any>(`/tenant/attendance/students/${studentId}`);
    }

    /** Fee records for a specific child */
    getChildFees(studentId: string) { return this.api.get<any>(`/tenant/fees?studentId=${studentId}`); }

    /** Assignments for a specific child */
    getChildAssignments(studentId: string) {
        return this.api.get<any>(`/tenant/assignments?studentId=${studentId}`);
    }

    /** Announcements visible to this parent */
    getAnnouncements() { return this.api.get<any>('/tenant/announcements'); }
}
