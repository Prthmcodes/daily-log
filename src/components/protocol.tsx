import { PROTOCOL, UI } from "@/lib/copy";

/**
 * The five rules.
 *
 * Plainly on the page — no tab, no accordion, no "read more", no modal. It is
 * meant to be read at the moment a day is being written off, and anything that
 * needs opening first is something you will not open at that moment.
 *
 * It sits below the log rather than above it because it runs to about 250
 * words, and a screen that makes you read 250 words before ticking a box is a
 * screen you stop opening. The reframe banner is the part that has to be seen
 * immediately; this is the part that has to be *there*.
 */
export function Protocol() {
  return (
    <section className="mt-4 rounded-[var(--radius-card)] border border-line bg-card px-5 py-[18px]">
      <h2 className="mb-[14px] text-[13px] font-semibold uppercase tracking-[0.07em] text-muted">
        {UI.protocolHeading}
      </h2>

      <ol className="list-decimal pl-5">
        {PROTOCOL.map((rule) => (
          <li key={rule.title} className="mb-[11px] last:mb-0">
            <strong className="block font-medium">{rule.title}</strong>
            <span className="text-[13.5px] text-muted">{rule.body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
