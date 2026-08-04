'use client';

/**
 * Purchase — the ONE place a customer buys platform credit or a plan.
 *
 * Every button here is a plain navigation to the single live Square surface
 * (`lib/pay.ts`). There is no fetch, no hidden "create session" round-trip and
 * therefore no way for this UI to fail silently: either we can name the wallet
 * being credited and the button goes to a card form, or we say why it cannot.
 *
 * WHICH WALLET — and why it is the HOME org, not the switcher's selection.
 *
 * The org is the payer of record; a personal account is an org of one. The
 * credited wallet is resolved SERVER-side and cannot be steered from a browser:
 * cloud's `SanitizeIdentity` deletes any client `X-Org-Id` and re-stamps it from
 * the verified `owner` claim for everyone except a member of the reserved admin
 * org, and commerce then keys the credit off that (`topupDestination` →
 * `orgBillingKey`).
 *
 * Checkout runs on pay.hanzo.ai, which sends only an Authorization header — no
 * `X-Org-Id` at all. So for EVERY caller, admin included, a payment credits the
 * token's `owner` claim: the HOME org. Naming the switcher's selection here
 * would therefore be a lie exactly when it matters — a user scoped into another
 * org would be told one wallet and credited another.
 *
 * So we name `homeOrg`, which `/v1/orgs` resolves from the verified session
 * server-side, we refuse to sell while it is unknown, and we say so plainly when
 * the current scope differs. Fail closed beats a confident guess about money.
 */

import { Paragraph, YStack, SizableText } from '@hanzo/gui';
import { useOrg } from '@/lib/org/client';
import { currentOrg, titleCase } from '@/lib/org-scope';
import { goToCheckout, billingReturnUrl } from '@/lib/pay';
import { usePlans, usd } from '@/lib/plans';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hanzo/ui';
import { CreditCard, Sparkles } from 'lucide-react';

/**
 * Top-up amounts, in whole dollars.
 *
 * A top-up credits the ledger with EXACTLY the dollars charged: commerce's
 * `TopupWithToken` writes `trans.Amount = req.AmountCents` and there is no
 * bonus, multiplier or promo anywhere on that path. Advertising "$25 → 2,750
 * credits" would therefore be a promise the ledger breaks on every purchase, so
 * these are amounts, not packs. Bounds mirror the server's own
 * COMMERCE_TOPUP_{MIN,MAX}_CENTS ($1–$5,000).
 */
const TOPUP_AMOUNTS = [10, 25, 50, 100] as const;

/** Copy shared by both refusal states, so the reason is always visible. */
function Unavailable({ reason }: { reason: string }) {
  return <Paragraph fontSize="$3" color="$color11">{reason}</Paragraph>;
}

/**
 * The org whose balance a purchase WILL credit, asserted server-side.
 *
 * `homeOrg` comes from `/v1/orgs`, which derives it from the verified IAM
 * session (`lib/org/server.ts` → `session()`), not from anything the browser
 * chose. That is the same `owner` claim the gateway re-stamps and commerce keys
 * the credit off, so it is the honest answer to "whose money is this".
 *
 * `scopedAway` is true when the switcher is pointed somewhere else — the balance
 * elsewhere on this page may then belong to a different wallet than the one
 * about to be topped up, and we must say so rather than let the two numbers
 * quietly disagree.
 */
function usePayer(): { org: string | null; scopedAway: boolean; loading: boolean } {
  const { ctx, loading } = useOrg();
  const org = ctx?.homeOrg?.trim() || null;
  const selected = (currentOrg() || ctx?.currentOrg || '').trim();
  return { org, scopedAway: Boolean(org && selected && selected !== org), loading };
}

