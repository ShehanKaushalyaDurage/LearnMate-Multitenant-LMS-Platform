import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';

@Component({
    selector: 'app-student-exams',
    standalone: true,
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Exams</h1>
        <p class="page-sub">Online exams and manual assessments</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (exams().length === 0) {
        <div class="empty-state">
          <mat-icon>quiz</mat-icon>
          <p>No exams scheduled for your batches.</p>
        </div>
      } @else {
        <div class="exams-grid">
          @for (e of exams(); track e.id) {
            <div class="exam-card" [attr.data-status]="e.status">
              <div class="card-top">
                <span class="type-tag">{{ e.type === 'ONLINE_MCQ' ? 'Online MCQ' : 'Manual' }}</span>
                <span class="status-chip">{{ e.status }}</span>
              </div>
              <h3 class="exam-title">{{ e.title }}</h3>
              <div class="exam-batch">{{ e.batch?.name }}</div>
              
              <div class="exam-info">
                <div class="info-item">
                  <mat-icon>calendar_today</mat-icon>
                  {{ e.date | date:'mediumDate' }}
                </div>
                <div class="info-item">
                  <mat-icon>schedule</mat-icon>
                  {{ e.durationMinutes }} mins
                </div>
                <div class="info-item">
                  <mat-icon>grade</mat-icon>
                  {{ e.maxMarks }} Marks
                </div>
              </div>

              <div class="card-footer">
                @if (e.status === 'PUBLISHED' || e.status === 'IN_PROGRESS') {
                  <button mat-flat-button color="primary" [routerLink]="['/student/exams', e.id]">
                    Start Exam
                  </button>
                } @else if (e.status === 'COMPLETED') {
                  <span class="completed-msg">Exam Completed</span>
                } @else {
                    <span class="scheduled-msg">Starts on {{ e.date | date:'short' }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1000px; padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .exams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .exam-card { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .card-top { display: flex; justify-content: space-between; align-items: center; }
    .type-tag { padding: 2px 8px; background: #EEF2FF; color: #6366F1; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .status-chip { padding: 2px 8px; background: #F1F5F9; color: #64748B; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
    
    .exam-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0; }
    .exam-batch { font-size: 0.85rem; color: #6366F1; font-weight: 600; }

    .exam-info { display: flex; flex-direction: column; gap: 6px; }
    .info-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #64748B; }
    .info-item mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .card-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid #F1F5F9; }
    .completed-msg { color: #059669; font-weight: 600; font-size: 0.875rem; }
    .scheduled-msg { color: #94A3B8; font-size: 0.85rem; font-style: italic; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class StudentExamsComponent implements OnInit {
    private readonly svc = inject(StudentService);
    readonly exams = signal<any[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        this.svc.getExams().subscribe({
            next: (r) => { this.exams.set(r.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }
}
