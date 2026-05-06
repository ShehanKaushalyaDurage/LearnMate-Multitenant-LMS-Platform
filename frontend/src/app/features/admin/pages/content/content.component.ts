import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContentAdminService, type ContentItem, type ContentType } from '../../services/content-admin.service';
import { CoursesAdminService, type CourseRow } from '../../services/courses-admin.service';

const TYPE_CONFIG: Record<string, { icon: string; bg: string; color: string; label: string }> = {
  VIDEO: { icon: 'play_circle', bg: '#FEF2F2', color: '#DC2626', label: 'Video' },
  PDF: { icon: 'picture_as_pdf', bg: '#FFF7ED', color: '#C2410C', label: 'PDF' },
  DOCUMENT: { icon: 'description', bg: '#F1F5F9', color: '#475569', label: 'Document' },
  LINK: { icon: 'link', bg: '#EFF6FF', color: '#1E40AF', label: 'Link' },
};

@Component({
  selector: 'app-admin-content',
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
          <h1 class="page-title">Content</h1>
          <p class="page-sub">Manage course resources — videos, PDFs, and links</p>
        </div>
        @if (selectedCourse()) {
          <button mat-flat-button color="primary" (click)="toggleForm()">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'Add Content' }}
          </button>
        }
      </div>

      <!-- Course Selector -->
      <div class="selector-bar">
        <mat-form-field appearance="outline">
          <mat-label>Select Course</mat-label>
          <mat-select [value]="selectedCourse()" (selectionChange)="onCourseChange($event.value)">
            <mat-option value="">— Choose course —</mat-option>
            @for (c of courses(); track c.id) {
              <mat-option [value]="c.id">{{ c.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (selectedCourse()) {
          <mat-form-field appearance="outline" class="type-filter">
            <mat-label>Type</mat-label>
            <mat-select [value]="typeFilter()" (selectionChange)="onTypeFilter($event.value)">
              <mat-option value="">All Types</mat-option>
              <mat-option value="VIDEO">Video</mat-option>
              <mat-option value="PDF">PDF</mat-option>
              <mat-option value="DOCUMENT">Document</mat-option>
              <mat-option value="LINK">Link</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </div>

      <!-- Add/Edit content form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">{{ editMode() ? 'Edit' : 'Add' }} Content Item</h3>
          <form [formGroup]="contentForm" (ngSubmit)="save()" class="content-grid">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Introduction to Algebra" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                @for (t of contentTypes; track t.value) {
                  <mat-option [value]="t.value">{{ t.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Visibility</mat-label>
              <mat-select formControlName="isVisible">
                <mat-option [value]="true">Visible</mat-option>
                <mat-option [value]="false">Hidden</mat-option>
              </mat-select>
            </mat-form-field>

            @if (contentForm.get('type')?.value === 'VIDEO') {
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Bunny.net Video ID</mat-label>
                <input matInput formControlName="bunnyVideoId" placeholder="e.g. 1a2b3c4d-5e6f..." />
              </mat-form-field>
            } @else {
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>URL / Link</mat-label>
                <input matInput formControlName="url" placeholder="https://..." />
              </mat-form-field>
            }

            <mat-form-field appearance="outline">
              <mat-label>Order Index</mat-label>
              <input matInput formControlName="orderIndex" type="number" placeholder="0" />
            </mat-form-field>

            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="contentForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                {{ editMode() ? 'Update' : 'Add' }} Content
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Content list -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!selectedCourse()) {
        <div class="empty-state">
          <mat-icon>video_library</mat-icon>
          <p>Select a course to manage its content</p>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>add_circle_outline</mat-icon>
          <p>No content yet. Click "Add Content" to get started.</p>
        </div>
      } @else {
        <div class="content-list">
          @for (item of items(); track item.id; let i = $index) {
            <div class="content-card" [class.hidden-item]="!item.isVisible">
              <div class="order-badge">{{ item.orderIndex }}</div>
              <div class="type-icon" [style.background]="typeCfg(item.type).bg"
                   [style.color]="typeCfg(item.type).color">
                <mat-icon>{{ typeCfg(item.type).icon }}</mat-icon>
              </div>
              <div class="item-body">
                <div class="item-title">{{ item.title }}</div>
                @if (item.type === 'VIDEO') {
                    <span class="vod-tag">VOD ID: {{ item.bunnyVideoId || 'Missing' }}</span>
                } @else {
                    <span class="item-url">{{ item.url }}</span>
                }
              </div>
              <div class="item-meta">
                <span class="type-tag">{{ typeCfg(item.type).label }}</span>
                <span class="vis-indicator" [class.visible]="item.isVisible">
                   {{ item.isVisible ? 'Visible' : 'Hidden' }}
                </span>
              </div>
              <div class="item-actions">
                <button mat-icon-button (click)="editItem(item)" matTooltip="Edit">
                  <mat-icon style="color:#6366F1">edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Delete" (click)="deleteItem(item)">
                  <mat-icon style="color:#DC2626">delete_outline</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; padding: 24px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .selector-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .selector-bar mat-form-field { width: 280px; }
    .type-filter { width: 160px !important; }

    .create-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .content-list { display: flex; flex-direction: column; gap: 8px; }
    .content-card {
      background: white; border-radius: 10px; border: 1px solid #E2E8F0;
      padding: 14px 16px; display: flex; align-items: center; gap: 14px;
      transition: box-shadow 0.15s;
    }
    .content-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
    .content-card.hidden-item { opacity: 0.6; background: #F8FAFC; border-style: dashed; }

    .order-badge {
      width: 28px; height: 28px; border-radius: 50%; background: #F1F5F9;
      color: #64748B; font-size: 0.75rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .type-icon {
      width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .type-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .item-body { flex: 1; min-width: 0; }
    .item-title { font-size: 0.9rem; font-weight: 600; color: #0F172A; }
    .item-url, .vod-tag { font-size: 0.75rem; color: #64748B; display: block; margin-top: 2px; }
    .vod-tag { color: #7C3AED; font-weight: 600; }

    .item-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .type-tag { font-size: 0.7rem; color: #94A3B8; font-weight: 600; text-transform: uppercase; }
    .vis-indicator { font-size: 0.7rem; font-weight: 700; color: #64748B; border: 1px solid #E2E8F0; padding: 1px 6px; border-radius: 4px; }
    .vis-indicator.visible { color: #059669; border-color: #BBF7D0; background: #F0FDF4; }

    .item-actions { display: flex; gap: 0; flex-shrink: 0; }
  `],
})
export class AdminContentComponent implements OnInit {
  private readonly svc = inject(ContentAdminService);
  private readonly coursesSvc = inject(CoursesAdminService);
  private readonly fb = inject(FormBuilder);

  readonly contentTypes = [
    { value: 'VIDEO', label: 'Video (VOD)' },
    { value: 'PDF', label: 'PDF Library' },
    { value: 'DOCUMENT', label: 'Document' },
    { value: 'LINK', label: 'External Link' },
  ];

  readonly courses = signal<CourseRow[]>([]);
  readonly items = signal<ContentItem[]>([]);
  readonly loading = signal(false);
  readonly selectedCourse = signal('');
  readonly typeFilter = signal('');
  readonly showForm = signal(false);
  readonly editMode = signal(false);
  readonly selectedItemId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly contentForm = this.fb.group({
    title: ['', Validators.required],
    type: ['VIDEO', Validators.required],
    isVisible: [true],
    url: [''],
    bunnyVideoId: [''],
    orderIndex: [0],
  });

  ngOnInit() {
    this.coursesSvc.getCourses(1, 100).subscribe({ next: (r) => this.courses.set(r.data.data) });
  }

  onCourseChange(id: string) {
    this.selectedCourse.set(id);
    this.typeFilter.set('');
    if (!id) { this.items.set([]); return; }
    this.load();
  }

  onTypeFilter(t: string) { this.typeFilter.set(t); this.load(); }

  load() {
    if (!this.selectedCourse()) return;
    this.loading.set(true);
    this.svc.getContent(
      this.selectedCourse(), 1, 100,
      (this.typeFilter() as ContentType) || undefined,
    ).subscribe({
      next: (r) => { this.items.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  typeCfg(type: string) { return TYPE_CONFIG[type] ?? TYPE_CONFIG['LINK']; }

  toggleForm() {
    if (this.showForm()) {
      this.showForm.set(false);
      this.editMode.set(false);
      this.selectedItemId.set(null);
      this.contentForm.reset({ type: 'VIDEO', isVisible: true, orderIndex: 0 });
    } else {
      this.showForm.set(true);
    }
  }

  editItem(item: ContentItem) {
    this.editMode.set(true);
    this.selectedItemId.set(item.id);
    this.contentForm.patchValue({
      title: item.title,
      type: item.type,
      isVisible: item.isVisible,
      url: item.url || '',
      bunnyVideoId: item.bunnyVideoId || '',
      orderIndex: item.orderIndex
    });
    this.showForm.set(true);
  }

  save() {
    if (this.contentForm.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.contentForm.value;
    const payload = {
      courseId: this.selectedCourse(),
      title: v.title!,
      type: v.type as ContentType,
      isVisible: !!v.isVisible,
      url: v.type !== 'VIDEO' ? v.url! : undefined,
      bunnyVideoId: v.type === 'VIDEO' ? v.bunnyVideoId! : undefined,
      orderIndex: v.orderIndex ?? 0,
    };

    const obs = this.editMode()
      ? this.svc.updateContent(this.selectedItemId()!, payload)
      : this.svc.createContent(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.toggleForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Failed to save content');
      },
    });
  }

  deleteItem(item: ContentItem) {
    if (!confirm('Are you sure you want to delete this content item?')) return;
    this.svc.deleteContent(item.id).subscribe({ next: () => this.load() });
  }
}
