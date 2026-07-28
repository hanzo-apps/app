// The version, once.
//
// This file exists because "what version is this?" had five different answers in
// one product: the sidebar and the dashboard imported package.json directly, the
// About dialog preferred an env var and fell back to package.json, telemetry
// wrapped package.json in its own accessor, and the admin route read package.json
// off DISK at request time. Five readers is five chances to disagree — and they
// did: the env-var branch let the About dialog show a number no other surface
// could show, and a disk read resolves against the *standalone* bundle rather
// than the source tree.
//
// One constant, imported everywhere. `tests/unit/version.test.ts` fails the build
// if a second reader appears.
//
// The remaining gap is one level up and NOT solvable here: this string is what
// the product SHOWS, while the container tag is what the product IS. Keeping
// them equal is the release path's job — see LLM.md.

import pkg from '@/package.json';

export const VERSION: string = pkg.version;
