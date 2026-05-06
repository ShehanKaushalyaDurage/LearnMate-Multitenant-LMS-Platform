import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SCHOOL_DAYS = [1, 2, 3, 4, 5, 6];

const DAY_COLORS: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    2: { bg: '#F0FDF4', border: '#BBF7D0', text: '#059669' },
    3: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
    4: { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' },
    5: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
    6: { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' },
};

interface TimetableSlot {
    id: string;
    batchId: string;
    batch?: { name: string };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subject?: string;
    room?: string;
    meetLink?: string;
}

@Component({
    selector: 'app-teacher-timetable',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Timetable</h1>
          <p class="page-sub">Your weekly class schedule</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="week-grid">
          @for (day of schoolDays; track day) {
            <div class="day-column">
              <div class="day-header"
                   [style.background]="dayColor(day).bg"
                   [style.border-color]="dayColor(day).border"
                   [style.color]="dayColor(day).text"
                   [class.today]="day === todayDay">
                {{ dayName(day) }}
                @if (day === todayDay) { <span class="today-dot">●</span> }
              </div>
              <div class="slots-list">
                @for (slot of slotsForDay(day); track slot.id) {
                  <div class="slot-card" [style.border-left-color]="dayColor(day).text">
                    <div class="slot-time">{{ slot.startTime }} – {{ slot.endTime }}</div>
                    @if (slot.subject) { <div class="slot-subject">{{ slot.subject }}</div> }
                    @if (slot.batch)   { <div class="slot-batch">{{ slot.batch.name }}</div> }
                    @if (slot.room)    { <div class="slot-room">📍 {{ slot.room }}</div> }
                    @if (slot.meetLink) {
                      <a [href]="slot.meetLink" target="_blank" class="meet-link">
                        🎥 Join Meet
                      </a>
                    }
                  </div>
                }
                @if (slotsForDay(day).length === 0) {
                  <div class="empty-day">—</div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1300px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .week-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    .day-column { display: flex; flex-direction: column; gap: 8px; min-width: 0; }

    .day-header {
      text-align: center; padding: 8px 4px; border-radius: 8px; border: 1px solid;
      font-weight: 700; font-size: 0.8rem; position: relative;
    }
    .day-header.today { box-shadow: 0 0 0 2px currentColor; }
    .today-dot { position: absolute; top: 4px; right: 6px; font-size: 8px; }

    .slots-list { display: flex; flex-direction: column; gap: 6px; }
    .slot-card {
      background: white; border-radius: 8px; border: 1px solid #E2E8F0;
      border-left: 3px solid; padding: 10px;
    }
    .slot-time { font-size: 0.72rem; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
    .slot-subject { font-size: 0.8rem; font-weight: 600; color: #334155; }
    .slot-batch { font-size: 0.7rem; color: #64748B; }
    .slot-room { font-size: 0.7rem; color: #64748B; margin-top: 2px; }
    .meet-link { display: block; font-size: 0.7rem; color: #1E40AF; text-decoration: none; margin-top: 4px; }

    .empty-day { color: #CBD5E1; font-size: 0.75rem; text-align: center; padding: 12px 0; border: 1px dashed #E2E8F0; border-radius: 8px; }

    @media (max-width: 900px) { .week-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 580px) { .week-grid { grid-template-columns: 1fr; } }
  `],
})
export class TeacherTimetableComponent implements OnInit {
    private readonly api = inject(ApiService);

    readonly timetableMap = signal<Record<string, TimetableSlot[]>>({});
    readonly loading = signal(true);
    readonly schoolDays = SCHOOL_DAYS;
    readonly todayDay = new Date().getDay();

    ngOnInit() {
        this.api.get<{ data: Record<string, TimetableSlot[]> }>('/tenant/timetable/my').subscribe({
            next: (r) => { this.timetableMap.set(r.data ?? {}); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    dayName(d: number) { return DAYS[d]; }
    dayColor(d: number) { return DAY_COLORS[d] ?? { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' }; }
    slotsForDay(d: number): TimetableSlot[] { return this.timetableMap()[String(d)] ?? []; }
}

