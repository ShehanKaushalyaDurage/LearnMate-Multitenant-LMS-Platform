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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface AssignmentRow {
  id: string;
  title: string;
  batchId: string;
  batch?: { name: string };
  dueDate?: string;
  maxScore?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  _count?: { submissions: number };
}

interface MyBatch { id: string; name: string; }

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Assignments</h1>
          <p class="page-sub">Manage assignments for your batches</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'New Assignment' }}
        </button>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <div class="create-panel">
          <h3 class="panel-title">New Assignment</h3>
          <form [formGroup]="form" (ngSubmit)="create()" class="form-grid">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Chapter 5 Exercises" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Batch</mat-label>
              <mat-select formControlName="batchId">
                @for (b of batches(); track b.id) {
                  <mat-option [value]="b.id">{{ b.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Due Date</mat-label>
              <input matInput formControlName="dueDate" type="date" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Max Score</mat-label>
              <input matInput formControlName="maxScore" type="number" placeholder="100" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="err">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Create
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Batch filter -->
      <div class="filter-row">
        <mat-form-field appearance="outline" class="batch-f">
          <mat-label>Filter by Batch</mat-label>
          <mat-select [value]="batchFilter()" (selectionChange)="onFilter($event.value)">
            <mat-option value="">All Batches</mat-option>
            @for (b of batches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="cards-grid">
          @for (a of assignments(); track a.id) {
            <div class="asgn-card">
              <div class="card-top">
                <span class="status-chip" [attr.data-s]="a.status">{{ a.status }}</span>
                @if (a.dueDate) {
                  <span class="due" [class.overdue]="isOverdue(a.dueDate)">
                    📅 {{ a.dueDate | date:'mediumDate' }}
                  </span>
                }
              </div>
              <h3 class="asgn-title">{{ a.title }}</h3>
              @if (a.batch) {
                <div class="batch-tag"><mat-icon>groups</mat-icon>{{ a.batch.name }}</div>
              }
              <div class="card-foot">
                <span class="sub-count">
                  <mat-icon>assignment_turned_in</mat-icon>
                  {{ a._count?.submissions ?? 0 }} submissions
                </span>
                @if (a.status === 'DRAFT') {
                  <button mat-stroked-button (click)="setStatus(a.id, 'PUBLISHED')">Publish</button>
                }
                @if (a.status === 'PUBLISHED') {
                  <button mat-stroked-button color="warn" (click)="setStatus(a.id, 'CLOSED')">Close</button>
                }
                <button mat-flat-button color="primary" [routerLink]="['./', a.id, 'review']">
                  Review
                </button>
              </div>
            </div>
          }
          @if (assignments().length === 0) {
            <div class="empty-state">
              <mat-icon>assignment</mat-icon>
              <p>No assignments yet</p>
            </div>
          }
        </div>
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
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .err { color: #DC2626; font-size: 0.875rem; }
    .filter-row { margin-bottom: 16px; }
    .batch-f { width: 220px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .asgn-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 18px; display: flex; flex-direction: column; gap: 8px; transition: box-shadow 0.15s, transform 0.15s; }
    .asgn-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }

    .card-top { display: flex; align-items: center; justify-content: space-between; }
    .status-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    [data-s="DRAFT"]     { background: #F1F5F9; color: #64748B; }
    [data-s="PUBLISHED"] { background: #ECFDF5; color: #059669; }
    [data-s="CLOSED"]    { background: #FEF2F2; color: #DC2626; }
    .due { font-size: 0.75rem; color: #64748B; }
    .due.overdue { color: #DC2626; font-weight: 600; }

    .asgn-title { font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0; }
    .batch-tag { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #059669; }
    .batch-tag mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .card-foot { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #F1F5F9; padding-top: 8px; margin-top: auto; }
    .sub-count { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #64748B; }
    .sub-count mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class TeacherAssignmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly batches = signal<MyBatch[]>([]);
  readonly assignments = signal<AssignmentRow[]>([]);
  readonly loading = signal(true);
  readonly batchFilter = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly form = this.fb.group({
    title: ['', Validators.required],
    batchId: ['', Validators.required],
    dueDate: [''],
    maxScore: [null as number | null],
    description: [''],
  });

  ngOnInit() {
    this.api.get<{ data: { data: MyBatch[] } }>('/tenant/batches/my', { page: 1, limit: 50 }).subscribe({
      next: (r) => {
        this.batches.set(r.data.data);
        const batchId = this.route.snapshot.queryParamMap.get('batchId');
        if (batchId) { this.batchFilter.set(batchId); this.form.patchValue({ batchId }); }
        this.load();
      },
    });
  }

  load() {
    this.loading.set(true);
    const params: Record<string, any> = { page: 1, limit: 50 };
    if (this.batchFilter()) params['batchId'] = this.batchFilter();
    this.api.get<{ data: { data: AssignmentRow[] } }>('/tenant/assignments', params).subscribe({
      next: (r) => { this.assignments.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilter(v: string) { this.batchFilter.set(v); this.load(); }
  isOverdue(d: string) { return new Date(d) < new Date(); }

  setStatus(id: string, status: string) {
    this.api.patch(`/tenant/assignments/${id}`, { status }).subscribe({ next: () => this.load() });
  }

  create() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    this.api.post('/tenant/assignments', {
      title: v.title, batchId: v.batchId,
      dueDate: v.dueDate || undefined,
      maxMarks: v.maxScore ?? 100, // Fixed backend key
      description: v.description || undefined,
    }).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.form.reset(); this.load(); },
      error: (e) => { this.saving.set(false); this.formError.set(e?.error?.message ?? 'Failed'); },
    });
  }
}
