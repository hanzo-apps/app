import { redirect } from 'next/navigation';

/**
 * /catalog → /community
 *
 * Both rendered the SAME `CatalogBrowser` over the same /v1/catalog corpus; the
 * only difference was chrome — this one wore the signed-in shell, /community
 * wears the site's. Browsing what exists needs no account, so the public one is
 * the one that survives, with lanes for the rest.
 */
export default function CatalogIndex() {
  redirect('/community');
}
