import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface ExamRow {
    id: string;
    title: string;
    batchId: string;
    batch?: { id: string; name: string };
    scheduledAt?: string;
    durationMins?: number;
    totalMarks?: number;
    passMark?: number;
    status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    _count?: { results: number };
    createdAt: string;
}

export interface QuestionRow {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    marks: number;
}

export interface CreateExamDto {
    title: string;
    batchId: string;
    scheduledAt?: string;
    durationMins?: number;
    totalMarks?: number;
    passMark?: number;
}

@Injectable({ providedIn: 'root' })
export class ExamsAdminService {
    private readonly api = inject(ApiService);

    getExams(page = 1, limit = 20, batchId?: string) {
        const params: Record<string, any> = { page, limit };
        if (batchId) params['batchId'] = batchId;
        return this.api.get<{ data: { data: ExamRow[]; meta: any } }>('/tenant/exams', params);
    }

    createExam(dto: CreateExamDto) {
        return this.api.post<{ data: ExamRow }>('/tenant/exams', dto);
    }

    getExamById(id: string) {
        return this.api.get<{ data: ExamRow }>(`/tenant/exams/${id}`);
    }

    updateStatus(id: string, status: string) {
        return this.api.patch<{ data: ExamRow }>(`/tenant/exams/${id}/status`, { status });
    }

    // Question Management
    getQuestions(examId: string) {
        return this.api.get<{ data: QuestionRow[] }>(`/tenant/exams/${examId}/questions`);
    }

    addQuestion(examId: string, q: Partial<QuestionRow>) {
        return this.api.post<QuestionRow>(`/tenant/exams/${examId}/questions`, q);
    }

    updateQuestion(qId: string, q: Partial<QuestionRow>) {
        return this.api.patch<QuestionRow>(`/tenant/exams/questions/${qId}`, q);
    }

    deleteQuestion(qId: string) {
        return this.api.delete<{ message: string }>(`/tenant/exams/questions/${qId}`);
    }

    // Results
    getExamResults(examId: string) {
        return this.api.get<{ data: { exam: any; results: any[] } }>(`/tenant/exams/${examId}/results`);
    }

    saveManualResult(examId: string, studentId: string, marks: number) {
        return this.api.post<{ data: any }>(`/tenant/exams/${examId}/results/manual`, { studentId, marks });
    }
}
