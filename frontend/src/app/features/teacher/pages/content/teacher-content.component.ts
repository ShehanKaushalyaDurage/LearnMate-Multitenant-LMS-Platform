import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

interface ContentItem {
    id: string;
    title: string;
    type: string;
    url: string;
    courseId: string;
    isVisible: boolean;
    createdAt: string;
}

@Component({
    selector: 'app-teacher-content',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Content</h1>
          <p class="page-sub">Upload YouTube video links for your classes</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'Add Content' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="form-panel">
          <h3 class="panel-title">Add YouTube Video</h3>
          <form [formGroup]="form" (ngSubmit)="addContent()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Lesson 1 – Introduction" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>YouTube URL</mat-label>
              <input matInput formControlName="url" placeholder="https://youtube.com/watch?v=..." />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Class</mat-label>
              <mat-select formControlName="courseId">
                @for (c of courses(); track c.id) {
                  <mat-option [value]="c.id">{{ c.title }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="err">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Add Video
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="content-grid">
          @for (item of items(); track item.id) {
            <div class="content-card">
              <div class="cc-icon">
                <mat-icon>{{ item.type === 'YOUTUBE' ? 'smart_display' : 'play_circle' }}</mat-icon>
              </div>
              <div class="cc-info">
                <h4>{{ item.title }}</h4>
                <span class="cc-type">{{ item.type }}</span>
              </div>
            </div>
          }
          @if (items().length === 0) {
            <div class="empty">
              <mat-icon>play_circle</mat-icon>
              <p>No content yet. Add your first YouTube video!</p>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1000px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .form-panel { background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px; margin-bottom: 20px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-actions { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .err { color: #DC2626; font-size: 0.875rem; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .content-card { display: flex; align-items: center; gap: 12px; background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; transition: box-shadow 0.15s; }
    .content-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .cc-icon { width: 44px; height: 44px; border-radius: 10px; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; }
    .cc-info h4 { margin: 0; font-size: 0.9rem; font-weight: 600; color: #0F172A; }
    .cc-type { font-size: 0.72rem; color: #94A3B8; text-transform: uppercase; font-weight: 600; }
  `],
})
export class TeacherContentComponent implements OnInit {
    private readonly api = inject(ApiService);
    private readonly fb = inject(FormBuilder);

    readonly items = signal<ContentItem[]>([]);
    readonly courses = signal<{ id: string; title: string }[]>([]);
    readonly loading = signal(true);
    readonly showForm = signal(false);
    readonly saving = signal(false);
    readonly formError = signal('');

    readonly form = this.fb.group({
        title: ['', Validators.required],
        url: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
        courseId: ['', Validators.required],
    });

    ngOnInit() {
        this.loadCourses();
    }

    loadCourses() {
        this.api.get<any>('/tenant/courses', { limit: '100' }).subscribe({
            next: (r) => {
                this.courses.set(r.data ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    addContent() {
        if (this.form.invalid) return;
        this.saving.set(true);
        this.formError.set('');
        const body = {
            ...this.form.value,
            type: 'YOUTUBE',
        };
        this.api.post(`/tenant/content/${this.form.value.courseId}`, body).subscribe({
            next: () => { this.saving.set(false); this.showForm.set(false); this.form.reset(); },
            error: (e) => { this.saving.set(false); this.formError.set(e?.error?.message ?? 'Failed'); },
        });
    }
}
