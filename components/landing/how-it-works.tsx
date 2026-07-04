// Three-step "how it works" — the Lovable structure (idea → build → ship) in
// Hanzo's monochrome. The third step is the differentiator: it ships to Hanzo
// Cloud, not just a preview.

const steps = [
  {
    n: "01",
    title: "Describe it",
    body: "Type what you want to build in plain English — or import an existing GitHub repo to start from real code.",
  },
  {
    n: "02",
    title: "Watch it come to life",
    body: "Hanzo generates the UI, database schema, auth, and API — then refines with you in a live editor as you chat.",
  },
  {
    n: "03",
    title: "Ship it on Hanzo Cloud",
    body: "One click deploys to a live URL with your database, auth, AI, and storage already running. No pipeline to set up.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            From a sentence to a shipped app.
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex flex-col bg-[#050505] p-8 transition-colors duration-200 hover:bg-[#0a0a0a] md:p-10"
            >
              <span className="font-mono text-sm text-white/30">{s.n}</span>
              <h3 className="mt-6 text-xl font-medium tracking-tight text-white">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
