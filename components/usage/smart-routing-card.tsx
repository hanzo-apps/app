"use client";

import classNames from "classnames";
import { Zap, ExternalLink } from "lucide-react";
import { useLocalStorage } from "react-use";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hanzo/ui";
import {
  AUTO_MODEL,
  DEFAULT_MODEL,
  ROUTING_DOCS_URL,
  isSmartRouting,
} from "@/lib/providers";

/**
 * Smart routing toggle for the /usage page.
 *
 * Routing is expressed as a VALUE of the builder's persisted `model` selection
 * (localStorage key "model"): `AUTO_MODEL` means "let the Hanzo gateway route
 * each request to the best/cheapest capable model". This is the exact same
 * value the builder's model picker reads and writes, so the two surfaces stay
 * in sync and an explicit model pick in the builder always wins over auto.
 * Turning routing off restores the concrete default model.
 */
export default function SmartRoutingCard() {
  const [model, setModel] = useLocalStorage<string>("model", AUTO_MODEL);
  const on = isSmartRouting(model);

  return (
    <Card className="bg-[#1a1a1a] border-white/10 mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-white/60" />
              Smart routing
            </CardTitle>
            <CardDescription>
              Sends each request to the best, cheapest model that can do the job
            </CardDescription>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Toggle smart routing"
            onClick={() => setModel(on ? DEFAULT_MODEL : AUTO_MODEL)}
            className={classNames(
              "mt-1 shrink-0 rounded-full min-w-10 w-10 h-6 flex items-center p-1 cursor-pointer transition-all duration-200",
              on ? "bg-white" : "bg-neutral-700"
            )}
          >
            <span
              className={classNames(
                "w-4 h-4 rounded-full shadow-md transition-all duration-200",
                on ? "translate-x-4 bg-black" : "bg-neutral-200"
              )}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white/70">
          Each request goes to the best, cheapest model capable of your workload.
          You&apos;re billed as what actually served you — up to 90% lower spend,
          workload-dependent. Pick a specific model in the builder to override
          routing for that request.
        </p>
        <p className="text-sm text-white/50">
          {on
            ? "On — the builder opens on Auto and the gateway routes each request."
            : `Off — the builder uses ${DEFAULT_MODEL} unless you pick another model.`}
        </p>
        <a
          href={ROUTING_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white underline underline-offset-4"
        >
          How routing works
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}
