import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

interface Child { id: string; firstName: string; lastName: string; }
interface ExamResult {
    id: string;
    examTitle: string;
    examType: 'ONLINE_MCQ' | 'MANUAL';
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    date: string;
    remarks?: string;
}

@Component({
    selector: 'app-parent-exams',
    standalone: true,
    imports: [
        CommonModule, MatIconModule, MatButtonModule,
        MatFormFieldModule, MatSelectModule, MatCardModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Exam Performance</h1>
          <p class="page-sub">Track your children's academic results</p>
        </div>
        <mat-form-field appearance="outline" class="child-selector">
          <mat-label>Select Child</mat-label>
          <mat-select [value]="selectedChildId()" (selectionChange)="onChildChange($event.value)">
            @for (c of children(); track c.id) {
              <mat-option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!selectedChildId()) {
        <div class="empty-state">
          <mat-icon>family_restroom</mat-icon>
          <h3>No child selected</h3>
          <p>Please select a child to view their exam performance.</p>
        </div>
      } @else if (results().length === 0) {
        <div class="empty-state">
          <mat-icon>quiz</mat-icon>
          <h3>No results found</h3>
          <p>There are no exam records available for this student.</p>
        </div>
      } @else {
        <div class="results-grid">
          @for (r of results(); track r.id) {
            <mat-card class="result-card">
              <div class="card-header">
                <div class="exam-info">
                  <h3 class="exam-title">{{ r.examTitle }}</h3>
                  <span class="exam-type" [class]="r.examType">{{ r.examType === 'ONLINE_MCQ' ? 'Online' : 'Manual' }}</span>
                </div>
                <div class="score-badge" [class.pass]="r.percentage >= 40" [class.fail]="r.percentage < 40">
                  <span class="score-main">{{ r.marksObtained }}/{{ r.maxMarks }}</span>
                  <span class="score-percent">{{ r.percentage | number:'1.0-0' }}%</span>
                </div>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <mat-icon>calendar_today</mat-icon>
                  <span>{{ r.date | date:'mediumDate' }}</span>
                </div>
                @if (r.remarks) {
                  <div class="remarks">
                    <strong>Teacher Remarks:</strong>
                    <p>{{ r.remarks }}</p>
                  </div>
                }
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; gap: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .child-selector { width: 240px; }

    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
    .result-card { border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: none; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; }
    .result-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .exam-title { font-size: 1.1rem; font-weight: 700; color: #1E293B; margin: 0 0 6px; line-height: 1.3; }
    .exam-type { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; }
    .exam-type.ONLINE_MCQ { background: #E0F2FE; color: #0369A1; }
    .exam-type.MANUAL { background: #F1F5F9; color: #475569; }

    .score-badge { display: flex; flex-direction: column; align-items: center; padding: 10px 14px; border-radius: 12px; min-width: 80px; }
    .score-badge.pass { background: #ECFDF5; color: #059669; }
    .score-badge.fail { background: #FEF2F2; color: #DC2626; }
    .score-main { font-size: 1rem; font-weight: 700; }
    .score-percent { font-size: 0.75rem; font-weight: 600; }

    .card-body { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; align-items: center; gap: 10px; color: #64748B; font-size: 0.875rem; }
    .info-row mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .remarks { background: #F8FAFC; border-radius: 10px; padding: 12px; border-left: 4px solid #E2E8F0; }
    .remarks strong { font-size: 0.75rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .remarks p { margin: 4px 0 0; font-size: 0.875rem; color: #64748B; line-height: 1.5; }

    .loading-center { padding: 100px; display: flex; justify-content: center; }
    .empty-state { padding: 80px 20px; text-align: center; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; color: #CBD5E1; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 700; color: #475569; margin: 0 0 8px; }
    .empty-state p { font-size: 0.95rem; margin: 0; }

    @media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } .child-selector { width: 100%; } }
  `],
})
export class ParentExamsComponent implements OnInit {
    private readonly api = inject(ApiService);

    readonly children = signal<Child[]>([]);
    readonly selectedChildId = signal<string | null>(null);
    readonly results = signal<ExamResult[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        this.loadChildren();
    }

    onChildChange(id: string) {
        this.selectedChildId.set(id);
        this.loadResults(id);
    }

    private loadChildren() {
        this.api.get<{ data: Child[] }>('/tenant/users/my-children').subscribe({
            next: (r) => {
                this.children.set(r.data);
                if (r.data.length > 0) {
                    this.selectedChildId.set(r.data[0].id);
                    this.loadResults(r.data[0].id);
                } else {
                    this.loading.set(false);
                }
            },
            error: () => this.loading.set(false),
        });
    }

    private loadResults(childId: string) {
        this.loading.set(true);
        this.api.get<{ data: ExamResult[] }>(`/tenant/exams/student/${childId}/results`).subscribe({
            next: (r) => {
                // In my backend implementation, r is the array if I didn't wrap it in {data}
                // Wait, typical API response wraps in {data: ...}
                this.results.set(r.data || r as any);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }
}
