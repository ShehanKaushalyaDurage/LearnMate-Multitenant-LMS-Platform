import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface MyBatch {
    id: string;
    name: string;
    course?: { title: string; subject: string };
    _count?: { students: number; sessions: number };
    status: string;
    startDate?: string;
    endDate?: string;
}

@Component({
    selector: 'app-teacher-batches',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Batches</h1>
          <p class="page-sub">Classes assigned to you</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (batches().length === 0) {
        <div class="empty-state">
          <mat-icon>groups</mat-icon>
          <p>No batches assigned to you yet</p>
        </div>
      } @else {
        <div class="batch-grid">
          @for (b of batches(); track b.id) {
            <div class="batch-card" [attr.data-status]="b.status">
              <div class="card-top">
                <div class="course-tag">{{ b.course?.subject ?? 'General' }}</div>
                <span class="status-chip" [attr.data-s]="b.status">{{ b.status }}</span>
              </div>
              <h3 class="batch-name">{{ b.name }}</h3>
              @if (b.course) {
                <p class="course-title">{{ b.course.title }}</p>
              }
              <div class="batch-meta">
                <div class="meta-item">
                  <mat-icon>person</mat-icon>
                  <span>{{ b._count?.students ?? 0 }} students</span>
                </div>
                @if (b.startDate) {
                  <div class="meta-item">
                    <mat-icon>event</mat-icon>
                    <span>{{ b.startDate | date:'mediumDate' }}</span>
                  </div>
                }
              </div>
              <div class="card-actions">
                <a mat-stroked-button [routerLink]="['/teacher/attendance']"
                   [queryParams]="{ batchId: b.id }">
                  <mat-icon>fact_check</mat-icon> Attendance
                </a>
                <a mat-stroked-button [routerLink]="['/teacher/assignments']"
                   [queryParams]="{ batchId: b.id }">
                  <mat-icon>assignment</mat-icon> Assignments
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 0.95rem; }

    .batch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .batch-card {
      background: white; border-radius: 14px; border: 1px solid #E2E8F0; padding: 20px;
      display: flex; flex-direction: column; gap: 10px;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .batch-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.08); transform: translateY(-2px); }

    .card-top { display: flex; align-items: center; justify-content: space-between; }
    .course-tag { background: #ECFDF5; color: #059669; padding: 3px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .status-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    [data-s="ACTIVE"]     { background: #ECFDF5; color: #059669; }
    [data-s="COMPLETED"]  { background: #F1F5F9; color: #64748B; }
    [data-s="UPCOMING"]   { background: #EFF6FF; color: #1E40AF; }

    .batch-name { font-size: 1.05rem; font-weight: 700; color: #0F172A; margin: 0; }
    .course-title { font-size: 0.8rem; color: #64748B; margin: 0; }

    .batch-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748B; }
    .meta-item mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .card-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 8px; }
    .card-actions a { flex: 1; font-size: 0.8rem; }
    .card-actions a mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }
  `],
})
export class TeacherBatchesComponent implements OnInit {
    private readonly api = inject(ApiService);
    readonly batches = signal<MyBatch[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        this.api.get<{ data: { data: MyBatch[] } }>('/tenant/batches/my', { page: 1, limit: 50 }).subscribe({
            next: (r) => { this.batches.set(r.data.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }
}
