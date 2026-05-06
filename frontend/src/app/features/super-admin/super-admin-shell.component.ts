import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthService } from '../../core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; }

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/super-admin' },
    { label: 'Tenants', icon: 'domain', route: '/super-admin/tenants' },
    { label: 'Users', icon: 'manage_accounts', route: '/super-admin/users' },
    { label: 'Billing', icon: 'receipt_long', route: '/super-admin/billing' },
    { label: 'Audit Logs', icon: 'security', route: '/super-admin/audit' },
    { label: 'Settings', icon: 'tune', route: '/super-admin/settings' },
];

@Component({
    selector: 'app-super-admin-shell',
    standalone: true,
    imports: [
        CommonModule, RouterLink, RouterLinkActive, RouterOutlet,
        MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule,
    ],
    template: `
    <div class="shell">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">🌐</span>
            @if (!sidebarCollapsed()) { <span class="logo-text">LearnHub</span> }
          </div>
          <button mat-icon-button class="collapse-btn"
                  (click)="sidebarCollapsed.set(!sidebarCollapsed())"
                  [matTooltip]="sidebarCollapsed() ? 'Expand' : 'Collapse'">
            <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        @if (!sidebarCollapsed()) {
          <div class="role-badge">
            <mat-icon>shield</mat-icon>
            <span>Super Admin</span>
          </div>
        }

        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.route === '/super-admin' }"
               [matTooltip]="sidebarCollapsed() ? item.label : ''"
               matTooltipPosition="right">
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!sidebarCollapsed()) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" [matMenuTriggerFor]="userMenu">
            <div class="avatar">{{ initials() }}</div>
            @if (!sidebarCollapsed()) {
              <div class="user-details">
                <span class="user-name">{{ fullName() }}</span>
                <span class="user-email">{{ email() }}</span>
              </div>
              <mat-icon class="menu-arrow">expand_less</mat-icon>
            }
          </div>
          <mat-menu #userMenu="matMenu" yPosition="above">
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon> Sign out
            </button>
          </mat-menu>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <button mat-icon-button class="mobile-menu-btn"
                    (click)="mobileOpen.set(!mobileOpen())">
              <mat-icon>menu</mat-icon>
            </button>
          </div>
          <div class="topbar-right">
            <span class="current-date">{{ currentDate }}</span>
          </div>
        </header>
        <main class="page-content"><router-outlet /></main>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100vh; }
    .shell { display: flex; height: 100vh; overflow: hidden; background: #F1F5F9; }

    /* Sidebar — deep slate/gray platform-owner accent */
    .sidebar {
      width: 260px; min-width: 260px;
      background: #0F172A;
      display: flex; flex-direction: column;
      transition: all 0.25s ease; overflow: hidden;
    }
    .sidebar.collapsed { width: 68px; min-width: 68px; }

    .sidebar-header {
      display: flex; align-items: center; padding: 0 12px;
      height: 64px; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .logo { display: flex; align-items: center; gap: 10px; flex: 1; }
    .logo-icon { font-size: 26px; }
    .logo-text { font-size: 1.2rem; font-weight: 700; color: white; letter-spacing: -0.3px; white-space: nowrap; }
    .collapse-btn { color: rgba(255,255,255,0.5) !important; }

    .role-badge {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      font-size: 0.75rem; color: #F472B6; font-weight: 600;
      letter-spacing: 0.5px; text-transform: uppercase;
    }
    .role-badge mat-icon { font-size: 16px; height: 16px; width: 16px; }

    .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: 8px; color: rgba(255,255,255,0.6);
      text-decoration: none; font-size: 0.875rem; font-weight: 500;
      transition: all 0.15s; white-space: nowrap;
    }
    .nav-item:hover { background: rgba(255,255,255,0.07); color: white; }
    .nav-item.active { background: #6D28D9; color: #EDE9FE; }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }

    .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.07); padding: 12px 8px; }
    .user-info { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
    .user-info:hover { background: rgba(255,255,255,0.07); }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #6D28D9; color: #EDE9FE; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-details { flex: 1; overflow: hidden; }
    .user-name { display: block; font-size: 0.875rem; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .menu-arrow { color: rgba(255,255,255,0.4); font-size: 18px; }

    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { height: 64px; background: white; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .current-date { font-size: 0.8rem; color: #94A3B8; }
    .mobile-menu-btn { display: none; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; }

    @media (max-width: 768px) { .sidebar { display: none; } .mobile-menu-btn { display: flex; } }
  `],
})
export class SuperAdminShellComponent {
    readonly navItems = NAV_ITEMS;
    readonly sidebarCollapsed = signal(false);
    readonly mobileOpen = signal(false);
    readonly currentDate = new Date().toLocaleDateString('en-LK', {
        weekday: 'short', month: 'short', day: 'numeric',
    });

    private readonly authState = inject(AuthStateService);
    private readonly authService = inject(AuthService);

    readonly fullName = this.authState.fullName;
    readonly email = computed(() => this.authState.user()?.email ?? '');
    readonly initials = computed(() => {
        const u = this.authState.user();
        return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
    });

    logout() { this.authService.logout(); }
}