/** Always name the wallet before the card form appears. */
function PayerNote({ org, scopedAway }: { org: string; scopedAway: boolean }) {
  return (
    <YStack rowGap="$1">
      <Paragraph fontSize="$1" color="$color11">
        Payment is credited to <SizableText color="$color">{titleCase(org)}</SizableText> — the
        organization your account belongs to.
      </Paragraph>
      {scopedAway && (
        <Paragraph fontSize="$1" color="$yellow9">
          You are currently viewing a different organization. Payment still credits{' '}
          {titleCase(org)}, because checkout bills the account you signed in as.
        </Paragraph>
      )}
    </YStack>
  );
}

/** Buy platform credit — a one-off card charge that tops up the org ledger. */
export function TopUp() {
  const { org, scopedAway, loading } = usePayer();
  const returnUrl = billingReturnUrl();

  return (
    <Card backgroundColor="$background" borderColor="$borderColor">
      <CardHeader>
        <CardTitle>Add credit with a card</CardTitle>
        <CardDescription>
          Secure card payment on pay.hanzo.ai. $1 tops up $1 of credit — no bonus, no
          expiry.
        </CardDescription>
      </CardHeader>
      <CardContent rowGap="$4">
        {loading ? (
          <Unavailable reason="Checking which organization to credit…" />
        ) : !org ? (
          <Unavailable reason="No organization resolved for your account, so there is no balance to credit. Reload or contact support — we will not guess." />
        ) : (
          <>
            <YStack gap="$4">
              {TOPUP_AMOUNTS.map((amount) => (
                <YStack
                  key={amount}
                  borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4.5" hoverStyle={{ borderColor: "$color" }}
                >
                  <YStack marginBottom="$4">
                    <SizableText textAlign="center" fontSize="$10" fontWeight="500">${amount}</SizableText>
                    <SizableText marginTop="$1" textAlign="center" fontSize="$3" color="$color11">
                      {amount}.00 of credit
                    </SizableText>
                  </YStack>
                  <Button
                    onClick={() => goToCheckout({ amountUsd: amount, returnUrl })}
                    width="100%" backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color" }}
                    size="sm"
                  >
                    <CreditCard size={16} />
                    Add ${amount}
                  </Button>
                </YStack>
              ))}
            </YStack>
            <PayerNote org={org} scopedAway={scopedAway} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Subscribe to a plan — card-on-file recurring billing on the same path.
 * The price shown is the catalog price commerce will actually charge.
 */
export function Subscribe({ slug, label }: { slug: string; label?: string }) {
  const { org, loading: orgLoading } = usePayer();
  const { plans, loading: plansLoading, error } = usePlans();
  const plan = plans.get(slug);
  const returnUrl = billingReturnUrl();

  if (orgLoading || plansLoading) {
    return (
      <Button disabled size="sm" width="100%">
        Loading…
      </Button>
    );
  }

  // No org, no catalog, an unpriced plan, or a contact-sales plan ⇒ do not sell.
  if (!org || error || !plan || plan.contactSales || plan.price <= 0) {
    return (
      <Button disabled size="sm" width="100%" title={error ?? 'Not available'}>
        Not available
      </Button>
    );
  }

  return (
    <Button
      onClick={() =>
        goToCheckout({ amountUsd: plan.price / 100, plan: plan.slug, returnUrl })
      }
      title={`Billed to ${titleCase(org)}`}
      width="100%" backgroundColor="$color12" hoverStyle={{ backgroundColor: "$color12" }}
      size="sm"
    >
      <Sparkles size={16} />
      {label ?? `Upgrade to ${plan.name}`} — {usd(plan.price)}
      {plan.perSeat ? '/seat' : ''}/mo
    </Button>
  );
}

/**
 * The one-line statement of which org a purchase bills, for surfaces that sell a
 * plan outside the <TopUp> card (the plans page). Renders nothing until the
 * payer is known, so it can never show a placeholder org.
 */
export function PayerLine() {
  const { org, scopedAway } = usePayer();
  if (!org) return null;
  return <PayerNote org={org} scopedAway={scopedAway} />;
}
