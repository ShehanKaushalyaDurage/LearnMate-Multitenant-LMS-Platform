import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  trend: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Overview of your institute</p>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="stats-grid">
        @for (card of cards(); track card.label) {
          <div class="stat-card">
            <div class="stat-icon" [style.background]="card.bg">
              <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ card.value }}</span>
              <span class="stat-label">{{ card.label }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Main content sections -->
      <div class="sections-grid">
        <div class="section-card">
          <div class="section-header">
            <mat-icon>announcement</mat-icon>
            <h3>Recent Announcements</h3>
          </div>
          
          @if (announcements().length > 0) {
            <div class="list">
              @for (a of announcements(); track a.id) {
                <div class="list-item">
                  <div class="li-title">{{ a.title }}</div>
                  <div class="li-sub">{{ a.createdAt | date:'shortDate' }} • {{ a.body | slice:0:60 }}...</div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>campaign</mat-icon>
              <p>No announcements yet</p>
            </div>
          }
        </div>

        <div class="section-card">
          <div class="section-header">
            <mat-icon>calendar_today</mat-icon>
            <h3>Today's Schedule</h3>
          </div>
          
          @if (sessions().length > 0) {
            <div class="list">
              @for (s of sessions(); track s.id) {
                <div class="list-item">
                  <div class="li-title">{{ s.batch?.name }}</div>
                  <div class="li-sub">{{ s.startTime }} - {{ s.endTime }} @ {{ s.room || 'TBA' }}</div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>event</mat-icon>
              <p>No sessions scheduled today</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 4px;
    }

    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 52px; height: 52px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon mat-icon { font-size: 26px; width: 26px; height: 26px; }

    .stat-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F172A;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label { font-size: 0.85rem; color: #64748B; }

    /* Sections */
    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .section-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      padding: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      color: #0F172A;
    }

    .section-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }

    .list { display: flex; flex-direction: column; gap: 12px; }
    .list-item { padding: 10px; border-radius: 8px; background: #F8FAFC; border: 1px solid #F1F5F9; }
    .li-title { font-weight: 700; font-size: 0.9rem; color: #0F172A; }
    .li-sub { font-size: 0.75rem; color: #64748B; margin-top: 2px; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      color: #CBD5E1;
    }

    .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-state p { font-size: 0.875rem; margin: 0; }

    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr; }
      .sections-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly cards = signal<StatCard[]>([
    { label: 'Students', value: '—', icon: 'school', color: '#1E40AF', bg: '#EFF6FF', trend: '' },
    { label: 'Teachers', value: '—', icon: 'person', color: '#7C3AED', bg: '#F5F3FF', trend: '' },
    { label: 'Active Courses', value: '—', icon: 'menu_book', color: '#059669', bg: '#ECFDF5', trend: '' },
    { label: 'Total Revenue', value: '—', icon: 'payments', color: '#0D9488', bg: '#F0FDFA', trend: '' },
    { label: 'Certificates', value: '—', icon: 'workspace_premium', color: '#D97706', bg: '#FFFBEB', trend: '' },
  ]);

  readonly announcements = signal<any[]>([]);
  readonly sessions = signal<any[]>([]);

  ngOnInit() {
    // Load Students count
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/users', { role: 'STUDENT', limit: 1 }).subscribe({
      next: (r) => this.updateStat('Students', r.data.meta.total),
    });

    // Load Teachers count
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/users', { role: 'TEACHER', limit: 1 }).subscribe({
      next: (r) => this.updateStat('Teachers', r.data.meta.total),
    });

    // Load Active Courses
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/courses', { status: 'ACTIVE', limit: 1 }).subscribe({
      next: (r) => this.updateStat('Active Courses', r.data.meta.total),
    });

    // Load Total Revenue
    this.api.get<{ total: number }>('/tenant/fees/stats/total-revenue').subscribe({
      next: (r) => this.updateStat('Total Revenue', `LKR ${Number(r.total).toLocaleString()}`),
    });

    // Load Certificates count
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/certificates', { limit: 1 }).subscribe({
      next: (r) => this.updateStat('Certificates', r.data.meta.total),
    });

    // Load Recent Announcements
    this.api.get<{ data: { data: any[] } }>('/tenant/announcements', { limit: 5 }).subscribe({
      next: (r) => this.announcements.set(r.data.data),
    });

    // Load Today's Schedule
    this.api.get<any[]>('/tenant/timetable/today').subscribe({
      next: (r) => this.sessions.set(r),
    });
  }

  private updateStat(label: string, value: string | number) {
    this.cards.update((cs) => cs.map((c) => (c.label === label ? { ...c, value } : c)));
  }
}
