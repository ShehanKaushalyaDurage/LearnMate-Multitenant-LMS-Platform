import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExamsAdminService, type QuestionRow, type ExamRow } from '../../services/exams-admin.service';

@Component({
    selector: 'app-question-builder',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, RouterLink,
        MatButtonModule, MatIconModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/admin/exams">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">Manage Questions</h1>
            <p class="page-sub">{{ exam()?.title || 'Loading...' }}</p>
          </div>
        </div>
        @if (exam()?.status === 'DRAFT') {
          <button mat-flat-button color="primary" (click)="toggleForm()">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'Add Question' }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <!-- Add/Edit Form -->
        @if (showForm()) {
          <div class="form-panel">
            <h3 class="panel-title">{{ editingId() ? 'Edit' : 'Add' }} Question</h3>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Question Text</mat-label>
                <textarea matInput formControlName="questionText" rows="2"></textarea>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Option A</mat-label>
                <input matInput formControlName="optionA" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Option B</mat-label>
                <input matInput formControlName="optionB" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Option C</mat-label>
                <input matInput formControlName="optionC" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Option D</mat-label>
                <input matInput formControlName="optionD" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Correct Option</mat-label>
                <mat-select formControlName="correctOption">
                  <mat-option value="A">Option A</mat-option>
                  <mat-option value="B">Option B</mat-option>
                  <mat-option value="C">Option C</mat-option>
                  <mat-option value="D">Option D</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Marks</mat-label>
                <input matInput type="number" formControlName="marks" />
              </mat-form-field>

              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                  @if (saving()) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                  {{ editingId() ? 'Update' : 'Add' }} Question
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Question List -->
        <div class="q-list">
          @for (q of questions(); track q.id; let i = $index) {
            <div class="q-card">
              <div class="q-header">
                <span class="q-num">Q{{ i + 1 }}</span>
                <span class="q-marks">{{ q.marks }} Marks</span>
                <div class="q-actions">
                  @if (exam()?.status === 'DRAFT') {
                    <button mat-icon-button color="primary" (click)="edit(q)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="delete(q.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
              </div>
              <p class="q-text">{{ q.questionText }}</p>
              <div class="options-grid">
                <div class="opt" [class.correct]="q.correctOption === 'A'"><span>A</span> {{ q.optionA }}</div>
                <div class="opt" [class.correct]="q.correctOption === 'B'"><span>B</span> {{ q.optionB }}</div>
                <div class="opt" [class.correct]="q.correctOption === 'C'"><span>C</span> {{ q.optionC }}</div>
                <div class="opt" [class.correct]="q.correctOption === 'D'"><span>D</span> {{ q.optionD }}</div>
              </div>
            </div>
          }
          @if (questions().length === 0) {
            <div class="empty-state">
              <mat-icon>format_list_bulleted</mat-icon>
              <p>No questions added yet.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 900px; padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }

    .form-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .panel-title { font-size: 1rem; font-weight: 600; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .span-2 { grid-column: 1 / -1; }
    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px; }

    .q-list { display: flex; flex-direction: column; gap: 16px; }
    .q-card { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
    .q-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .q-num { background: #F1F5F9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
    .q-marks { font-size: 0.75rem; color: #64748B; font-weight: 600; }
    .q-actions { margin-left: auto; display: flex; gap: 4px; }
    .q-text { font-size: 1rem; font-weight: 500; color: #1E293B; margin: 0 0 16px; }

    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .opt { padding: 10px 14px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 0.875rem; display: flex; align-items: center; gap: 10px; }
    .opt span { font-weight: 700; color: #94A3B8; }
    .opt.correct { border-color: #059669; background: #ECFDF5; }
    .opt.correct span { color: #059669; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94A3B8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class QuestionBuilderComponent implements OnInit {
    private readonly svc = inject(ExamsAdminService);
    private readonly route = inject(ActivatedRoute);
    private readonly fb = inject(FormBuilder);

    readonly exam = signal<ExamRow | null>(null);
    readonly questions = signal<QuestionRow[]>([]);
    readonly loading = signal(true);
    readonly showForm = signal(false);
    readonly saving = signal(false);
    readonly editingId = signal<string | null>(null);

    readonly form = this.fb.group({
        questionText: ['', Validators.required],
        optionA: ['', Validators.required],
        optionB: ['', Validators.required],
        optionC: ['', Validators.required],
        optionD: ['', Validators.required],
        correctOption: ['A', Validators.required],
        marks: [1, [Validators.required, Validators.min(1)]],
    });

    ngOnInit() {
        const examId = this.route.snapshot.paramMap.get('id');
        if (examId) {
            this.loadExam(examId);
            this.loadQuestions(examId);
        }
    }

    loadExam(id: string) {
        this.svc.getExamById(id).subscribe({
            next: (res) => this.exam.set(res.data)
        });
    }

    loadQuestions(id: string) {
        this.loading.set(true);
        this.svc.getQuestions(id).subscribe({
            next: (r) => { this.questions.set(r.data); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    toggleForm() {
        this.showForm.set(!this.showForm());
        if (!this.showForm()) {
            this.editingId.set(null);
            this.form.reset({ correctOption: 'A', marks: 1 });
        }
    }

    edit(q: QuestionRow) {
        this.editingId.set(q.id);
        this.form.patchValue(q);
        this.showForm.set(true);
    }

    save() {
        if (this.form.invalid) return;
        this.saving.set(true);
        const examId = this.exam()?.id;
        if (!examId) return;

        const val = this.form.value;
        const obs = this.editingId()
            ? this.svc.updateQuestion(this.editingId()!, val as any)
            : this.svc.addQuestion(examId, val as any);

        obs.subscribe({
            next: () => {
                this.saving.set(false);
                this.showForm.set(false);
                this.editingId.set(null);
                this.form.reset({ correctOption: 'A', marks: 1 });
                this.loadQuestions(examId);
            },
            error: () => this.saving.set(false),
        });
    }

    delete(id: string) {
        if (!confirm('Delete this question?')) return;
        this.svc.deleteQuestion(id).subscribe({
            next: () => {
                const examId = this.exam()?.id;
                if (examId) this.loadQuestions(examId);
            },
        });
    }
}
