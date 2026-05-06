import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AssignmentsService, type Assignment, type Submission } from '../../../admin/services/assignments.service';

@Component({
    selector: 'app-teacher-assignment-review',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        MatButtonModule, MatIconModule, MatTableModule,
        MatProgressSpinnerModule, MatFormFieldModule, MatInputModule
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/teacher/assignments">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">Review Submissions</h1>
            <p class="page-sub">{{ assignment()?.title }} • {{ assignment()?.batch?.name }}</p>
          </div>
        </div>
        <div class="stats">
            <div class="stat">
                <span class="val">{{ submissions().length }}</span>
                <span class="lab">Submissions</span>
            </div>
            <div class="stat">
                <span class="val">{{ gradedCount() }} / {{ submissions().length }}</span>
                <span class="lab">Graded</span>
            </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="submissions()" class="review-table">
          <ng-container matColumnDef="student">
            <th mat-header-cell *matHeaderCellDef>Student</th>
            <td mat-cell *matCellDef="let s">
              <div class="student-info">
                <div class="avatar">{{ s.student.firstName[0] }}{{ s.student.lastName[0] }}</div>
                <div>
                  <div class="name">{{ s.student.firstName }} {{ s.student.lastName }}</div>
                  <div class="email">{{ s.student.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="submission">
            <th mat-header-cell *matHeaderCellDef>Submission</th>
            <td mat-cell *matCellDef="let s">
              @if (s.fileUrl) {
                <div class="sub-link">
                  <mat-icon>link</mat-icon>
                  <a [href]="s.fileUrl" target="_blank">View Work</a>
                </div>
                <div class="sub-date">{{ s.submittedAt | date:'short' }}</div>
              } @else {
                <span class="no-sub">No submission</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="grade">
            <th mat-header-cell *matHeaderCellDef>Grade & Feedback</th>
            <td mat-cell *matCellDef="let s">
              <div class="grade-cell">
                <div class="marks-row">
                  <input type="number" [(ngModel)]="s.marks" placeholder="Marks" class="marks-input" />
                  <span class="max">/ {{ assignment()?.maxMarks }}</span>
                </div>
                <textarea [(ngModel)]="s.feedback" placeholder="Add feedback..." class="feedback-input"></textarea>
                <button mat-flat-button color="primary" size="small" 
                        [disabled]="s.saving || s.marks === null"
                        (click)="saveGrade(s)">
                  @if (s.saving) { <mat-spinner diameter="14"></mat-spinner> }
                  Save
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (submissions().length === 0) {
          <div class="empty">
            <mat-icon>people_outline</mat-icon>
            <p>No submissions yet for this assignment.</p>
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .page { padding: 24px; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }

    .stats { display: flex; gap: 24px; }
    .stat { display: flex; flex-direction: column; align-items: flex-end; }
    .stat .val { font-size: 1.25rem; font-weight: 700; color: #0F172A; }
    .stat .lab { font-size: 0.75rem; color: #64748B; text-transform: uppercase; font-weight: 600; }

    .review-table { width: 100%; background: white; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
    
    .student-info { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #EEF2FF; color: #6366F1; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; }
    .name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .email { font-size: 0.75rem; color: #64748B; }

    .sub-link { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .sub-link a { font-size: 0.875rem; color: #6366F1; font-weight: 600; text-decoration: none; }
    .sub-link mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6366F1; }
    .sub-date { font-size: 0.7rem; color: #94A3B8; }
    .no-sub { font-size: 0.875rem; color: #94A3B8; font-style: italic; }

    .grade-cell { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; width: 300px; }
    .marks-row { display: flex; align-items: center; gap: 8px; }
    .marks-input { width: 70px; padding: 6px; border: 1px solid #E2E8F0; border-radius: 6px; font-weight: 700; text-align: center; }
    .max { color: #64748B; font-size: 0.875rem; }
    .feedback-input { width: 100%; padding: 8px; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 0.8rem; resize: vertical; min-height: 40px; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class TeacherAssignmentReviewComponent implements OnInit {
    private readonly svc = inject(AssignmentsService);
    private readonly route = inject(ActivatedRoute);

    readonly assignment = signal<Assignment | null>(null);
    readonly submissions = signal<any[]>([]);
    readonly loading = signal(true);
    readonly displayedColumns = ['student', 'submission', 'grade'];

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.load(id);
    }

    load(id: string) {
        this.svc.getAssignmentById(id).subscribe({
            next: (res) => {
                this.assignment.set(res.data);
                this.submissions.set((res.data as any).submissions || []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    gradedCount(): number {
        return this.submissions().filter(s => s.marks !== null && s.marks !== undefined).length;
    }

    saveGrade(s: any) {
        s.saving = true;
        this.svc.grade(s.id, s.marks, s.feedback).subscribe({
            next: () => {
                s.saving = false;
                // Optional: show snackbar
            },
            error: (e) => {
                s.saving = false;
                alert(e?.error?.message || 'Failed to save grade');
            }
        });
    }
}
