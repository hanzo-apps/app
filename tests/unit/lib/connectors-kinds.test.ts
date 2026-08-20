/**
 * The two connector kinds, as this client reads them off the wire.
 *
 * `kind` decides which connect leg the UI takes, so a normalizer that guessed
 * wrong would render a form for a provider that wants a redirect, or a dead
 * Connect button for one that wants a form.
 */
import { normalizeProviders } from '@/lib/connectors';

describe('connector kinds', () => {
  const one = (raw: unknown) => normalizeProviders({ connectors: [raw] })[0];

  it('reads a credential connector and its published form', () => {
    const p = one({
      id: 'whatsapp',
      name: 'WhatsApp',
      kind: 'credential',
      available: true,
      fields: [
        { name: 'phone_number_id', label: 'Phone number ID', required: true },
        { name: 'access_token', label: 'Permanent access token', secret: true, required: true },
      ],
    });
    expect(p.kind).toBe('credential');
    expect(p.fields.map((f) => f.name)).toEqual(['phone_number_id', 'access_token']);
    expect(p.fields[1].secret).toBe(true);
    expect(p.fields[0].secret).toBe(false);
  });

  it('defaults to oauth so a cloud that has not published `kind` keeps working', () => {
    const p = one({ id: 'slack', name: 'Slack', available: true });
    expect(p.kind).toBe('oauth');
    expect(p.fields).toEqual([]);
  });

  it('reads an unknown kind as oauth rather than rendering an empty form', () => {
    expect(one({ id: 'x', kind: 'sorcery' }).kind).toBe('oauth');
  });

  it('drops a field with no name — it could not be submitted under any key', () => {
    const p = one({ id: 'sms', kind: 'credential', fields: [{ label: 'Orphan' }, { name: 'ok' }] });
    expect(p.fields.map((f) => f.name)).toEqual(['ok']);
  });

  it('labels a field by its name when the provider sent no label', () => {
    const p = one({ id: 'sms', kind: 'credential', fields: [{ name: 'account_sid' }] });
    expect(p.fields[0].label).toBe('account_sid');
  });

  it('survives a garbage `fields` instead of throwing the page away', () => {
    expect(one({ id: 'sms', kind: 'credential', fields: 'nope' }).fields).toEqual([]);
    expect(one({ id: 'sms', kind: 'credential' }).fields).toEqual([]);
  });
});
