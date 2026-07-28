/**
 * @jest-environment node
 *
 * "Cannot read the balance" is not "the balance is zero".
 *
 * The defect this pins: `spendableCents` answered `number | null` and collapsed a
 * 401, a 403, a dead backend, a 200-with-no-amount and a genuine $0 into ONE null,
 * so every caller rendered all five as "$0.00 / add credits". A funded customer
 * with a stale session was told they were out of money — wrong, and it blamed them
 * for our failure. Each of those causes now reports itself.
 */
import { spendable, funded, knownCents } from '@/lib/billing/server';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/org/server', () => ({ cloudBase: () => 'https://api.example.test' }));

const asFetch = (impl: () => Promise<unknown>) => {
  (global as unknown as { fetch: unknown }).fetch = impl as unknown;
};

/** A gateway reply with a real HTTP status and an arbitrary JSON body. */
const reply = (status: number, body: unknown) =>
  asFetch(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('a balance that was READ', () => {
  it('reports real cents', async () => {
    reply(200, { available: 11179 });
    const s = await spendable('t');
    expect(s).toEqual({ state: 'ok', cents: 11179 });
    expect(funded(s)).toBe(true);
    expect(knownCents(s)).toBe(11179);
  });

  it('falls back to `balance` when `available` is absent', async () => {
    reply(200, { balance: 2500 });
    expect(await spendable('t')).toEqual({ state: 'ok', cents: 2500 });
  });

  it('a genuine zero is a real answer — and the ONLY thing that means "no credits"', async () => {
    reply(200, { available: 0 });
    const s = await spendable('t');
    expect(s).toEqual({ state: 'ok', cents: 0 });
    expect(funded(s)).toBe(false);
    expect(knownCents(s)).toBe(0);
  });
});

describe('a balance that could NOT be read never reads as zero', () => {
  it.each([
    [401, 'the session failed'],
    [403, 'the gateway refused the identity'],
  ])('%i is noauth, not an empty wallet — %s', async (status) => {
    reply(status, { error: 'sign in to view billing' });
    const s = await spendable('t');
    expect(s).toEqual({ state: 'noauth', status });
    // The distinction that matters: unfunded, but NOT because they are broke.
    expect(funded(s)).toBe(false);
    expect(knownCents(s)).toBeNull();
  });

  it.each([[500], [502], [404], [501]])('%i is unavailable — our fault, not theirs', async (status) => {
    reply(status, {});
    expect(await spendable('t')).toEqual({ state: 'unavailable', status });
  });

  it('an unreachable backend is unavailable, never zero', async () => {
    asFetch(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(await spendable('t')).toEqual({ state: 'unavailable', status: 0 });
  });

  it('a 200 carrying no amount is NOT a zero balance', async () => {
    // The live gateway answers some refusals 200-with-an-error-body; that is exactly
    // how a failure used to be laundered into "$0.00".
    reply(200, { status: 401, error: 'sign in to view billing' });
    expect(await spendable('t')).toEqual({ state: 'unavailable', status: 200 });
  });

  it('logs the status, so a broken token binding is visible instead of silent', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    reply(403, {});
    await spendable('t');
    expect(err).toHaveBeenCalledWith(expect.stringContaining('balance'), { status: 403 });
  });
});
