import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Child { id: string; firstName: string; lastName: string; }
interface Assignment {
    id: string;
    title: string;
    dueDate?: string;
    batch?: { name: string };
    status: string;
    maxScore?: number;
}

@Component({
    selector: 'app-parent-assignments',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Assignments</h1>
        <p class="page-sub">Track your children's assignment progress</p>
      </div>

      <div class="controls">
        <mat-form-field appearance="outline">
          <mat-label>Select Child</mat-label>
          <mat-select [value]="selectedChild()" (selectionChange)="onChild($event.value)">
            <mat-option value="">— Select child —</mat-option>
            @for (c of children(); track c.id) {
              <mat-option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!selectedChild()) {
        <div class="empty-state">
          <mat-icon>family_restroom</mat-icon>
          <p>Select a child to view assignments</p>
        </div>
      } @else if (assignments().length === 0) {
        <div class="empty-state">
          <mat-icon>assignment</mat-icon>
          <p>No published assignments found</p>
        </div>
      } @else {
        <div class="cards-grid">
          @for (a of assignments(); track a.id) {
            <div class="asgn-card" [class.overdue]="isOverdue(a.dueDate)">
              <div class="card-top">
                @if (a.batch) { <span class="batch-tag">{{ a.batch.name }}</span> }
                @if (a.dueDate) {
                  <span class="due" [class.red]="isOverdue(a.dueDate)">
                    📅 {{ a.dueDate | date:'mediumDate' }}
                  </span>
                }
              </div>
              <h3 class="asgn-title">{{ a.title }}</h3>
              <div class="card-foot">
                @if (a.maxScore) { <span class="score">{{ a.maxScore }} pts</span> }
                @if (isOverdue(a.dueDate)) {
                  <span class="overdue-badge">Overdue</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1000px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .controls { margin-bottom: 16px; }
    .controls mat-form-field { width: 240px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .asgn-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; border-left: 4px solid #D97706; padding: 16px; display: flex; flex-direction: column; gap: 8px; transition: box-shadow 0.15s; }
    .asgn-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
    .asgn-card.overdue { border-left-color: #DC2626; }

    .card-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; }
    .batch-tag { background: #FFFBEB; color: #92400E; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .due { font-size: 0.75rem; color: #64748B; }
    .due.red { color: #DC2626; font-weight: 700; }

    .asgn-title { font-size: 0.9rem; font-weight: 700; color: #0F172A; margin: 0; }
    .card-foot { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #F1F5F9; padding-top: 8px; margin-top: auto; }
    .score { font-size: 0.75rem; color: #94A3B8; }
    .overdue-badge { background: #FEF2F2; color: #DC2626; padding: 2px 8px; border-radius: 8px; font-size: 0.72rem; font-weight: 700; }
  `],
})
export class ParentAssignmentsComponent implements OnInit {
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);

    readonly children = signal<Child[]>([]);
    readonly assignments = signal<Assignment[]>([]);
    readonly loading = signal(false);
    readonly selectedChild = signal('');

    ngOnInit() {
        this.api.get<{ data: { data: Child[] } }>('/tenant/users/my-children', { page: 1, limit: 50 }).subscribe({
            next: (r) => { this.children.set(r.data.data); },
        });
    }

    onChild(id: string) {
        this.selectedChild.set(id);
        if (!id) { this.assignments.set([]); return; }
        this.loading.set(true);
        this.api.get<{ data: { data: Assignment[] } }>('/tenant/assignments', {
            studentId: id, status: 'PUBLISHED', page: 1, limit: 100,
        }).subscribe({
            next: (r) => { this.assignments.set(r.data.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    isOverdue(d?: string): boolean { return !!d && new Date(d) < new Date(); }
}
