import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    startTime: string;
    endTime: string;
    subject?: string;
    room?: string;
    meetLink?: string;
    batch?: { name: string };
}

@Component({
    selector: 'app-student-timetable',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Timetable</h1>
        <p class="page-sub">Your weekly class schedule</p>
      </div>
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="week-grid">
          @for (day of schoolDays; track day) {
            <div class="day-col">
              <div class="day-hdr"
                   [style.background]="dc(day).bg"
                   [style.border-color]="dc(day).border"
                   [style.color]="dc(day).text"
                   [class.today]="day === todayDay">
                {{ dayName(day) }}
                @if (day === todayDay) { <span class="dot">●</span> }
              </div>
              <div class="slots">
                @for (s of slotsFor(day); track s.id) {
                  <div class="slot" [style.border-left-color]="dc(day).text">
                    <div class="time">{{ s.startTime }} – {{ s.endTime }}</div>
                    @if (s.subject) { <div class="subj">{{ s.subject }}</div> }
                    @if (s.batch)   { <div class="batch">{{ s.batch.name }}</div> }
                    @if (s.room)    { <div class="room">📍 {{ s.room }}</div> }
                    @if (s.meetLink) {
                      <a [href]="s.meetLink" target="_blank" class="meet">🎥 Join</a>
                    }
                  </div>
                }
                @if (slotsFor(day).length === 0) {
                  <div class="no-class">—</div>
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
    .day-col { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .day-hdr { text-align: center; padding: 8px 4px; border-radius: 8px; border: 1px solid; font-weight: 700; font-size: 0.8rem; position: relative; }
    .day-hdr.today { box-shadow: 0 0 0 2px currentColor; }
    .dot { position: absolute; top: 4px; right: 6px; font-size: 8px; }

    .slots { display: flex; flex-direction: column; gap: 6px; }
    .slot { background: white; border-radius: 8px; border: 1px solid #E2E8F0; border-left: 3px solid; padding: 10px; }
    .time { font-size: 0.72rem; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
    .subj { font-size: 0.8rem; font-weight: 600; color: #334155; }
    .batch { font-size: 0.7rem; color: #64748B; }
    .room { font-size: 0.7rem; color: #64748B; margin-top: 2px; }
    .meet { display: block; font-size: 0.7rem; color: #6366F1; text-decoration: none; margin-top: 4px; }
    .no-class { color: #CBD5E1; font-size: 0.75rem; text-align: center; padding: 12px 0; border: 1px dashed #E2E8F0; border-radius: 8px; }

    @media (max-width: 900px) { .week-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 580px) { .week-grid { grid-template-columns: 1fr; } }
  `],
})
export class StudentTimetableComponent implements OnInit {
    private readonly api = inject(ApiService);
    readonly map = signal<Record<string, TimetableSlot[]>>({});
    readonly loading = signal(true);
    readonly schoolDays = SCHOOL_DAYS;
    readonly todayDay = new Date().getDay();

    ngOnInit() {
        this.api.get<{ data: Record<string, TimetableSlot[]> }>('/tenant/timetable/my').subscribe({
            next: (r) => { this.map.set(r.data ?? {}); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    dayName(d: number) { return DAYS[d]; }
    dc(d: number) { return DAY_COLORS[d] ?? { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' }; }
    slotsFor(d: number): TimetableSlot[] { return this.map()[String(d)] ?? []; }
}
