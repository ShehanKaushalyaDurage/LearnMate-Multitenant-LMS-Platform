import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AssignmentsService, type Assignment, type Submission } from '../../../admin/services/assignments.service';

@Component({
    selector: 'app-student-assignment-detail',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        MatButtonModule, MatIconModule, MatProgressSpinnerModule,
        MatFormFieldModule, MatInputModule
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <button mat-icon-button routerLink="/student/assignments">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="page-title">{{ assignment()?.title || 'Loading...' }}</h1>
          <p class="page-sub">{{ assignment()?.batch?.name }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (assignment()) {
        <div class="content-grid">
          <!-- Details -->
          <div class="details-panel">
            <h2 class="section-title">Instructions</h2>
            <p class="description">{{ assignment()?.description || 'No instructions provided.' }}</p>

            <div class="info-strip">
              <div class="info-item">
                <mat-icon>event</mat-icon>
                <span>Due: {{ assignment()?.dueDate | date:'medium' }}</span>
              </div>
              <div class="info-item">
                <mat-icon>grade</mat-icon>
                <span>Max Marks: {{ assignment()?.maxMarks }}</span>
              </div>
            </div>
          </div>

          <!-- Submission -->
          <div class="submission-panel">
            <h2 class="section-title">Your Submission</h2>
            
            @if (mySubmission()) {
                <div class="submission-card">
                    <div class="sub-header">
                        <mat-icon class="done">check_circle</mat-icon>
                        <div>
                            <div class="status">Submitted</div>
                            <div class="date">{{ mySubmission()?.submittedAt | date:'medium' }}</div>
                        </div>
                    </div>
                    
                    @if (mySubmission()?.fileUrl) {
                        <div class="file-link">
                            <mat-icon>attachment</mat-icon>
                            <a [href]="mySubmission()?.fileUrl" target="_blank">{{ fileName() }}</a>
                        </div>
                    }

                    <!-- Grade Section -->
                    @if (mySubmission()?.marks !== null && mySubmission()?.marks !== undefined) {
                        <div class="grade-box">
                            <div class="grade-label">Grade</div>
                            <div class="grade-value">{{ mySubmission()?.marks }} / {{ assignment()?.maxMarks }}</div>
                            @if (mySubmission()?.feedback) {
                                <div class="feedback">
                                    <strong>Feedback:</strong> {{ mySubmission()?.feedback }}
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="pending-grade">Waiting for grading...</div>
                    }
                </div>
            } @else {
                <div class="submit-form">
                    <p class="hint">Enter the URL of your submission (e.g. Google Drive, GitHub, or Dropbox link)</p>
                    <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Submission Link</mat-label>
                        <input matInput [(ngModel)]="submissionUrl" placeholder="https://..." />
                        <mat-icon matPrefix>link</mat-icon>
                    </mat-form-field>
                    
                    <button mat-flat-button color="primary" class="w-full" 
                            [disabled]="!submissionUrl || submitting()"
                            (click)="submit()">
                        @if (submitting()) { <mat-spinner diameter="18"></mat-spinner> }
                        Submit Assignment
                    </button>
                    <p class="warning-txt">Note: You cannot edit your submission once sent.</p>
                </div>
            }
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1000px; padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }

    .content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } }

    .section-title { font-size: 1rem; font-weight: 700; color: #1E293B; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .details-panel { background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; }
    .description { color: #475569; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px; }
    .info-strip { display: flex; gap: 24px; border-top: 1px solid #F1F5F9; padding-top: 20px; }
    .info-item { display: flex; align-items: center; gap: 8px; color: #64748B; font-size: 0.875rem; font-weight: 500; }
    .info-item mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .submission-panel { background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; height: fit-content; }
    .submission-card { display: flex; flex-direction: column; gap: 16px; }
    .sub-header { display: flex; align-items: center; gap: 12px; }
    .sub-header .done { color: #059669; font-size: 32px; width: 32px; height: 32px; }
    .status { font-weight: 700; color: #0F172A; }
    .date { font-size: 0.75rem; color: #64748B; }

    .file-link { display: flex; align-items: center; gap: 8px; background: #F8FAFC; padding: 10px; border-radius: 8px; font-size: 0.875rem; }
    .file-link a { color: #6366F1; text-decoration: none; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .grade-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-top: 8px; }
    .grade-label { font-size: 0.75rem; color: #166534; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .grade-value { font-size: 1.25rem; font-weight: 800; color: #0F172A; }
    .feedback { margin-top: 12px; font-size: 0.875rem; color: #166534; line-height: 1.5; }
    .pending-grade { text-align: center; color: #94A3B8; font-style: italic; font-size: 0.875rem; padding: 12px; }

    .submit-form { display: flex; flex-direction: column; gap: 16px; }
    .hint { font-size: 0.85rem; color: #64748B; line-height: 1.5; }
    .w-full { width: 100%; }
    .warning-txt { font-size: 0.75rem; color: #94A3B8; text-align: center; font-style: italic; }

    .loading-center { display: flex; justify-content: center; padding: 100px; }
  `],
})
export class StudentAssignmentDetailComponent implements OnInit {
    private readonly svc = inject(AssignmentsService);
    private readonly route = inject(ActivatedRoute);

    readonly assignment = signal<Assignment | null>(null);
    readonly mySubmission = signal<Submission | null>(null);
    readonly loading = signal(true);
    readonly submitting = signal(false);
    submissionUrl = '';

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.load(id);
    }

    load(id: string) {
        this.svc.getAssignmentById(id).subscribe({
            next: (res) => {
                this.assignment.set(res.data);
                // In this architecture, getByID for student likely returns their submission in the list if it exists
                // Filter student's own submission from the array
                const subs = (res.data as any).submissions || [];
                if (subs.length > 0) this.mySubmission.set(subs[0]);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    submit() {
        if (!this.submissionUrl) return;
        this.submitting.set(true);
        this.svc.submit(this.assignment()!.id, this.submissionUrl).subscribe({
            next: (r) => {
                this.mySubmission.set(r.data);
                this.submitting.set(false);
            },
            error: (e) => {
                alert(e?.error?.message || 'Failed to submit');
                this.submitting.set(false);
            }
        });
    }

    fileName(): string {
        const url = this.mySubmission()?.fileUrl || '';
        try {
            const parts = url.split('/');
            return parts[parts.length - 1] || 'Submission Link';
        } catch { return 'Submission Link'; }
    }
}
