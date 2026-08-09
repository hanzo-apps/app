#!/usr/bin/env bash
# The version of ghcr.io/hanzoai/app. ONE implementation, every caller.
#
#   scripts/version.sh published   # the highest version already shipped
#   scripts/version.sh next        # the number the next release publishes
#
# THE SOURCE OF TRUTH IS THE STREAM, not a file: the scan below is git tags union
# the already-pushed container tags, and it reads package.json as NOTHING.
#
# There used to be a third verb, `check`, asserting that package.json's version
# had not fallen behind `published` — plus a release step that pushed that number
# onto main to keep it true. Both are gone. Once the number is derived, a copy of
# it in the tree is not a second opinion, it is a thing to keep in sync: the copy
# drifted to 141 patches behind (1.42.211 against a published v1.42.353), and the
# write-back that fixed that needed a push to a protected branch, which the forge
# refuses for the Actions token — so every release ended RED after shipping
# correctly. Deleting the copy's authority deletes both failures at once.
#
# package.json's version still gets STAMPED by release.yml into the build
# context, because lib/version.ts reads it for the sidebar and the about modal.
# That is a display string written from the derived number, downstream of it,
# never an input to it.
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

case "${1:-}" in
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

  *) echo "usage: scripts/version.sh [published|next]" >&2; exit 2 ;;
esac
