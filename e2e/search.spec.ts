import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should search for projects', async ({ page }) => {
    await page.goto('/search');
    
    await page.fill('input[name="q"]', 'education');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount(5, { timeout: 5000 });
  });

  test('should filter search results', async ({ page }) => {
    await page.goto('/search?q=volunteer');
    
    // Apply category filter
    await page.click('text=Category');
    await page.check('input[value="education"]');
    
    await expect(page).toHaveURL(/.*category=education/);
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount(3, { timeout: 5000 });
  });

  test('should search with no results', async ({ page }) => {
    await page.goto('/search');
    
    await page.fill('input[name="q"]', 'nonexistentproject12345');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=No results found')).toBeVisible();
  });

  test('should use autocomplete suggestions', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('edu');
    
    // Wait for suggestions
    await expect(page.locator('[data-testid="suggestion"]')).toHaveCount(3, { timeout: 2000 });
    
    // Click first suggestion
    await page.locator('[data-testid="suggestion"]').first().click();
    
    await expect(page).toHaveURL(/.*search/);
  });
});
