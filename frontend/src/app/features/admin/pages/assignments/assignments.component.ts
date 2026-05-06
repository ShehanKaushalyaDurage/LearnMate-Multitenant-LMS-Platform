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
import { AssignmentsAdminService, type AssignmentRow } from '../../services/assignments-admin.service';
import { BatchesAdminService, type BatchRow } from '../../services/batches-admin.service';

@Component({
    selector: 'app-admin-assignments',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatTableModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatProgressSpinnerModule, MatTooltipModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Assignments</h1>
          <p class="page-sub">Create and manage batch assignments</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'New Assignment' }}
        </button>
      </div>

      <!-- Create Form -->
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
              <mat-label>Due Date (optional)</mat-label>
              <input matInput formControlName="dueDate" type="date" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Max Score (optional)</mat-label>
              <input matInput formControlName="maxScore" type="number" placeholder="100" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Description (optional)</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="error-text">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Create Assignment
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Batch filter -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="batch-filter">
          <mat-label>Filter by Batch</mat-label>
          <mat-select [value]="batchFilter()" (selectionChange)="onBatchFilter($event.value)">
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
            <div class="assignment-card">
              <div class="card-header">
                <span class="status-chip" [attr.data-status]="a.status">{{ a.status }}</span>
                @if (a.dueDate) {
                  <span class="due-date" [class.overdue]="isOverdue(a.dueDate)">
                    <mat-icon>schedule</mat-icon>
                    {{ a.dueDate | date:'mediumDate' }}
                  </span>
                }
              </div>
              <h3 class="card-title">{{ a.title }}</h3>
              @if (a.batch) {
                <div class="batch-tag">
                  <mat-icon>groups</mat-icon>
                  {{ a.batch.name }}
                </div>
              }
              @if (a.description) {
                <p class="card-desc">{{ a.description }}</p>
              }
              <div class="card-footer">
                <div class="submission-count">
                  <mat-icon>assignment_turned_in</mat-icon>
                  {{ a._count?.submissions ?? 0 }} submissions
                </div>
                @if (a.maxScore) {
                  <span class="max-score">/ {{ a.maxScore }} pts</span>
                }
                <div class="card-actions">
                  @if (a.status === 'DRAFT') {
                    <button mat-icon-button matTooltip="Publish"
                            (click)="setStatus(a, 'PUBLISHED')">
                      <mat-icon style="color:#059669">publish</mat-icon>
                    </button>
                  }
                  @if (a.status === 'PUBLISHED') {
                    <button mat-icon-button matTooltip="Close"
                            (click)="setStatus(a, 'CLOSED')">
                      <mat-icon style="color:#DC2626">lock</mat-icon>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
          @if (assignments().length === 0) {
            <div class="empty-state">
              <mat-icon>assignment</mat-icon>
              <p>No assignments yet.</p>
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
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .create-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1/-1; }
    .form-actions { grid-column: 1/-1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .error-text { color: #DC2626; font-size: 0.875rem; }

    .filters-row { margin-bottom: 16px; }
    .batch-filter { width: 220px; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .assignment-card {
      background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px;
      display: flex; flex-direction: column; gap: 10px;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .assignment-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }

    .card-header { display: flex; align-items: center; justify-content: space-between; }
    .status-chip { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    [data-status="DRAFT"]     { background: #F1F5F9; color: #64748B; }
    [data-status="PUBLISHED"] { background: #ECFDF5; color: #059669; }
    [data-status="CLOSED"]    { background: #FEF2F2; color: #DC2626; }
    .due-date { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: #64748B; }
    .due-date mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .due-date.overdue { color: #DC2626; font-weight: 600; }

    .card-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .card-desc { font-size: 0.8rem; color: #64748B; margin: 0; line-height: 1.5; }
    .batch-tag { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #1E40AF; }
    .batch-tag mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .card-footer { display: flex; align-items: center; gap: 8px; border-top: 1px solid #F1F5F9; padding-top: 10px; margin-top: auto; }
    .submission-count { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748B; flex: 1; }
    .submission-count mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .max-score { font-size: 0.8rem; color: #94A3B8; }
    .card-actions { display: flex; gap: 4px; }

    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 1rem; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748B; font-size: 0.875rem; }
  `],
})
export class AdminAssignmentsComponent implements OnInit {
    private readonly svc = inject(AssignmentsAdminService);
    private readonly batchesSvc = inject(BatchesAdminService);
    private readonly fb = inject(FormBuilder);

    readonly assignments = signal<AssignmentRow[]>([]);
    readonly batches = signal<BatchRow[]>([]);
    readonly loading = signal(true);
    readonly page = signal(1);
    readonly totalPages = signal(1);
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
        this.load();
        this.batchesSvc.getBatches(1, 100).subscribe({ next: (r) => this.batches.set(r.data.data) });
    }

    load() {
        this.loading.set(true);
        this.svc.getAssignments(this.page(), 20, this.batchFilter() || undefined).subscribe({
            next: (r) => { this.assignments.set(r.data.data); this.totalPages.set(r.data.meta.totalPages ?? 1); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    onBatchFilter(v: string) { this.batchFilter.set(v); this.page.set(1); this.load(); }
    changePage(p: number) { this.page.set(p); this.load(); }

    isOverdue(dueDate: string): boolean {
        return new Date(dueDate) < new Date();
    }

    setStatus(a: AssignmentRow, status: string) {
        this.svc.updateStatus(a.id, status).subscribe({ next: () => this.load() });
    }

    create() {
        if (this.form.invalid) return;
        this.saving.set(true);
        this.formError.set('');
        const v = this.form.value;
        this.svc.createAssignment({
            title: v.title!, batchId: v.batchId!,
            dueDate: v.dueDate || undefined,
            maxScore: v.maxScore ?? undefined,
            description: v.description || undefined,
        }).subscribe({
            next: () => { this.saving.set(false); this.showForm.set(false); this.form.reset(); this.load(); },
            error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Failed to create'); },
        });
    }
}
