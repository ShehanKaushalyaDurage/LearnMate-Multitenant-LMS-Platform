import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Batch {
  id: string;
  name: string;
  course?: { id: string; title: string; subject: string; grade?: string };
  status: string;
  startDate?: string;
  endDate?: string;
  _count?: { students: number };
}

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Courses</h1>
        <p class="page-sub">Batches you are enrolled in</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (batches().length === 0) {
        <div class="empty-state">
          <mat-icon>school</mat-icon>
          <p>You are not enrolled in any batches yet</p>
        </div>
      } @else {
        <div class="batch-grid">
          @for (b of batches(); track b.id) {
            <div class="batch-card">
              <div class="card-top">
                <div class="subject-pill">{{ b.course?.subject ?? 'Course' }}</div>
                <span class="status-chip" [attr.data-s]="b.status">{{ b.status }}</span>
              </div>
              <h3 class="batch-name">{{ b.name }}</h3>
              @if (b.course) {
                <p class="course-title">{{ b.course.title }}</p>
                @if (b.course.grade) {
                  <div class="grade-badge">Grade {{ b.course.grade }}</div>
                }
              }
              <div class="card-dates">
                @if (b.startDate) {
                  <div class="date-item">
                    <mat-icon>event</mat-icon>
                    <span>{{ b.startDate | date:'mediumDate' }}</span>
                  </div>
                }
                @if (b.endDate) {
                  <div class="date-item">
                    <mat-icon>event_available</mat-icon>
                    <span>{{ b.endDate | date:'mediumDate' }}</span>
                  </div>
                }
              </div>
              <div class="class-count">
                <mat-icon>people</mat-icon>
                {{ b._count?.students ?? 0 }} classmates
              </div>
              <div class="card-footer">
                <button mat-flat-button color="primary" 
                        [routerLink]="['/student/courses', b.course?.id, 'learn']"
                        [disabled]="!b.course?.id">
                   <mat-icon>play_circle</mat-icon> Start Learning
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .batch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .batch-card {
      background: white; border-radius: 14px; border: 1px solid #E2E8F0; padding: 20px;
      display: flex; flex-direction: column; gap: 10px;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .batch-card:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.12); transform: translateY(-3px); }

    .card-top { display: flex; align-items: center; justify-content: space-between; }
    .subject-pill { background: #EEF2FF; color: #6366F1; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .status-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    [data-s="ACTIVE"]    { background: #ECFDF5; color: #059669; }
    [data-s="COMPLETED"] { background: #F1F5F9; color: #64748B; }
    [data-s="UPCOMING"]  { background: #EFF6FF; color: #1E40AF; }

    .batch-name { font-size: 1.05rem; font-weight: 700; color: #0F172A; margin: 0; }
    .course-title { font-size: 0.82rem; color: #64748B; margin: 0; }
    .grade-badge { display: inline-block; background: #F5F3FF; color: #7C3AED; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 600; }

    .card-dates { display: flex; flex-direction: column; gap: 4px; }
    .date-item { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #64748B; }
    .date-item mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .class-count { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 8px; margin-top: auto; margin-bottom: 12px; }
    .class-count mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .card-footer { display: flex; justify-content: stretch; }
    .card-footer button { width: 100%; border-radius: 10px; font-weight: 700; }
  `],
})
export class StudentCoursesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly batches = signal<Batch[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.get<{ data: { data: Batch[] } }>('/tenant/batches/my', { page: 1, limit: 50 }).subscribe({
      next: (r) => { this.batches.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
