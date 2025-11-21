import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as NGO user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ngo@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create new project', async ({ page }) => {
    await page.goto('/projects/new');
    
    await page.fill('input[name="title"]', 'Community Garden Project');
    await page.fill('textarea[name="description"]', 'A community garden to grow fresh vegetables');
    await page.selectOption('select[name="category"]', 'environment');
    await page.fill('input[name="location"]', 'Karachi, Pakistan');
    await page.fill('input[name="duration"]', '6');
    await page.fill('input[name="volunteersNeeded"]', '20');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Project created successfully')).toBeVisible();
    await expect(page).toHaveURL(/.*projects\/\w+/);
  });

  test('should list all projects', async ({ page }) => {
    await page.goto('/projects');
    
    await expect(page.locator('h1')).toContainText('Projects');
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(3, { timeout: 5000 });
  });

  test('should view project details', async ({ page }) => {
    await page.goto('/projects');
    
    // Click on first project
    await page.locator('[data-testid="project-card"]').first().click();
    
    await expect(page).toHaveURL(/.*projects\/\w+/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
  });

  test('should edit project', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('[data-testid="project-card"]').first().click();
    
    await page.click('button:has-text("Edit")');
    
    await page.fill('input[name="title"]', 'Updated Project Title');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Project updated successfully')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Updated Project Title');
  });

  test('should delete project', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('[data-testid="project-card"]').first().click();
    
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=Project deleted successfully')).toBeVisible();
    await expect(page).toHaveURL('/projects');
  });

  test('should apply to project as volunteer', async ({ page }) => {
    // Logout and login as volunteer
    await page.click('button:has-text("Logout")');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'volunteer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/projects');
    await page.locator('[data-testid="project-card"]').first().click();
    
    await page.click('button:has-text("Apply")');
    
    await page.fill('textarea[name="message"]', 'I would love to volunteer for this project');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Application submitted')).toBeVisible();
  });
});
