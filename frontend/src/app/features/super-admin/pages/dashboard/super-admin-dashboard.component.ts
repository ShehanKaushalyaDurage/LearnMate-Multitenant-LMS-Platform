import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ApiService } from '../../../../core/services/api.service';

interface PlatformStat { label: string; value: string | number; icon: string; color: string; bg: string; delta?: string; }

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="dash">
      <div class="greet">
        <h1 class="greet-txt">Platform Overview</h1>
        <p class="greet-sub">LearnHub SaaS — Real-time metrics across all tenants.</p>
      </div>

      <div class="stats-row">
        @for (s of stats(); track s.label) {
          <div class="stat-card" [style.border-top-color]="s.color">
            <div class="stat-top">
              <div class="stat-icon" [style.background]="s.bg" [style.color]="s.color">
                <mat-icon>{{ s.icon }}</mat-icon>
              </div>
              @if (s.delta) {
                <span class="delta">↑ {{ s.delta }}</span>
              }
            </div>
            <div class="stat-val">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        }
      </div>

      <!-- Quick navigation cards -->
      <div class="section-label">Management</div>
      <div class="mgmt-grid">
        <a class="mgmt-card" routerLink="/super-admin/tenants">
          <div class="mgmt-icon" style="background:linear-gradient(135deg,#6D28D9,#7C3AED)">
            <mat-icon>domain</mat-icon>
          </div>
          <div class="mgmt-text">
            <span class="mgmt-title">Tenants</span>
            <span class="mgmt-sub">Manage institutes</span>
          </div>
          <mat-icon class="mgmt-arr">arrow_forward</mat-icon>
        </a>
        <a class="mgmt-card" routerLink="/super-admin/users">
          <div class="mgmt-icon" style="background:linear-gradient(135deg,#0EA5E9,#0284C7)">
            <mat-icon>manage_accounts</mat-icon>
          </div>
          <div class="mgmt-text">
            <span class="mgmt-title">Users</span>
            <span class="mgmt-sub">All platform users</span>
          </div>
          <mat-icon class="mgmt-arr">arrow_forward</mat-icon>
        </a>
        <a class="mgmt-card" routerLink="/super-admin/billing">
          <div class="mgmt-icon" style="background:linear-gradient(135deg,#10B981,#059669)">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="mgmt-text">
            <span class="mgmt-title">Billing</span>
            <span class="mgmt-sub">Subscriptions & invoices</span>
          </div>
          <mat-icon class="mgmt-arr">arrow_forward</mat-icon>
        </a>
        <a class="mgmt-card" routerLink="/super-admin/audit">
          <div class="mgmt-icon" style="background:linear-gradient(135deg,#F59E0B,#D97706)">
            <mat-icon>security</mat-icon>
          </div>
          <div class="mgmt-text">
            <span class="mgmt-title">Audit Logs</span>
            <span class="mgmt-sub">Platform-wide activity</span>
          </div>
          <mat-icon class="mgmt-arr">arrow_forward</mat-icon>
        </a>
        <a class="mgmt-card" routerLink="/super-admin/settings">
          <div class="mgmt-icon" style="background:linear-gradient(135deg,#EC4899,#BE185D)">
            <mat-icon>tune</mat-icon>
          </div>
          <div class="mgmt-text">
            <span class="mgmt-title">Settings</span>
            <span class="mgmt-sub">Platform configuration</span>
          </div>
          <mat-icon class="mgmt-arr">arrow_forward</mat-icon>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1100px; }
    .greet { margin-bottom: 24px; }
    .greet-txt { font-size: 1.6rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .greet-sub { color: #64748B; font-size: 0.9rem; margin: 0; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; border-top: 3px solid; padding: 16px; display: flex; flex-direction: column; gap: 6px; transition: box-shadow 0.15s; }
    .stat-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
    .stat-top { display: flex; align-items: center; justify-content: space-between; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .delta { font-size: 0.72rem; font-weight: 700; color: #059669; background: #ECFDF5; padding: 2px 7px; border-radius: 8px; }
    .stat-val { font-size: 1.7rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; color: #64748B; }

    .section-label { font-size: 0.8rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; }
    .mgmt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 12px; }
    .mgmt-card { display: flex; align-items: center; gap: 14px; background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 18px; text-decoration: none; color: #0F172A; transition: box-shadow 0.15s, transform 0.12s; }
    .mgmt-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .mgmt-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mgmt-icon mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    .mgmt-text { flex: 1; }
    .mgmt-title { display: block; font-size: 0.9rem; font-weight: 700; }
    .mgmt-sub { display: block; font-size: 0.75rem; color: #94A3B8; }
    .mgmt-arr { color: #CBD5E1; font-size: 20px; }
  `],
})
export class SuperAdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly stats = signal<PlatformStat[]>([
    { label: 'Total Tenants', value: '—', icon: 'domain', color: '#6D28D9', bg: '#F5F3FF' },
    { label: 'Active Tenants', value: '—', icon: 'check_circle', color: '#059669', bg: '#ECFDF5' },
    { label: 'Platform Users', value: '—', icon: 'group', color: '#0EA5E9', bg: '#F0F9FF' },
    { label: 'MRR (LKR)', value: '—', icon: 'attach_money', color: '#D97706', bg: '#FFFBEB' },
    { label: 'This Month', value: '—', icon: 'new_releases', color: '#EC4899', bg: '#FDF2F8', delta: 'new' },
  ]);

  ngOnInit() {
    this.api.get<{ data: any }>('/platform/stats').subscribe({
      next: (r) => {
        const d = r.data;
        this.stats.update((s) => s.map((st) => {
          if (st.label === 'Total Tenants') return { ...st, value: d.tenants.total ?? 0 };
          if (st.label === 'Active Tenants') return { ...st, value: d.tenants.active ?? 0 };
          if (st.label === 'MRR (LKR)') return { ...st, value: d.subscriptions?.mrr?.toLocaleString() ?? 0 };
          return st;
        }));
      },
    });
  }
}
