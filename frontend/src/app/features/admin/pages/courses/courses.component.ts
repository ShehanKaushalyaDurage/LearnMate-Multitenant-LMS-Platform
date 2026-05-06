import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CoursesAdminService, type CourseRow } from '../../services/courses-admin.service';
import { ApiService } from '../../../../core/services/api.service';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Sinhala', 'History', 'Geography', 'ICT', 'Commerce', 'Biology', 'Physics', 'Chemistry', 'Other'];
const GRADE_LEVELS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'A/L', 'Other'];

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Classes</h1>
          <p class="page-sub">Manage your institute's classes</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'New Class' }}
        </button>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">Create New Class</h3>
          <form [formGroup]="courseForm" (ngSubmit)="createCourse()" class="course-grid">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Class Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Grade 10 Mathematics" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Subject</mat-label>
              <mat-select formControlName="subject">
                @for (s of subjects; track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Grade Level</mat-label>
              <mat-select formControlName="grade">
                <mat-option value="O/L">O/L</mat-option>
                <mat-option value="A/L">A/L</mat-option>
                <mat-option value="Courses">Courses</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Teacher</mat-label>
              <mat-select formControlName="teacherId">
                @for (t of teachers(); track t.id) {
                  <mat-option [value]="t.id">{{ t.firstName }} {{ t.lastName }} ({{ t.subject ?? 'N/A' }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Class Location</mat-label>
              <mat-select formControlName="classLocation">
                <mat-option value="Online">Online</mat-option>
                <mat-option value="Physical">Physical</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Description (optional)</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="courseForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Create Class
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Course cards grid -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (courses().length === 0) {
        <div class="empty-state">
          <mat-icon>menu_book</mat-icon>
          <p>No classes yet. Create your first class!</p>
        </div>
      } @else {
        <div class="courses-grid">
          @for (c of courses(); track c.id) {
            <div class="course-card">
              <div class="course-accent" [attr.data-subject]="c.subject"></div>
              <div class="course-body">
                <div class="course-header">
                  <span class="subject-tag">{{ c.subject }}</span>
                  <span class="status-dot" [attr.data-status]="c.status">{{ c.status }}</span>
                </div>
                <h3 class="course-title">{{ c.title }}</h3>
                @if (c.gradeLevel) {
                  <p class="course-grade">{{ c.gradeLevel }}</p>
                }
                @if (c.teacher) {
                  <div class="course-teacher">
                    <mat-icon>person</mat-icon>
                    {{ c.teacher.firstName }} {{ c.teacher.lastName }}
                  </div>
                }
                <div class="course-stats">
                  <div class="stat-item">
                    <mat-icon>groups</mat-icon>
                    <span>{{ c._count?.batches ?? 0 }} batches</span>
                  </div>
                  <div class="stat-item">
                    <mat-icon>school</mat-icon>
                    <span>{{ c._count?.enrollments ?? 0 }} students</span>
                  </div>
                </div>
              </div>
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
    .course-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 1rem; }

    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

    .course-card {
      background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .course-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }

    .course-accent { height: 4px; background: linear-gradient(90deg, #1E40AF, #7C3AED); }

    .course-body { padding: 16px; }
    .course-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .subject-tag { font-size: 0.75rem; font-weight: 600; color: #1E40AF; background: #EFF6FF; padding: 3px 10px; border-radius: 12px; }
    .status-dot { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
    [data-status="ACTIVE"]   { background: #ECFDF5; color: #059669; }
    [data-status="INACTIVE"] { background: #F1F5F9; color: #64748B; }

    .course-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; line-height: 1.3; }
    .course-grade { font-size: 0.8rem; color: #64748B; margin: 0 0 8px; }
    .course-teacher { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748B; margin-bottom: 12px; }
    .course-teacher mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .course-stats { display: flex; gap: 16px; border-top: 1px solid #F1F5F9; padding-top: 12px; }
    .stat-item { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748B; }
    .stat-item mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }

    @media (max-width: 640px) { .course-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminCoursesComponent implements OnInit {
  private readonly svc = inject(CoursesAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly subjects = SUBJECTS;
  readonly gradeLevels = GRADE_LEVELS;
  readonly teachers = signal<{ id: string; firstName: string; lastName: string; subject?: string }[]>([]);

  readonly courses = signal<CourseRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly courseForm = this.fb.group({
    title: ['', Validators.required],
    subject: ['', Validators.required],
    grade: [''],
    teacherId: [''],
    classLocation: [''],
    description: [''],
  });

  ngOnInit() {
    this.load();
    this.loadTeachers();
  }

  loadTeachers() {
    this.api.get<any>('/tenant/users/teachers-list').subscribe({
      next: (r) => this.teachers.set(r.data ?? []),
    });
  }

  load() {
    this.loading.set(true);
    this.svc.getCourses(this.page()).subscribe({
      next: (res) => {
        this.courses.set(res.data.data);
        this.totalPages.set(res.data.meta.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number) { this.page.set(p); this.load(); }

  createCourse() {
    if (this.courseForm.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.courseForm.value;
    this.svc.createCourse({
      title: v.title!,
      subject: v.subject!,
      grade: v.grade || undefined,
      teacherId: v.teacherId || undefined,
      classLocation: v.classLocation || undefined,
      description: v.description || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.courseForm.reset();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Failed to create class');
      },
    });
  }
}
