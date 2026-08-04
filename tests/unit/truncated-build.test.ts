/**
 * A build that stopped mid-document must not be reported as a success.
 *
 * The builder parsed whatever bytes arrived, so a stream cut partway through
 * still produced "Built · 1 file" and a success toast. The person then sees the
 * SHAPE of the truncation — a complete header above one enormous unclosed
 * section, nothing below — and reads it as a bad design rather than as a page
 * that never finished. Observed on a real build.
 *
 * The distinction that makes this safe to act on: a FRAGMENT is a legitimate
 * result for a follow-up edit, so a missing `</html>` is evidence of truncation
 * only when the model opened `<html>` to begin with.
 */
import { unterminatedDocument } from '@/hooks/useCallAi';

describe('unterminatedDocument', () => {
  it('accepts a complete document', () => {
    expect(
      unterminatedDocument('<!DOCTYPE html><html><body><h1>hi</h1></body></html>'),
    ).toBe(false);
  });

  it('flags a document that opened <html> and never closed it', () => {
    // The exact shape of the reported bug: nav renders, an unclosed section
    // swallows the rest, and the stream ends.
    const cut =
      '<!DOCTYPE html><html><head><title>LuxQuest</title></head><body>' +
      '<nav>LuxQuest</nav><section class="hero" style="background:linear-gradient(#7c3aed,#a855f7)">';
    expect(unterminatedDocument(cut)).toBe(true);
  });

  it('does NOT flag a fragment — a follow-up edit legitimately returns one', () => {
    expect(unterminatedDocument('<section><h2>Quests</h2></section>')).toBe(false);
    expect(unterminatedDocument('')).toBe(false);
  });

  it('is case-insensitive — a model may emit <HTML>', () => {
    expect(unterminatedDocument('<!DOCTYPE HTML><HTML><BODY>x</BODY>')).toBe(true);
    expect(unterminatedDocument('<HTML><BODY>x</BODY></HTML>')).toBe(false);
  });

  it('tolerates attributes on the html tag', () => {
    expect(unterminatedDocument('<html lang="en"><body>x')).toBe(true);
    expect(unterminatedDocument('<html lang="en"><body>x</body></html>')).toBe(false);
  });
});
