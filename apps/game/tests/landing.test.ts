import { expect, test } from '@playwright/test';

test('landing page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('h1')).toContainText('MAINTAINER');
});

test('landing page has Enter Film Room button', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Enter Film Room' })).toBeVisible();
});
