/*
  Chunk 1 placeholder. This is a token proof sheet, not the real screen —
  it exists so we can see every colour in globals.css rendered before any
  feature depends on it. Chunk 6 replaces it with the today view.

  Deliberately contains NO product copy: every user-facing string in this app
  has to live in src/lib/copy.ts (spec 5.5), and that module arrives in Chunk 3.
*/

// The score ramp, 0 to 5. Each entry names a Tailwind class generated from a
// token in globals.css.
const SCORE_SWATCHES = [
  "bg-score-0",
  "bg-score-1",
  "bg-score-2",
  "bg-score-3",
  "bg-score-4",
  "bg-score-5",
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-6">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Daily Log</h1>
      <p className="mb-6 text-[13px] text-muted">Scaffold — no features yet.</p>

      <section className="mb-4 rounded-[var(--radius-card)] border border-line bg-card p-5">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.07em] text-muted">
          Score ramp
        </h2>

        <div className="flex gap-[5px]">
          {/*
            `.map()` returning JSX is how React renders a list. The `key` prop
            is required — React uses it to tell the items apart between renders.
          */}
          {SCORE_SWATCHES.map((className, score) => (
            <div key={className} className="flex-1 text-center">
              <div className={`aspect-square rounded-[4px] ${className}`} />
              <div className="mt-1 text-[11px] text-muted">{score}</div>
            </div>
          ))}

          <div className="flex-1 text-center">
            <div className="aspect-square rounded-[4px] border border-dashed border-field-line bg-unlogged" />
            <div className="mt-1 text-[11px] text-muted">–</div>
          </div>
        </div>

        <p className="mt-4 text-[12.5px] text-muted">
          The final swatch is an unlogged day. It is paler than a zero and
          dashed, because a day you never opened is not a failure.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-card p-5">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.07em] text-muted">
          Surfaces and text
        </h2>

        <p className="text-[15px] text-ink">Ink — body text.</p>
        <p className="text-[13px] text-muted">Muted — helper text, labels.</p>
        <p className="text-[22px] text-faint">Faint — large text only.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-tag-line bg-tag px-2 py-[2px] text-[11px] text-tag-ink">
            today
          </span>
          <span className="rounded-[var(--radius-control)] border border-on-line bg-on px-3 py-1 text-[13px] text-accent">
            accent
          </span>
          <span className="rounded-[var(--radius-control)] border border-control bg-hover px-3 py-1 text-[13px] text-muted">
            control
          </span>
        </div>

        <div className="mt-4 rounded-[var(--radius-card)] bg-banner px-4 py-3 text-[14px] text-white">
          Banner surface, with a{" "}
          <span className="font-semibold text-highlight">highlight</span> span.
        </div>
      </section>
    </main>
  );
}
