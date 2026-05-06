import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface Assignment {
    id: string;
    title: string;
    description?: string;
    batchId: string;
    batch?: { name: string };
    dueDate?: string;
    maxMarks: number;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    submissions?: Submission[];
    _count?: { submissions: number };
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl?: string;
    marks?: number;
    feedback?: string;
    submittedAt: string;
    student?: { id: string; firstName: string; lastName: string; email: string };
    grader?: { id: string; firstName: string; lastName: string };
}

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
    private readonly api = inject(ApiService);

    /** Shared: Get assignment list */
    getAssignments(params: any = {}) {
        return this.api.get<{ data: { data: Assignment[], meta: any } }>('/tenant/assignments', params);
    }

    /** Shared: Get detailed assignment (includes submissions for teacher) */
    getAssignmentById(id: string) {
        return this.api.get<{ data: Assignment }>(`/tenant/assignments/${id}`);
    }

    /** Student: Submit work */
    submit(assignmentId: string, fileUrl: string) {
        return this.api.post<{ data: Submission }>(`/tenant/assignments/${assignmentId}/submit`, { fileUrl });
    }

    /** Teacher: Grade a submission */
    grade(submissionId: string, marks: number, feedback?: string) {
        return this.api.patch<{ data: Submission }>(`/tenant/assignments/submissions/${submissionId}/grade`, { marks, feedback });
    }

    /** Teacher: Update assignment status */
    updateStatus(id: string, status: string) {
        return this.api.patch<{ data: Assignment }>(`/tenant/assignments/${id}`, { status });
    }
}
