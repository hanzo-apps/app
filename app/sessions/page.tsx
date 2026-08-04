import { redirect } from 'next/navigation';

/**
 * /sessions → tabs.hanzo.ai
 *
 * The terminal workspace moved to its own product. It was never really part of
 * this app: it needs no server, it frames terminals the machines themselves
 * serve, and it wants the whole viewport — none of which is true of the pages
 * around it here. Keeping a second copy behind this route would be the second
 * way to do one thing, and the one that quietly falls behind.
 *
 * The route stays because links to it exist. Only the index moves; the machine
 * roster lives on at /agents.
 */
export default function SessionsMoved() {
  redirect('https://tabs.hanzo.ai/app');
}
