/**
 * The server fetches an address the browser chose, so the refusals are the
 * feature. A name that resolves inward is the attack this guards.
 */
import { Unreachable, address, readable } from '@/lib/redesign';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(async (host: string) => {
    const table: Record<string, string> = {
      'example.com': '93.184.216.34',
      'evil.test': '169.254.169.254', // cloud metadata behind a public name
      'inside.test': '10.0.0.5',
      'loop.test': '127.0.0.1',
      'six.test': '::1',
      'ula.test': 'fd00::1',
    };
    if (!(host in table)) throw new Error('ENOTFOUND');
    return { address: table[host], family: table[host].includes(':') ? 6 : 4 };
  }),
}));

const refuses = async (url: string) => {
  await expect(address(url)).rejects.toBeInstanceOf(Unreachable);
};

describe('address', () => {
  it('admits a public https host', async () => {
    expect((await address('https://example.com/pricing')).host).toBe('example.com');
  });

  it.each([
    ['cloud metadata behind a public name', 'http://evil.test/latest/meta-data/'],
    ['private space', 'http://inside.test/'],
    ['loopback', 'http://loop.test:8080/'],
    ['ipv6 loopback', 'http://six.test/'],
    ['unique-local ipv6', 'http://ula.test/'],
  ])('refuses %s', async (_label, url) => refuses(url));

  it.each([
    ['a non-http scheme', 'file:///etc/passwd'],
    ['nonsense', 'not a url'],
    ['a host that does not exist', 'https://nowhere.invalid/'],
  ])('refuses %s', async (_label, url) => refuses(url));
});

describe('readable', () => {
  it('keeps the structure a model needs and drops what it cannot use', () => {
    const md = readable(`
      <html><head><title>Acme</title><style>.a{color:red}</style></head>
      <body>
        <script>window.x = 1</script>
        <h1>Build faster</h1>
        <p>We make &amp; ship things.</p>
        <ul><li>One</li><li>Two</li></ul>
        <a href="/pricing">Pricing</a>
        <button>Start now</button>
      </body></html>`);
    expect(md).toContain('# Acme');
    expect(md).toContain('# Build faster');
    expect(md).toContain('We make & ship things.');
    expect(md).toContain('- One');
    expect(md).toContain('[Pricing](/pricing)');
    expect(md).toContain('- Start now (button)');
    expect(md).not.toContain('window.x');
    expect(md).not.toContain('color:red');
  });

  it('says each repeated nav item once', () => {
    const md = readable('<a href="/a">Home</a><a href="/a">Home</a><a href="/a">Home</a>');
    expect(md.match(/\[Home\]/g)).toHaveLength(1);
  });

  it('returns nothing for a page with no words', () => {
    expect(readable('<html><body><script>1</script></body></html>')).toBe('');
  });
});
