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
    <section className="mt-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
      <h2 className="mb-3 text-2xs uppercase tracking-[0.09em] text-muted">
        {UI.protocolHeading}
      </h2>

      <ol className="list-decimal pl-5">
        {PROTOCOL.map((rule) => (
          <li key={rule.title} className="mb-[11px] last:mb-0">
            <strong className="block text-base font-medium">{rule.title}</strong>
            <span className="text-sm text-muted">{rule.body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
