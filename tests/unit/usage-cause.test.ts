import { cause } from '@/components/usage/UsageLimitDialog';

/**
 * A gateway sentence is written for a caller with no UI. This modal IS the UI,
 * and it offers "Add credits" and "Upgrade your plan" as real controls — so the
 * prose above them must state the CAUSE and never a competing way forward.
 */
describe('the reason states a cause, never a second way forward', () => {
  it('drops the instruction and keeps the cause', () => {
    // Measured in production, rendered verbatim as
    // "…at https://pay.hanzo.ai To keep going:".
    expect(cause('Insufficient balance. Add credits to your wallet at https://pay.hanzo.ai'))
      .toBe('Insufficient balance.');
  });

  it('ends like a sentence, because another one follows it', () => {
    // The caller appends "To keep going:". Without the stop the two ran
    // together into one broken line.
    expect(cause('Your plan is out of included usage')).toBe('Your plan is out of included usage.');
    expect(cause('Rate limited.')).toBe('Rate limited.');
  });

  it('answers undefined when nothing but instruction was given', () => {
    // The caller then states no cause at all, rather than inventing one — the
    // rule this modal already lived by.
    expect(cause('See https://pay.hanzo.ai to continue.')).toBeUndefined();
    expect(cause('')).toBeUndefined();
    expect(cause(undefined)).toBeUndefined();
  });

  it('is about the job of the sentence, not about one host', () => {
    // Any link is an instruction; the rule must not be a patch on one string.
    expect(cause('Out of credit. Top up at www.example.com')).toBe('Out of credit.');
    expect(cause('Quota spent. Visit http://billing.internal/x now.')).toBe('Quota spent.');
  });

  it('keeps a multi-sentence cause whole', () => {
    expect(cause('Insufficient balance. Your last deploy spent the remainder.'))
      .toBe('Insufficient balance. Your last deploy spent the remainder.');
  });
});
