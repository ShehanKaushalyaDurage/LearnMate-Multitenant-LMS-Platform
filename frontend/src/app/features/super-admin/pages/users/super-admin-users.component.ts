import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

interface PlatformUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    tenant?: { name: string };
    createdAt: string;
    isActive: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    SUPER_ADMIN: { bg: '#F5F3FF', color: '#6D28D9' },
    ADMIN: { bg: '#EFF6FF', color: '#1E40AF' },
    TEACHER: { bg: '#ECFDF5', color: '#059669' },
    STUDENT: { bg: '#FFFBEB', color: '#D97706' },
    PARENT: { bg: '#FFF1F2', color: '#BE123C' },
};

@Component({
    selector: 'app-super-admin-users',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Platform Users</h1>
          <p class="page-sub">All users across all tenants</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select [value]="roleFilter()" (selectionChange)="roleFilter.set($event.value); load()">
            <mat-option value="">All Roles</mat-option>
            @for (r of roles; track r) { <mat-option [value]="r">{{ r }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-wrap">
          <table class="u-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Tenant</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="u-avatar">{{ u.firstName[0] }}{{ u.lastName[0] }}</div>
                      <div>
                        <div class="u-name">{{ u.firstName }} {{ u.lastName }}</div>
                        <div class="u-email">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="role-chip"
                          [style.background]="roleColor(u.role).bg"
                          [style.color]="roleColor(u.role).color">
                      {{ u.role }}
                    </span>
                  </td>
                  <td class="tenant-cell">{{ u.tenant?.name ?? '—' }}</td>
                  <td class="date-cell">{{ u.createdAt | date:'mediumDate' }}</td>
                  <td>
                    <span class="active-chip" [class.inactive]="!u.isActive">
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              }
              @if (users().length === 0) {
                <tr><td colspan="5" class="no-data">No users found</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1200px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .filters mat-form-field { width: 180px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .u-table { width: 100%; border-collapse: collapse; }
    thead { background: #F8FAFC; }
    th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #E2E8F0; }
    td { padding: 12px 16px; border-bottom: 1px solid #F8FAFC; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #FAFAFA; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .u-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6D28D9, #7C3AED); color: white; font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .u-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .u-email { font-size: 0.75rem; color: #64748B; }
    .role-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .tenant-cell { font-size: 0.82rem; color: #475569; }
    .date-cell { font-size: 0.78rem; color: #94A3B8; white-space: nowrap; }
    .active-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; background: #ECFDF5; color: #059669; }
    .active-chip.inactive { background: #FEF2F2; color: #DC2626; }
    .no-data { text-align: center; color: #94A3B8; padding: 40px; }
  `],
})
export class SuperAdminUsersComponent implements OnInit {
    private readonly api = inject(ApiService);

    readonly users = signal<PlatformUser[]>([]);
    readonly loading = signal(true);
    readonly roleFilter = signal('');
    readonly roles = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        const params: Record<string, any> = { page: 1, limit: 100 };
        if (this.roleFilter()) params['role'] = this.roleFilter();
        this.api.get<{ data: { data: PlatformUser[] } }>('/platform/users', params).subscribe({
            next: (r) => { this.users.set(r.data.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    roleColor(role: string) { return ROLE_COLORS[role] ?? { bg: '#F1F5F9', color: '#64748B' }; }
}
