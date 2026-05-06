import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ApiService } from '../../../../core/services/api.service';

interface DashStat { label: string; value: string | number; icon: string; color: string; bg: string; }

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="dash">
      <div class="greet">
        <h1 class="greet-txt">Good {{ greeting() }}, <strong>{{ firstName() }}</strong> 👋</h1>
        <p class="greet-sub">Welcome back to your learning space.</p>
      </div>

      <div class="stats-row">
        @for (s of stats(); track s.label) {
          <div class="stat-card" [style.border-top-color]="s.color">
            <div class="stat-icon" [style.background]="s.bg" [style.color]="s.color">
              <mat-icon>{{ s.icon }}</mat-icon>
            </div>
            <div>
              <div class="stat-val">{{ s.value }}</div>
              <div class="stat-lbl">{{ s.label }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Quick links -->
      <div class="section-title">Quick Access</div>
      <div class="quick-grid">
        <a class="quick-card" routerLink="/student/courses">
          <div class="qc-icon" style="background:linear-gradient(135deg,#6366F1,#8B5CF6)">
            <mat-icon>menu_book</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">My Courses</span>
            <span class="qc-sub">View enrolled batches</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
        <a class="quick-card" routerLink="/student/timetable">
          <div class="qc-icon" style="background:linear-gradient(135deg,#0EA5E9,#06B6D4)">
            <mat-icon>calendar_month</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">Timetable</span>
            <span class="qc-sub">This week's schedule</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
        <a class="quick-card" routerLink="/student/assignments">
          <div class="qc-icon" style="background:linear-gradient(135deg,#F59E0B,#EF4444)">
            <mat-icon>assignment</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">Assignments</span>
            <span class="qc-sub">Pending & submitted</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
        <a class="quick-card" routerLink="/student/announcements">
          <div class="qc-icon" style="background:linear-gradient(135deg,#10B981,#059669)">
            <mat-icon>campaign</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">Announcements</span>
            <span class="qc-sub">Latest notices</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
        <a class="quick-card" routerLink="/student/fees">
          <div class="qc-icon" style="background:linear-gradient(135deg,#EC4899,#BE185D)">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">Fees</span>
            <span class="qc-sub">Payment status</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
        <a class="quick-card" routerLink="/student/certificates">
          <div class="qc-icon" style="background:linear-gradient(135deg,#059669,#10B981)">
            <mat-icon>workspace_premium</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">Certificates</span>
            <span class="qc-sub">Your outcomes</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
        <a class="quick-card" routerLink="/student/exams">
          <div class="qc-icon" style="background:linear-gradient(135deg,#7C3AED,#C026D3)">
            <mat-icon>quiz</mat-icon>
          </div>
          <div class="qc-text">
            <span class="qc-label">Exams</span>
            <span class="qc-sub">Assessments</span>
          </div>
          <mat-icon class="qc-arr">arrow_forward</mat-icon>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1000px; }
    .greet { margin-bottom: 24px; }
    .greet-txt { font-size: 1.6rem; font-weight: 600; color: #0F172A; margin: 0 0 4px; }
    .greet-txt strong { font-weight: 800; }
    .greet-sub { color: #64748B; font-size: 0.9rem; margin: 0; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; border-top: 3px solid; padding: 16px; display: flex; align-items: center; gap: 14px; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-val { font-size: 1.5rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; color: #64748B; margin-top: 2px; }

    .section-title { font-size: 0.8rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; }

    .quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .quick-card {
      display: flex; align-items: center; gap: 14px; background: white;
      border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px;
      text-decoration: none; color: #0F172A; transition: box-shadow 0.15s, transform 0.12s;
    }
    .quick-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }
    .qc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .qc-icon mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    .qc-text { flex: 1; display: flex; flex-direction: column; }
    .qc-label { font-size: 0.9rem; font-weight: 700; color: #0F172A; }
    .qc-sub { font-size: 0.75rem; color: #94A3B8; }
    .qc-arr { color: #CBD5E1; font-size: 20px; }
  `],
})
export class StudentDashboardComponent implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly api = inject(ApiService);

  readonly firstName = () => this.authState.user()?.firstName ?? 'Student';
  readonly stats = signal<DashStat[]>([
    { label: 'Enrolled Batches', value: '—', icon: 'groups', color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Assignments Due', value: '—', icon: 'assignment', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Pending Fees', value: '—', icon: 'payments', color: '#EC4899', bg: '#FDF2F8' },
    { label: 'Certificates', value: '—', icon: 'workspace_premium', color: '#059669', bg: '#ECFDF5' },
  ]);

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  ngOnInit() {
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/batches/my', { page: 1, limit: 1 }).subscribe({
      next: (r) => this.stats.update((s) =>
        s.map((st) => st.label === 'Enrolled Batches' ? { ...st, value: r.data.meta.total ?? 0 } : st),
      ),
    });
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/fees/my', { status: 'PENDING', page: 1, limit: 1 }).subscribe({
      next: (r) => this.stats.update((s) =>
        s.map((st) => st.label === 'Pending Fees' ? { ...st, value: r.data.meta.total ?? 0 } : st),
      ),
    });
    this.api.get<{ data: { meta: { total: number } } }>('/tenant/certificates/my', { page: 1, limit: 1 }).subscribe({
      next: (r) => this.stats.update((s) =>
        s.map((st) => st.label === 'Certificates' ? { ...st, value: r.data.meta.total ?? 0 } : st),
      ),
    });
  }
}
