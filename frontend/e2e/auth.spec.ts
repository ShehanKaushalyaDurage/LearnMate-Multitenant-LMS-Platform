/**
 * LearnHub — E2E Auth Flow Tests (Playwright)
 *
 * Prerequisites:
 *   1. Backend running:  npm run start:dev  (in /backend)
 *   2. Frontend running: ng serve           (in /frontend)
 *   3. A test tenant "test-school" exists with admin user
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4200';
const TENANT_SLUG = 'test-school';
const ADMIN_EMAIL = 'admin@testschool.lk';
const ADMIN_PASS = 'Admin@1234';

// ── Login flow ────────────────────────────────────────────────────────

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/auth/login`);
    });

    test('renders branding panel and form', async ({ page }) => {
        await expect(page.locator('.brand-name')).toContainText('LearnHub');
        await expect(page.locator('.login-card')).toBeVisible();
    });

    test('step 1: requires institute ID', async ({ page }) => {
        // Continue button disabled with empty slug
        const btn = page.locator('button[type="submit"]').first();
        await expect(btn).toBeDisabled();
    });

    test('step 1: advances to step 2 after valid slug', async ({ page }) => {
        await page.fill('input[formControlName="slug"]', TENANT_SLUG);
        await page.click('button[type="submit"]');
        await expect(page.locator('h2')).toContainText('Welcome back');
    });

    test('step 2: shows error on wrong credentials', async ({ page }) => {
        await page.fill('input[formControlName="slug"]', TENANT_SLUG);
        await page.click('button[type="submit"]');
        await page.fill('input[formControlName="email"]', 'wrong@email.com');
        await page.fill('input[formControlName="password"]', 'wrongpass');
        await page.click('button[type="submit"]');
        await expect(page.locator('.error-banner')).toBeVisible();
        await expect(page.locator('.error-banner')).toContainText('Invalid email or password');
    });

    test('platform admin toggle switches to platform login mode', async ({ page }) => {
        await expect(page.locator('.platform-toggle')).toBeVisible();
        await page.click('.platform-toggle');
        await expect(page.locator('h2')).toContainText('Platform Admin Sign-In');
    });

    test('successful admin login redirects to /admin', async ({ page }) => {
        await page.fill('input[formControlName="slug"]', TENANT_SLUG);
        await page.click('button[type="submit"]');
        await page.fill('input[formControlName="email"]', ADMIN_EMAIL);
        await page.fill('input[formControlName="password"]', ADMIN_PASS);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/admin/);
    });
});

// ── Admin Dashboard ───────────────────────────────────────────────────

test.describe('Admin Portal', () => {
    test.beforeEach(async ({ page }) => {
        // Quick login helper
        await page.goto(`${BASE}/auth/login`);
        await page.fill('input[formControlName="slug"]', TENANT_SLUG);
        await page.click('button[type="submit"]');
        await page.fill('input[formControlName="email"]', ADMIN_EMAIL);
        await page.fill('input[formControlName="password"]', ADMIN_PASS);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);
    });

    test('dashboard shows stat cards', async ({ page }) => {
        await expect(page.locator('.stat-card').first()).toBeVisible();
    });

    test('sidebar navigates to Users page', async ({ page }) => {
        await page.click('a[href*="/admin/users"]');
        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.locator('h1')).toContainText('Users');
    });

    test('sidebar navigates to Fees page', async ({ page }) => {
        await page.click('a[href*="/admin/fees"]');
        await expect(page).toHaveURL(/\/admin\/fees/);
        await expect(page.locator('h1')).toContainText('Fees');
    });
});

// ── Logout ────────────────────────────────────────────────────────────

test.describe('Logout', () => {
    test('logout button clears session and redirects to login', async ({ page }) => {
        await page.goto(`${BASE}/auth/login`);
        await page.fill('input[formControlName="slug"]', TENANT_SLUG);
        await page.click('button[type="submit"]');
        await page.fill('input[formControlName="email"]', ADMIN_EMAIL);
        await page.fill('input[formControlName="password"]', ADMIN_PASS);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin/);
        // Click logout in sidebar
        await page.click('button[title="Sign out"], button:has-text("Sign out")');
        await expect(page).toHaveURL(/\/auth\/login/);
    });
});
