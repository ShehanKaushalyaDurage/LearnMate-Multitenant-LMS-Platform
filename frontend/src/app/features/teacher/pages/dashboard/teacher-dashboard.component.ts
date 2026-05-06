import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ApiService } from '../../../../core/services/api.service';

interface DashStat { label: string; value: string | number; icon: string; color: string; }
interface UpcomingSlot {
    subject?: string;
    batch?: { name: string };
    startTime: string;
    endTime: string;
    dayOfWeek: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY_DAY = new Date().getDay();

@Component({
    selector: 'app-teacher-dashboard',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
    template: `
    <div class="dash">
      <div class="greet">
        <h1 class="greet-txt">Good {{ greeting() }}, <strong>{{ firstName() }}</strong> 👋</h1>
        <p class="greet-sub">Here's your teaching overview for today.</p>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        @for (s of stats(); track s.label) {
          <div class="stat-card" [style.border-top-color]="s.color">
            <div class="stat-icon" [style.background]="s.color + '20'" [style.color]="s.color">
              <mat-icon>{{ s.icon }}</mat-icon>
            </div>
            <div>
              <div class="stat-val">{{ s.value }}</div>
              <div class="stat-lbl">{{ s.label }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Two-column layout: today's classes + quick links -->
      <div class="two-col">
        <!-- Today's timetable -->
        <div class="card">
          <div class="card-hdr">
            <mat-icon>today</mat-icon>
            <span>Today's Schedule</span>
            <span class="day-badge">{{ todayName }}</span>
          </div>
          @if (loadingSlots()) {
            <div class="load-pad"><mat-spinner diameter="32"></mat-spinner></div>
          } @else if (todaySlots().length === 0) {
            <div class="empty">
              <mat-icon>event_available</mat-icon>
              <p>No classes scheduled today</p>
            </div>
          } @else {
            <div class="slots">
              @for (sl of todaySlots(); track sl.startTime) {
                <div class="slot">
                  <div class="slot-time">{{ sl.startTime }} – {{ sl.endTime }}</div>
                  <div class="slot-info">
                    <div class="slot-subj">{{ sl.subject ?? 'Class' }}</div>
                    @if (sl.batch) { <div class="slot-batch">{{ sl.batch.name }}</div> }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Quick links -->
        <div class="card">
          <div class="card-hdr">
            <mat-icon>bolt</mat-icon>
            <span>Quick Actions</span>
          </div>
          <div class="quick-links">
            <a class="ql" routerLink="/teacher/attendance">
              <div class="ql-icon" style="background:#ECFDF5;color:#059669"><mat-icon>fact_check</mat-icon></div>
              <span>Mark Attendance</span>
              <mat-icon class="ql-arr">chevron_right</mat-icon>
            </a>
            <a class="ql" routerLink="/teacher/assignments">
              <div class="ql-icon" style="background:#EFF6FF;color:#1E40AF"><mat-icon>assignment</mat-icon></div>
              <span>Assignments</span>
              <mat-icon class="ql-arr">chevron_right</mat-icon>
            </a>
            <a class="ql" routerLink="/teacher/batches">
              <div class="ql-icon" style="background:#F5F3FF;color:#7C3AED"><mat-icon>groups</mat-icon></div>
              <span>My Batches</span>
              <mat-icon class="ql-arr">chevron_right</mat-icon>
            </a>
            <a class="ql" routerLink="/teacher/timetable">
              <div class="ql-icon" style="background:#FFF7ED;color:#C2410C"><mat-icon>calendar_month</mat-icon></div>
              <span>Timetable</span>
              <mat-icon class="ql-arr">chevron_right</mat-icon>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dash { max-width: 1100px; }
    .greet { margin-bottom: 24px; }
    .greet-txt { font-size: 1.6rem; font-weight: 600; color: #0F172A; margin: 0 0 4px; }
    .greet-txt strong { font-weight: 800; }
    .greet-sub { color: #64748B; font-size: 0.9rem; margin: 0; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; border-top: 3px solid; padding: 16px; display: flex; align-items: center; gap: 14px; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-val { font-size: 1.5rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; color: #64748B; margin-top: 2px; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .card-hdr { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid #F1F5F9; font-weight: 600; color: #0F172A; font-size: 0.9rem; }
    .card-hdr mat-icon { font-size: 18px; width: 18px; height: 18px; color: #059669; }
    .day-badge { margin-left: auto; background: #ECFDF5; color: #059669; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; }

    .load-pad { display: flex; justify-content: center; padding: 32px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #94A3B8; }
    .empty mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty p { margin: 0; font-size: 0.875rem; }

    .slots { display: flex; flex-direction: column; }
    .slot { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-bottom: 1px solid #F8FAFC; }
    .slot:last-child { border-bottom: none; }
    .slot-time { font-size: 0.8rem; font-weight: 700; color: #059669; min-width: 100px; }
    .slot-subj { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .slot-batch { font-size: 0.75rem; color: #64748B; }

    .quick-links { display: flex; flex-direction: column; }
    .ql { display: flex; align-items: center; gap: 12px; padding: 12px 16px; text-decoration: none; color: #0F172A; border-bottom: 1px solid #F8FAFC; transition: background 0.12s; }
    .ql:last-child { border-bottom: none; }
    .ql:hover { background: #F8FAFC; }
    .ql-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ql-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .ql span { flex: 1; font-size: 0.875rem; font-weight: 500; }
    .ql-arr { color: #CBD5E1; font-size: 18px; }

    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }
  `],
})
export class TeacherDashboardComponent implements OnInit {
    private readonly authState = inject(AuthStateService);
    private readonly api = inject(ApiService);

    readonly firstName = () => this.authState.user()?.firstName ?? 'Teacher';
    readonly todaySlots = signal<UpcomingSlot[]>([]);
    readonly loadingSlots = signal(true);
    readonly stats = signal<DashStat[]>([
        { label: 'My Batches', value: '—', icon: 'groups', color: '#059669' },
        { label: 'Students', value: '—', icon: 'person', color: '#1E40AF' },
        { label: 'Assignments', value: '—', icon: 'assignment', color: '#7C3AED' },
        { label: 'Today Classes', value: '—', icon: 'today', color: '#C2410C' },
    ]);
    readonly todayName = DAY_NAMES[TODAY_DAY];

    greeting(): string {
        const h = new Date().getHours();
        return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    }

    ngOnInit() {
        // Load teacher timetable to get today's slots
        this.api.get<{ data: Record<string, UpcomingSlot[]> }>('/tenant/timetable/my').subscribe({
            next: (r) => {
                const slots = r.data[String(TODAY_DAY)] ?? [];
                this.todaySlots.set(slots);
                const todayCount = slots.length;
                this.stats.update((s) => s.map((st) =>
                    st.label === 'Today Classes' ? { ...st, value: todayCount } : st,
                ));
                this.loadingSlots.set(false);
            },
            error: () => this.loadingSlots.set(false),
        });

        // Load my batches count
        this.api.get<{ data: { meta: { total: number } } }>('/tenant/batches/my', { page: 1, limit: 1 }).subscribe({
            next: (r) => {
                const total = r.data.meta.total ?? 0;
                this.stats.update((s) => s.map((st) =>
                    st.label === 'My Batches' ? { ...st, value: total } : st,
                ));
            },
        });
    }
}
