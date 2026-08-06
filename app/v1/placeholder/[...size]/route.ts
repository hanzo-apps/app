/**
 * /v1/placeholder/<w>/<h> — a generated grey box.
 *
 * Template preview pages reference stand-in imagery at a dozen aspect ratios.
 * Shipping a dozen PNGs, or letting them 404 into broken-image icons (which is
 * what they did), are both worse than drawing one SVG on demand.
 */
const clamp = (n: number) => Math.min(Math.max(Math.round(n) || 1, 1), 4096);

export async function GET(_req: Request, ctx: { params: Promise<{ size: string[] }> }) {
  const [w, h] = (await ctx.params).size;
  const width = clamp(Number(w));
  const height = clamp(Number(h ?? w));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#e5e5e5"/>` +
    `<text x="50%" y="50%" fill="#a3a3a3" text-anchor="middle" dominant-baseline="middle"` +
    ` font-family="system-ui,sans-serif" font-size="${clamp(Math.min(width, height) / 8)}">` +
    `${width}×${height}</text></svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
