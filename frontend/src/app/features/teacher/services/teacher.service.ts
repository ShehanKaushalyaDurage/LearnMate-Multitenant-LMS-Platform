/**
 * LearnHub — Teacher Portal Service
 * Centralises all API calls for the teacher portal.
 * Backend routes: all under /tenant/* — RBAC filters to teacher's own data.
 */
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class TeacherService {
    private readonly api = inject(ApiService);

    /** Batches assigned to this teacher */
    getMyBatches() { return this.api.get<any>('/tenant/batches'); }

    /** This teacher's timetable slots */
    getTimetable() { return this.api.get<any>('/tenant/timetable'); }

    /** Assignments created by this teacher */
    getAssignments() { return this.api.get<any>('/tenant/assignments'); }

    /** Create a new assignment */
    createAssignment(dto: any) { return this.api.post<any>('/tenant/assignments', dto); }

    /** Update assignment status */
    updateAssignmentStatus(id: string, status: string) {
        return this.api.patch<any>(`/tenant/assignments/${id}`, { status });
    }

    /** Load attendance sessions for a batch */
    getAttendanceSessions(batchId: string, date?: string) {
        const qs = date ? `?batchId=${batchId}&date=${date}` : `?batchId=${batchId}`;
        return this.api.get<any>(`/tenant/attendance/sessions${qs}`);
    }

    /** Create an attendance session (start of a class) */
    createAttendanceSession(dto: any) {
        return this.api.post<any>('/tenant/attendance/sessions', dto);
    }

    /** Mark/update attendance records on a session */
    markAttendance(sessionId: string, records: any[]) {
        return this.api.post<any>(`/tenant/attendance/sessions/${sessionId}/mark`, { records });
    }

    /** View attendance history for a specific student */
    getStudentAttendance(studentId: string) {
        return this.api.get<any>(`/tenant/attendance/students/${studentId}`);
    }
}
