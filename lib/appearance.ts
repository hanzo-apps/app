/**
 * The signed-in user's appearance preference — account-level, read and write.
 *
 * The same reading of the Hanzo design system a person sets in @hanzo/appearance
 * (text size, density, accent), but kept ON THE ACCOUNT so it follows them across
 * devices and every Hanzo surface — hanzo.app, hanzo.chat, the console — and is
 * editable from the account page on hanzo.id and each white-label id host.
 * localStorage stays the pre-paint cache; the account is the source of truth the
 * moment a session exists.
 *
 * IAM keeps it in the user row's `properties` bag — the same extensible map that
 * already holds a person's oauth tokens — under one key, as one JSON value. So
 * nothing in the IAM schema changes to gain a preference.
 *
 * Writes go through the app's confidential client ({@link iam}), which can address
 * any row; the ROUTE binds `id` to the verified session, exactly as lib/profile
 * does, so no value from the browser can name a different account. The full row is
 * read and written back with only this one property changed, because IAM's
 * update-user overwrites the column set — a partial would blank the rest of the
 * row (the trap lib/profile documents).
 */
import 'server-only';

import { IamError, adminConfigured, iam } from '@/lib/iam-admin';

export { adminConfigured as appearanceConfigured };

/**
 * The one shape, mirrored from @hanzo/appearance's `Preference`. Every axis is
 * OPTIONAL: an axis nobody set is absent, never a neutral value — the same law
 * @hanzo/appearance's own storage keeps, so an unset preference cannot stamp a
 * scale over a brand that published its own.
 */
export interface Appearance {
  type?: number;
  density?: 'compact' | 'default' | 'comfortable';
  accent?: string;
}

/** The properties-bag key. One key, one JSON value. */
const PROP = 'appearance';

/** @hanzo/design clamps the type scale to this window (the same bounds the head
 *  boot script enforces); mirror it so a stored value cannot drive the ramp past
 *  what the panel itself can pick. */
const TYPE_MIN = 0.85;
const TYPE_MAX = 1.4;

/**
 * A colour we are willing to put on the document — and, decisively, into a
 * server-rendered `<style>` body (@hanzo/appearance's `style()` path). So it is
 * validated as a REAL colour token: a hex, or a bounded functional-colour form.
 * Anything carrying `;`, `{`, `}`, `<` or `url(` cannot match, because the account
 * value is chosen by its owner and must never become a CSS-injection vector when
 * another surface renders it.
 */
const ACCENT =
  /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\([0-9a-zA-Z.,%\s/+-]{1,60}\)$/;

/**
 * Keep only what is valid; drop what is not. A stored preference is advisory —
 * one bad axis narrows the result, it never refuses the whole thing — and an
 * unknown key never survives, so neither a future version nor a hand-edited value
 * can reach a stylesheet.
 */
export function clean(input: unknown): Appearance {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out: Appearance = {};
  if (typeof p.type === 'number' && Number.isFinite(p.type)) {
    out.type = Math.min(TYPE_MAX, Math.max(TYPE_MIN, p.type));
  }
  if (p.density === 'compact' || p.density === 'default' || p.density === 'comfortable') {
    out.density = p.density;
  }
  if (typeof p.accent === 'string' && ACCENT.test(p.accent.trim())) {
    out.accent = p.accent.trim();
  }
  return out;
}

/** The stored JSON value parsed out of a user row's `properties` bag. */
function view(row: Record<string, unknown> | null): Appearance {
  const props = (row?.properties ?? null) as Record<string, unknown> | null;
  const raw = props && typeof props.appearance === 'string' ? props.appearance : '';
  if (!raw) return {};
  try {
    return clean(JSON.parse(raw));
  } catch {
    return {};
  }
}

/** Read the user's stored appearance. `{}` when unset or unreadable. */
export async function readAppearance(id: string): Promise<Appearance> {
  const row = await iam<Record<string, unknown> | null>('/v1/iam/get-user', { id });
  return view(row);
}

/**
 * Write the user's appearance and return exactly what was stored.
 *
 * Reads the FULL current row and writes it back with only `properties.appearance`
 * changed — every other property (oauth tokens above all) is preserved, and every
 * column survives. A row that reads back empty is refused rather than written,
 * because writing a partial would erase the account.
 */
export async function writeAppearance(id: string, next: unknown): Promise<Appearance> {
  const value = clean(next);

  const current = await iam<Record<string, unknown> | null>('/v1/iam/get-user', { id });
  if (!current) throw new IamError(`IAM returned no user for ${id}`, false);

  const properties = {
    ...((current.properties as Record<string, unknown>) ?? {}),
    [PROP]: JSON.stringify(value),
  };
  await iam('/v1/iam/update-user', { id }, { ...current, properties });
  return value;
}
