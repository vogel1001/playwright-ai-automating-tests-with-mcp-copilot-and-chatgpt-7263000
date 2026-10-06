import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'users.json'), 'utf-8')
);
const { username, password } = users[0];

test('login and create a new bug', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/board$/);

  await page.getByRole('button', { name: 'New Bug' }).click();

  const title = `Login button unresponsive on Safari ${Math.floor(Math.random() * 1_000_000)}`;
  const dialog = page.getByRole('dialog', { name: 'Create bug' });
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Severity').selectOption('high');
  await dialog.getByLabel('Owner').fill(username);
  await dialog.getByLabel('Description').fill('Clicking the login button does nothing in Safari 17.');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(title)).toBeVisible();
});

test('edit the first bug in the list and keep it at the top', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/board$/);

  const firstRow = page.locator('table[aria-label="Bugs"] tbody tr[role="button"]').first();
  await expect(firstRow).toBeVisible();

  const originalTitle = (await firstRow.locator('td').nth(2).textContent())?.trim() ?? '';
  const words = originalTitle.trim().split(/\s+/);
  const lastWord = words.length ? words[words.length - 1] : 'item';
  const randomWord = `widget${Math.floor(Math.random() * 100000)}`;
  const updatedTitle = `${words.slice(0, -1).join(' ')} ${randomWord}`.trim();

  await firstRow.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title').fill(updatedTitle);
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();

  const updatedFirstRow = page.locator('table[aria-label="Bugs"] tbody tr[role="button"]').first();
  await expect(updatedFirstRow).toContainText(updatedTitle);
  await expect(updatedFirstRow.locator('td').nth(2)).toContainText(updatedTitle);
  await expect(updatedFirstRow.locator('td').nth(2)).not.toContainText(lastWord);
});

test('searching for pickle shows no results', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/board$/);

  const search = page.getByRole('search', { name: 'Search bugs by title' });
  await search.fill('pickle');

  await expect(page.getByText('No bugs matched.')).toBeVisible();
  await expect(page.getByText('pickle')).not.toBeVisible();
});

test('logs in, logs out, and returns to the login page', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/board$/);
  await page.getByRole('button', { name: 'Logout' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('logs in, closes the last bug, and verifies it shows in the closed list', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/board$/);

  const lastBug = page.locator('table[aria-label="Bugs"] tbody tr[role="button"]').last();
  await expect(lastBug).toBeVisible();

  const bugTitle = (await lastBug.locator('td').nth(2).textContent())?.trim();
  await lastBug.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('State').selectOption('closed');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Closed' }).click();
  await expect(page.getByText('No bugs matched.')).not.toBeVisible();
  await expect(page.getByRole('table', { name: 'Bugs' })).toContainText(bugTitle ?? '');
});
