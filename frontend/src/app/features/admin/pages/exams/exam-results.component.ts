import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExamsAdminService } from '../../services/exams-admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-exam-results',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/admin/exams">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">Exam Results</h1>
            <p class="page-sub">{{ examInfo()?.title || 'Loading...' }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="stats-row">
          <div class="stat-card">
            <span class="label">Total Attempts</span>
            <span class="value">{{ results().length }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Avg. Percentage</span>
            <span class="value">{{ averagePercentage() }}%</span>
          </div>
        </div>

        <div class="table-card">
          <table mat-table [dataSource]="results()" class="results-table">
            <ng-container matColumnDef="student">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let r">
                <div class="student-cell">
                  <div class="avatar">{{ r.student.firstName[0] }}{{ r.student.lastName[0] }}</div>
                  <div>
                    <div class="name">{{ r.student.firstName }} {{ r.student.lastName }}</div>
                    <div class="email">{{ r.student.email }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="score">
              <th mat-header-cell *matHeaderCellDef>Score</th>
              <td mat-cell *matCellDef="let r">
                @if (examInfo()?.type === 'ONLINE_MCQ') {
                  <div class="score-cell">
                    <span class="marks">{{ r.totalMarks ?? r.marksObtained }} / {{ examInfo()?.maxMarks }}</span>
                    <span class="pct" [class.pass]="isPass(r)">{{ r.percentage ?? calculatePct(r) }}%</span>
                  </div>
                } @else {
                  <div class="manual-input">
                    <input type="number" [(ngModel)]="r.marksObtained" (change)="saveMarks(r)" />
                    <span class="max">/ {{ examInfo()?.maxMarks }}</span>
                    @if (r.saving) { <mat-spinner diameter="16"></mat-spinner> }
                  </div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Submitted/Marked</th>
              <td mat-cell *matCellDef="let r">
                {{ (r.submittedAt || r.createdAt) | date:'medium' }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (results().length === 0) {
            <div class="empty-state">
              <mat-icon>summarize</mat-icon>
              <p>No results found for this exam.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat-card .label { font-size: 0.75rem; color: #64748B; font-weight: 600; text-transform: uppercase; }
    .stat-card .value { font-size: 1.5rem; font-weight: 700; color: #0F172A; }

    .table-card { background: white; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
    .results-table { width: 100%; }
    
    .student-cell { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #EFF6FF; color: #1E40AF; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
    .student-cell .name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .student-cell .email { font-size: 0.75rem; color: #64748B; }

    .score-cell { display: flex; flex-direction: column; }
    .marks { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .pct { font-size: 0.75rem; font-weight: 700; color: #64748B; }
    .pct.pass { color: #059669; }

    .manual-input { display: flex; align-items: center; gap: 8px; }
    .manual-input input { width: 60px; padding: 4px 8px; border: 1px solid #E2E8F0; border-radius: 4px; font-weight: 700; text-align: center; }
    .manual-input .max { color: #64748B; font-size: 0.875rem; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
  `],
})
export class AdminExamResultsComponent implements OnInit {
  private readonly svc = inject(ExamsAdminService);
  private readonly route = inject(ActivatedRoute);

  readonly results = signal<any[]>([]);
  readonly examInfo = signal<any>(null);
  readonly loading = signal(true);

  readonly displayedColumns = ['student', 'score', 'date'];

  ngOnInit() {
    const examId = this.route.snapshot.paramMap.get('id');
    if (examId) this.loadResults(examId);
  }

  loadResults(id: string) {
    this.loading.set(true);
    this.svc.getExamResults(id).subscribe({
      next: (r: any) => {
        this.results.set(r.data.results);
        this.examInfo.set(r.data.exam);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveMarks(r: any) {
    if (r.marksObtained === null || r.marksObtained === undefined) return;
    r.saving = true;
    this.svc.saveManualResult(this.examInfo().id, r.studentId, r.marksObtained).subscribe({
      next: () => { r.saving = false; },
      error: () => { r.saving = false; alert('Failed to save marks'); }
    });
  }

  averagePercentage(): string {
    const res = this.results();
    if (res.length === 0) return '0';
    const sum = res.reduce((acc, r) => {
      const p = r.percentage ?? this.calculatePct(r);
      return acc + p;
    }, 0);
    return (sum / res.length).toFixed(1);
  }

  calculatePct(r: any): number {
    const max = this.examInfo()?.maxMarks || 100;
    const obtained = r.marksObtained ?? r.totalMarks ?? 0;
    return Number(((obtained / max) * 100).toFixed(1));
  }

  isPass(r: any): boolean {
    const pct = r.percentage ?? this.calculatePct(r);
    return pct >= 50;
  }
}
