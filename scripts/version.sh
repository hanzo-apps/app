#!/usr/bin/env bash
# The version of ghcr.io/hanzoai/app. ONE implementation, every caller.
#
#   scripts/version.sh published   # the highest version already shipped
#   scripts/version.sh next        # the number the next release publishes
#   scripts/version.sh check       # package.json must not lag `published` (default)
#
# WHY THIS IS A FILE AND NOT INLINE SHELL. Two callers need the identical scan:
# .hanzo/workflows/release.yml computes the release number with `next`, and
# hanzo.yml's gate asserts the committed file with `check`. Written twice it
# would be right twice and then wrong once — which is the whole mechanism of the
# defect this script exists to close.
#
# THE DEFECT, MEASURED 2026-08-06: package.json said 1.42.211 while
# ghcr.io/hanzoai/app was on v1.42.353. 141 patches. Not a typo and not neglect —
# the scan below reads package.json as NOTHING, so `declared` was an input no
# writer ever wrote. `published` advances once per release, `declared` never
# moved, and the gap grew by exactly one per release forever. Release.yml now
# commits the number in the same commit it tags, and `check` proves it stuck.
#
# THE INVARIANT, one sentence: the declared version must never be BEHIND the
# highest published version of its release stream. Equal is the steady state
# (CI writes it); ahead is a human raising the series on purpose, which is the
# affordance hanzoai/ci's `imgver` documents and this keeps.
#
# ENV: GH_PAT (or GITHUB_TOKEN) to read the registry floor. Without one the scan
#      degrades to git tags alone and SAYS so on stderr — never silently.
set -euo pipefail

cd "$(dirname "$0")/.."

# The deployed lineage is 1.42.x: the operator CR (universe: hanzo-app.yaml) and
# every ghcr.io/hanzoai/app image are on it, and the newest-by-date commits on
# main are tagged v1.42.x. Stray older tags exist off that line (v2.2.0 = a 2025
# "stack integration" relic, v2.2.1 = a one-off CSP fix, v1.75.0 = a June relic).
# `sort -V` is purely numeric, so an UNCONSTRAINED scan lets 2.2.1 > 1.75.0 >
# 1.42.x hijack the floor and cut a v2.2.2 the CR can't follow. Pin the scan to
# the 1.42. line so the bump stays monotonic over the ACTUAL deploy stream, not
# the numerically-largest orphan tag.
LINE='1.42.'
ONLINE="^${LINE//./\\.}[0-9]+$"

git_max() {
  # `|| true` on the pipeline, not on the grep: an empty tag list is a fact, not
  # a failure, and `set -e` would otherwise abort a fresh clone.
  git tag -l "v${LINE}[0-9]*" | sed 's/^v//' | grep -E "$ONLINE" | sort -V | tail -1 || true
}

cont_max() {
  # Fold in ALREADY-PUSHED container tags on the same line, so a number that has
  # an image (even from a run that died before git-tagging) is never reused
  # (mirrors hanzoai/cloud). Best-effort — never fails the run if the API is down.
  # Use curl (universally present) NOT gh — the runners have no `gh`, so a
  # gh-gated scan returned container_max='none' and the first run cut v1.42.11
  # instead of v1.42.13. Fold BOTH v-prefixed and legacy non-v 1.42.x image tags
  # so the v-stream never numerically collides with the retired platform-build
  # non-v tags. jq-optional: grep fallback if a runner lacks jq.
  #
  # The package scanned MUST be the one release.yml pushes to. It named the
  # retired `hanzo-app` package while the build pushed `app`, so the scan read a
  # stream that stopped at 1.42.153 and the floor came from git alone — and the
  # forge's tag stream lags GitHub's, so v1.42.158 was cut AFTER v1.42.163 was
  # already live. The image ⇔ tag guard in release.yml cannot catch that: the
  # image resolved, it was simply numbered backwards.
  local tok="${GH_PAT:-${GITHUB_TOKEN:-}}"
  [ -n "$tok" ] || { echo "version.sh: no GH_PAT/GITHUB_TOKEN — registry floor NOT read" >&2; return 0; }
  curl -fsSL -H "Authorization: Bearer $tok" \
      -H "Accept: application/vnd.github+json" \
      'https://api.github.com/orgs/hanzoai/packages/container/app/versions?per_page=100' 2>/dev/null \
    | { jq -r '.[].metadata.container.tags[]?' 2>/dev/null || grep -oE '"v?[0-9]+\.[0-9]+\.[0-9]+"' | tr -d '"'; } \
    | sed 's/^v//' | grep -E "$ONLINE" | sort -V | tail -1 || true
}

published() {
  # ${LINE}0 is the base floor, so a repo with neither a tag nor an image still
  # yields a number on the line rather than an empty string.
  printf '%s\n%s\n%s\n' "${LINE}0" "$(git_max)" "$(cont_max)" \
    | grep -E "$ONLINE" | sort -V | tail -1
}

declared() { jq -r '.version // ""' package.json; }

# `a` is at least `b` — string-equal, or the larger of the two under sort -V.
at_least() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | tail -1)" = "$1" ]; }

case "${1:-check}" in
  published) published ;;

  next)
    max="$(published)"
    version="${max%.*}.$(( ${max##*.} + 1 ))"
    if git rev-parse -q --verify "refs/tags/v${version}" >/dev/null; then
      echo "version.sh: computed v${version} already exists — aborting to avoid collision" >&2
      exit 1
    fi
    echo "version.sh: git_max='$(git_max)' container_max='$(cont_max)' -> v${version}" >&2
    echo "$version"
    ;;

  check)
    pub="$(published)"; dec="$(declared)"
    if ! echo "$dec" | grep -qE "$ONLINE"; then
      echo "::error::package.json declares '${dec}', which is not on the ${LINE}x deploy line." >&2
      echo "  The operator CR (universe: hanzo-app.yaml) follows ${LINE}x and nothing else;" >&2
      echo "  a number off that line cuts an image the CR cannot follow (see v2.2.1)." >&2
      exit 1
    fi
    if ! at_least "$dec" "$pub"; then
      echo "::error::package.json says ${dec} but ${pub} is already published — the declared version is BEHIND what ships." >&2
      echo "  A release commits the number it tags; this means that write-back did not land." >&2
      echo "  Fix: set package.json version to ${pub} (never lower, never off the ${LINE}x line)." >&2
      exit 1
    fi
    echo "version.sh: declared=${dec} published=${pub} — declared is not behind. OK"
    ;;

  *) echo "usage: scripts/version.sh [published|next|check]" >&2; exit 2 ;;
esac
