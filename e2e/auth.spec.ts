import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    
    const timestamp = Date.now();
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    await page.selectOption('select[name="role"]', 'volunteer');
    
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
  });

  test('should reset password', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });
});
