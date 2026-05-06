import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  batch?: { name: string };
  dueDate?: string;
  maxScore?: number;
  maxMarks?: number;
  status: string;
}

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Assignments</h1>
        <p class="page-sub">Published assignments for your batches</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (assignments().length === 0) {
        <div class="empty-state">
          <mat-icon>assignment</mat-icon>
          <p>No assignments yet</p>
        </div>
      } @else {
        <!-- Tabs -->
        <div class="tabs">
          @for (tab of tabs; track tab.key) {
            <button class="tab" [class.active]="activeTab() === tab.key"
                    (click)="activeTab.set(tab.key)">
              {{ tab.label }}
              <span class="tab-count">{{ countFor(tab.key) }}</span>
            </button>
          }
        </div>

        <div class="cards-grid">
          @for (a of filtered(); track a.id) {
            <div class="asgn-card" [class.overdue]="isOverdue(a.dueDate)">
              <div class="card-top">
                @if (a.batch) {
                  <span class="batch-tag">{{ a.batch.name }}</span>
                }
                @if (a.dueDate) {
                  <span class="due" [class.overdue-txt]="isOverdue(a.dueDate)">
                    📅 Due: {{ a.dueDate | date:'mediumDate' }}
                  </span>
                }
              </div>
              <h3 class="asgn-title">{{ a.title }}</h3>
              @if (a.description) {
                <p class="asgn-desc">{{ a.description }}</p>
              }
              <div class="card-foot">
                <div class="foot-left">
                  @if (a.maxScore || a.maxMarks) {
                    <span class="max-score">{{ a.maxScore || a.maxMarks }} pts</span>
                  }
                  @if (isOverdue(a.dueDate)) {
                    <span class="overdue-badge">Overdue</span>
                  }
                </div>
                <button mat-flat-button color="primary" size="small" [routerLink]="['/student/assignments', a.id]">
                  View & Submit
                </button>
              </div>
            </div>
          }
          @if (filtered().length === 0) {
            <div class="empty-tab">No {{ activeTab() | lowercase }} assignments</div>
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
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .tabs { display: flex; gap: 4px; margin-bottom: 16px; background: white; border: 1px solid #E2E8F0; border-radius: 10px; padding: 4px; width: fit-content; }
    .tab { padding: 7px 16px; border-radius: 7px; border: none; background: none; font-size: 0.85rem; font-weight: 600; color: #64748B; cursor: pointer; transition: all 0.12s; display: flex; align-items: center; gap: 6px; }
    .tab.active { background: #6366F1; color: white; }
    .tab-count { background: rgba(0,0,0,0.1); border-radius: 10px; padding: 1px 7px; font-size: 0.72rem; }
    .tab.active .tab-count { background: rgba(255,255,255,0.25); }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .asgn-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; border-left: 4px solid #6366F1; padding: 18px; display: flex; flex-direction: column; gap: 8px; }
    .asgn-card.overdue { border-left-color: #DC2626; }

    .card-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; }
    .batch-tag { background: #EEF2FF; color: #6366F1; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .due { font-size: 0.75rem; color: #64748B; }
    .due.overdue-txt { color: #DC2626; font-weight: 700; }

    .asgn-title { font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0; }
    .asgn-desc { font-size: 0.8rem; color: #64748B; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .card-foot { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #F1F5F9; padding-top: 8px; margin-top: auto; }
    .max-score { font-size: 0.78rem; color: #94A3B8; }
    .overdue-badge { background: #FEF2F2; color: #DC2626; padding: 2px 8px; border-radius: 8px; font-size: 0.72rem; font-weight: 700; }
    .empty-tab { grid-column: 1/-1; text-align: center; color: #94A3B8; padding: 40px; font-size: 0.9rem; }
  `],
})
export class StudentAssignmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly assignments = signal<Assignment[]>([]);
  readonly loading = signal(true);
  readonly activeTab = signal<'all' | 'pending' | 'overdue'>('all');

  readonly tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'pending' as const, label: 'Pending' },
    { key: 'overdue' as const, label: 'Overdue' },
  ];

  ngOnInit() {
    this.api.get<{ data: { data: Assignment[] } }>('/tenant/assignments', {
      status: 'PUBLISHED', page: 1, limit: 100,
    }).subscribe({
      next: (r) => { this.assignments.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isOverdue(dueDate?: string): boolean {
    return !!dueDate && new Date(dueDate) < new Date();
  }

  filtered(): Assignment[] {
    const all = this.assignments();
    if (this.activeTab() === 'overdue') return all.filter((a) => this.isOverdue(a.dueDate));
    if (this.activeTab() === 'pending') return all.filter((a) => !this.isOverdue(a.dueDate));
    return all;
  }

  countFor(tab: string): number {
    if (tab === 'all') return this.assignments().length;
    if (tab === 'overdue') return this.assignments().filter((a) => this.isOverdue(a.dueDate)).length;
    return this.assignments().filter((a) => !this.isOverdue(a.dueDate)).length;
  }
}
