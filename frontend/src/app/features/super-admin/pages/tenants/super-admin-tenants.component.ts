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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../../../core/services/api.service';

type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'INACTIVE';

interface Plan {
  id: string;
  name: string;
  maxStudents: number;
  maxTeachers: number;
  maxCourses: number;
  priceLkr: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  planId?: string;
  plan?: Plan;
  enableExams: boolean;
  enableAssignments: boolean;
  enableAttendance: boolean;
  createdAt: string;
  _count?: { users: number };
}

const STATUS_CFG: Record<TenantStatus, { bg: string; color: string }> = {
  ACTIVE: { bg: '#ECFDF5', color: '#059669' },
  TRIAL: { bg: '#EFF6FF', color: '#1E40AF' },
  SUSPENDED: { bg: '#FEF2F2', color: '#DC2626' },
  INACTIVE: { bg: '#F1F5F9', color: '#64748B' },
};

@Component({
  selector: 'app-super-admin-tenants',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSlideToggleModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tenants</h1>
          <p class="page-sub">All institutes on the LearnHub platform</p>
        </div>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancel' : 'Provision Tenant' }}
        </button>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <div class="form-panel">
          <h3 class="panel-title">New Tenant</h3>
          <form [formGroup]="form" (ngSubmit)="create()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Institute Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Sunrise Academy" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Institute ID (Slug)</mat-label>
              <input matInput formControlName="slug" placeholder="sunrise" />
              <span matSuffix>.learnhub.lk</span>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Plan</mat-label>
              <mat-select formControlName="planId">
                @for (p of plans(); track p.id) {
                  <mat-option [value]="p.id">{{ p.name }} (LKR {{ p.priceLkr }}/mo)</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Admin Email</mat-label>
              <input matInput formControlName="adminEmail" placeholder="admin@sunrise.lk" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Admin First Name</mat-label>
              <input matInput formControlName="adminFirstName" placeholder="John" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Admin Last Name</mat-label>
              <input matInput formControlName="adminLastName" placeholder="Doe" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Admin Password</mat-label>
              <input matInput formControlName="adminPassword" type="password" placeholder="Min 8 chars" />
            </mat-form-field>
            <div class="form-actions">
              @if (formError()) { <span class="err">{{ formError() }}</span> }
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
                Provision
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="tenant-grid">
          @for (t of tenants(); track t.id) {
            <div class="tenant-card">
              <div class="tc-top">
                <div class="tc-logo">{{ t.name[0] }}</div>
                <span class="status-chip" [style.background]="STATUS_CFG[t.status].bg" [style.color]="STATUS_CFG[t.status].color">
                  {{ t.status }}
                </span>
              </div>
              <h3 class="tc-name">{{ t.name }}</h3>
              <div class="tc-domain">🌐 {{ t.slug }}</div>

              <!-- Plan dropdown -->
              <div class="tc-plan-row">
                <mat-form-field appearance="outline" class="plan-select">
                  <mat-label>Plan</mat-label>
                  <mat-select [value]="t.planId" (selectionChange)="changePlan(t.id, $event.value)">
                    @for (p of plans(); track p.id) {
                      <mat-option [value]="p.id">{{ p.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Feature Toggles -->
              <div class="tc-features">
                <div class="feature-row">
                  <mat-slide-toggle [checked]="t.enableExams" (change)="toggleFeature(t.id, 'enableExams', $event.checked)">Exams</mat-slide-toggle>
                </div>
                <div class="feature-row">
                  <mat-slide-toggle [checked]="t.enableAssignments" (change)="toggleFeature(t.id, 'enableAssignments', $event.checked)">Assignments</mat-slide-toggle>
                </div>
                <div class="feature-row">
                  <mat-slide-toggle [checked]="t.enableAttendance" (change)="toggleFeature(t.id, 'enableAttendance', $event.checked)">Attendance</mat-slide-toggle>
                </div>
              </div>

              <div class="tc-meta">
                <span><mat-icon>group</mat-icon>{{ t._count?.users ?? 0 }}</span>
                <span><mat-icon>event</mat-icon>{{ t.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="tc-actions">
                @if (t.status !== 'SUSPENDED') {
                  <button mat-stroked-button color="warn" (click)="suspend(t.id)">Suspend</button>
                } @else {
                  <button mat-stroked-button (click)="activate(t.id)">Activate</button>
                }
              </div>
            </div>
          }
          @if (tenants().length === 0) {
            <div class="empty">
              <mat-icon>domain</mat-icon>
              <p>No tenants yet</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .form-panel { background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px; margin-bottom: 20px; }
    .panel-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-actions { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .err { color: #DC2626; font-size: 0.875rem; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty p { margin: 0; }

    .tenant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .tenant-card { background: white; border-radius: 14px; border: 1px solid #E2E8F0; padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.2s, transform 0.15s; }
    .tenant-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }

    .tc-top { display: flex; align-items: center; justify-content: space-between; }
    .tc-logo { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #6D28D9, #7C3AED); color: white; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .status-chip { padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .tc-name { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .tc-domain { font-size: 0.8rem; color: #64748B; }
    .tc-plan-row { margin-top: 4px; }
    .plan-select { width: 100%; }
    .plan-select ::ng-deep .mat-mdc-form-field-infix { padding-top: 8px !important; padding-bottom: 8px !important; min-height: 40px !important; }

    .tc-features { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; border-top: 1px solid #F1F5F9; }
    .feature-row { display: flex; align-items: center; }
    .feature-row ::ng-deep .mdc-label { font-size: 0.82rem; }

    .tc-meta { display: flex; gap: 12px; }
    .tc-meta span { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #94A3B8; }
    .tc-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .tc-actions { margin-top: auto; }
    .tc-actions button { width: 100%; }
  `],
})
export class SuperAdminTenantsComponent implements OnInit {
  readonly STATUS_CFG = STATUS_CFG;
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly tenants = signal<Tenant[]>([]);
  readonly plans = signal<Plan[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    planId: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminFirstName: ['', [Validators.required, Validators.minLength(2)]],
    adminLastName: ['', [Validators.required, Validators.minLength(1)]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() {
    this.loadPlans();
    this.load();
  }

  loadPlans() {
    this.api.get<any>('/platform/plans').subscribe({
      next: (r) => {
        const data = Array.isArray(r) ? r : (r.data ?? []);
        this.plans.set(data);
        // Set default plan if available
        if (data.length > 0 && !this.form.get('planId')?.value) {
          this.form.patchValue({ planId: data[0].id });
        }
      },
    });
  }

  load() {
    this.api.get<{ data: { data: Tenant[] } }>('/platform/tenants', { page: 1, limit: 100 }).subscribe({
      next: (r) => { this.tenants.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    this.api.post('/platform/tenants', this.form.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset();
        if (this.plans().length > 0) this.form.patchValue({ planId: this.plans()[0].id });
        this.load();
      },
      error: (e) => { this.saving.set(false); this.formError.set(e?.error?.message ?? 'Failed'); },
    });
  }

  changePlan(tenantId: string, planId: string) {
    this.api.patch(`/platform/tenants/${tenantId}/plan`, { planId }).subscribe({
      next: () => this.load(),
    });
  }

  toggleFeature(tenantId: string, feature: string, enabled: boolean) {
    this.api.patch(`/platform/tenants/${tenantId}/features`, { [feature]: enabled }).subscribe({
      next: () => this.load(),
    });
  }

  suspend(id: string) {
    this.api.patch(`/platform/tenants/${id}`, { status: 'SUSPENDED' }).subscribe({ next: () => this.load() });
  }

  activate(id: string) {
    this.api.patch(`/platform/tenants/${id}`, { status: 'ACTIVE' }).subscribe({ next: () => this.load() });
  }
}
