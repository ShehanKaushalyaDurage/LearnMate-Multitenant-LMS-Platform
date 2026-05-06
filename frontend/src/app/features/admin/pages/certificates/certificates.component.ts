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
import { CertificatesAdminService, type CertificateRow } from '../../services/certificates-admin.service';
import { CoursesAdminService, type CourseRow } from '../../services/courses-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-certificates',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Certificates</h1>
          <p class="page-sub">Issue and track completion certificates</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'workspace_premium' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'Issue Certificate' }}
        </button>
      </div>

      <!-- Issue form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">Issue New Certificate</h3>
          <form [formGroup]="form" (ngSubmit)="issue()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Student ID</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="studentId" placeholder="Student UUID" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Course</mat-label>
              <mat-select formControlName="courseId">
                @for (c of courses(); track c.id) {
                  <mat-option [value]="c.id">{{ c.title }}</mat-option>
                }
              </mat-select>
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
              <mat-label>Notes (optional)</mat-label>
              <input matInput formControlName="notes" placeholder="e.g. Completed with distinction" />
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Issue Certificate
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Course filter -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="course-filter">
          <mat-label>Filter by Course</mat-label>
          <mat-select [value]="courseFilter()" (selectionChange)="onCourseFilter($event.value)">
            <mat-option value="">All Courses</mat-option>
            @for (c of courses(); track c.id) {
              <mat-option [value]="c.id">{{ c.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <!-- Summary stat -->
        <div class="cert-summary">
          <div class="cert-stat">
            <mat-icon>workspace_premium</mat-icon>
            <div>
              <div class="stat-num">{{ certs().length }}</div>
              <div class="stat-lbl">Certificates Issued</div>
            </div>
          </div>
        </div>

        <div class="table-card">
          <table mat-table [dataSource]="certs()" class="certs-table">

            <ng-container matColumnDef="student">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let c">
                @if (c.student) {
                  <div class="user-cell">
                    <div class="avatar-sm">{{ (c.student.firstName[0] + c.student.lastName[0]).toUpperCase() }}</div>
                    <div>
                      <div class="cell-name">{{ c.student.firstName }} {{ c.student.lastName }}</div>
                      <div class="cell-email">{{ c.student.email }}</div>
                    </div>
                  </div>
                } @else {
                  <span class="muted">{{ c.studentId.slice(0,8) }}…</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="course">
              <th mat-header-cell *matHeaderCellDef>Course</th>
              <td mat-cell *matCellDef="let c">
                <span class="course-tag">{{ c.course?.title ?? '—' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="batch">
              <th mat-header-cell *matHeaderCellDef>Batch</th>
              <td mat-cell *matCellDef="let c">
                {{ c.batch?.name ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="issuedAt">
              <th mat-header-cell *matHeaderCellDef>Issued</th>
              <td mat-cell *matCellDef="let c">{{ c.issuedAt | date:'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                @if (c.certificateUrl) {
                  <a mat-icon-button [href]="c.certificateUrl" target="_blank"
                     matTooltip="Download Certificate">
                    <mat-icon style="color:#1E40AF">download</mat-icon>
                  </a>
                }
                <button mat-icon-button color="primary" matTooltip="Preview Certificate"
                        (click)="preview(c)">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (certs().length === 0) {
            <div class="empty-table">
              <mat-icon>workspace_premium</mat-icon>
              <p>No certificates issued yet</p>
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
    .page { max-width: 1100px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .create-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .filters-row { margin-bottom: 16px; }
    .course-filter { width: 280px; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .cert-summary { margin-bottom: 16px; }
    .cert-stat {
      display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #1E40AF, #7C3AED);
      color: white; padding: 14px 24px; border-radius: 12px;
    }
    .cert-stat mat-icon { font-size: 28px; width: 28px; height: 28px; opacity: 0.9; }
    .stat-num { font-size: 1.5rem; font-weight: 700; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; opacity: 0.85; }

    .table-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .certs-table { width: 100%; }
    .table-row:hover { background: #F8FAFC; }

    .user-cell { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .avatar-sm { width: 34px; height: 34px; border-radius: 50%; background: #EFF6FF; color: #1E40AF; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cell-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .cell-email { font-size: 0.75rem; color: #64748B; }
    .muted { color: #94A3B8; font-size: 0.875rem; }
    .course-tag { background: #F5F3FF; color: #7C3AED; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }

    .empty-table { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #CBD5E1; }
    .empty-table mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-table p { margin: 0; font-size: 0.875rem; }
    td.mat-column-actions { width: 52px; text-align: right; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }
  `],
})
export class AdminCertificatesComponent implements OnInit {
  private readonly svc = inject(CertificatesAdminService);
  private readonly coursesSvc = inject(CoursesAdminService);
  private readonly batchesSvc = inject(BatchesAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly certs = signal<CertificateRow[]>([]);
  readonly courses = signal<CourseRow[]>([]);
  readonly batches = signal<BatchRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly courseFilter = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly displayedColumns = ['student', 'course', 'batch', 'issuedAt', 'actions'];

  readonly form = this.fb.group({
    studentId: ['', Validators.required],
    courseId: ['', Validators.required],
    batchId: [''],
    notes: [''],
  });

  ngOnInit() {
    this.load();
    this.coursesSvc.getCourses(1, 100).subscribe({ next: (r) => this.courses.set(r.data.data) });
    this.batchesSvc.getBatches(1, 100).subscribe({ next: (r) => this.batches.set(r.data.data) });
  }

  load() {
    this.loading.set(true);
    this.svc.getCertificates(this.page(), 20, this.courseFilter() || undefined).subscribe({
      next: (r) => { this.certs.set(r.data.data); this.totalPages.set(r.data.meta.totalPages ?? 1); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onCourseFilter(v: string) { this.courseFilter.set(v); this.page.set(1); this.load(); }
  changePage(p: number) { this.page.set(p); this.load(); }

  issue() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    this.svc.issueCertificate({
      studentId: v.studentId!, courseId: v.courseId!,
      batchId: v.batchId || undefined,
      notes: v.notes || undefined,
    }).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.form.reset(); this.load(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Failed to issue certificate'); },
    });
  }

  preview(cert: CertificateRow) {
    this.dialog.open(CertificatePreviewDialog, {
      data: cert,
      width: '800px',
      maxWidth: '90vw',
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="cert-modal">
      <div class="cert-container" id="cert-print">
        <div class="cert-border">
          <div class="cert-inner">
            <div class="cert-header">
              <mat-icon class="cert-logo">workspace_premium</mat-icon>
              <h1>Certificate of Completion</h1>
            </div>
            
            <p class="cert-sub">This is to certify that</p>
            <h2 class="student-name">{{ data.student?.firstName }} {{ data.student?.lastName }}</h2>
            
            <p class="cert-text">has successfully completed the course</p>
            <h3 class="course-title">{{ data.course?.title }}</h3>
            
            @if (data.batch) {
              <p class="batch-info">Batch: {{ data.batch.name }}</p>
            }

            <div class="cert-footer">
              <div class="sig-box">
                <div class="sig-line"></div>
                <p>Director, LearnHub</p>
              </div>
              <div class="cert-metadata">
                <p>Issued: {{ data.issuedAt | date:'longDate' }}</p>
                <p class="unique-code">Verify: {{ data.id.slice(0,8).toUpperCase() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button mat-flat-button color="primary" (click)="print()">
          <mat-icon>print</mat-icon> Print / Save PDF
        </button>
      </div>
    </div>
    `,
  styles: [`
    .cert-modal { padding: 20px; background: #F8FAFC; border-radius: 8px; }
    .cert-container { 
        background: white; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        width: 100%; aspect-ratio: 1.414 / 1; overflow: hidden;
    }
    .cert-border { 
        border: 15px double #1E40AF; padding: 10px; height: 100%;
        background: linear-gradient(135deg, #fffcf5 0%, #ffffff 100%);
    }
    .cert-inner { 
        border: 2px solid #1E40AF; height: 100%; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; text-align: center; padding: 40px;
        position: relative;
    }
    .cert-logo { font-size: 64px; width: 64px; height: 64px; color: #D97706; margin-bottom: 20px; }
    h1 { font-family: 'Georgia', serif; font-size: 2.5rem; color: #1E3A8A; margin-bottom: 30px; }
    .cert-sub { font-size: 1.1rem; color: #64748B; margin: 0; }
    .student-name { font-family: 'Brush Script MT', cursive; font-size: 3.5rem; color: #0F172A; margin: 10px 0 30px; }
    .course-title { font-size: 1.75rem; color: #1E40AF; margin: 10px 0; }
    .cert-footer { 
        margin-top: auto; width: 100%; display: flex; justify-content: space-between; 
        align-items: flex-end; padding-top: 40px;
    }
    .sig-line { width: 180px; border-top: 1px solid #0F172A; margin-bottom: 8px; }
    .cert-metadata { text-align: right; font-size: 0.8rem; color: #64748B; }
    .unique-code { font-weight: 700; color: #1E40AF; letter-spacing: 1px; }
    .modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
    @media print {
        body * { visibility: hidden; }
        #cert-print, #cert-print * { visibility: visible; }
        #cert-print { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
    }
    `]
})
class CertificatePreviewDialog {
  readonly data: CertificateRow = inject(MAT_DIALOG_DATA);
  print() { window.print(); }
}
