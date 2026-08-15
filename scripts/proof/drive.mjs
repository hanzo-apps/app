// Live-site flow driver. Real Chrome, real network, real screenshots.
// Node resolves from THIS file's dir, so it lives in the repo (probe scripts
// must live in the repo — a scratchpad script cannot see node_modules).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.PROOF_BASE || 'https://hanzo.app';
export const SHOTS = process.env.PROOF_SHOTS || path.resolve(process.cwd(), 'test-results/proof');
export const AUTH = path.join(SHOTS, '.auth.json');

export const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

fs.mkdirSync(SHOTS, { recursive: true });

export async function browser() {
  return chromium.launch({ channel: 'chrome', headless: true });
}

export async function ctx(b, { size = 'desktop', authed = false } = {}) {
  return b.newContext({
    viewport: VIEWPORTS[size],
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    ...(authed && fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
  });
}

/** Screenshot to a named file; returns the absolute path. */
export async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

export async function shotFull(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/** Console + network error collector — a screenshot alone hides a 500. */
export function watch(page) {
  const errs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => errs.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).pathname !== '/favicon.ico')
      errs.push(`${r.status()} ${r.url().slice(0, 160)}`);
  });
  return errs;
}

export const settle = (page, ms = 1200) => page.waitForTimeout(ms);

export function log(...a) {
  console.log(...a);
}
