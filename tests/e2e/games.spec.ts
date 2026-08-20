import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Visual e2e for the games surface: real navigation + interactions, screenshots
// saved to tests/e2e/screenshots. Asserts the catalog renders cards, a detail
// page opens with its hooks, and the WebGL player mounts a live <canvas>.
//
// THE INDEX LIVES UNDER /templates NOW. `/games` 307s to
// `/templates?category=Games` — one library, filtered — while `/games/<id>` and
// its /play route stayed where they were. The two tests below looked for an `h1`
// reading "Games" and a `game-card` testid on a page that no longer exists, so
// they failed on a product decision rather than a defect. What they GUARANTEE is
// unchanged and still worth holding: the catalog shows real games, and picking
// the category narrows the library rather than emptying it.

const SHOTS = path.join(__dirname, 'screenshots');
test.beforeAll(() => fs.mkdirSync(SHOTS, { recursive: true }));

const shot = (name: string) => path.join(SHOTS, name);

test.describe('Games surface', () => {
  test('catalog lists >= 6 game cards', async ({ page }) => {
    await page.goto('/games');
    // The redirect is the contract: /games is an alias for the filtered library.
    await expect(page).toHaveURL(/\/templates\?category=Games/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const cards = page.getByRole('button', { name: /^Preview / });
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(6);

    await page.screenshot({ path: shot('games-catalog.png'), fullPage: true });
  });

  test('genre filter narrows the grid', async ({ page }) => {
    // Start from the WHOLE library so narrowing is observable — arriving via
    // /games already has Games selected and there would be nothing to narrow.
    await page.goto('/templates');
    const cards = page.getByRole('button', { name: /^Preview / });
    // Wait for the grid before counting it. This read raced hydration exactly
    // like the click below, and the failure it produced was unreadable: `all`
    // came back 0, so the assertion became `expect(28).toBeLessThan(0)` — a
    // filter that had in fact worked, reported as an impossible expectation.
    await expect(cards.first()).toBeVisible();
    const all = await cards.count();
    expect(all).toBeGreaterThan(0);
    const fps = page.getByRole('button', { name: 'Games', exact: true });

    // Retry the click until it narrows the grid: a click that lands before React
    // finishes hydrating the button has no effect, so re-click until it takes
    // (setGenre is idempotent). The filter logic itself is deterministic.
    await expect(async () => {
      await fps.click({ timeout: 3000 });
      const n = await cards.count();
      expect(n).toBeLessThan(all);
      expect(n).toBeGreaterThan(0);
    }).toPass({ intervals: [250, 500, 1000], timeout: 20000 });

    await page.screenshot({ path: shot('games-filtered.png'), fullPage: true });
  });

  test('detail page shows engine, targets, and both generative hooks', async ({ page }) => {
    await page.goto('/games/unity-red-runner');
    await expect(page.getByRole('heading', { name: 'Red Runner', level: 1 })).toBeVisible();

    // Studio generative hook links out with the URL contract (carries the game id).
    const studio = page.getByRole('link', { name: /Generate assets in Studio/i });
    await expect(studio).toBeVisible();
    const studioHref = await studio.getAttribute('href');
    expect(studioHref).toContain('studio.hanzo.ai');
    expect(studioHref).toContain('game=unity-red-runner');

    // Builder hook is a real prompt box routing to /dev with repo context.
    await expect(page.getByTestId('builder-prompt')).toBeVisible();

    await page.screenshot({ path: shot('game-detail.png'), fullPage: true });
  });

  test('unreal desktop title shows no play button (honest, no fake UI)', async ({ page }) => {
    await page.goto('/games/ue-lyra');
    await expect(page.getByRole('heading', { name: 'Lyra Starter Game', level: 1 })).toBeVisible();
    await expect(page.getByTestId('play-button')).toHaveCount(0);
    await expect(page.getByText(/no in-browser build/i)).toBeVisible();
  });

  test('WebGL player mounts a live canvas', async ({ page }) => {
    // Detail -> Play, exercising the real interaction path.
    await page.goto('/games/unity-red-runner');
    await page.getByTestId('play-button').click();
    await expect(page).toHaveURL(/\/games\/unity-red-runner\/play/);

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
