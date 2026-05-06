import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

interface AuditEntry {
    id: string;
    action: string;
    entityType?: string;
    tenant?: { name: string };
    performedBy?: { firstName: string; lastName: string; role: string };
    createdAt: string;
    ipAddress?: string;
}

@Component({
    selector: 'app-super-admin-audit',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Audit Logs</h1>
        <p class="page-sub">Platform-wide activity trail</p>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Tenant</mat-label>
          <mat-select [value]="tenantFilter()" (selectionChange)="tenantFilter.set($event.value); load()">
            <mat-option value="">All Tenants</mat-option>
            @for (t of tenants(); track t) { <mat-option [value]="t">{{ t }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="log-list">
          @for (e of entries(); track e.id) {
            <div class="log-row">
              <div class="log-dot" [ngClass]="'dot-' + actionType(e.action)"></div>
              <div class="log-main">
                <div class="log-action">
                  <strong>{{ e.action }}</strong>
                  @if (e.entityType) { <span class="entity">on {{ e.entityType }}</span> }
                </div>
                <div class="log-meta">
                  @if (e.performedBy) {
                    <span class="performer">{{ e.performedBy.firstName }} {{ e.performedBy.lastName }} · {{ e.performedBy.role }}</span>
                  }
                  @if (e.tenant)    { <span class="tenant-tag">{{ e.tenant.name }}</span> }
                  @if (e.ipAddress) { <span class="ip">IP: {{ e.ipAddress }}</span> }
                </div>
              </div>
              <div class="log-time">{{ e.createdAt | date:'short' }}</div>
            </div>
          }
          @if (entries().length === 0) {
            <div class="empty"><mat-icon>policy</mat-icon><p>No audit logs found</p></div>
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
    .filters { margin-bottom: 16px; }
    .filters mat-form-field { width: 220px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .log-list { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .log-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F8FAFC; transition: background 0.12s; }
    .log-row:last-child { border-bottom: none; }
    .log-row:hover { background: #FAFAFA; }
    .log-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; background: #94A3B8; }
    .dot-CREATE { background: #059669; }
    .dot-UPDATE { background: #D97706; }
    .dot-DELETE { background: #DC2626; }
    .dot-LOGIN  { background: #6366F1; }
    .log-main { flex: 1; }
    .log-action { font-size: 0.875rem; color: #0F172A; }
    .log-action strong { font-weight: 700; }
    .entity { color: #64748B; margin-left: 4px; }
    .log-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .performer { font-size: 0.75rem; color: #64748B; }
    .tenant-tag { font-size: 0.72rem; background: #F5F3FF; color: #6D28D9; padding: 1px 7px; border-radius: 8px; font-weight: 600; }
    .ip { font-size: 0.72rem; color: #94A3B8; font-family: monospace; }
    .log-time { font-size: 0.72rem; color: #94A3B8; white-space: nowrap; flex-shrink: 0; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty p { margin: 0; }
  `],
})
export class SuperAdminAuditComponent implements OnInit {
    private readonly api = inject(ApiService);
    readonly entries = signal<AuditEntry[]>([]);
    readonly tenants = signal<string[]>([]);
    readonly loading = signal(true);
    readonly tenantFilter = signal('');

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        const params: Record<string, any> = { page: 1, limit: 100 };
        if (this.tenantFilter()) params['tenantId'] = this.tenantFilter();
        this.api.get<{ data: { data: AuditEntry[] } }>('/platform/audit-logs', params).subscribe({
            next: (r) => {
                const data = r.data.data;
                this.entries.set(data);
                const names = [...new Set(data.map((e) => e.tenant?.name).filter(Boolean))] as string[];
                this.tenants.set(names);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    actionType(action: string): string {
        if (action.includes('CREATE') || action.includes('PROVISION')) return 'CREATE';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'UPDATE';
        if (action.includes('DELETE') || action.includes('REMOVE')) return 'DELETE';
        if (action.includes('LOGIN') || action.includes('AUTH')) return 'LOGIN';
        return 'OTHER';
    }
}
