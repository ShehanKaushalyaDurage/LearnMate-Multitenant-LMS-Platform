import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

interface SettingSection { title: string; icon: string; key: string; }

@Component({
    selector: 'app-super-admin-settings',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatIconModule, MatButtonModule,
        MatFormFieldModule, MatInputModule, MatSlideToggleModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Platform Settings</h1>
        <p class="page-sub">Global configuration for LearnHub SaaS</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="settings-grid">

        <!-- Platform Identity -->
        <div class="setting-card">
          <div class="sc-header">
            <div class="sc-icon" style="background:#F5F3FF;color:#6D28D9"><mat-icon>public</mat-icon></div>
            <h3 class="sc-title">Platform Identity</h3>
          </div>
          <form [formGroup]="identityForm" class="sc-form">
            <mat-form-field appearance="outline">
              <mat-label>Platform Name</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Root Domain</mat-label>
              <input matInput formControlName="domain" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Support Email</mat-label>
              <input matInput formControlName="supportEmail" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="button" (click)="save('identity')">
              <mat-icon>save</mat-icon> Save
            </button>
          </form>
        </div>

        <!-- Tenant Defaults -->
        <div class="setting-card">
          <div class="sc-header">
            <div class="sc-icon" style="background:#EFF6FF;color:#1E40AF"><mat-icon>domain</mat-icon></div>
            <h3 class="sc-title">Tenant Defaults</h3>
          </div>
          <form [formGroup]="tenantForm" class="sc-form">
            <mat-form-field appearance="outline">
              <mat-label>Default Plan</mat-label>
              <input matInput formControlName="defaultPlan" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Trial Duration (days)</mat-label>
              <input matInput type="number" formControlName="trialDays" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="button" (click)="save('tenant')">
              <mat-icon>save</mat-icon> Save
            </button>
          </form>
        </div>

        <!-- Feature Flags -->
        <div class="setting-card">
          <div class="sc-header">
            <div class="sc-icon" style="background:#ECFDF5;color:#059669"><mat-icon>toggle_on</mat-icon></div>
            <h3 class="sc-title">Feature Flags</h3>
          </div>
          <div class="toggle-list">
            @for (f of features(); track f.key) {
              <div class="toggle-row">
                <div>
                  <div class="toggle-label">{{ f.label }}</div>
                  <div class="toggle-sub">{{ f.description }}</div>
                </div>
                <mat-slide-toggle [checked]="f.enabled" (change)="f.enabled = $event.checked" color="primary"></mat-slide-toggle>
              </div>
            }
          </div>
          <button mat-flat-button color="primary" type="button" (click)="save('features')">
            <mat-icon>save</mat-icon> Save
          </button>
        </div>

        <!-- Notifications -->
        <div class="setting-card">
          <div class="sc-header">
            <div class="sc-icon" style="background:#FFFBEB;color:#D97706"><mat-icon>notifications</mat-icon></div>
            <h3 class="sc-title">Notifications</h3>
          </div>
          <form [formGroup]="notifForm" class="sc-form">
            <mat-form-field appearance="outline">
              <mat-label>SMTP Host</mat-label>
              <input matInput formControlName="smtpHost" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>SMTP Port</mat-label>
              <input matInput type="number" formControlName="smtpPort" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sender Email</mat-label>
              <input matInput formControlName="senderEmail" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="button" (click)="save('notif')">
              <mat-icon>save</mat-icon> Save
            </button>
          </form>
        </div>

      </div>

      }

      @if (saved()) {
        <div class="toast">✅ Settings saved</div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1100px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }

    .settings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .setting-card { background: white; border-radius: 14px; border: 1px solid #E2E8F0; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .sc-header { display: flex; align-items: center; gap: 12px; }
    .sc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .sc-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .sc-form { display: flex; flex-direction: column; gap: 0; }
    .sc-form mat-form-field { width: 100%; }

    .toggle-list { display: flex; flex-direction: column; gap: 12px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #F8FAFC; padding-bottom: 10px; }
    .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
    .toggle-label { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .toggle-sub { font-size: 0.75rem; color: #94A3B8; }

    .toast { position: fixed; bottom: 24px; right: 24px; background: #0F172A; color: white; padding: 12px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 600; animation: fadeIn 0.3s; z-index: 1000; }
    .loading-center { display: flex; justify-content: center; padding: 100px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class SuperAdminSettingsComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(ApiService);
    readonly saved = signal(false);
    readonly loading = signal(true);

    readonly identityForm = this.fb.group({
        name: [''],
        domain: [''],
        supportEmail: [''],
    });

    readonly tenantForm = this.fb.group({
        defaultPlan: [''],
        trialDays: [0],
    });

    readonly notifForm = this.fb.group({
        smtpHost: [''],
        smtpPort: [0],
        senderEmail: [''],
    });

    readonly features = signal([
        { key: ' Exams', label: 'Online Exams', description: 'Enable exam module for tenants', enabled: false },
        { key: 'Certificates', label: 'Certificates', description: 'Auto-issue completion certificates', enabled: false },
        { key: 'Parent Portal', label: 'Parent Portal', description: 'Allow parent access', enabled: false },
        { key: 'Live Classes', label: 'Live Classes', description: 'Video conferencing integration', enabled: false },
        { key: 'Custom Domains', label: 'Custom Domains', description: 'Tenant custom domain mapping', enabled: false },
    ]);

    ngOnInit() {
        this.load();
    }

    load() {
        this.api.get<{ data: any[] }>('/platform/settings').subscribe({
            next: (r) => {
                const data = r.data;
                this.patchForms(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    private patchForms(settings: any[]) {
        const find = (key: string) => settings.find(s => s.key === key)?.value;

        this.identityForm.patchValue({
            name: find('identity:name') || 'LearnHub',
            domain: find('identity:domain') || 'learnhub.lk',
            supportEmail: find('identity:supportEmail') || 'support@learnhub.lk',
        });

        this.tenantForm.patchValue({
            defaultPlan: find('tenant:defaultPlan') || 'TRIAL',
            trialDays: Number(find('tenant:trialDays')) || 30,
        });

        this.notifForm.patchValue({
            smtpHost: find('notif:smtpHost') || 'smtp.sendgrid.net',
            smtpPort: Number(find('notif:smtpPort')) || 587,
            senderEmail: find('notif:senderEmail') || 'noreply@learnhub.lk',
        });

        this.features.update(fs => fs.map(f => ({
            ...f,
            enabled: find(`feature:${f.key}`) === 'true'
        })));
    }

    save(section: string) {
        let payload: any[] = [];

        if (section === 'identity') {
            const v = this.identityForm.value;
            payload = [
                { key: 'identity:name', value: v.name, category: 'identity' },
                { key: 'identity:domain', value: v.domain, category: 'identity' },
                { key: 'identity:supportEmail', value: v.supportEmail, category: 'identity' },
            ];
        } else if (section === 'tenant') {
            const v = this.tenantForm.value;
            payload = [
                { key: 'tenant:defaultPlan', value: v.defaultPlan, category: 'tenant' },
                { key: 'tenant:trialDays', value: String(v.trialDays), category: 'tenant' },
            ];
        } else if (section === 'notif') {
            const v = this.notifForm.value;
            payload = [
                { key: 'notif:smtpHost', value: v.smtpHost, category: 'notifications' },
                { key: 'notif:smtpPort', value: String(v.smtpPort), category: 'notifications' },
                { key: 'notif:senderEmail', value: v.senderEmail, category: 'notifications' },
            ];
        } else if (section === 'features') {
            payload = this.features().map(f => ({
                key: `feature:${f.key}`,
                value: String(f.enabled),
                category: 'features'
            }));
        }

        this.api.patch('/platform/settings', { settings: payload }).subscribe(() => {
            this.saved.set(true);
            setTimeout(() => this.saved.set(false), 2500);
        });
    }
}
