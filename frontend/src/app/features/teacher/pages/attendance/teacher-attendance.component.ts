import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE';

interface Student { id: string; firstName: string; lastName: string; }
interface AttRecord { studentId: string; status: AttStatus; }
interface MyBatch { id: string; name: string; }

@Component({
    selector: 'app-teacher-attendance',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mark Attendance</h1>
        <p class="page-sub">Take attendance for your batches</p>
      </div>

      <!-- Controls -->
      <div class="controls">
        <mat-form-field appearance="outline">
          <mat-label>Batch</mat-label>
          <mat-select [value]="selectedBatch()" (selectionChange)="onBatchChange($event.value)">
            <mat-option value="">— Select batch —</mat-option>
            @for (b of batches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <input type="date" class="date-input" [value]="selectedDate()"
               (change)="onDateChange($any($event.target).value)" />
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!selectedBatch()) {
        <div class="empty-state">
          <mat-icon>groups</mat-icon>
          <p>Select a batch to mark attendance</p>
        </div>
      } @else if (students().length === 0) {
        <div class="empty-state">
          <mat-icon>person_off</mat-icon>
          <p>No students in this batch</p>
        </div>
      } @else {
        <!-- Summary -->
        <div class="summary-bar">
          <div class="sum present"><mat-icon>check_circle</mat-icon>{{ countStatus('PRESENT') }} Present</div>
          <div class="sum absent"><mat-icon>cancel</mat-icon>{{ countStatus('ABSENT') }} Absent</div>
          <div class="sum late"><mat-icon>schedule</mat-icon>{{ countStatus('LATE') }} Late</div>
          <div class="sum-actions">
            <button mat-stroked-button (click)="markAll('PRESENT')">All Present</button>
            <button mat-stroked-button (click)="markAll('ABSENT')">All Absent</button>
          </div>
        </div>

        <!-- Roster -->
        <div class="roster-grid">
          @for (s of students(); track s.id) {
            <div class="student-card" [attr.data-status]="statusOf(s.id)">
              <div class="avatar">{{ s.firstName[0] }}{{ s.lastName[0] }}</div>
              <div class="student-name">{{ s.firstName }} {{ s.lastName }}</div>
              <div class="toggle-row">
                @for (opt of statusOpts; track opt.value) {
                  <button class="tog" [class.active]="statusOf(s.id) === opt.value"
                          [attr.data-opt]="opt.value" (click)="setStatus(s.id, opt.value)">
                    <mat-icon>{{ opt.icon }}</mat-icon>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <div class="save-row">
          @if (saveMsg()) { <span class="save-msg" [class.err]="saveErr()">{{ saveMsg() }}</span> }
          <button mat-flat-button color="primary" [disabled]="saving()" (click)="save()">
            @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
            Save Attendance
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1100px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .controls { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .controls mat-form-field { width: 220px; }
    .date-input { height: 56px; padding: 0 14px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 0.9rem; background: white; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .summary-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; background: white; border-radius: 10px; border: 1px solid #E2E8F0; padding: 12px 16px; }
    .sum { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; font-weight: 600; }
    .sum mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .sum.present { color: #059669; }
    .sum.absent  { color: #DC2626; }
    .sum.late    { color: #C2410C; }
    .sum-actions { margin-left: auto; display: flex; gap: 8px; }

    .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .student-card {
      background: white; border-radius: 12px; border: 2px solid #E2E8F0; padding: 14px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      transition: border-color 0.15s, background 0.15s;
    }
    [data-status="PRESENT"] { border-color: #059669; background: #F0FDF4; }
    [data-status="ABSENT"]  { border-color: #DC2626; background: #FEF2F2; }
    [data-status="LATE"]    { border-color: #C2410C; background: #FFF7ED; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #EFF6FF; color: #1E40AF; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .student-name { font-size: 0.8rem; font-weight: 600; color: #0F172A; text-align: center; }

    .toggle-row { display: flex; gap: 4px; }
    .tog { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #E2E8F0; background: #F8FAFC; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
    .tog mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94A3B8; }
    .tog.active[data-opt="PRESENT"] { background: #059669; border-color: #059669; }
    .tog.active[data-opt="ABSENT"]  { background: #DC2626; border-color: #DC2626; }
    .tog.active[data-opt="LATE"]    { background: #C2410C; border-color: #C2410C; }
    .tog.active mat-icon { color: white; }

    .save-row { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .save-msg { font-size: 0.875rem; color: #059669; }
    .save-msg.err { color: #DC2626; }
  `],
})
export class TeacherAttendanceComponent implements OnInit {
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);

    readonly batches = signal<MyBatch[]>([]);
    readonly students = signal<Student[]>([]);
    readonly records = signal<AttRecord[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly saveMsg = signal('');
    readonly saveErr = signal(false);
    readonly selectedBatch = signal('');
    readonly selectedDate = signal(new Date().toISOString().slice(0, 10));

    readonly statusOpts = [
        { value: 'PRESENT', icon: 'check_circle' },
        { value: 'ABSENT', icon: 'cancel' },
        { value: 'LATE', icon: 'schedule' },
    ] as const;

    ngOnInit() {
        this.api.get<{ data: { data: MyBatch[] } }>('/tenant/batches/my', { page: 1, limit: 50 }).subscribe({
            next: (r) => {
                this.batches.set(r.data.data);
                // Pre-select via query param
                const batchId = this.route.snapshot.queryParamMap.get('batchId');
                if (batchId) this.onBatchChange(batchId);
            },
        });
    }

    onBatchChange(batchId: string) {
        this.selectedBatch.set(batchId);
        if (!batchId) { this.students.set([]); this.records.set([]); return; }
        this.loadRoster(batchId);
    }

    onDateChange(date: string) { this.selectedDate.set(date); }

    loadRoster(batchId: string) {
        this.loading.set(true);
        this.api.get<{ data: { data: Student[] } }>('/tenant/users', { role: 'STUDENT', batchId, page: 1, limit: 100 }).subscribe({
            next: (r) => {
                this.students.set(r.data.data);
                this.records.set(r.data.data.map((s) => ({ studentId: s.id, status: 'PRESENT' as AttStatus })));
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    statusOf(studentId: string): AttStatus {
        return this.records().find((r) => r.studentId === studentId)?.status ?? 'PRESENT';
    }

    setStatus(studentId: string, status: AttStatus) {
        this.records.update((rs) => rs.map((r) => r.studentId === studentId ? { ...r, status } : r));
    }

    markAll(status: AttStatus) {
        this.records.update((rs) => rs.map((r) => ({ ...r, status })));
    }

    countStatus(s: AttStatus): number { return this.records().filter((r) => r.status === s).length; }

    save() {
        this.saving.set(true);
        this.saveMsg.set('');
        this.api.post('/tenant/attendance/bulk', {
            batchId: this.selectedBatch(),
            date: this.selectedDate(),
            records: this.records(),
        }).subscribe({
            next: () => { this.saving.set(false); this.saveMsg.set('Attendance saved!'); this.saveErr.set(false); },
            error: () => { this.saving.set(false); this.saveMsg.set('Failed to save.'); this.saveErr.set(true); },
        });
    }
}
