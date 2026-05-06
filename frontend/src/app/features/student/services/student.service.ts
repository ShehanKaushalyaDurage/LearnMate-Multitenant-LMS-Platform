/**
 * LearnHub — Student Portal Service
 * Centralises all API calls for the student portal.
 * Backend routes: all under /tenant/* — RBAC filters data by the caller's role.
 */
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class StudentService {
    private readonly api = inject(ApiService);

    /** Enrolled batches for this student */
    getEnrolledBatches() { return this.api.get<any>('/tenant/batches'); }

    /** Student's personal timetable */
    getTimetable() { return this.api.get<any>('/tenant/timetable'); }

    /** All assignments visible to this student */
    getAssignments() { return this.api.get<any>('/tenant/assignments'); }

    /** Announcements visible to this student */
    getAnnouncements() { return this.api.get<any>('/tenant/announcements'); }

    /** Fee records for this student */
    getFees() { return this.api.get<any>('/tenant/fees'); }

    /** Attendance records for this student */
    getMyAttendance(studentId: string) {
        return this.api.get<any>(`/tenant/attendance/students/${studentId}`);
    }

    /** Exams for this student */
    getExams(params: any = {}) {
        return this.api.get<any>('/tenant/exams', params);
    }

    getExamById(id: string) {
        return this.api.get<any>(`/tenant/exams/${id}`);
    }

    /** ONLINE MCQ: Start an attempt */
    startExamAttempt(examId: string) {
        return this.api.post<any>(`/tenant/exams/${examId}/attempts`, {});
    }

    /** ONLINE MCQ: Submit answers */
    submitExamAttempt(attemptId: string, answers: any[]) {
        return this.api.post<any>(`/tenant/exams/attempts/${attemptId}/submit`, { answers });
    }
}
