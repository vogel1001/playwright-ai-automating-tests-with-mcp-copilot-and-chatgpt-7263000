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
