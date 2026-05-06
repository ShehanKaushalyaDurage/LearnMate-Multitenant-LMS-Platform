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
import { RouterLink } from '@angular/router';
import { ExamsAdminService, type ExamRow } from '../../services/exams-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';

const STATUS_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  SCHEDULED: { bg: '#EFF6FF', color: '#1E40AF', icon: 'event' },
  ONGOING: { bg: '#FFFBEB', color: '#C2410C', icon: 'pending' },
  COMPLETED: { bg: '#ECFDF5', color: '#059669', icon: 'check_circle' },
  CANCELLED: { bg: '#FEF2F2', color: '#DC2626', icon: 'cancel' },
};

@Component({
  selector: 'app-admin-exams',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, RouterLink,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Exams</h1>
          <p class="page-sub">Schedule and manage batch exams</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'Schedule Exam' }}
        </button>
      </div>

      <!-- Create Form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">Schedule New Exam</h3>
          <form [formGroup]="form" (ngSubmit)="create()" class="form-grid">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Exam Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Mid-Term Theory Paper" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Batch</mat-label>
              <mat-select formControlName="batchId">
                @for (b of batches(); track b.id) {
                  <mat-option [value]="b.id">{{ b.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Scheduled Date & Time</mat-label>
              <input matInput formControlName="scheduledAt" type="datetime-local" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Duration (minutes)</mat-label>
              <input matInput formControlName="durationMins" type="number" placeholder="120" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Total Marks</mat-label>
              <input matInput formControlName="totalMarks" type="number" placeholder="100" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Pass Mark</mat-label>
              <input matInput formControlName="passMark" type="number" placeholder="50" />
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Schedule Exam
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Filter -->
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

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="exams()" class="exams-table">
            <ng-container matColumnDef="exam">
              <th mat-header-cell *matHeaderCellDef>Exam</th>
              <td mat-cell *matCellDef="let e">
                <div class="exam-cell">
                  <div class="status-icon" [style.background]="statusCfg(e.status).bg"
                       [style.color]="statusCfg(e.status).color">
                    <mat-icon>{{ statusCfg(e.status).icon }}</mat-icon>
                  </div>
                  <div>
                    <div class="exam-title">{{ e.title }}</div>
                    @if (e.batch) {
                      <div class="exam-batch">{{ e.batch.name }}</div>
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="schedule">
              <th mat-header-cell *matHeaderCellDef>Scheduled</th>
              <td mat-cell *matCellDef="let e">
                {{ e.scheduledAt ? (e.scheduledAt | date:'medium') : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="duration">
              <th mat-header-cell *matHeaderCellDef>Duration</th>
              <td mat-cell *matCellDef="let e">
                {{ e.durationMins ? e.durationMins + ' min' : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="marks">
              <th mat-header-cell *matHeaderCellDef>Marks</th>
              <td mat-cell *matCellDef="let e">
                @if (e.totalMarks) {
                  <span class="marks">{{ e.passMark ?? '?' }} / {{ e.totalMarks }}</span>
                } @else {
                  <span class="muted">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let e">
                <span class="status-chip"
                      [style.background]="statusCfg(e.status).bg"
                      [style.color]="statusCfg(e.status).color">
                  {{ e.status }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let e" class="actions-cell">
                <div class="actions-row">
                  @if (e.status === 'DRAFT') {
                    <button mat-icon-button color="primary" [routerLink]="['./questions', e.id]"
                            matTooltip="Manage Questions">
                      <mat-icon>quiz</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" (click)="setStatus(e.id, 'PUBLISHED')"
                            matTooltip="Publish Exam">
                      <mat-icon>publish</mat-icon>
                    </button>
                  }
                  @if (e.status === 'PUBLISHED') {
                    <button mat-icon-button color="primary" (click)="setStatus(e.id, 'COMPLETED')"
                            matTooltip="Finish Exam">
                      <mat-icon>done_all</mat-icon>
                    </button>
                  }
                  @if (e.status === 'COMPLETED') {
                    <button mat-icon-button color="primary" [routerLink]="['./results', e.id]"
                            matTooltip="View Results">
                      <mat-icon>bar_chart</mat-icon>
                    </button>
                  }
                </div>
              </td>
            </ng-container>


            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
          @if (exams().length === 0) {
            <div class="empty-table">
              <mat-icon>quiz</mat-icon>
              <p>No exams scheduled</p>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button mat-icon-button [disabled]="page() === 1" (click)="changePage(page()-1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span>Page {{ page() }} of {{ totalPages() }}</span>
            <button mat-icon-button [disabled]="page() === totalPages()" (click)="changePage(page()+1)">
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
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .filters-row { margin-bottom: 16px; }
    .batch-filter { width: 220px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .table-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .exams-table { width: 100%; }
    .table-row:hover { background: #F8FAFC; }

    .exam-cell { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .status-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .exam-title { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .exam-batch { font-size: 0.75rem; color: #64748B; }

    .marks { font-size: 0.875rem; color: #0F172A; }
    .marks::before { content: 'Pass: '; color: #94A3B8; font-size: 0.75rem; }
    .muted { color: #94A3B8; }

    .status-chip { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .empty-table { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #CBD5E1; }
    .empty-table mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-table p { margin: 0; font-size: 0.875rem; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }

    .actions-cell { width: 120px; }
    .actions-row { display: flex; gap: 4px; visibility: hidden; }
    .table-row:hover .actions-row { visibility: visible; }
  `],
})
export class AdminExamsComponent implements OnInit {
  private readonly svc = inject(ExamsAdminService);
  private readonly batchesSvc = inject(BatchesAdminService);
  private readonly fb = inject(FormBuilder);

  readonly exams = signal<ExamRow[]>([]);
  readonly batches = signal<BatchRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly batchFilter = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly displayedColumns = ['exam', 'schedule', 'duration', 'marks', 'status', 'actions'];

  readonly form = this.fb.group({
    title: ['', Validators.required],
    batchId: ['', Validators.required],
    scheduledAt: [''],
    durationMins: [null as number | null],
    totalMarks: [null as number | null],
    passMark: [null as number | null],
  });

  ngOnInit() {
    this.load();
    this.batchesSvc.getBatches(1, 100).subscribe({ next: (r) => this.batches.set(r.data.data) });
  }

  load() {
    this.loading.set(true);
    this.svc.getExams(this.page(), 20, this.batchFilter() || undefined).subscribe({
      next: (r) => { this.exams.set(r.data.data); this.totalPages.set(r.data.meta.totalPages ?? 1); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusCfg(status: string) { return STATUS_CONFIG[status] ?? STATUS_CONFIG['SCHEDULED']; }
  onBatchFilter(v: string) { this.batchFilter.set(v); this.page.set(1); this.load(); }
  changePage(p: number) { this.page.set(p); this.load(); }

  setStatus(id: string, status: string) {
    this.svc.updateStatus(id, status).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Failed to update status'),
    });
  }

  create() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    this.svc.createExam({
      title: v.title!, batchId: v.batchId!,
      scheduledAt: v.scheduledAt || undefined,
      durationMins: v.durationMins ?? undefined,
      totalMarks: v.totalMarks ?? undefined,
      passMark: v.passMark ?? undefined,
    }).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.form.reset(); this.load(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Failed to create'); },
    });
  }
}
