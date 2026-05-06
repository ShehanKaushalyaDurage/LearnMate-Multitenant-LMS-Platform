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
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';
import { CoursesAdminService, type CourseRow } from '../../services/courses-admin.service';

@Component({
    selector: 'app-admin-batches',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatTableModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Batches</h1>
          <p class="page-sub">Manage class batches across your courses</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'New Batch' }}
        </button>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">Create New Batch</h3>
          <form [formGroup]="batchForm" (ngSubmit)="createBatch()" class="batch-grid">
            <mat-form-field appearance="outline">
              <mat-label>Batch Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Batch 2025 A" />
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
              <mat-label>Max Students</mat-label>
              <input matInput formControlName="maxStudents" type="number" placeholder="30" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Start Date (optional)</mat-label>
              <input matInput formControlName="startDate" type="date" />
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="batchForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Create Batch
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="batches()" class="batches-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Batch</th>
              <td mat-cell *matCellDef="let b">
                <div class="batch-name">{{ b.name }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="course">
              <th mat-header-cell *matHeaderCellDef>Course</th>
              <td mat-cell *matCellDef="let b">
                <span class="course-tag">{{ b.course?.title ?? '—' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="teacher">
              <th mat-header-cell *matHeaderCellDef>Teacher</th>
              <td mat-cell *matCellDef="let b">
                @if (b.teacher) {
                  {{ b.teacher.firstName }} {{ b.teacher.lastName }}
                } @else {
                  <span class="muted">Unassigned</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>Capacity</th>
              <td mat-cell *matCellDef="let b">
                <div class="capacity-bar-wrap">
                  <span class="capacity-text">{{ b._count?.enrollments ?? 0 }} / {{ b.maxStudents }}</span>
                  <div class="capacity-bar">
                    <div class="capacity-fill"
                         [style.width.%]="getCapacity(b)"></div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let b">
                <span class="status-chip" [attr.data-status]="b.status">{{ b.status }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (batches().length === 0) {
            <div class="empty-table">
              <mat-icon>groups</mat-icon>
              <p>No batches yet</p>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button mat-icon-button [disabled]="page() === 1" (click)="changePage(page() - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span>Page {{ page() }} of {{ totalPages() }}</span>
            <button mat-icon-button [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">
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
    .batch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .table-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .batches-table { width: 100%; }
    .table-row:hover { background: #F8FAFC; }

    .batch-name { font-weight: 600; color: #0F172A; font-size: 0.875rem; }
    .course-tag { font-size: 0.75rem; background: #EFF6FF; color: #1E40AF; padding: 3px 10px; border-radius: 12px; font-weight: 600; }
    .muted { color: #94A3B8; font-size: 0.875rem; }

    .capacity-bar-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
    .capacity-text { font-size: 0.75rem; color: #64748B; }
    .capacity-bar { height: 6px; background: #F1F5F9; border-radius: 3px; overflow: hidden; }
    .capacity-fill { height: 100%; background: linear-gradient(90deg, #1E40AF, #7C3AED); border-radius: 3px; transition: width 0.3s; }

    .status-chip { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    [data-status="ACTIVE"]   { background: #ECFDF5; color: #059669; }
    [data-status="INACTIVE"] { background: #F1F5F9; color: #64748B; }

    .empty-table { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #CBD5E1; }
    .empty-table mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-table p { margin: 0; font-size: 0.875rem; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }
  `],
})
export class AdminBatchesComponent implements OnInit {
    private readonly svc = inject(BatchesAdminService);
    private readonly coursesSvc = inject(CoursesAdminService);
    private readonly fb = inject(FormBuilder);

    readonly batches = signal<BatchRow[]>([]);
    readonly courses = signal<CourseRow[]>([]);
    readonly loading = signal(true);
    readonly page = signal(1);
    readonly totalPages = signal(1);
    readonly showForm = signal(false);
    readonly saving = signal(false);
    readonly formError = signal('');

    readonly displayedColumns = ['name', 'course', 'teacher', 'capacity', 'status'];

    readonly batchForm = this.fb.group({
        name: ['', Validators.required],
        courseId: ['', Validators.required],
        maxStudents: [30],
        startDate: [''],
    });

    ngOnInit() {
        this.load();
        // Load courses for the dropdown
        this.coursesSvc.getCourses(1, 100).subscribe({
            next: (res) => this.courses.set(res.data.data),
        });
    }

    load() {
        this.loading.set(true);
        this.svc.getBatches(this.page()).subscribe({
            next: (res) => {
                this.batches.set(res.data.data);
                this.totalPages.set(res.data.meta.totalPages ?? 1);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    changePage(p: number) { this.page.set(p); this.load(); }

    getCapacity(b: BatchRow): number {
        if (!b.maxStudents) return 0;
        return Math.min(100, Math.round(((b._count?.enrollments ?? 0) / b.maxStudents) * 100));
    }

    createBatch() {
        if (this.batchForm.invalid) return;
        this.saving.set(true);
        this.formError.set('');
        const v = this.batchForm.value;
        this.svc.createBatch({
            name: v.name!, courseId: v.courseId!,
            maxStudents: v.maxStudents ?? undefined,
            startDate: v.startDate || undefined,
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.showForm.set(false);
                this.batchForm.reset({ maxStudents: 30 });
                this.load();
            },
            error: (err) => {
                this.saving.set(false);
                this.formError.set(err?.error?.message ?? 'Failed to create batch');
            },
        });
    }
}
