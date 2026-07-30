// The ZERO-JS server twin of @hanzogui/shell's HanzoFooter. Same ONE canonical
// registry (HANZO_FOOTER_COLUMNS / HANZO_FOOTER_BOTTOM) and the same shell
// chrome tokens, so it is content-identical with the client footer on every
// Hanzo property — but it renders as a pure server component: the hover states
// that HanzoFooter wires with onMouseEnter/onMouseLeave are one scoped <style>
// rule here, and the focus ring the shell injects with useShellFocusRing is a
// :focus-visible rule. No hooks, no directive, no bytes shipped.
//
// Marketing shells import THIS footer; app chrome keeps the shell HanzoFooter.

import {
  ACCENT,
  CHROME,
  FS,
  HANZO_FOOTER_BOTTOM,
  HANZO_FOOTER_COLUMNS,
} from "@hanzogui/shell";
import { HanzoLogo } from "@/components/HanzoLogo";

const css = `
footer[data-hanzo-shell-static] a { transition: color 120ms ease; }
footer[data-hanzo-shell-static] a:hover { color: ${CHROME.fg}; }
footer[data-hanzo-shell-static] a[aria-current="true"]:hover { color: ${ACCENT}; }
footer[data-hanzo-shell-static] a:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 2px; border-radius: 6px; }
`;

export default function StaticFooter({
  currentProductId,
  className,
}: {
  currentProductId?: string;
  className?: string;
}) {
  return (
    <footer
      role="contentinfo"
      data-hanzo-shell-static=""
      className={className}
      style={{
        borderTop: `1px solid ${CHROME.border}`,
        background: CHROME.panel,
        color: CHROME.fg,
        fontFamily: CHROME.font,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 24px", boxSizing: "border-box" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "32px 24px",
          }}
        >
          {HANZO_FOOTER_COLUMNS.map((col) => (
            <nav key={col.id} aria-label={col.title}>
              <div
                style={{
                  fontSize: FS.xs,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: CHROME.fgDim,
                  marginBottom: 14,
                }}
              >
                {col.title}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.items.map((item) => {
                  const current = col.id === "products" && item.id === currentProductId;
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        aria-current={current ? "true" : undefined}
                        style={{
                          fontSize: FS.sm,
                          textDecoration: "none",
                          color: current ? ACCENT : CHROME.fgMuted,
                        }}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
            marginTop: 40,
            paddingTop: 22,
            borderTop: `1px solid ${CHROME.border}`,
          }}
        >
          <a href="https://hanzo.ai" aria-label="Hanzo" style={{ color: CHROME.fg, textDecoration: "none", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <HanzoLogo className="w-5 h-5" />
            <span style={{ fontSize: FS.base, fontWeight: 600, letterSpacing: "-0.01em" }}>Hanzo</span>
          </a>
          <span style={{ fontSize: FS.sm, color: CHROME.fgMuted, flexShrink: 0 }}>{HANZO_FOOTER_BOTTOM.copyright}</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {HANZO_FOOTER_BOTTOM.links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                style={{
                  fontSize: FS.sm,
                  textDecoration: "none",
                  color: CHROME.fgMuted,
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
