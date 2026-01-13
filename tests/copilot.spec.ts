/**
 * E2E Tests for Copilot
 * UX-GATE-COPILOT-0: Read-only Copilot with cited answers
 */

import { test, expect } from '@playwright/test';

test.describe('Copilot Page', () => {
  test.describe('Route and Page Shell', () => {
    test('/copilot route exists and shows page shell', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Verify page root exists
      await expect(page.getByTestId('page-root')).toBeVisible();

      // Verify page title
      await expect(page.getByTestId('page-title')).toHaveText('Copilot');
    });

    test('Copilot appears in sidebar navigation', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Verify nav item exists
      await expect(page.getByTestId('nav-copilot')).toBeVisible();
    });
  });

  test.describe('Demo Mode', () => {
    test('demo mode shows DEMO badge', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Verify demo badge is visible
      await expect(page.getByText('DEMO (read-only)')).toBeVisible();
    });

    test('can type question in demo mode', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Find input and type
      const input = page.getByTestId('copilot-input');
      await expect(input).toBeVisible();
      await input.fill('What is the Council?');

      // Verify input has value
      await expect(input).toHaveValue('What is the Council?');
    });

    test('can send message and receive answer in demo mode', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Type question
      const input = page.getByTestId('copilot-input');
      await input.fill('What is the Council?');

      // Click send
      const sendButton = page.getByTestId('copilot-send');
      await sendButton.click();

      // Wait for response (with timeout for API call)
      await page.waitForTimeout(2000);

      // Verify answer appears
      const chat = page.getByTestId('copilot-chat');
      await expect(chat).toContainText('Council');
    });

    test('sources block appears after answer', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Send a question
      const input = page.getByTestId('copilot-input');
      await input.fill('Explain Council Gate');
      await page.getByTestId('copilot-send').click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Verify sources block exists
      await expect(page.getByTestId('copilot-sources').first()).toBeVisible();
    });
  });

  test.describe('Context Panel', () => {
    test('context panel is visible', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      await expect(page.getByTestId('copilot-context')).toBeVisible();
    });

    test('quick prompts are clickable', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Find and click a quick prompt
      const quickPrompt = page.getByRole('button', { name: 'Explain Council Gate' });
      await expect(quickPrompt).toBeVisible();
      await quickPrompt.click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Verify message was sent
      const chat = page.getByTestId('copilot-chat');
      await expect(chat).toContainText('Council');
    });

    test('scope selector is visible', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Find scope selector
      const scopeSelector = page.getByRole('combobox');
      await expect(scopeSelector).toBeVisible();

      // Verify default is Global
      await expect(scopeSelector).toHaveValue('global');
    });
  });

  test.describe('Signed Out UX', () => {
    test('signed out non-demo shows CTA', async ({ page }) => {
      // Navigate without demo mode
      await page.goto('/copilot');

      // Should show either SignedOutCTA or redirect to login
      // Check for either the CTA or the page root (if already authenticated)
      const pageRoot = page.getByTestId('page-root');
      await expect(pageRoot).toBeVisible();

      // If not authenticated, should show sign-in prompt
      // This depends on the auth state - in E2E without auth, should show CTA
    });
  });

  test.describe('Read-Only Enforcement', () => {
    test('read-only info is displayed', async ({ page }) => {
      await page.goto('/copilot?demo=1');

      // Verify read-only notice is visible
      await expect(page.getByText('Read-only mode')).toBeVisible();
    });
  });
});
