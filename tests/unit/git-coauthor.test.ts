/**
 * The commit is the USER's — pushed on their own provider token, under their own
 * GitHub identity. The trailer records the other participant, and removing it is
 * a paid capability. These pin the part that must not be gettable for free.
 */
import { commitMessage, mayOmitAttribution, HANZO_COAUTHOR } from '@/lib/git/coauthor';

describe('commit attribution', () => {
  it('adds the trailer by default', () => {
    const msg = commitMessage('Sync LuxQuest from hanzo.app');
    expect(msg).toContain(HANZO_COAUTHOR);
    // A blank line is what makes git read it as a TRAILER, not as body text.
    expect(msg).toMatch(/\n\nCo-authored-by:/);
  });

  it('does NOT let an unpaid caller remove it, however they ask', () => {
    // The browser can send anything; the entitlement is the authority.
    for (const tier of ['', '   ', undefined, null]) {
      const msg = commitMessage('x', { omitAttribution: true, tier: tier as string });
      expect(msg).toContain(HANZO_COAUTHOR);
    }
  });

  it('lets a paying caller remove it when they ask', () => {
    expect(commitMessage('x', { omitAttribution: true, tier: 'pro' })).not.toContain(HANZO_COAUTHOR);
  });

  it('keeps the trailer for a paying caller who did NOT ask', () => {
    // Paying is permission, not a preference — the default stays attribution.
    expect(commitMessage('x', { tier: 'pro' })).toContain(HANZO_COAUTHOR);
    expect(commitMessage('x', { omitAttribution: false, tier: 'pro' })).toContain(HANZO_COAUTHOR);
  });

  it('never stacks duplicates on a re-sync', () => {
    const once = commitMessage('Sync');
    const twice = commitMessage(once);
    expect(twice).toBe(once);
    expect(twice.match(/Co-authored-by:/g)).toHaveLength(1);
  });

  it('treats any named plan as a plan, not a hardcoded list', () => {
    // A slug someone renames must not silently re-enable the paywall.
    expect(mayOmitAttribution('team-annual-2027')).toBe(true);
    expect(mayOmitAttribution('')).toBe(false);
  });
});
