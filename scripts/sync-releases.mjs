/**
 * Resolve every download on /download against the releases that actually exist.
 *
 * The page names a PLATFORM and an asset PATTERN; this writes the URL. That
 * split exists because half our repos version the filename — the extension
 * publishes `hanzo-ai-desktop-macos-v1.9.31.dmg`, so the obvious
 * `releases/latest/download/<name>` link works until 1.9.32 ships and then
 * 404s for everyone. A pattern cannot go stale that way.
 *
 * It also catches the other direction, which is how this started: hanzoai/desktop
 * 1.1.48 published a macOS `.sig` and no macOS binary, so the tile a reader
 * would have clicked answered 404 while the release looked healthy. An asset
 * that is not in the payload is not written, and a platform with no asset does
 * not render — the page cannot advertise a build that does not exist.
 *
 * Three rules, the same three every sync in this estate keeps:
 *   - never fail the build on an unreachable API — the committed snapshot is
 *     the designed fallback, and a page must not need github.com to deploy;
 *   - never regress — a payload resolving FEWER assets than the snapshot is far
 *     more likely to be a degraded response than a product being retired, so it
 *     is refused and what it would have dropped is printed;
 *   - never go quiet — every run prints what resolved and what did not.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'releases.json')

/**
 * What each surface publishes, as `platform -> pattern`.
 *
 * The pattern matches the asset NAME. Checksums and signatures are never
 * candidates: a `.sig` is not a download, and treating one as a build is the
 * exact defect above.
 */
const SURFACES = {
  cli: {
    repo: 'hanzoai/cli',
    assets: {
      'macOS (Apple Silicon)': /^hanzo-darwin-arm64\.tar\.gz$/,
      'macOS (Intel)': /^hanzo-darwin-amd64\.tar\.gz$/,
      Windows: /^hanzo-windows-amd64\.tar\.gz$/,
      'Linux (x86_64)': /^hanzo-linux-amd64\.tar\.gz$/,
      'Linux (arm64)': /^hanzo-linux-arm64\.tar\.gz$/,
    },
  },
  desktop: {
    repo: 'hanzoai/extension',
    assets: {
      macOS: /^hanzo-ai-desktop-macos-v[\d.]+\.dmg$/,
      Windows: /^hanzo-ai-desktop-windows-v[\d.]+\.exe$/,
      'Linux (AppImage)': /^hanzo-ai-desktop-linux-v[\d.]+\.AppImage$/,
      'Linux (deb)': /^hanzo-ai-desktop-linux-v[\d.]+\.deb$/,
    },
  },
  browser: {
    repo: 'hanzoai/extension',
    assets: {
      Chrome: /^hanzo-ai-chrome-v[\d.]+\.zip$/,
      Firefox: /^hanzo-ai-firefox-v[\d.]+\.zip$/,
      Safari: /^hanzo-ai-safari-v[\d.]+\.zip$/,
      Edge: /^hanzo-ai-edge-v[\d.]+\.zip$/,
    },
  },
  editor: {
    repo: 'hanzoai/extension',
    assets: {
      'VS Code': /^hanzo-ai-vscode-v[\d.]+\.vsix$/,
      Cursor: /^hanzo-ai-cursor-v[\d.]+\.vsix$/,
      Windsurf: /^hanzo-ai-windsurf-v[\d.]+\.vsix$/,
      JetBrains: /^hanzo-ai-jetbrains-v[\d.]+\.zip$/,
    },
  },
}

const snapshot = () => {
  try {
    return JSON.parse(readFileSync(OUT, 'utf8'))
  } catch {
    return null
  }
}

async function release(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`${repo}: ${res.status}`)
  return res.json()
}

async function main() {
  const held = snapshot()
  let next
  try {
    const repos = [...new Set(Object.values(SURFACES).map((s) => s.repo))]
    const payloads = Object.fromEntries(
      await Promise.all(repos.map(async (r) => [r, await release(r)])),
    )

    next = {}
    for (const [id, { repo, assets }] of Object.entries(SURFACES)) {
      const payload = payloads[repo]
      const published = payload.assets ?? []
      const found = {}
      for (const [platform, pattern] of Object.entries(assets)) {
        const hit = published.find((a) => pattern.test(a.name))
        if (hit) found[platform] = { url: hit.browser_download_url, size: hit.size }
      }
      next[id] = { repo, version: payload.tag_name, platforms: found }
      const missing = Object.keys(assets).filter((p) => !found[p])
      console.log(
        `  ${id.padEnd(8)} ${payload.tag_name.padEnd(10)} ${Object.keys(found).length}/${Object.keys(assets).length}` +
          (missing.length ? `  NOT PUBLISHED: ${missing.join(', ')}` : ''),
      )
    }
  } catch (err) {
    // An unreachable API is not a build failure. The snapshot is the fallback.
    console.log(`  releases unreachable (${err.message}) — keeping the committed snapshot`)
    if (!held) throw new Error('no snapshot on disk and no API: cannot resolve downloads')
    return
  }

  // Never regress: a shrinking payload is a degraded response, not a retirement.
  if (held) {
    const count = (s) => Object.values(s).reduce((n, v) => n + Object.keys(v.platforms).length, 0)
    if (count(next) < count(held)) {
      console.log(`  REFUSED: resolves ${count(next)} assets, snapshot holds ${count(held)}`)
      for (const id of Object.keys(held)) {
        const gone = Object.keys(held[id].platforms).filter((p) => !next[id]?.platforms[p])
        if (gone.length) console.log(`    ${id}: would drop ${gone.join(', ')}`)
      }
      return
    }
  }

  writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`  wrote ${OUT}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
