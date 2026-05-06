import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-root">

      <!-- Left panel: branding -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="brand-icon">🎓</span>
          </div>
          <h1 class="brand-name">LearnHub</h1>
          <p class="brand-tagline">
            The all-in-one LMS for Sri Lankan<br>educational institutes.
          </p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">📚</span>
              <span>Courses &amp; Batches</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span>Attendance &amp; Grades</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💳</span>
              <span>Fee Management</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>Exams &amp; Certificates</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel: form -->
      <div class="login-form-panel">
        <div class="login-card">
          <!-- Step indicator -->
          <div class="steps">
            <div class="step" [class.active]="step() === 1" [class.done]="step() > 1">
              <span class="step-num">1</span>
              <span class="step-label">Institute</span>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="step() === 2">
              <span class="step-num">2</span>
              <span class="step-label">Sign In</span>
            </div>
          </div>

          <!-- Step 1: Tenant slug OR Platform Admin login -->
          @if (step() === 1) {
            <div class="form-step">
              <h2 class="form-title">
                @if (superAdminMode()) { Platform Admin Sign-In } @else { Find your institute }
              </h2>
              <p class="form-subtitle">
                @if (superAdminMode()) {
                  Sign in with your LearnHub platform credentials.
                } @else {
                  Enter the unique ID of your educational institute.
                }
              </p>

              @if (superAdminMode()) {
                <!-- Platform admin: show email + password directly, no slug -->
                @if (errorMessage()) {
                  <div class="error-banner">
                    <mat-icon>error_outline</mat-icon>
                    {{ errorMessage() }}
                  </div>
                }
                <form [formGroup]="credForm" (ngSubmit)="login()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email address</mat-label>
                    <mat-icon matPrefix>email</mat-icon>
                    <input matInput formControlName="email" type="email"
                           placeholder="admin@learnhub.lk"
                           autocomplete="email" />
                    @if (credForm.get('email')?.hasError('email') && credForm.get('email')?.touched) {
                      <mat-error>Valid email required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Password</mat-label>
                    <mat-icon matPrefix>lock</mat-icon>
                    <input matInput formControlName="password"
                           [type]="showPassword() ? 'text' : 'password'"
                           autocomplete="current-password" />
                    <button mat-icon-button matSuffix type="button"
                            (click)="showPassword.set(!showPassword())">
                      <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (credForm.get('password')?.hasError('required') && credForm.get('password')?.touched) {
                      <mat-error>Password is required</mat-error>
                    }
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit"
                          class="submit-btn"
                          [disabled]="credForm.invalid || loading()">
                    @if (loading()) {
                      <ng-container>
                        <mat-spinner diameter="20"></mat-spinner><span>Signing in...</span>
                      </ng-container>
                    } @else {
                      <ng-container>
                        <mat-icon>shield</mat-icon> Sign in as Platform Admin
                      </ng-container>
                    }
                  </button>
                </form>
              } @else {
                <!-- Normal tenant flow: slug → next step -->
                <form [formGroup]="slugForm" (ngSubmit)="nextStep()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Institute ID</mat-label>
                    <mat-icon matPrefix>business</mat-icon>
                    <input matInput formControlName="slug"
                           placeholder="e.g. sunrise-academy"
                           autocomplete="organization" />
                    @if (slugForm.get('slug')?.hasError('required') && slugForm.get('slug')?.touched) {
                      <mat-error>Institute ID is required</mat-error>
                    }
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit"
                          class="submit-btn"
                          [disabled]="slugForm.invalid || loading()">
                    <ng-container>
                      Continue <mat-icon>arrow_forward</mat-icon>
                    </ng-container>
                  </button>
                </form>

                <p class="help-text">
                  Your institute ID is provided by your admin.<br>
                  Example: <code>sunrise-academy</code>
                </p>
              }

              <!-- Platform admin mode toggle -->
              <button type="button" class="platform-toggle"
                      (click)="togglePlatformMode()">
                @if (superAdminMode()) {
                  ← Back to institute login
                } @else {
                  🔐 Platform admin sign-in
                }
              </button>
            </div>
          }

          <!-- Step 2: Credentials -->
          @if (step() === 2) {
            <div class="form-step">
              <div class="institute-badge">
                <mat-icon>business</mat-icon>
                <span>{{ slugForm.get('slug')?.value }}</span>
                <button mat-icon-button (click)="goBack()" title="Change institute">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>

              <h2 class="form-title">Welcome back</h2>
              <p class="form-subtitle">Sign in to your account.</p>

              @if (errorMessage()) {
                <div class="error-banner">
                  <mat-icon>error_outline</mat-icon>
                  {{ errorMessage() }}
                </div>
              }

              <form [formGroup]="credForm" (ngSubmit)="login()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email address</mat-label>
                  <mat-icon matPrefix>email</mat-icon>
                  <input matInput formControlName="email" type="email"
                         placeholder="you@institute.lk"
                         autocomplete="email" />
                  @if (credForm.get('email')?.hasError('email') && credForm.get('email')?.touched) {
                    <mat-error>Valid email required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Password</mat-label>
                  <mat-icon matPrefix>lock</mat-icon>
                  <input matInput formControlName="password"
                         [type]="showPassword() ? 'text' : 'password'"
                         autocomplete="current-password" />
                  <button mat-icon-button matSuffix type="button"
                          (click)="showPassword.set(!showPassword())">
                    <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  @if (credForm.get('password')?.hasError('required') && credForm.get('password')?.touched) {
                    <mat-error>Password is required</mat-error>
                  }
                </mat-form-field>

                <button mat-flat-button color="primary" type="submit"
                        class="submit-btn"
                        [disabled]="credForm.invalid || loading()">
                  @if (loading()) {
                    <ng-container>
                      <mat-spinner diameter="20"></mat-spinner>
                      <span>Signing in...</span>
                    </ng-container>
                  } @else {
                    <ng-container>
                      <mat-icon>login</mat-icon>
                      <span>Sign in</span>
                    </ng-container>
                  }
                </button>
              </form>
            </div>
          }
        </div>

        <p class="footer-copy">© {{ currentYear }} LearnHub · Built for Sri Lanka 🇱🇰</p>
      </div>
    </div>
  `,
  styles: [`
    .login-root {
      display: flex;
      min-height: 100vh;
      font-family: 'Roboto', sans-serif;
    }

    /* ---- Brand panel ---- */
    .login-brand {
      flex: 0 0 42%;
      background: linear-gradient(145deg, #1E3A8A 0%, #1E40AF 45%, #7C3AED 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }

    .login-brand::before {
      content: '';
      position: absolute;
      width: 400px; height: 400px;
      background: rgba(255,255,255,0.04);
      border-radius: 50%;
      top: -100px; right: -100px;
    }
    .login-brand::after {
      content: '';
      position: absolute;
      width: 300px; height: 300px;
      background: rgba(255,255,255,0.04);
      border-radius: 50%;
      bottom: -60px; left: -60px;
    }

    .brand-content { color: white; z-index: 1; }

    .brand-logo {
      width: 80px; height: 80px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .brand-icon { font-size: 40px; }

    .brand-name {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 12px;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 1.05rem;
      opacity: 0.85;
      line-height: 1.6;
      margin-bottom: 40px;
    }

    .brand-features { display: flex; flex-direction: column; gap: 16px; }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.95rem;
    }

    .feature-icon { font-size: 20px; }

    /* ---- Form panel ---- */
    .login-form-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #F8FAFC;
      padding: 48px 32px;
    }

    .login-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
      border: 1px solid #E2E8F0;
    }

    /* ---- Steps ---- */
    .steps {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 32px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-num {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #E2E8F0;
      color: #94A3B8;
      font-size: 13px;
      font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }

    .step.active .step-num {
      background: #1E40AF;
      color: white;
    }

    .step.done .step-num {
      background: #059669;
      color: white;
    }

    .step-label {
      font-size: 13px;
      font-weight: 500;
      color: #94A3B8;
    }

    .step.active .step-label,
    .step.done .step-label {
      color: #0F172A;
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: #E2E8F0;
      margin: 0 12px;
    }

    /* ---- Form ---- */
    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 6px;
    }

    .form-subtitle {
      font-size: 0.9rem;
      color: #64748B;
      margin: 0 0 24px;
    }

    .full-width { width: 100%; margin-bottom: 16px; }

    .submit-btn {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 10px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }

    .institute-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 20px;
      color: #1E40AF;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .institute-badge mat-icon { font-size: 18px; height: 18px; width: 18px; }
    .institute-badge span { flex: 1; }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .help-text {
      font-size: 0.8rem;
      color: #94A3B8;
      text-align: center;
      margin-top: 20px;
      line-height: 1.6;
    }

    code {
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #1E40AF;
    }

    .footer-copy {
      margin-top: 24px;
      font-size: 0.8rem;
      color: #94A3B8;
      text-align: center;
    }

    /* Responsive: stack on mobile */
    @media (max-width: 768px) {
      .login-root { flex-direction: column; }
      .login-brand { flex: none; padding: 32px 24px; min-height: 200px; }
      .brand-features { display: none; }
      .login-form-panel { padding: 32px 16px; }
      .login-card { padding: 28px 20px; }
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly step = signal(1);
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');
  readonly superAdminMode = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly slugForm = this.fb.group({
    slug: ['', Validators.required],
  });

  readonly credForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  togglePlatformMode() {
    this.superAdminMode.update(v => !v);
    this.errorMessage.set('');
    this.slugForm.reset();
    this.credForm.reset();
  }

  nextStep() {
    if (this.slugForm.valid) {
      this.step.set(2);
      this.errorMessage.set('');
    }
  }

  goBack() {
    this.step.set(1);
    this.errorMessage.set('');
  }

  login() {
    if (this.credForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.credForm.value;

    if (this.superAdminMode()) {
      // Platform admin login — no slug
      this.authService.platformLogin(email!, password!).subscribe({
        error: (err) => {
          this.loading.set(false);
          const status = err?.status;
          this.errorMessage.set(
            status === 401 ? 'Invalid platform credentials.' :
              err?.error?.message ?? 'Sign-in failed. Please try again.',
          );
        },
        complete: () => this.loading.set(false),
      });
      return;
    }

    const slug = this.slugForm.get('slug')!.value!;
    this.authService.login(slug, email!, password!).subscribe({
      error: (err) => {
        this.loading.set(false);
        const status = err?.status;
        this.errorMessage.set(
          status === 401 ? 'Invalid email or password. Please try again.' :
            status === 404 ? 'Institute not found. Check the institute ID.' :
              err?.error?.message ?? 'Sign-in failed. Please try again.',
        );
      },
      complete: () => this.loading.set(false),
    });
  }
}
