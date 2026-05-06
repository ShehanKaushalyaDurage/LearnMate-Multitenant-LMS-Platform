import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnnouncementsAdminService, type AnnouncementRow } from '../../services/announcements-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';

const TARGET_TYPES = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'ROLE', label: 'By Role' },
  { value: 'COURSE', label: 'By Course' },
  { value: 'BATCH', label: 'By Batch' },
];

@Component({
  selector: 'app-admin-announcements',
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
          <h1 class="page-title">Announcements</h1>
          <p class="page-sub">Broadcast messages to your institute</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'campaign' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'New Announcement' }}
        </button>
      </div>

      <!-- Compose form -->
      @if (showForm()) {
        <div class="compose-panel">
          <h3 class="panel-title">New Announcement</h3>
          <form [formGroup]="form" (ngSubmit)="create()" class="compose-grid">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. School Closed Tomorrow" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Message</mat-label>
              <textarea matInput formControlName="body" rows="4"
                        placeholder="Write your announcement here..."></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Send To</mat-label>
              <mat-select formControlName="targetType">
                @for (t of targetTypes; track t.value) {
                  <mat-option [value]="t.value">{{ t.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (form.get('targetType')?.value === 'ROLE') {
              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="targetId">
                  <mat-option value="STUDENT">Student</mat-option>
                  <mat-option value="TEACHER">Teacher</mat-option>
                  <mat-option value="ADMIN">Admin</mat-option>
                </mat-select>
              </mat-form-field>
            } @else if (form.get('targetType')?.value === 'BATCH') {
              <mat-form-field appearance="outline">
                <mat-label>Select Batch</mat-label>
                <mat-select formControlName="targetId">
                  @for (b of batches(); track b.id) {
                    <mat-option [value]="b.id">{{ b.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            } @else if (form.get('targetType')?.value === 'COURSE') {
               <mat-form-field appearance="outline">
                 <mat-label>Course ID (UUID)</mat-label>
                 <input matInput formControlName="targetId" placeholder="Course UUID" />
               </mat-form-field>
            }

            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Post Announcement
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Feed -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (announcements().length === 0) {
        <div class="empty-state">
          <mat-icon>campaign</mat-icon>
          <p>No announcements yet. Post your first one!</p>
        </div>
      } @else {
        <div class="feed">
          @for (a of announcements(); track a.id) {
            <div class="announcement-card">
              <div class="card-top">
                <div class="card-meta">
                  <span class="target-badge" [attr.data-target]="a.targetType">
                    {{ targetLabel(a.targetType) }} {{ a.batch ? '(' + a.batch.name + ')' : '' }}
                  </span>
                  <span class="card-date">{{ a.createdAt | date:'mediumDate' }}</span>
                  <div class="spacer"></div>
                  <button mat-icon-button color="warn" class="delete-btn" (click)="deleteAnn(a.id)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
                <h3 class="card-title">{{ a.title }}</h3>
              </div>
              <p class="card-body">{{ a.body }}</p>
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
    .page { max-width: 900px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .compose-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .compose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 1rem; }

    .feed { display: flex; flex-direction: column; gap: 12px; }

    .announcement-card {
      background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px;
      border-left: 4px solid #1E40AF; transition: box-shadow 0.15s;
    }
    .announcement-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }

    .card-top { margin-bottom: 12px; }
    .card-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .spacer { flex: 1; }
    .delete-btn { opacity: 0; transition: opacity 0.2s; }
    .announcement-card:hover .delete-btn { opacity: 1; }

    .card-date { font-size: 0.75rem; color: #94A3B8; }
    .card-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .card-body { font-size: 0.9rem; color: #475569; margin: 0; line-height: 1.6; }

    .target-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    [data-target="ALL"]    { background: #F5F3FF; color: #7C3AED; }
    [data-target="BATCH"]  { background: #EFF6FF; color: #1E40AF; }
    [data-target="COURSE"] { background: #ECFDF5; color: #059669; }
    [data-target="ROLE"]   { background: #FFF7ED; color: #C2410C; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }
  `],
})
export class AdminAnnouncementsComponent implements OnInit {
  private readonly svc = inject(AnnouncementsAdminService);
  private readonly batchSvc = inject(BatchesAdminService);
  private readonly fb = inject(FormBuilder);

  readonly targetTypes = TARGET_TYPES;
  readonly announcements = signal<AnnouncementRow[]>([]);
  readonly batches = signal<BatchRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly form = this.fb.group({
    title: ['', Validators.required],
    body: ['', Validators.required],
    targetType: ['ALL', Validators.required],
    targetId: [''],
  });

  ngOnInit() {
    this.load();
    this.loadBatches();
  }

  loadBatches() {
    this.batchSvc.getBatches(1, 100).subscribe({
      next: (res) => this.batches.set(res.data.data),
    });
  }

  load() {
    this.loading.set(true);
    this.svc.getAnnouncements(this.page()).subscribe({
      next: (res) => {
        this.announcements.set(res.data.data);
        this.totalPages.set(res.data.meta.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number) { this.page.set(p); this.load(); }

  targetLabel(t: string): string {
    return TARGET_TYPES.find((x) => x.value === t)?.label ?? t;
  }

  create() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    this.svc.createAnnouncement({
      title: v.title!, body: v.body!,
      targetType: v.targetType as any,
      targetId: v.targetId || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset({ targetType: 'ALL' });
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Failed to post announcement');
      },
    });
  }

  deleteAnn(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    this.svc.deleteAnnouncement(id).subscribe({
      next: () => this.load(),
    });
  }
}
