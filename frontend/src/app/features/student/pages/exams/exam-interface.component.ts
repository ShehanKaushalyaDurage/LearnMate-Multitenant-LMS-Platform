import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-exam-interface',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatRadioModule],
    template: `
    <div class="exam-container">
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!attempt()) {
        <div class="start-pane">
          <h1 class="title">{{ examInfo()?.title }}</h1>
          <div class="info-card">
            <div class="info-item"><mat-icon>schedule</mat-icon> Duration: {{ examInfo()?.durationMinutes }} mins</div>
            <div class="info-item"><mat-icon>grade</mat-icon> Total Marks: {{ examInfo()?.maxMarks }}</div>
          </div>
          <div class="warning">
             <mat-icon>warning</mat-icon>
             <p>Once you start, the timer cannot be paused. Do not refresh or close the browser.</p>
          </div>
          <button mat-flat-button color="primary" size="large" (click)="start()">
            I'm Ready, Start Exam
          </button>
        </div>
      } @else if (submitted()) {
        <div class="result-pane">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h1>Exam Submitted!</h1>
          <p>Your attempt has been recorded successfully.</p>
          <div class="score-card">
            <span class="label">Score</span>
            <span class="value">{{ result()?.totalMarks }} / {{ examInfo()?.maxMarks }}</span>
            <span class="pct">{{ result()?.percentage }}%</span>
          </div>
          <button mat-stroked-button color="primary" routerLink="/student/exams">Back to Exams</button>
        </div>
      } @else {
        <!-- Header / Timer -->
        <div class="exam-header">
          <div class="exam-title">{{ examInfo()?.title }}</div>
          <div class="timer" [class.urgent]="timeRemaining() < 300">
            <mat-icon>timer</mat-icon>
            {{ formatTime(timeRemaining()) }}
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress()"></div>
        </div>

        <!-- Question View -->
        <div class="question-pane">
          <div class="q-meta">
            <span class="q-num">Question {{ currIdx() + 1 }} of {{ questions().length }}</span>
            <span class="q-marks">{{ questions()[currIdx()].marks }} Marks</span>
          </div>
          <h2 class="q-text">{{ questions()[currIdx()].questionText }}</h2>

          <mat-radio-group class="options-list" [(ngModel)]="answers()[currIdx()].selectedOption">
             <mat-radio-button value="A"><span>A</span> {{ questions()[currIdx()].optionA }}</mat-radio-button>
             <mat-radio-button value="B"><span>B</span> {{ questions()[currIdx()].optionB }}</mat-radio-button>
             <mat-radio-button value="C"><span>C</span> {{ questions()[currIdx()].optionC }}</mat-radio-button>
             <mat-radio-button value="D"><span>D</span> {{ questions()[currIdx()].optionD }}</mat-radio-button>
          </mat-radio-group>
        </div>

        <!-- Footer / Nav -->
        <div class="exam-footer">
          <button mat-stroked-button (click)="prev()" [disabled]="currIdx() === 0">Previous</button>
          
          <div class="footer-center">
            @for (q of questions(); track $index) {
                <div class="dot" [class.active]="currIdx() === $index" 
                     [class.answered]="answers()[$index].selectedOption"
                     (click)="currIdx.set($index)"></div>
            }
          </div>

          @if (currIdx() === questions().length - 1) {
            <button mat-flat-button color="warn" (click)="submit()" [disabled]="submitting()">
                 @if (submitting()) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                 Finish & Submit
            </button>
          } @else {
            <button mat-flat-button color="primary" (click)="next()">Next Question</button>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .exam-container { max-width: 800px; margin: 40px auto; padding: 24px; min-height: 400px; }
    
    .start-pane, .result-pane { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 40px; background: white; border-radius: 16px; border: 1px solid #E2E8F0; }
    .info-card { display: flex; gap: 24px; background: #F8FAFC; padding: 16px 24px; border-radius: 12px; }
    .warning { display: flex; align-items: center; gap: 12px; color: #DC2626; background: #FEF2F2; padding: 12px 20px; border-radius: 8px; font-size: 0.9rem; }
    .warning mat-icon { flex-shrink: 0; }
    
    .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .exam-title { font-weight: 700; color: #0F172A; }
    .timer { display: flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; font-weight: 700; color: #475569; background: #F1F5F9; padding: 6px 14px; border-radius: 20px; }
    .timer.urgent { color: #DC2626; background: #FEF2F2; animation: blink 1s infinite alternate; }
    @keyframes blink { from { opacity: 1; } to { opacity: 0.6; } }

    .progress-bar { height: 6px; background: #E2E8F0; border-radius: 3px; margin-bottom: 32px; }
    .progress-fill { height: 100%; background: #6366F1; border-radius: 3px; transition: width 0.3s; }

    .question-pane { background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; margin-bottom: 24px; position: relative; }
    .q-meta { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .q-num { font-size: 0.75rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .q-marks { font-size: 0.75rem; color: #6366F1; font-weight: 600; }
    .q-text { font-size: 1.25rem; font-weight: 600; color: #1E293B; margin-bottom: 32px; line-height: 1.4; }
    
    .options-list { display: flex; flex-direction: column; gap: 12px; }
    .options-list mat-radio-button { border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 16px; transition: all 0.15s; }
    .options-list mat-radio-button:hover { background: #F8FAFC; border-color: #CBD5E1; }
    .options-list mat-radio-button.mat-mdc-radio-checked { background: #EEF2FF; border-color: #6366F1; }
    .options-list span { font-weight: 700; color: #94A3B8; margin-right: 12px; }

    .exam-footer { display: flex; justify-content: space-between; align-items: center; }
    .footer-center { display: flex; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #E2E8F0; cursor: pointer; }
    .dot.active { transform: scale(1.3); background: #6366F1; }
    .dot.answered { background: #CBD5E1; }

    .score-card { display: flex; flex-direction: column; align-items: center; background: #F0FDF4; border: 2px solid #059669; padding: 24px; border-radius: 16px; min-width: 200px; }
    .score-card .label { font-size: 0.75rem; color: #059669; font-weight: 700; text-transform: uppercase; }
    .score-card .value { font-size: 2rem; font-weight: 800; color: #0F172A; }
    .score-card .pct { font-size: 1rem; color: #059669; font-weight: 700; }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #059669; }
    
    .loading-center { display: flex; justify-content: center; padding: 100px; }
  `],
})
export class ExamInterfaceComponent implements OnInit, OnDestroy {
    private readonly svc = inject(StudentService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly examInfo = signal<any>(null);
    readonly attempt = signal<any>(null);
    readonly questions = signal<any[]>([]);
    readonly answers = signal<any[]>([]); // { questionId, selectedOption }

    readonly currIdx = signal(0);
    readonly loading = signal(true);
    readonly submitting = signal(false);
    readonly submitted = signal(false);
    readonly result = signal<any>(null);

    readonly timeRemaining = signal(0); // in seconds
    private timerInt?: any;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.svc.getExamById(id).subscribe({
                next: (r) => { this.examInfo.set(r.data); this.loading.set(false); },
                error: () => this.loading.set(false),
            });
        }
    }

    ngOnDestroy() { this.clearTimer(); }

    start() {
        const examId = this.examInfo().id;
        this.loading.set(true);
        this.svc.startExamAttempt(examId).subscribe({
            next: (r) => {
                this.attempt.set(r.data);
                this.questions.set(r.data.exam.questions);
                this.answers.set(r.data.exam.questions.map((q: any) => ({ questionId: q.id, selectedOption: null })));
                this.timeRemaining.set(r.data.exam.durationMinutes * 60);
                this.startTimer();
                this.loading.set(false);
            },
            error: (e) => {
                alert(e?.error?.message ?? 'Failed to start exam.');
                this.loading.set(false);
            }
        });
    }

    private startTimer() {
        this.timerInt = setInterval(() => {
            this.timeRemaining.update(v => v - 1);
            if (this.timeRemaining() <= 0) {
                this.clearTimer();
                this.submit(true);
            }
        }, 1000);
    }

    private clearTimer() { if (this.timerInt) clearInterval(this.timerInt); }

    formatTime(sec: number): string {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    progress(): number {
        if (this.questions().length === 0) return 0;
        return ((this.currIdx() + 1) / this.questions().length) * 100;
    }

    next() { if (this.currIdx() < this.questions().length - 1) this.currIdx.update(i => i + 1); }
    prev() { if (this.currIdx() > 0) this.currIdx.update(i => i - 1); }

    submit(auto = false) {
        if (!auto && !confirm('Are you sure you want to finish and submit your exam?')) return;

        this.clearTimer();
        this.submitting.set(true);
        // Filter out unanswered questions
        const submission = this.answers().filter(a => a.selectedOption !== null);

        this.svc.submitExamAttempt(this.attempt().id, submission).subscribe({
            next: (r) => {
                this.result.set(r.data);
                this.submitted.set(true);
                this.submitting.set(false);
            },
            error: () => {
                alert('Submission failed. Please contact your instructor.');
                this.submitting.set(false);
            }
        });
    }
}
