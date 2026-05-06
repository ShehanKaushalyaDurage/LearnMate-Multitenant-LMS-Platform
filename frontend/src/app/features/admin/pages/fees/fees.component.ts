import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeesAdminService, type FeeRow } from '../../services/fees-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';

@Component({
    selector: 'app-admin-fees',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatTableModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatProgressSpinnerModule, MatTooltipModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Fees</h1>
          <p class="page-sub">Track and manage student fee records</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'Record Fee' }}
        </button>
      </div>

      <!-- Create Fee Form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">Record New Fee</h3>
          <form [formGroup]="feeForm" (ngSubmit)="createFee()" class="fee-grid">
            <mat-form-field appearance="outline">
              <mat-label>Student ID</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="studentId" placeholder="Student UUID" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Batch (optional)</mat-label>
              <mat-select formControlName="batchId">
                <mat-option value="">— None —</mat-option>
                @for (b of batches(); track b.id) {
                  <mat-option [value]="b.id">{{ b.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Amount (LKR)</mat-label>
              <mat-icon matPrefix>payments</mat-icon>
              <input matInput formControlName="amount" type="number" placeholder="2500" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Due Date</mat-label>
              <input matInput formControlName="dueDate" type="date" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Notes (optional)</mat-label>
              <input matInput formControlName="notes" placeholder="e.g. Monthly tuition fee" />
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="feeForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Save Fee Record
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Filter row -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="batch-filter">
          <mat-label>Filter by Batch</mat-label>
          <mat-select [value]="batchFilter()" (selectionChange)="onBatchFilter($event.value)">
            <mat-option value="">All Batches</mat-option>
            @for (b of batches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Summary chips -->
      <div class="summary-row">
        @for (s of summary(); track s.label) {
          <div class="summary-chip" [attr.data-status]="s.key">
            <span class="chip-count">{{ s.count }}</span>
            <span class="chip-label">{{ s.label }}</span>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="fees()" class="fees-table">
            <ng-container matColumnDef="student">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let f">
                @if (f.student) {
                  <div class="user-cell">
                    <div class="avatar-sm">{{ (f.student.firstName[0] + f.student.lastName[0]).toUpperCase() }}</div>
                    <div>
                      <div class="cell-name">{{ f.student.firstName }} {{ f.student.lastName }}</div>
                      <div class="cell-email">{{ f.student.email }}</div>
                    </div>
                  </div>
                } @else {
                  <span class="muted">{{ f.studentId.slice(0, 8) }}…</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="batch">
              <th mat-header-cell *matHeaderCellDef>Batch</th>
              <td mat-cell *matCellDef="let f">
                @if (f.batch) {
                  <span class="batch-tag">{{ f.batch.name }}</span>
                } @else {
                  <span class="muted">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let f">
                <span class="amount">LKR {{ f.amount | number }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let f">
                {{ f.dueDate ? (f.dueDate | date:'mediumDate') : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let f">
                <span class="status-chip" [attr.data-status]="f.status">{{ f.status }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let f">
                @if (f.status === 'PENDING' || f.status === 'OVERDUE') {
                  <button mat-icon-button matTooltip="Mark as Paid"
                          (click)="markPaid(f)">
                    <mat-icon style="color: #059669">check_circle</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (fees().length === 0) {
            <div class="empty-table">
              <mat-icon>payments</mat-icon>
              <p>No fee records found</p>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button mat-icon-button [disabled]="page() === 1" (click)="changePage(page() - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span>Page {{ page() }} of {{ totalPages() }}</span>
            <button mat-icon-button [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .create-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .fee-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .filters-row { margin-bottom: 16px; }
    .batch-filter { width: 220px; }

    .summary-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .summary-chip { display: flex; flex-direction: column; align-items: center; padding: 12px 20px; border-radius: 10px; min-width: 90px; }
    [data-status="PENDING"]  { background: #FFF7ED; }
    [data-status="PAID"]     { background: #ECFDF5; }
    [data-status="OVERDUE"]  { background: #FEF2F2; }
    [data-status="WAIVED"]   { background: #F1F5F9; }
    .chip-count { font-size: 1.5rem; font-weight: 700; color: #0F172A; }
    .chip-label { font-size: 0.75rem; color: #64748B; font-weight: 500; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .table-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .fees-table { width: 100%; }
    .table-row:hover { background: #F8FAFC; }

    .user-cell { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .avatar-sm { width: 34px; height: 34px; border-radius: 50%; background: #EFF6FF; color: #1E40AF; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cell-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .cell-email { font-size: 0.75rem; color: #64748B; }
    .muted { color: #94A3B8; font-size: 0.875rem; }
    .batch-tag { background: #EFF6FF; color: #1E40AF; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .amount { font-weight: 700; color: #0F172A; font-size: 0.9rem; }

    .status-chip { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    [data-status="PAID"]     { background: #ECFDF5; color: #059669; }
    [data-status="PENDING"]  { background: #FFF7ED; color: #C2410C; }
    [data-status="OVERDUE"]  { background: #FEF2F2; color: #DC2626; }
    [data-status="WAIVED"]   { background: #F1F5F9; color: #64748B; }

    td.mat-column-actions { width: 52px; text-align: right; }
    .empty-table { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #CBD5E1; }
    .empty-table mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-table p { margin: 0; font-size: 0.875rem; }
    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }
  `],
})
export class AdminFeesComponent implements OnInit {
    private readonly svc = inject(FeesAdminService);
    private readonly batchesSvc = inject(BatchesAdminService);
    private readonly fb = inject(FormBuilder);

    readonly fees = signal<FeeRow[]>([]);
    readonly batches = signal<BatchRow[]>([]);
    readonly loading = signal(true);
    readonly page = signal(1);
    readonly totalPages = signal(1);
    readonly batchFilter = signal('');
    readonly showForm = signal(false);
    readonly saving = signal(false);
    readonly formError = signal('');
    readonly summary = signal<{ key: string; label: string; count: number }[]>([]);

    readonly displayedColumns = ['student', 'batch', 'amount', 'dueDate', 'status', 'actions'];

    readonly feeForm = this.fb.group({
        studentId: ['', Validators.required],
        batchId: [''],
        amount: [null as number | null, [Validators.required, Validators.min(1)]],
        dueDate: [''],
        notes: [''],
    });

    ngOnInit() {
        this.load();
        this.batchesSvc.getBatches(1, 100).subscribe({
            next: (res) => this.batches.set(res.data.data),
        });
    }

    load() {
        this.loading.set(true);
        this.svc.getFees(this.page(), 20, this.batchFilter() || undefined).subscribe({
            next: (res) => {
                this.fees.set(res.data.data);
                this.totalPages.set(res.data.meta.totalPages ?? 1);
                this.computeSummary(res.data.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    computeSummary(rows: FeeRow[]) {
        const counts: Record<string, number> = { PENDING: 0, PAID: 0, OVERDUE: 0, WAIVED: 0 };
        rows.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
        this.summary.set([
            { key: 'PENDING', label: 'Pending', count: counts['PENDING'] },
            { key: 'PAID', label: 'Paid', count: counts['PAID'] },
            { key: 'OVERDUE', label: 'Overdue', count: counts['OVERDUE'] },
            { key: 'WAIVED', label: 'Waived', count: counts['WAIVED'] },
        ]);
    }

    onBatchFilter(v: string) { this.batchFilter.set(v); this.page.set(1); this.load(); }
    changePage(p: number) { this.page.set(p); this.load(); }

    markPaid(fee: FeeRow) {
        this.svc.updateStatus(fee.id, 'PAID').subscribe({ next: () => this.load() });
    }

    createFee() {
        if (this.feeForm.invalid) return;
        this.saving.set(true);
        this.formError.set('');
        const v = this.feeForm.value;
        this.svc.createFee({
            studentId: v.studentId!,
            batchId: v.batchId || undefined,
            amount: v.amount!,
            dueDate: v.dueDate || undefined,
            notes: v.notes || undefined,
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.showForm.set(false);
                this.feeForm.reset();
                this.load();
            },
            error: (err) => {
                this.saving.set(false);
                this.formError.set(err?.error?.message ?? 'Failed to record fee');
            },
        });
    }
}
