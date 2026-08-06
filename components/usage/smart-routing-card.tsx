"use client";

import { XStack, SizableText, Paragraph } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { Zap, ExternalLink } from "lucide-react";
import { useLocalStorage } from "react-use";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@hanzo/ui';
import {
  AUTO_MODEL,
  DEFAULT_MODEL,
  ROUTING_DOCS_URL,
  isSmartRouting,
  resolveSmartRouting,
} from "@/lib/providers";
import { useRoutingDefaults } from "@/lib/hooks/use-routing-defaults";

/**
 * Smart routing toggle for the /usage page.
 *
 * Routing is expressed as a VALUE of the builder's persisted `model` selection
 * (localStorage key "model"): `AUTO_MODEL` means "let the Hanzo gateway route
 * each request to the best/cheapest capable model". This is the exact same
 * value the builder's model picker reads and writes, so the two surfaces stay
 * in sync and an explicit model pick in the builder always wins over auto.
 * Turning routing off restores the concrete default model.
 *
 * The local value is the user OVERRIDE. When it is unset (never touched), the
 * effective state follows the org's server-driven default
 * (`/v1/routing-defaults`); if the org disables routing, the toggle is locked
 * off with honest copy. Fail-soft: with no org policy known, this behaves
 * exactly as before — local preference only, defaulting to on.
 */
export default function SmartRoutingCard() {
  // No default: an unset key reads as `undefined`, so we can tell "never
  // touched" (follow the org default) apart from an explicit on/off override.
  const [model, setModel] = useLocalStorage<string>("model");
  const defaults = useRoutingDefaults();

  const localPref = model == null ? null : isSmartRouting(model);
  const { enabled: on, toggleDisabled } = resolveSmartRouting(localPref, defaults);

  return (
    <Card backgroundColor="$background" borderColor="$borderColor" marginBottom="$5">
      <CardHeader>
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
          <div>
            <CardTitle display="flex" alignItems="center" gap="$2">
              <Zap size={16} />
              Smart routing
            </CardTitle>
            <CardDescription>
              Sends each request to the best, cheapest model that can do the job
            </CardDescription>
          </div>
          <Button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Toggle smart routing"
            disabled={toggleDisabled}
            onClick={() => setModel(on ? DEFAULT_MODEL : AUTO_MODEL)}
            marginTop="$1" flexShrink={0} borderRadius="$10" minWidth="$7" width="$7" height="$5" alignItems="center" padding="$1" {...{ cursor: toggleDisabled ? "not-allowed" : "pointer", opacity: toggleDisabled ? 0.4 : undefined, backgroundColor: on ? "$color12" : "$color3" }}
          >
            <SizableText
              width="$4" height="$4" borderRadius="$10" elevation={3} {...{ x: on ? "$4" : undefined, backgroundColor: on ? "$background" : "$color12" }}
  />
          </Button>
        </XStack>
      </CardHeader>
      <CardContent rowGap="$3">
        <Paragraph fontSize="$3" color="$color">
          Each request goes to the best, cheapest model capable of your workload.
          You&apos;re billed as what actually served you — up to 90% lower spend,
          workload-dependent. Pick a specific model in the builder to override
          routing for that request.
        </Paragraph>
        <Paragraph fontSize="$3" color="$color11">
          {toggleDisabled
            ? "Disabled for your organization."
            : on
              ? "On — the builder opens on Auto and the gateway routes each request."
              : `Off — the builder uses ${DEFAULT_MODEL} unless you pick another model.`}
        </Paragraph>
        <Anchor display="inline-flex"
          href={ROUTING_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          alignItems="center" gap="$1.5" fontSize="$3" color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}
        >
          How routing works
          <ExternalLink size={14} />
        </Anchor>
      </CardContent>
    </Card>
  );
}
