import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimetableAdminService, type TimetableSlot, type DayOfWeek } from '../../services/timetable-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SCHOOL_DAYS = [1, 2, 3, 4, 5, 6]; // Mon–Sat

const DAY_COLORS: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    2: { bg: '#F0FDF4', border: '#BBF7D0', text: '#059669' },
    3: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
    4: { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' },
    5: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
    6: { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' },
};

@Component({
    selector: 'app-admin-timetable',
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
          <h1 class="page-title">Timetable</h1>
          <p class="page-sub">Manage weekly class schedules</p>
        </div>
        @if (selectedBatch()) {
          <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'Add Slot' }}
          </button>
        }
      </div>

      <!-- Batch selector -->
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
      </div>

      <!-- Add slot form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">Add Timetable Slot</h3>
          <form [formGroup]="slotForm" (ngSubmit)="addSlot()" class="slot-grid">
            <mat-form-field appearance="outline">
              <mat-label>Day</mat-label>
              <mat-select formControlName="dayOfWeek">
                @for (d of schoolDays; track d) {
                  <mat-option [value]="d">{{ dayName(d) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Start Time</mat-label>
              <input matInput formControlName="startTime" type="time" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>End Time</mat-label>
              <input matInput formControlName="endTime" type="time" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Subject (optional)</mat-label>
              <input matInput formControlName="subject" placeholder="e.g. Mathematics" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Room (optional)</mat-label>
              <input matInput formControlName="room" placeholder="e.g. Room 201" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Meet Link (optional)</mat-label>
              <input matInput formControlName="meetLink" placeholder="https://meet.google.com/..." />
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="slotForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Add Slot
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!selectedBatch()) {
        <div class="empty-state">
          <mat-icon>calendar_month</mat-icon>
          <p>Select a batch to view and manage its weekly timetable</p>
        </div>
      } @else {
        <!-- Weekly grid -->
        <div class="week-grid">
          @for (day of schoolDays; track day) {
            <div class="day-column">
              <div class="day-header" [style.background]="dayColor(day).bg"
                   [style.border-color]="dayColor(day).border"
                   [style.color]="dayColor(day).text">
                {{ dayName(day) }}
              </div>
              <div class="slots-list">
                @for (slot of slotsForDay(day); track slot.id) {
                  <div class="slot-card" [style.border-left-color]="dayColor(day).text">
                    <div class="slot-time">{{ slot.startTime }} – {{ slot.endTime }}</div>
                    @if (slot.subject) {
                      <div class="slot-subject">{{ slot.subject }}</div>
                    }
                    @if (slot.room) {
                      <div class="slot-room">
                        <mat-icon>room</mat-icon>{{ slot.room }}
                      </div>
                    }
                    @if (slot.meetLink) {
                      <a [href]="slot.meetLink" target="_blank" class="meet-link">
                        <mat-icon>videocam</mat-icon>Join
                      </a>
                    }
                    <button mat-icon-button class="delete-btn" matTooltip="Remove slot"
                            (click)="removeSlot(slot.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
                @if (slotsForDay(day).length === 0) {
                  <div class="empty-day">No class</div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1300px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .selector-bar { margin-bottom: 16px; }
    .selector-bar mat-form-field { width: 240px; }

    .create-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 16px; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 0.95rem; }

    /* Weekly grid */
    .week-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    .day-column { display: flex; flex-direction: column; gap: 8px; }

    .day-header {
      text-align: center; padding: 8px; border-radius: 8px;
      border: 1px solid; font-weight: 700; font-size: 0.8rem;
    }

    .slots-list { display: flex; flex-direction: column; gap: 6px; }

    .slot-card {
      background: white; border-radius: 8px; border: 1px solid #E2E8F0;
      border-left: 3px solid; padding: 10px; position: relative;
      font-size: 0.78rem;
    }
    .slot-time { font-weight: 700; color: #0F172A; margin-bottom: 4px; }
    .slot-subject { color: #334155; font-weight: 600; }
    .slot-room { display: flex; align-items: center; gap: 2px; color: #64748B; margin-top: 2px; }
    .slot-room mat-icon { font-size: 11px; width: 11px; height: 11px; }
    .meet-link { display: flex; align-items: center; gap: 2px; color: #1E40AF; text-decoration: none; font-size: 0.75rem; margin-top: 4px; }
    .meet-link mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .delete-btn { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; line-height: 20px; opacity: 0; transition: opacity 0.15s; }
    .delete-btn mat-icon { font-size: 14px; width: 14px; height: 14px; color: #94A3B8; }
    .slot-card:hover .delete-btn { opacity: 1; }

    .empty-day { color: #CBD5E1; font-size: 0.75rem; text-align: center; padding: 12px 0; border: 1px dashed #E2E8F0; border-radius: 8px; }

    @media (max-width: 900px) { .week-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 580px) { .week-grid { grid-template-columns: 1fr; } .slot-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminTimetableComponent implements OnInit {
    private readonly svc = inject(TimetableAdminService);
    private readonly batchesSvc = inject(BatchesAdminService);
    private readonly fb = inject(FormBuilder);

    readonly batches = signal<BatchRow[]>([]);
    readonly timetableMap = signal<Record<string, TimetableSlot[]>>({});
    readonly loading = signal(false);
    readonly selectedBatch = signal('');
    readonly showForm = signal(false);
    readonly saving = signal(false);
    readonly formError = signal('');

    readonly schoolDays = SCHOOL_DAYS;

    readonly slotForm = this.fb.group({
        dayOfWeek: [1, Validators.required],
        startTime: ['', Validators.required],
        endTime: ['', Validators.required],
        subject: [''],
        room: [''],
        meetLink: [''],
    });

    ngOnInit() {
        this.batchesSvc.getBatches(1, 100).subscribe({ next: (r) => this.batches.set(r.data.data) });
    }

    onBatchChange(id: string) {
        this.selectedBatch.set(id);
        if (!id) { this.timetableMap.set({}); return; }
        this.loading.set(true);
        this.svc.getBatchTimetable(id).subscribe({
            next: (r) => { this.timetableMap.set(r.data ?? {}); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    dayName(d: number) { return DAYS[d]; }
    dayColor(d: number) { return DAY_COLORS[d] ?? { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' }; }
    slotsForDay(d: number): TimetableSlot[] { return this.timetableMap()[String(d)] ?? []; }

    addSlot() {
        if (this.slotForm.invalid) return;
        this.saving.set(true);
        this.formError.set('');
        const v = this.slotForm.value;
        this.svc.createSlot({
            batchId: this.selectedBatch(),
            dayOfWeek: v.dayOfWeek!,
            startTime: v.startTime!,
            endTime: v.endTime!,
            subject: v.subject || undefined,
            room: v.room || undefined,
            meetLink: v.meetLink || undefined,
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.showForm.set(false);
                this.slotForm.reset({ dayOfWeek: 1 });
                this.onBatchChange(this.selectedBatch());
            },
            error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Failed to add slot'); },
        });
    }

    removeSlot(id: string) {
        this.svc.deleteSlot(id).subscribe({ next: () => this.onBatchChange(this.selectedBatch()) });
    }
}
