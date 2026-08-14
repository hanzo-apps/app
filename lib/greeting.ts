/**
 * What a person is called, from whatever the account happens to carry.
 *
 * "Ready to build, Zach Kelling?" is how a database addresses a record. A person is
 * called Zach. An IAM record's name is a full name, a handle, or an email, and only
 * the first is a name in the sense that matters here — so each is reduced to the part
 * a person would answer to, and anything matching none of those rules is returned
 * unchanged, because an unfamiliar shape is not an invitation to guess.
 *
 * DUPLICATE, deliberately and temporarily: console ships the same rule at
 * src/components/home/greeting.ts. Both belong in @hanzo/ui (which builds fine —
 * the note claiming otherwise is stale), and the first surface to need a third copy
 * should move it there instead of pasting it again.
 */
export function firstName(raw: string | null | undefined): string {
  const name = (raw ?? "").trim();
  if (!name) return "";

  // An email is a login, not a name: keep the local part, and only up to the first
  // separator, so zach.kelling@ and zach+cloud@ both come back as "zach".
  const local = name.includes("@") ? name.split("@")[0] : name;
  const first = local.split(/[\s._+-]+/).filter(Boolean)[0] ?? local;

  // A single chosen handle keeps its own capitalisation — "z" is a name here, and
  // "Z" is someone else's idea of one.
  return first;
}
