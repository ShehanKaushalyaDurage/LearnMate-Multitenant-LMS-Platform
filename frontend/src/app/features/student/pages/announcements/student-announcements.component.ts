import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

type TargetType = 'ALL' | 'BATCH' | 'COURSE' | 'ROLE';

interface Announcement {
  id: string;
  title: string;
  body: string;
  targetType: TargetType;
  createdAt: string;
  creator?: { firstName: string; lastName: string };
  batch?: { name: string };
}

const TARGET_BADGE: Record<TargetType, { bg: string; color: string }> = {
  ALL: { bg: '#ECFDF5', color: '#059669' },
  BATCH: { bg: '#EFF6FF', color: '#1E40AF' },
  COURSE: { bg: '#F5F3FF', color: '#7C3AED' },
  ROLE: { bg: '#FFF7ED', color: '#C2410C' },
};

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Announcements</h1>
        <p class="page-sub">Latest notices from your institute</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (announcements().length === 0) {
        <div class="empty-state">
          <mat-icon>campaign</mat-icon>
          <p>No announcements</p>
        </div>
      } @else {
        <div class="feed">
          @for (a of announcements(); track a.id) {
            <div class="ann-card">
              <div class="ann-accent" [style.background]="badge(a.targetType).color"></div>
              <div class="ann-body">
                <div class="ann-top">
                  <div class="badges">
                    <span class="target-badge"
                          [style.background]="badge(a.targetType).bg"
                          [style.color]="badge(a.targetType).color">
                      {{ a.targetType }} {{ a.batch ? '(' + a.batch.name + ')' : '' }}
                    </span>
                    @if (isNew(a.createdAt)) {
                       <span class="new-badge">NEW</span>
                    }
                  </div>
                  <span class="ann-date">{{ a.createdAt | date:'mediumDate' }}</span>
                </div>
                <h3 class="ann-title">{{ a.title }}</h3>
                <p class="ann-text">{{ a.body }}</p>
                @if (a.creator) {
                  <div class="ann-author">
                    <mat-icon>person</mat-icon>
                    {{ a.creator.firstName }} {{ a.creator.lastName }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; }

    .feed { display: flex; flex-direction: column; gap: 12px; }
    .ann-card {
      background: white; border-radius: 12px; border: 1px solid #E2E8F0;
      display: flex; overflow: hidden;
      transition: box-shadow 0.15s;
    }
    .ann-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.06); }
    .ann-accent { width: 4px; flex-shrink: 0; }
    .ann-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }

    .ann-top { display: flex; align-items: center; justify-content: space-between; }
    .badges { display: flex; align-items: center; gap: 8px; }
    .target-badge { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .new-badge { 
        background: #FEE2E2; color: #DC2626; padding: 2px 8px; border-radius: 6px; 
        font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px;
    }
    .ann-date { font-size: 0.75rem; color: #94A3B8; }

    .ann-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0; }
    .ann-text { font-size: 0.95rem; color: #475569; margin: 0; line-height: 1.6; }
    .ann-author { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #94A3B8; margin-top: 4px; }
    .ann-author mat-icon { font-size: 13px; width: 13px; height: 13px; }
  `],
})
export class StudentAnnouncementsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly announcements = signal<Announcement[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.get<{ data: { data: Announcement[] } }>('/tenant/announcements', { page: 1, limit: 50 }).subscribe({
      next: (r) => { this.announcements.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  badge(t: TargetType) { return TARGET_BADGE[t] ?? TARGET_BADGE['ALL']; }

  isNew(date: string): boolean {
    const created = new Date(date);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return diff < 86400000; // 24 hours
  }
}
