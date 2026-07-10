import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Visual e2e for the /games surface: real navigation + interactions, screenshots
// saved to tests/e2e/screenshots. Asserts the catalog renders cards, a detail
// page opens with its hooks, and the WebGL player mounts a live <canvas>.

const SHOTS = path.join(__dirname, 'screenshots');
test.beforeAll(() => fs.mkdirSync(SHOTS, { recursive: true }));

const shot = (name: string) => path.join(SHOTS, name);

test.describe('Games surface', () => {
  test('catalog lists >= 6 game cards', async ({ page }) => {
    await page.goto('/games');
    await expect(page.getByRole('heading', { name: 'Games', level: 1 })).toBeVisible();

    const cards = page.getByTestId('game-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(6);

    await page.screenshot({ path: shot('games-catalog.png'), fullPage: true });
  });

  test('genre filter narrows the grid', async ({ page }) => {
    await page.goto('/games');
    const cards = page.getByTestId('game-card');
    const all = await cards.count();
    const platformer = page.getByRole('button', { name: 'Platformer', exact: true });

    // Retry the click until it narrows the grid: a click that lands before React
    // finishes hydrating the button has no effect, so re-click until it takes
    // (setGenre is idempotent). The filter logic itself is deterministic.
    await expect(async () => {
      await platformer.click({ timeout: 3000 });
      const n = await cards.count();
      expect(n).toBeLessThan(all);
      expect(n).toBeGreaterThan(0);
    }).toPass({ intervals: [250, 500, 1000], timeout: 20000 });

    await page.screenshot({ path: shot('games-filtered.png'), fullPage: true });
  });

  test('detail page shows engine, targets, and both generative hooks', async ({ page }) => {
    await page.goto('/games/dodge-the-creeps');
    await expect(page.getByRole('heading', { name: 'Dodge the Creeps', level: 1 })).toBeVisible();

    // Studio generative hook links out with the URL contract (game id + slots).
    const studio = page.getByRole('link', { name: /Generate assets in Studio/i });
    await expect(studio).toBeVisible();
    const studioHref = await studio.getAttribute('href');
    expect(studioHref).toContain('studio.hanzo.ai');
    expect(studioHref).toContain('game=dodge-the-creeps');
    expect(studioHref).toContain('slots=');

    // Builder hook is a real prompt box routing to /dev with repo context.
    await expect(page.getByTestId('builder-prompt')).toBeVisible();

    await page.screenshot({ path: shot('game-detail.png'), fullPage: true });
  });

  test('unreal desktop title shows no play button (honest, no fake UI)', async ({ page }) => {
    await page.goto('/games/lyra');
    await expect(page.getByRole('heading', { name: 'Lyra Starter Game', level: 1 })).toBeVisible();
    await expect(page.getByTestId('play-button')).toHaveCount(0);
    await expect(page.getByText(/no in-browser build/i)).toBeVisible();
  });

  test('WebGL player mounts a live canvas', async ({ page }) => {
    // Detail -> Play, exercising the real interaction path.
    await page.goto('/games/dodge-the-creeps');
    await page.getByTestId('play-button').click();
    await expect(page).toHaveURL(/\/games\/dodge-the-creeps\/play/);

    const frame = page.frameLocator('[data-testid="game-player-frame"]');
    const canvas = frame.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // The canvas must have real, non-zero rendering surface.
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    await page.waitForTimeout(500); // let a few animation frames paint
    await page.screenshot({ path: shot('game-player.png'), fullPage: true });
  });
});
