import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

type BillStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
interface Invoice {
  id: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: BillStatus;
  dueDate?: string;
  paidAt?: string;
  plan: string;
}

const STATUS_CFG: Record<BillStatus, { bg: string; color: string; icon: string }> = {
  ACTIVE: { bg: '#ECFDF5', color: '#059669', icon: 'check_circle' },
  TRIALING: { bg: '#EFF6FF', color: '#1E40AF', icon: 'schedule' },
  PAST_DUE: { bg: '#FEF2F2', color: '#DC2626', icon: 'warning' },
  CANCELLED: { bg: '#F1F5F9', color: '#64748B', icon: 'cancel' },
};

@Component({
  selector: 'app-super-admin-billing',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Billing</h1>
        <p class="page-sub">Subscription invoices across all tenants</p>
      </div>

      <!-- MRR Summary row -->
      <div class="mrr-row">
        @for (s of mrrCards; track s.label) {
          <div class="mrr-card" [style.border-top-color]="s.color">
            <div class="mrr-icon" [style.background]="s.bg" [style.color]="s.color">
              <mat-icon>{{ s.icon }}</mat-icon>
            </div>
            <div>
              <div class="mrr-val">{{ countFor(s.status) }}</div>
              <div class="mrr-lbl">{{ s.label }}</div>
            </div>
          </div>
        }
        <div class="mrr-card revenue" style="border-top-color:#059669">
          <div class="mrr-icon" style="background:#ECFDF5;color:#059669">
            <mat-icon>attach_money</mat-icon>
          </div>
          <div>
            <div class="mrr-val">LKR {{ totalRevenue() | number:'1.0-0' }}</div>
            <div class="mrr-lbl">Total Collected</div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="inv-list">
          @for (inv of invoices(); track inv.id) {
            <div class="inv-row">
              <div class="inv-icon" [style.background]="STATUS_CFG[inv.status].bg" [style.color]="STATUS_CFG[inv.status].color">
                <mat-icon>{{ STATUS_CFG[inv.status].icon }}</mat-icon>
              </div>
              <div class="inv-info">
                <div class="inv-tenant">{{ inv.tenantName }}</div>
                <div class="inv-plan plan-{{ inv.plan }}">{{ inv.plan }}</div>
              </div>
              <div class="inv-dates">
                @if (inv.dueDate) { <div>Due: {{ inv.dueDate | date:'mediumDate' }}</div> }
                @if (inv.paidAt)  { <div class="paid">Paid: {{ inv.paidAt | date:'mediumDate' }}</div> }
              </div>
              <div class="inv-right">
                <div class="inv-amt">{{ inv.currency }} {{ inv.amount | number:'1.0-0' }}</div>
                <span class="status-chip"
                      [style.background]="STATUS_CFG[inv.status].bg"
                      [style.color]="STATUS_CFG[inv.status].color">
                  {{ inv.status }}
                </span>
              </div>
            </div>
          }
          @if (invoices().length === 0) {
            <div class="empty">
              <mat-icon>receipt_long</mat-icon>
              <p>No invoices yet</p>
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
    .mrr-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .mrr-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; border-top: 3px solid; padding: 16px; display: flex; align-items: center; gap: 12px; }
    .mrr-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mrr-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .mrr-val { font-size: 1.3rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .mrr-lbl { font-size: 0.72rem; color: #64748B; margin-top: 2px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .inv-list { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .inv-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-bottom: 1px solid #F8FAFC; transition: background 0.12s; }
    .inv-row:last-child { border-bottom: none; }
    .inv-row:hover { background: #FAFAFA; }
    .inv-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .inv-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .inv-info { flex: 1; }
    .inv-tenant { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .inv-plan { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; }
    .plan-TRIAL      { background: #EFF6FF; color: #1E40AF; }
    .plan-BASIC      { background: #ECFDF5; color: #059669; }
    .plan-PRO        { background: #F5F3FF; color: #6D28D9; }
    .plan-ENTERPRISE { background: #FFFBEB; color: #D97706; }
    .inv-dates { font-size: 0.72rem; color: #94A3B8; display: flex; flex-direction: column; gap: 2px; }
    .paid { color: #059669; }
    .inv-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .inv-amt { font-size: 0.9rem; font-weight: 700; color: #0F172A; }
    .status-chip { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty p { margin: 0; }
  `],
})
export class SuperAdminBillingComponent implements OnInit {
  readonly STATUS_CFG = STATUS_CFG;
  private readonly api = inject(ApiService);
  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(true);

  readonly mrrCards = [
    { label: 'Trialing', status: 'TRIALING' as BillStatus, color: '#1E40AF', bg: '#EFF6FF', icon: 'schedule' },
    { label: 'Past Due', status: 'PAST_DUE' as BillStatus, color: '#DC2626', bg: '#FEF2F2', icon: 'warning' },
    { label: 'Active', status: 'ACTIVE' as BillStatus, color: '#059669', bg: '#ECFDF5', icon: 'check_circle' },
  ];

  ngOnInit() {
    this.api.get<{ data: { data: any[] } }>('/platform/billing/invoices', { page: 1, limit: 100 }).subscribe({
      next: (r) => {
        // Backend returns: { id, status, createdAt, tenant: {name}, plan: {name, priceLkr} }
        const mapped: Invoice[] = (r.data.data ?? []).map((s: any) => ({
          id: s.id,
          tenantName: s.tenant?.name ?? '—',
          amount: s.plan?.priceLkr ?? 0,
          currency: 'LKR',
          status: s.status as BillStatus,
          dueDate: s.currentPeriodEnd,
          paidAt: s.status === 'ACTIVE' ? s.currentPeriodStart : undefined,
          plan: s.plan?.name ?? '—',
        }));
        this.invoices.set(mapped);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  countFor(s: BillStatus) { return this.invoices().filter((i) => i.status === s).length; }
  totalRevenue() { return this.invoices().filter((i) => i.status === 'ACTIVE').reduce((acc, i) => acc + i.amount, 0); }
}
