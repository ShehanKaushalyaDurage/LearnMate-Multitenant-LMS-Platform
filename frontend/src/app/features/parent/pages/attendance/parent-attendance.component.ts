import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Child { id: string; firstName: string; lastName: string; }
interface AttRecord {
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    batch?: { name: string };
    session?: { subject?: string };
}

const STATUS_CFG = {
    PRESENT: { color: '#059669', bg: '#ECFDF5', icon: 'check_circle' },
    ABSENT: { color: '#DC2626', bg: '#FEF2F2', icon: 'cancel' },
    LATE: { color: '#C2410C', bg: '#FFF7ED', icon: 'schedule' },
} as const;

@Component({
    selector: 'app-parent-attendance',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Attendance</h1>
        <p class="page-sub">View your children's attendance records</p>
      </div>

      <!-- Child selector -->
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
          <p>Select a child to view attendance</p>
        </div>
      } @else if (records().length === 0) {
        <div class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <p>No attendance records found</p>
        </div>
      } @else {
        <!-- Summary -->
        <div class="summary-row">
          @for (s of summaryKeys; track s) {
            <div class="sum-card" [style.border-color]="STATUS_CFG[s].color">
              <div class="sum-icon" [style.background]="STATUS_CFG[s].bg" [style.color]="STATUS_CFG[s].color">
                <mat-icon>{{ STATUS_CFG[s].icon }}</mat-icon>
              </div>
              <div>
                <div class="sum-count">{{ countStatus(s) }}</div>
                <div class="sum-label">{{ s }}</div>
              </div>
            </div>
          }
          <div class="sum-card" style="border-color:#6366F1">
            <div class="sum-icon" style="background:#EEF2FF;color:#6366F1"><mat-icon>percent</mat-icon></div>
            <div>
              <div class="sum-count">{{ attendancePct() }}%</div>
              <div class="sum-label">Rate</div>
            </div>
          </div>
        </div>

        <!-- Records list -->
        <div class="rec-list">
          @for (r of records(); track r.id) {
            <div class="rec-row">
              <div class="rec-icon" [style.background]="STATUS_CFG[r.status].bg" [style.color]="STATUS_CFG[r.status].color">
                <mat-icon>{{ STATUS_CFG[r.status].icon }}</mat-icon>
              </div>
              <div class="rec-info">
                <div class="rec-date">{{ r.date | date:'fullDate' }}</div>
                @if (r.batch)            { <div class="rec-batch">{{ r.batch.name }}</div> }
                @if (r.session?.subject) { <div class="rec-subj">{{ r.session!.subject }}</div> }
              </div>
              <span class="status-chip"
                    [style.background]="STATUS_CFG[r.status].bg"
                    [style.color]="STATUS_CFG[r.status].color">
                {{ r.status }}
              </span>
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

    .summary-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .sum-card { background: white; border-radius: 12px; border: 1px solid; padding: 14px; display: flex; align-items: center; gap: 10px; }
    .sum-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sum-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sum-count { font-size: 1.4rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .sum-label { font-size: 0.72rem; color: #64748B; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.4px; }

    .rec-list { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .rec-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F8FAFC; transition: background 0.12s; }
    .rec-row:last-child { border-bottom: none; }
    .rec-row:hover { background: #FAFAFA; }
    .rec-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .rec-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .rec-info { flex: 1; }
    .rec-date { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .rec-batch { font-size: 0.75rem; color: #64748B; }
    .rec-subj { font-size: 0.72rem; color: #94A3B8; }
    .status-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
  `],
})
export class ParentAttendanceComponent implements OnInit {
    readonly STATUS_CFG = STATUS_CFG;
    readonly summaryKeys: ('PRESENT' | 'ABSENT' | 'LATE')[] = ['PRESENT', 'ABSENT', 'LATE'];

    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);

    readonly children = signal<Child[]>([]);
    readonly records = signal<AttRecord[]>([]);
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
        if (!id) { this.records.set([]); return; }
        this.loading.set(true);
        this.api.get<{ data: { data: AttRecord[] } }>('/tenant/attendance', { studentId: id, page: 1, limit: 100 }).subscribe({
            next: (r) => { this.records.set(r.data.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    countStatus(s: 'PRESENT' | 'ABSENT' | 'LATE'): number {
        return this.records().filter((r) => r.status === s).length;
    }

    attendancePct(): number {
        const total = this.records().length;
        if (!total) return 0;
        return Math.round((this.countStatus('PRESENT') / total) * 100);
    }
}
