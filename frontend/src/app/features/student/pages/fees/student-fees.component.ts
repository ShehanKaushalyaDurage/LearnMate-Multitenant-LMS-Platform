import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'WAIVED';

interface FeeRow {
  id: string;
  amount: number;
  status: FeeStatus;
  dueDate?: string;
  paidAt?: string;
  description?: string;
  batch?: { name: string };
}

const STATUS_CFG: Record<FeeStatus, { bg: string; color: string; icon: string }> = {
  PAID: { bg: '#ECFDF5', color: '#059669', icon: 'check_circle' },
  PENDING: { bg: '#FFFBEB', color: '#D97706', icon: 'schedule' },
  OVERDUE: { bg: '#FEF2F2', color: '#DC2626', icon: 'warning' },
  WAIVED: { bg: '#F5F3FF', color: '#7C3AED', icon: 'do_not_disturb_on' },
};

@Component({
  selector: 'app-student-fees',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Fees</h1>
        <p class="page-sub">Your payment history and outstanding fees</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <!-- Summary -->
        <div class="summary-row">
          @for (s of summary; track s.status) {
            <div class="sum-card" [style.border-color]="cfg(s.status).color">
              <div class="sum-icon" [style.background]="cfg(s.status).bg" [style.color]="cfg(s.status).color">
                <mat-icon>{{ cfg(s.status).icon }}</mat-icon>
              </div>
              <div>
                <div class="sum-label">{{ s.status }}</div>
                <div class="sum-amount">LKR {{ countFor(s.status) | number:'1.2-2' }}</div>
              </div>
            </div>
          }
        </div>

        <!-- Fee table -->
        @if (fees().length === 0) {
          <div class="empty-state">
            <mat-icon>payments</mat-icon>
            <p>No fee records found</p>
          </div>
        } @else {
          <div class="fee-list">
            @for (f of fees(); track f.id) {
              <div class="fee-row">
                <div class="fee-icon" [style.background]="cfg(f.status).bg" [style.color]="cfg(f.status).color">
                  <mat-icon>{{ cfg(f.status).icon }}</mat-icon>
                </div>
                <div class="fee-info">
                  @if (f.description) { <div class="fee-desc">{{ f.description }}</div> }
                  @if (f.batch)       { <div class="fee-batch">{{ f.batch.name }}</div> }
                </div>
                <div class="fee-dates">
                  @if (f.dueDate) {
                    <div class="fee-due">Due: {{ f.dueDate | date:'mediumDate' }}</div>
                  }
                  @if (f.paidAt) {
                    <div class="fee-paid">Paid: {{ f.paidAt | date:'mediumDate' }}</div>
                  }
                </div>
                <div class="fee-right">
                  <div class="fee-amount">LKR {{ f.amount | number:'1.2-2' }}</div>
                  @if (f.status === 'PENDING' || f.status === 'OVERDUE') {
                    <button class="pay-btn" [disabled]="loadingPay() === f.id" (click)="pay(f)">
                        @if (loadingPay() === f.id) { <mat-spinner diameter="14"></mat-spinner> }
                        @else { Pay Now }
                    </button>
                  } @else {
                    <span class="status-chip"
                          [style.background]="cfg(f.status).bg"
                          [style.color]="cfg(f.status).color">
                      {{ f.status }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .summary-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .sum-card { background: white; border-radius: 12px; border: 1px solid; padding: 16px; display: flex; align-items: center; gap: 12px; }
    .sum-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sum-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sum-label { font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .sum-amount { font-size: 0.95rem; font-weight: 700; color: #0F172A; }

    .fee-list { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .fee-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-bottom: 1px solid #F8FAFC; transition: background 0.12s; }
    .fee-row:last-child { border-bottom: none; }
    .fee-row:hover { background: #F8FAFC; }

    .fee-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .fee-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .fee-info { flex: 1; }
    .fee-desc { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .fee-batch { font-size: 0.75rem; color: #64748B; }

    .fee-dates { font-size: 0.75rem; color: #94A3B8; display: flex; flex-direction: column; gap: 2px; }
    .fee-paid { color: #059669; }

    .fee-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
    .fee-amount { font-size: 1rem; font-weight: 700; color: #0F172A; }
    .status-chip { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; width: fit-content; }
    
    .pay-btn {
        background: #1E40AF; color: white; border: none; padding: 6px 14px; 
        border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; gap: 8px; transition: background 0.2s;
    }
    .pay-btn:hover { background: #1E3A8A; }
    .pay-btn:disabled { background: #94A3B8; cursor: not-allowed; }
  `],
})
export class StudentFeesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly fees = signal<FeeRow[]>([]);
  readonly loading = signal(true);
  readonly loadingPay = signal<string | null>(null);

  readonly summary: { status: FeeStatus }[] = [
    { status: 'PENDING' },
    { status: 'OVERDUE' },
    { status: 'PAID' },
    { status: 'WAIVED' },
  ];

  ngOnInit() {
    this.api.get<{ data: { data: FeeRow[] } }>('/tenant/fees/my', { page: 1, limit: 100 }).subscribe({
      next: (r) => { this.fees.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  cfg(s: FeeStatus) { return STATUS_CFG[s] ?? STATUS_CFG['PENDING']; }

  countFor(status: FeeStatus): number {
    return this.fees()
      .filter((f) => f.status === status)
      .reduce((sum, f) => sum + f.amount, 0);
  }

  pay(fee: FeeRow) {
    if (!confirm(`Proceed to pay LKR ${fee.amount.toLocaleString()} for ${fee.batch?.name || 'Invoiced Fee'}? (Simulation)`)) return;
    this.loadingPay.set(fee.id);

    // Use the simulation endpoint
    this.api.post(`/tenant/fees/invoices/${fee.id}/simulate-payment`, {}).subscribe({
      next: () => {
        this.loadingPay.set(null);
        this.ngOnInit();
      },
      error: () => this.loadingPay.set(null),
    });
  }
}
