import { relativeTime } from '@/lib/time';

// ONE answer to "how long ago", in two registers.
//
// There were two implementations and they contradicted each other about the
// same instant: something 90 minutes old read "2 hours ago" on the projects
// table and "updated 1h ago" under a repo, because one rounded and the other
// floored. Nothing failed — the product simply disagreed with itself about a
// fact it had fetched from one row.
const NOW = Date.parse('2026-08-20T12:00:00.000Z');
const ago = (mins: number) => new Date(NOW - mins * 60_000).toISOString();

describe('relativeTime', () => {
  it('floors, so it never claims more time than has passed', () => {
    // The whole reason the two disagreed. 90 minutes is one hour and a half:
    // "1 hour ago" is true, "2 hours ago" is not yet.
    expect(relativeTime(ago(90), { now: NOW })).toBe('1 hour ago');
    expect(relativeTime(ago(90), { now: NOW, style: 'short' })).toBe('1h ago');
  });

  it('says the same thing in both registers', () => {
    const cases: [number, string, string][] = [
      [2, '2 minutes ago', '2m ago'],
      [45, '45 minutes ago', '45m ago'],
      [20 * 60, '20 hours ago', '20h ago'],
      [36 * 60, '1 day ago', '1d ago'],
      [10 * 24 * 60, '1 week ago', '1w ago'],
      [45 * 24 * 60, '1 month ago', '1mo ago'],
      [400 * 24 * 60, '1 year ago', '1y ago'],
    ];
    for (const [mins, long, short] of cases) {
      expect({ mins, long: relativeTime(ago(mins), { now: NOW }) }).toEqual({ mins, long });
      expect({ mins, short: relativeTime(ago(mins), { now: NOW, style: 'short' }) })
        .toEqual({ mins, short });
    }
  });

  it('pluralises the long register and never the short one', () => {
    expect(relativeTime(ago(1440), { now: NOW })).toBe('1 day ago');
    expect(relativeTime(ago(2880), { now: NOW })).toBe('2 days ago');
    expect(relativeTime(ago(2880), { now: NOW, style: 'short' })).toBe('2d ago');
  });

  it('counts no seconds — under 45 is just now', () => {
    expect(relativeTime(ago(0.5), { now: NOW })).toBe('just now');
    expect(relativeTime(ago(0.5), { now: NOW, style: 'short' })).toBe('just now');
  });

  it('a missing timestamp is UNKNOWN, and the caller says how unknown looks', () => {
    // Not an error and not a zero. A table shows "—"; a subtitle shows nothing.
    expect(relativeTime(null, { now: NOW })).toBe('—');
    expect(relativeTime(undefined, { now: NOW })).toBe('—');
    expect(relativeTime('not a date', { now: NOW })).toBe('—');
    expect(relativeTime(null, { now: NOW, absent: '' })).toBe('');
  });

  it('a future timestamp does not read as negative', () => {
    // Clock skew between a browser and a server is ordinary, and "-3 minutes
    // ago" is the kind of thing a reader screenshots.
    expect(relativeTime(ago(-30), { now: NOW })).toBe('just now');
  });
});
