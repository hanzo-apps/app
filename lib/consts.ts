// Idle canvas shown in the builder preview before anything is generated.
//
// Honest empty state — NOT a fake loader: no phantom progress bar, no "being
// generated…" copy while nothing is happening. Monochrome to match the brand
// sweep, fully self-contained (no external CDN), and it respects
// prefers-reduced-motion. The moment the AI returns HTML, `srcDoc` swaps to the
// real site — this is just what sits behind the cursor until then.
export const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body {
      background: #0a0a0a;
      color: #fafafa;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { text-align: center; padding: 2rem; max-width: 30rem; }
    .mark {
      width: 3.5rem; height: 3.5rem; margin: 0 auto 1.75rem;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 0.875rem;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em;
      color: #fafafa; background: rgba(255,255,255,0.03);
    }
    h1 { font-size: 1.05rem; font-weight: 600; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
    p { font-size: 0.85rem; line-height: 1.5; color: rgba(255,255,255,0.5); margin: 0; }
    .cursor {
      display: inline-block; width: 0.5rem; height: 1.05rem;
      background: rgba(255,255,255,0.55); margin-left: 0.25rem;
      transform: translateY(0.15rem);
      animation: blink 1.15s steps(1) infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .cursor { animation: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="mark" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3c.45 3.75 2.55 5.85 6 6-3.45.15-5.55 2.25-6 6-.45-3.75-2.55-5.85-6-6 3.45-.15 5.55-2.25 6-6z" fill="rgba(255,255,255,0.7)"/>
      </svg>
    </div>
    <h1>Your app will appear here<span class="cursor"></span></h1>
    <p>Describe what you want to build in the chat and Hanzo generates it live — right here.</p>
  </div>
</body>
</html>
`;
