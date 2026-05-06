import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'WAIVED';
interface Child { id: string; firstName: string; lastName: string; }
interface FeeRow { id: string; amount: number; status: FeeStatus; dueDate?: string; paidAt?: string; description?: string; batch?: { name: string }; }

const FEE_CFG: Record<FeeStatus, { bg: string; color: string; icon: string }> = {
    PAID: { bg: '#ECFDF5', color: '#059669', icon: 'check_circle' },
    PENDING: { bg: '#FFFBEB', color: '#D97706', icon: 'schedule' },
    OVERDUE: { bg: '#FEF2F2', color: '#DC2626', icon: 'warning' },
    WAIVED: { bg: '#F5F3FF', color: '#7C3AED', icon: 'do_not_disturb_on' },
};

@Component({
    selector: 'app-parent-fees',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Fees</h1>
        <p class="page-sub">Payment records for your children</p>
      </div>

      <div class="controls">
        <mat-form-field appearance="outline">
          <mat-label>Select Child</mat-label>
          <mat-select [value]="selectedChild()" (selectionChange)="onChild($event.value)">
            <mat-option value="">— Select child —</mat-option>
            @for (c of children(); track c.id) {
              <mat-option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!selectedChild()) {
        <div class="empty-state">
          <mat-icon>family_restroom</mat-icon>
          <p>Select a child to view fees</p>
        </div>
      } @else if (fees().length === 0) {
        <div class="empty-state">
          <mat-icon>payments</mat-icon>
          <p>No fee records found</p>
        </div>
      } @else {
        <!-- Summary cards -->
        <div class="sum-row">
          @for (s of statusKeys; track s) {
            <div class="sum-card" [style.border-color]="FEE_CFG[s].color">
              <div class="sum-icon" [style.background]="FEE_CFG[s].bg" [style.color]="FEE_CFG[s].color">
                <mat-icon>{{ FEE_CFG[s].icon }}</mat-icon>
              </div>
              <div>
                <div class="sum-lbl">{{ s }}</div>
                <div class="sum-amt">LKR {{ totalFor(s) | number:'1.0-0' }}</div>
              </div>
            </div>
          }
        </div>

        <!-- Fee list -->
        <div class="fee-list">
          @for (f of fees(); track f.id) {
            <div class="fee-row">
              <div class="fee-icon" [style.background]="FEE_CFG[f.status].bg" [style.color]="FEE_CFG[f.status].color">
                <mat-icon>{{ FEE_CFG[f.status].icon }}</mat-icon>
              </div>
              <div class="fee-info">
                @if (f.description) { <div class="fee-desc">{{ f.description }}</div> }
                @if (f.batch)       { <div class="fee-batch">{{ f.batch.name }}</div> }
              </div>
              <div class="fee-dates">
                @if (f.dueDate) { <div>Due: {{ f.dueDate | date:'mediumDate' }}</div> }
                @if (f.paidAt)  { <div class="paid-date">Paid: {{ f.paidAt | date:'mediumDate' }}</div> }
              </div>
              <div class="fee-right">
                <div class="fee-amt">LKR {{ f.amount | number:'1.0-0' }}</div>
                <span class="status-chip" [style.background]="FEE_CFG[f.status].bg" [style.color]="FEE_CFG[f.status].color">
                  {{ f.status }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 900px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .controls { margin-bottom: 16px; }
    .controls mat-form-field { width: 240px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .sum-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .sum-card { background: white; border-radius: 12px; border: 1px solid; padding: 14px; display: flex; align-items: center; gap: 10px; }
    .sum-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sum-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sum-lbl { font-size: 0.7rem; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }
    .sum-amt { font-size: 0.9rem; font-weight: 700; color: #0F172A; }

    .fee-list { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .fee-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #F8FAFC; transition: background 0.12s; }
    .fee-row:last-child { border-bottom: none; }
    .fee-row:hover { background: #FAFAFA; }
    .fee-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .fee-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .fee-info { flex: 1; }
    .fee-desc { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .fee-batch { font-size: 0.75rem; color: #64748B; }
    .fee-dates { font-size: 0.72rem; color: #94A3B8; display: flex; flex-direction: column; gap: 2px; }
    .paid-date { color: #059669; }
    .fee-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .fee-amt { font-size: 0.9rem; font-weight: 700; color: #0F172A; }
    .status-chip { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; }
  `],
})
export class ParentFeesComponent implements OnInit {
    readonly FEE_CFG = FEE_CFG;
    readonly statusKeys: FeeStatus[] = ['PENDING', 'OVERDUE', 'PAID', 'WAIVED'];

    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);

    readonly children = signal<Child[]>([]);
    readonly fees = signal<FeeRow[]>([]);
    readonly loading = signal(false);
    readonly selectedChild = signal('');

    ngOnInit() {
        this.api.get<{ data: { data: Child[] } }>('/tenant/users/my-children', { page: 1, limit: 50 }).subscribe({
            next: (r) => {
                this.children.set(r.data.data);
                const cid = this.route.snapshot.queryParamMap.get('childId');
                if (cid) this.onChild(cid);
            },
        });
    }

    onChild(id: string) {
        this.selectedChild.set(id);
        if (!id) { this.fees.set([]); return; }
        this.loading.set(true);
        this.api.get<{ data: { data: FeeRow[] } }>('/tenant/fees', { studentId: id, page: 1, limit: 100 }).subscribe({
            next: (r) => { this.fees.set(r.data.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    totalFor(s: FeeStatus): number {
        return this.fees().filter((f) => f.status === s).reduce((sum, f) => sum + f.amount, 0);
    }
}
