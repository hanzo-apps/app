import { providerName } from '@/lib/edit/provider';

/**
 * One name for our own git.
 *
 * The app called git.hanzo.ai `hanzo` everywhere (lib/api/git.ts, lib/git/sync.ts)
 * except in the Edit flow, which called the same forge `gitea` — after the
 * project it forked, not after us. Two names for one thing is not merely untidy:
 * it required a translator (`linkedKey` in lib/edit/token.ts) to sit between the
 * Edit flow and the IAM connection lookup, and that function existed for no
 * reason other than the disagreement. Renaming deleted it.
 *
 * What survives is tolerance at the BOUNDARY, and these tests are about the
 * boundary, because that is where getting it wrong is silent.
 */
describe('reading a page\'s declared forge', () => {
  it('takes the names we use', () => {
    expect(providerName('github')).toBe('github');
    expect(providerName('gitlab')).toBe('gitlab');
    expect(providerName('hanzo')).toBe('hanzo');
  });

  it('still accepts `gitea` — and resolves it to hanzo, never to the default', () => {
    // `providerName` reads a `<meta name="hanzo:provider">` off a page we do not
    // control, and pages already carry `gitea`. Dropping it would not error:
    // it would fall through to the `github` default and aim a Hanzo Git page at
    // GitHub, which is a wrong answer wearing a valid one.
    expect(providerName('gitea')).toBe('hanzo');
  });

  it('defaults to github for anything it does not know', () => {
    for (const v of ['bitbucket', '', null, undefined, 42, {}, 'HANZO']) {
      expect(providerName(v)).toBe('github');
    }
  });
});
