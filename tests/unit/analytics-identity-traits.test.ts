// From lib/, not from components/providers/analytics where it is used: the
// function is pure data-shaping, and reaching it through the provider boots the
// whole telemetry runtime for nothing.
import { identityTraits } from '@/lib/analytics-identity';

describe('identityTraits', () => {
  it('carries the email and the human name off the OIDC claims', () => {
    expect(
      identityTraits({ email: 'z@hanzo.ai', fullname: 'Z Hanzo', name: 'z' }),
    ).toEqual({ email: 'z@hanzo.ai', name: 'Z Hanzo' });
  });

  it('falls back to the resolved name when no fullname was claimed', () => {
    expect(identityTraits({ email: 'z@hanzo.ai', name: 'z' })).toEqual({
      email: 'z@hanzo.ai',
      name: 'z',
    });
  });

  // An absent claim must be ABSENT, not `undefined`: a trait sent as undefined
  // is a trait written, and it would blank a value an earlier identify set.
  it('omits a key it has no claim for rather than sending undefined', () => {
    const traits = identityTraits({ fullname: 'Z Hanzo' });
    expect(traits).toEqual({ name: 'Z Hanzo' });
    expect('email' in traits).toBe(false);
  });

  // useUser fills fullname/name with "" when no name claim resolved.
  it('sends no name at all rather than an empty one', () => {
    expect(identityTraits({ email: 'z@hanzo.ai', fullname: '', name: '' })).toEqual({
      email: 'z@hanzo.ai',
    });
  });
});
