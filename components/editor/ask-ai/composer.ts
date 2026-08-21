/**
 * The composer, as values: the corner it is cut to and the gutter its content
 * sits in.
 *
 * They live out here because a SECOND thing wears them. A message you have
 * already sent is the thing you typed a moment ago, and it drew as a small bare
 * chip beside the large lit box it came out of — the same words, twice, in two
 * unrelated shapes, one of which read as a system label rather than as yours.
 * Cutting a sent message to these numbers makes the pair one object in two
 * states: the box you are typing into, and the box you typed into.
 *
 * A module of its own rather than a pair of literals in each file, because the
 * whole point is that they cannot be changed in one place and not the other.
 * `chat-thread` may not read them off `index`, which imports it.
 *
 * `corner` is `--hz-composer-radius` (assets/globals.css) in px, and it is the
 * HOST's corner — the ring and its halo are already concentric with it. The
 * panel inside sits one band in, so it takes `corner - 1`, written as that
 * arithmetic and never as a second number: two numbers is how the ring and the
 * panel peeled apart the last time.
 *
 * `gutter` is the side inset the field and its action row share.
 */
export const composer = { corner: 24, gutter: "$4" } as const;
