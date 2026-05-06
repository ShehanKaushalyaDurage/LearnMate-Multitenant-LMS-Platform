import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../../core/services/api.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  uniqueId?: string;
  qrCode?: string;
  subject?: string;
  grade?: string;
  classType?: string;
  medium?: string;
  classLocation?: string;
  birthYear?: number;
  parentName?: string;
  parentMobile?: string;
  createdAt: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTabsModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          <p class="page-sub">Manage admins, teachers, students & parents</p>
        </div>
        <div class="header-actions">
          <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
            <mat-icon>{{ showForm() ? 'close' : 'person_add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'Add User' }}
          </button>
        </div>
      </div>

      <!-- Registration panels -->
      @if (showForm()) {
        <div class="form-panel">
          <mat-tab-group (selectedIndexChange)="onTabChange($event)">
            <!-- Admin Tab -->
            <mat-tab label="Admin">
              <div class="tab-content">
                <form [formGroup]="adminForm" (ngSubmit)="createUser('ADMIN', adminForm)" class="form-grid">
                  <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" type="email" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput formControlName="password" type="password" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone" /></mat-form-field>
                  <div class="form-actions">
                    @if (formError()) { <span class="err">{{ formError() }}</span> }
                    <button mat-flat-button color="primary" type="submit" [disabled]="adminForm.invalid || saving()">
                      @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } Create Admin
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>

            <!-- Teacher Tab -->
            <mat-tab label="Teacher">
              <div class="tab-content">
                <form [formGroup]="teacherForm" (ngSubmit)="createUser('TEACHER', teacherForm)" class="form-grid">
                  <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" type="email" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput formControlName="password" type="password" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone" /></mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Subject</mat-label>
                    <mat-select formControlName="subject">
                      @for (s of SUBJECTS; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <div class="form-actions">
                    @if (formError()) { <span class="err">{{ formError() }}</span> }
                    <button mat-flat-button color="primary" type="submit" [disabled]="teacherForm.invalid || saving()">
                      @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } Create Teacher
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>

            <!-- Student Tab -->
            <mat-tab label="Student">
              <div class="tab-content">
                <form [formGroup]="studentForm" (ngSubmit)="createUser('STUDENT', studentForm)" class="form-grid student-grid">
                  <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" type="email" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput formControlName="password" type="password" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone" /></mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Subject</mat-label>
                    <mat-select formControlName="subject">
                      @for (s of SUBJECTS; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Birth Year</mat-label>
                    <input matInput formControlName="birthYear" type="number" placeholder="e.g. 2005" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Grade</mat-label>
                    <mat-select formControlName="grade">
                      <mat-option value="O/L">O/L</mat-option>
                      <mat-option value="A/L">A/L</mat-option>
                      <mat-option value="Courses">Courses</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Class Type</mat-label>
                    <mat-select formControlName="classType">
                      <mat-option value="Theory">Theory</mat-option>
                      <mat-option value="Paper">Paper</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Medium</mat-label>
                    <mat-select formControlName="medium">
                      <mat-option value="English Medium">English Medium</mat-option>
                      <mat-option value="Sinhala Medium">Sinhala Medium</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Class Location</mat-label>
                    <mat-select formControlName="classLocation">
                      <mat-option value="Online">Online</mat-option>
                      <mat-option value="Physical">Physical</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Parent Name</mat-label><input matInput formControlName="parentName" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Parent Mobile</mat-label><input matInput formControlName="parentMobile" /></mat-form-field>
                  <div class="form-actions">
                    @if (formError()) { <span class="err">{{ formError() }}</span> }
                    <button mat-flat-button color="primary" type="submit" [disabled]="studentForm.invalid || saving()">
                      @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } Create Student
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      }

      <!-- QR Code Search -->
      <div class="qr-search-section">
        <h3 class="section-title">🔍 Student QR Code Lookup</h3>
        <div class="qr-search-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search by ID or Name</mat-label>
            <input matInput [value]="qrQuery()" (input)="qrQuery.set($any($event.target).value)" (keyup.enter)="searchQr()" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="searchQr()" [disabled]="!qrQuery()">Search</button>
        </div>
        @if (qrResults().length > 0) {
          <div class="qr-results">
            @for (s of qrResults(); track s.id) {
              <div class="qr-card">
                <div class="qr-info">
                  <strong>{{ s.firstName }} {{ s.lastName }}</strong>
                  <span class="qr-id">ID: {{ s.uniqueId }}</span>
                  <span class="qr-email">{{ s.email }}</span>
                </div>
                @if (s.qrCode) {
                  <img [src]="s.qrCode" alt="QR Code" class="qr-img" />
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Filters & Users Table -->
      <div class="controls-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search users</mat-label>
          <input matInput [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="loadUsers()" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Role</mat-label>
          <mat-select [value]="roleFilter()" (selectionChange)="roleFilter.set($event.value); loadUsers()">
            <mat-option value="">All Roles</mat-option>
            <mat-option value="ADMIN">Admin</mat-option>
            <mat-option value="TEACHER">Teacher</mat-option>
            <mat-option value="STUDENT">Student</mat-option>
            <mat-option value="PARENT">Parent</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Subject</th><th>Status</th><th>ID</th><th>Actions</th>
            </tr></thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td class="name-cell">{{ u.firstName }} {{ u.lastName }}</td>
                  <td>{{ u.email }}</td>
                  <td><span class="role-chip role-{{u.role}}">{{ u.role }}</span></td>
                  <td>{{ u.subject ?? '—' }}</td>
                  <td>
                    <span class="status-dot" [class.active]="u.status === 'ACTIVE'" [class.inactive]="u.status !== 'ACTIVE'"></span>
                    {{ u.status }}
                  </td>
                  <td>{{ u.uniqueId ?? '—' }}</td>
                  <td>
                    <button mat-icon-button [matTooltip]="u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'" (click)="toggleStatus(u)">
                      <mat-icon>{{ u.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (users().length === 0) {
          <div class="empty"><mat-icon>people</mat-icon><p>No users found</p></div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .form-panel { background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px; margin-bottom: 20px; }
    .tab-content { padding: 16px 0 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .student-grid { grid-template-columns: 1fr 1fr 1fr; }
    .form-actions { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .err { color: #DC2626; font-size: 0.875rem; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .section-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin: 0 0 12px; }
    .qr-search-section { background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px; margin-bottom: 20px; }
    .qr-search-row { display: flex; gap: 12px; align-items: flex-start; }
    .qr-results { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin-top: 12px; }
    .qr-card { display: flex; align-items: center; gap: 12px; background: #F8FAFC; border-radius: 10px; padding: 12px; }
    .qr-info { display: flex; flex-direction: column; flex: 1; }
    .qr-id { font-size: 0.78rem; color: #6D28D9; font-weight: 600; }
    .qr-email { font-size: 0.78rem; color: #94A3B8; }
    .qr-img { width: 80px; height: 80px; border-radius: 8px; border: 1px solid #E2E8F0; }

    .controls-row { display: flex; gap: 12px; margin-bottom: 12px; }
    .search-field { flex: 1; }
    .filter-field { width: 180px; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
    .data-table td { padding: 12px 16px; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #F1F5F9; }
    .name-cell { font-weight: 600; color: #0F172A; }

    .role-chip { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .role-ADMIN { background: #FEF3C7; color: #D97706; }
    .role-TEACHER { background: #EDE9FE; color: #6D28D9; }
    .role-STUDENT { background: #E0F2FE; color: #0369A1; }
    .role-PARENT { background: #FCE7F3; color: #BE185D; }

    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .status-dot.active { background: #059669; }
    .status-dot.inactive { background: #DC2626; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly SUBJECTS = [
    'Mathematics', 'Science', 'English', 'Sinhala', 'Tamil',
    'Physics', 'Chemistry', 'Biology', 'Commerce', 'Economics',
    'ICT', 'History', 'Geography', 'Art', 'Music',
  ];

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly search = signal('');
  readonly roleFilter = signal('');

  // QR Search
  readonly qrQuery = signal('');
  readonly qrResults = signal<User[]>([]);

  // 3 separate forms
  readonly adminForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(1)]],
    lastName: ['', [Validators.required, Validators.minLength(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
  });

  readonly teacherForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(1)]],
    lastName: ['', [Validators.required, Validators.minLength(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    subject: ['', Validators.required],
  });

  readonly studentForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(1)]],
    lastName: ['', [Validators.required, Validators.minLength(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    subject: [''],
    birthYear: [null as number | null],
    grade: [''],
    classType: [''],
    medium: [''],
    classLocation: [''],
    parentName: [''],
    parentMobile: [''],
  });

  ngOnInit() {
    this.loadUsers();
  }

  onTabChange(_: number) {
    this.formError.set('');
  }

  loadUsers() {
    this.loading.set(true);
    const params: Record<string, string> = { page: '1', limit: '100' };
    if (this.search()) params['search'] = this.search();
    if (this.roleFilter()) params['role'] = this.roleFilter();

    this.api.get<any>('/tenant/users', params).subscribe({
      next: (r) => {
        console.log('GET users response:', r);
        const items = r.data?.data || r.data || [];
        this.users.set(Array.isArray(items) ? items : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.loading.set(false);
      },
    });
  }

  createUser(role: string, form: FormGroup) {
    if (form.invalid) return;
    this.saving.set(true);
    this.formError.set('');

    const body = { ...form.value, role };
    // Clean undefined/empty values
    Object.keys(body).forEach(k => { if (body[k] === '' || body[k] === null) delete body[k]; });
    body.role = role;

    this.api.post('/tenant/users', body).subscribe({
      next: () => { this.saving.set(false); form.reset(); this.loadUsers(); },
      error: (e) => { this.saving.set(false); this.formError.set(e?.error?.message ?? 'Failed'); },
    });
  }

  searchQr() {
    if (!this.qrQuery()) return;
    this.api.get<any>('/tenant/users/search-qr', { q: this.qrQuery() }).subscribe({
      next: (r) => {
        const items = r.data?.data || r.data || [];
        this.qrResults.set(Array.isArray(items) ? items : []);
      },
    });
  }

  toggleStatus(user: User) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.patch(`/tenant/users/${user.id}/status`, { status: newStatus }).subscribe({
      next: () => this.loadUsers(),
    });
  }
}
