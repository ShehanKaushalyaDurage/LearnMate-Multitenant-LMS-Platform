import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AttendanceAdminService, type AttendanceRecord } from '../../services/attendance-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

interface RosterRow {
    studentId: string;
    name: string;
    initials: string;
    status: AttendanceStatus;
}

@Component({
    selector: 'app-admin-attendance',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatButtonModule, MatIconModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatProgressSpinnerModule, MatTooltipModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Attendance</h1>
          <p class="page-sub">Mark and review daily attendance</p>
        </div>
        @if (roster().length > 0) {
          <button mat-flat-button color="primary" [disabled]="saving()"
                  (click)="saveAttendance()">
            @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
            <mat-icon>save</mat-icon>
            Save Attendance
          </button>
        }
      </div>

      <!-- Selector bar -->
      <div class="selector-bar">
        <mat-form-field appearance="outline">
          <mat-label>Select Batch</mat-label>
          <mat-select [value]="selectedBatch()" (selectionChange)="onBatchChange($event.value)">
            <mat-option value="">— Choose batch —</mat-option>
            @for (b of batches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput type="date" [value]="selectedDate()"
                 (change)="onDateChange($event)" />
        </mat-form-field>

        <button mat-stroked-button [disabled]="!selectedBatch() || loading()"
                (click)="loadRoster()">
          <mat-icon>search</mat-icon>
          Load Roster
        </button>
      </div>

      @if (saveSuccess()) {
        <div class="success-banner">
          <mat-icon>check_circle</mat-icon>
          Attendance saved successfully!
        </div>
      }
      @if (saveError()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          {{ saveError() }}
        </div>
      }

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!hasLoaded()) {
        <div class="empty-state">
          <mat-icon>fact_check</mat-icon>
          <p>Select a batch and date, then click "Load Roster"</p>
        </div>
      } @else if (roster().length === 0) {
        <div class="empty-state">
          <mat-icon>people_outline</mat-icon>
          <p>No students found in this batch</p>
        </div>
      } @else {
        <!-- Summary bar -->
        <div class="att-summary">
          <div class="att-chip present">
            <mat-icon>check_circle</mat-icon>
            <span>{{ presentCount() }} Present</span>
          </div>
          <div class="att-chip absent">
            <mat-icon>cancel</mat-icon>
            <span>{{ absentCount() }} Absent</span>
          </div>
          <div class="att-chip late">
            <mat-icon>schedule</mat-icon>
            <span>{{ lateCount() }} Late</span>
          </div>
          <div class="att-quick-actions">
            <button mat-stroked-button (click)="markAll('PRESENT')">All Present</button>
            <button mat-stroked-button (click)="markAll('ABSENT')">All Absent</button>
          </div>
        </div>

        <!-- Roster grid -->
        <div class="roster-grid">
          @for (row of roster(); track row.studentId) {
            <div class="roster-card" [attr.data-status]="row.status">
              <div class="student-info">
                <div class="avatar" [attr.data-status]="row.status">{{ row.initials }}</div>
                <span class="student-name">{{ row.name }}</span>
              </div>
              <div class="status-toggle">
                <button mat-icon-button
                        [class.active]="row.status === 'PRESENT'"
                        matTooltip="Present"
                        (click)="setStatus(row, 'PRESENT')">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button
                        [class.active]="row.status === 'LATE'"
                        matTooltip="Late"
                        (click)="setStatus(row, 'LATE')">
                  <mat-icon>schedule</mat-icon>
                </button>
                <button mat-icon-button
                        [class.active]="row.status === 'ABSENT'"
                        matTooltip="Absent"
                        (click)="setStatus(row, 'ABSENT')">
                  <mat-icon>cancel</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .selector-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .selector-bar mat-form-field { width: 220px; }

    .success-banner { display: flex; align-items: center; gap: 8px; background: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; border-radius: 8px; padding: 10px 14px; font-size: 0.875rem; margin-bottom: 16px; }
    .error-banner   { display: flex; align-items: center; gap: 8px; background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-radius: 8px; padding: 10px 14px; font-size: 0.875rem; margin-bottom: 16px; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 0.95rem; }

    .att-summary { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .att-chip { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
    .att-chip mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .att-chip.present { background: #ECFDF5; color: #059669; }
    .att-chip.absent  { background: #FEF2F2; color: #DC2626; }
    .att-chip.late    { background: #FFF7ED; color: #C2410C; }
    .att-quick-actions { display: flex; gap: 8px; margin-left: auto; }

    .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }

    .roster-card {
      background: white; border-radius: 10px; border: 2px solid #E2E8F0;
      padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
      transition: border-color 0.15s, background 0.15s;
    }
    [data-status="PRESENT"] { border-color: #A7F3D0; background: #F0FDF4; }
    [data-status="ABSENT"]  { border-color: #FECACA; background: #FEF2F2; }
    [data-status="LATE"]    { border-color: #FDE68A; background: #FFFBEB; }

    .student-info { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
      background: #E2E8F0; color: #475569; flex-shrink: 0;
    }
    .avatar[data-status="PRESENT"] { background: #A7F3D0; color: #059669; }
    .avatar[data-status="ABSENT"]  { background: #FECACA; color: #DC2626; }
    .avatar[data-status="LATE"]    { background: #FDE68A; color: #C2410C; }
    .student-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }

    .status-toggle { display: flex; gap: 0; }
    .status-toggle button.active mat-icon { opacity: 1; }
    .status-toggle button mat-icon { opacity: 0.25; transition: opacity 0.15s; }
    .status-toggle button:hover mat-icon { opacity: 0.7; }
    .status-toggle [class*="active-present"] mat-icon { color: #059669; }
    .status-toggle button.active { opacity: 1; }

    @media (max-width: 600px) { .roster-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminAttendanceComponent implements OnInit {
    private readonly svc = inject(AttendanceAdminService);
    private readonly batchesSvc = inject(BatchesAdminService);

    readonly batches = signal<BatchRow[]>([]);
    readonly roster = signal<RosterRow[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly hasLoaded = signal(false);
    readonly saveSuccess = signal(false);
    readonly saveError = signal('');
    readonly selectedBatch = signal('');
    readonly selectedDate = signal(new Date().toISOString().split('T')[0]);

    readonly presentCount = computed(() => this.roster().filter((r) => r.status === 'PRESENT').length);
    readonly absentCount = computed(() => this.roster().filter((r) => r.status === 'ABSENT').length);
    readonly lateCount = computed(() => this.roster().filter((r) => r.status === 'LATE').length);

    ngOnInit() {
        this.batchesSvc.getBatches(1, 100).subscribe({
            next: (res) => this.batches.set(res.data.data),
        });
    }

    onBatchChange(id: string) { this.selectedBatch.set(id); }
    onDateChange(event: Event) {
        this.selectedDate.set((event.target as HTMLInputElement).value);
    }

    loadRoster() {
        if (!this.selectedBatch()) return;
        this.loading.set(true);
        this.hasLoaded.set(false);
        this.saveSuccess.set(false);
        this.saveError.set('');

        this.svc.getAttendance(this.selectedBatch(), this.selectedDate()).subscribe({
            next: (res) => {
                this.roster.set(
                    (res.data ?? []).map((r) => ({
                        studentId: r.studentId,
                        name: r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentId,
                        initials: r.student
                            ? `${r.student.firstName[0]}${r.student.lastName[0]}`.toUpperCase()
                            : '?',
                        status: r.status,
                    })),
                );
                this.hasLoaded.set(true);
                this.loading.set(false);
            },
            error: () => { this.loading.set(false); this.hasLoaded.set(true); },
        });
    }

    setStatus(row: RosterRow, status: AttendanceStatus) {
        this.roster.update((rows) =>
            rows.map((r) => r.studentId === row.studentId ? { ...r, status } : r),
        );
    }

    markAll(status: AttendanceStatus) {
        this.roster.update((rows) => rows.map((r) => ({ ...r, status })));
    }

    saveAttendance() {
        this.saving.set(true);
        this.saveSuccess.set(false);
        this.saveError.set('');

        const dto = {
            batchId: this.selectedBatch(),
            date: this.selectedDate(),
            records: this.roster().map((r) => ({ studentId: r.studentId, status: r.status })),
        };

        this.svc.markBulk(dto).subscribe({
            next: () => { this.saving.set(false); this.saveSuccess.set(true); },
            error: (err) => {
                this.saving.set(false);
                this.saveError.set(err?.error?.message ?? 'Failed to save attendance');
            },
        });
    }
}
