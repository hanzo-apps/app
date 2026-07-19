// /support is an alias for the canonical support hub at /help. One hub, one way —
// both entry routes resolve to the same content. Referenced from the old docs
// "Contact Support" action, so it must keep resolving.

import { redirect } from "next/navigation";

export default function SupportPage() {
  redirect("/help");
}
