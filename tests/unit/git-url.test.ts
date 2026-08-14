/**
 * The ONE git-URL recognizer, which the composer, the import panel and the
 * import route all gate on — so what one accepts, the others must.
 *
 * GitLab is the case worth pinning: it has nested groups (`group/sub/project`),
 * so a recognizer written around `owner/repo` reports the wrong name, and it is
 * commonly self-hosted under a `gitlab.` host with no `.git` suffix.
 */
import { gitUrlGateMessage, isGitUrl, parseGitUrl } from '@/lib/git/url';

describe('parseGitUrl — GitLab', () => {
  it('accepts gitlab.com, with or without a scheme or suffix', () => {
    for (const url of [
      'https://gitlab.com/acme/storefront',
      'https://gitlab.com/acme/storefront.git',
      'gitlab.com/acme/storefront',
    ]) {
      expect(parseGitUrl(url)).toMatchObject({
        provider: 'gitlab',
        host: 'gitlab.com',
        owner: 'acme',
        name: 'storefront',
        isPublicHttps: true,
      });
      expect(gitUrlGateMessage(url)).toBeNull();
    }
  });

  it('names the PROJECT in a nested group, not the group', () => {
    expect(parseGitUrl('https://gitlab.com/acme/web/storefront')).toMatchObject({
      owner: 'acme',
      name: 'storefront',
      path: 'acme/web/storefront',
    });
  });

  it('accepts a self-hosted GitLab', () => {
    expect(parseGitUrl('https://gitlab.acme.dev/team/site')).toMatchObject({
      provider: 'gitlab',
      host: 'gitlab.acme.dev',
      isPublicHttps: true,
    });
  });

  it('recognizes an SSH remote but refuses to import it, in words', () => {
    const ssh = 'git@gitlab.com:acme/storefront.git';
    expect(isGitUrl(ssh)).toBe(true);
    expect(gitUrlGateMessage(ssh)).toMatch(/Public HTTPS/);
  });

  it('is not fooled by an ordinary web page', () => {
    expect(parseGitUrl('https://example.com/blog/post')).toBeNull();
  });
});
