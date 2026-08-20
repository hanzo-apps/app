/**
 * How long ago, said once. (Money is next door in `lib/money.ts`.)
 *
 * There were two of these — `lib/projects-view.ts` and `lib/api/git.ts` — and
 * they disagreed about the same instant. Measured: something 90 minutes old read
 * "2 hours ago" on the projects table and "updated 1h ago" under a repo, because
 * one rounded and the other floored. A reader with both screens open sees the
 * product contradict itself about a fact it fetched from one row.
 *
 * FLOOR, never round. "2 hours ago" for something 90 minutes old claims more
 * elapsed time than has actually passed; the floor says "at least an hour",
 * which is both true and what every other tool a developer uses says. Rounding
 * also makes the boundary jump backwards — 89 minutes reads "1 hour", 91 reads
 * "2" — so a list refreshing in place appears to skip.
 *
 * The two REGISTERS are real and stay: a table cell has room for "2 minutes
 * ago", a repo subtitle does not. That is a format, not a second function.
 */

/** Seconds in each unit, largest first. The order IS the selection rule. */
const UNITS: [seconds: number, long: string, short: string][] = [
  [31_536_000, 'year', 'y'],
  [2_592_000, 'month', 'mo'],
  [604_800, 'week', 'w'],
  [86_400, 'day', 'd'],
  [3_600, 'hour', 'h'],
  [60, 'minute', 'm'],
];

export interface Elapsed {
  /** `long` → "2 minutes ago". `short` → "2m ago". */
  style?: 'long' | 'short';
  /** What to say when the timestamp is missing or unparseable. */
  absent?: string;
  /** Injectable clock, so a test does not have to wait. */
  now?: number;
}

/**
 * "2 minutes ago" / "2m ago", from an ISO timestamp.
 *
 * A missing or unparseable timestamp is NOT an error and not a zero: it is
 * unknown, and the caller says how unknown looks. A table shows "—"; a subtitle
 * shows nothing at all.
 */
export function relativeTime(iso: string | null | undefined, opts: Elapsed = {}): string {
  const { style = 'long', absent = '—', now = Date.now() } = opts;
  if (!iso) return absent;

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return absent;

  // No clamp and no seconds threshold. Both were here and BOTH WERE DEAD: the
  // smallest unit is a minute, so anything under 60 seconds — including a
  // negative from clock skew — finds no unit and falls to "just now" anyway.
  // Two guards that never once changed an answer, which is two things a reader
  // has to hold and nothing to show for it. Mutation-testing found them: break
  // either and every test still passed.
  const secs = Math.floor((now - then) / 1000);

  for (const [size, long, short] of UNITS) {
    if (secs < size) continue;
    const n = Math.floor(secs / size);
    return style === 'short' ? `${n}${short} ago` : `${n} ${long}${n === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}
