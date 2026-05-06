import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Child {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    enrollments?: { batch: { id: string; name: string; course?: { title: string; subject: string } } }[];
}

@Component({
    selector: 'app-parent-children',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Children</h1>
        <p class="page-sub">Students linked to your account</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (children().length === 0) {
        <div class="empty-state">
          <mat-icon>family_restroom</mat-icon>
          <p>No children linked to your account</p>
          <p class="empty-hint">Please contact your institute administrator to link your children.</p>
        </div>
      } @else {
        <div class="children-grid">
          @for (c of children(); track c.id) {
            <div class="child-card">
              <div class="child-avatar">
                {{ c.firstName[0] }}{{ c.lastName[0] }}
              </div>
              <div class="child-info">
                <h3 class="child-name">{{ c.firstName }} {{ c.lastName }}</h3>
                <p class="child-email">{{ c.email }}</p>
              </div>

              @if (c.enrollments && c.enrollments.length > 0) {
                <div class="enrollments">
                  <div class="enroll-label">Enrolled Batches</div>
                  @for (en of c.enrollments; track en.batch.id) {
                    <div class="enroll-row">
                      <div class="enroll-dot"></div>
                      <div>
                        <div class="enroll-batch">{{ en.batch.name }}</div>
                        @if (en.batch.course) {
                          <div class="enroll-course">{{ en.batch.course.title }}</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="child-actions">
                <a mat-stroked-button [routerLink]="'/parent/attendance'"
                   [queryParams]="{ childId: c.id }">
                  <mat-icon>fact_check</mat-icon> Attendance
                </a>
                <a mat-stroked-button [routerLink]="'/parent/fees'"
                   [queryParams]="{ childId: c.id }">
                  <mat-icon>payments</mat-icon> Fees
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1000px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 80px; color: #94A3B8; text-align: center; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; }
    .empty-state p { margin: 0; }
    .empty-hint { font-size: 0.8rem; color: #CBD5E1; max-width: 280px; }

    .children-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .child-card {
      background: white; border-radius: 16px; border: 1px solid #E2E8F0; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .child-card:hover { box-shadow: 0 6px 24px rgba(217,119,6,0.12); transform: translateY(-3px); }

    .child-avatar {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: white; font-size: 1.4rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .child-info { }
    .child-name { font-size: 1.1rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .child-email { font-size: 0.82rem; color: #64748B; margin: 0; }

    .enrollments { background: #FFFBEB; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .enroll-label { font-size: 0.72rem; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .enroll-row { display: flex; align-items: flex-start; gap: 8px; }
    .enroll-dot { width: 6px; height: 6px; border-radius: 50%; background: #D97706; margin-top: 5px; flex-shrink: 0; }
    .enroll-batch { font-size: 0.82rem; font-weight: 600; color: #0F172A; }
    .enroll-course { font-size: 0.75rem; color: #64748B; }

    .child-actions { display: flex; gap: 8px; }
    .child-actions a { flex: 1; font-size: 0.8rem; }
    .child-actions a mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }
  `],
})
export class ParentChildrenComponent implements OnInit {
    private readonly api = inject(ApiService);
    readonly children = signal<Child[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        this.api.get<{ data: { data: Child[] } }>('/tenant/users/my-children', { page: 1, limit: 50 }).subscribe({
            next: (r) => { this.children.set(r.data.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }
}
