"use client";

type Props = {
  label: string;
  helper: string;
  ticked: boolean;
  /** True while another day is loading, so a tap cannot land on stale data. */
  disabled: boolean;
  onToggle: () => void;
  /**
   * The ticked fill. Green for the five daily marks; grey for anything that
   * is not scored, because a green tick would make it look like an
   * achievement — see spec 6.6.
   */
  tone?: "accent" | "muted";
};

/**
 * One tickable row.
 *
 * A real `<button>` rather than a styled `<div>`, so it can be reached and
 * operated from the keyboard and announced properly by a screen reader.
 * `role="switch"` with `aria-checked` says "this is a two-state control and it
 * is currently on", which is exactly what it is.
 *
 * The row runs the full width of the card, edge to edge, separated by a
 * hairline — the ruling of a ledger. That is why it carries `-mx-4 px-4`: the
 * negative margin cancels the card's padding so the rule reaches both edges,
 * and the padding puts the content back where it belongs.
 *
 * The whole row is the target, and it clears the 44px minimum for a thumb.
 */
export function MarkToggle({
  label,
  helper,
  ticked,
  disabled,
  onToggle,
  tone = "accent",
}: Props) {
  const boxOn =
    tone === "accent" ? "border-accent bg-accent" : "border-muted bg-muted";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ticked}
      disabled={disabled}
      onClick={onToggle}
      className={`-mx-4 flex min-h-11 w-[calc(100%+2rem)] items-start gap-3 border-b-[0.5px] border-rule px-4 py-3 text-left transition-colors duration-100 last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
        ticked ? "bg-on" : "hover:bg-row-hover"
      }`}
    >
      <span
        // aria-hidden because the button already announces its own state;
        // without this a screen reader would read the tick twice.
        aria-hidden="true"
        className={`mt-px grid size-[21px] shrink-0 place-items-center rounded-[6px] border-[1.5px] text-sm text-white ${
          ticked ? boxOn : "border-box bg-card"
        }`}
      >
        {ticked ? "✓" : ""}
      </span>

      <span>
        <span className="text-base font-medium">{label}</span>
        <span className="mt-px block text-sm text-muted">{helper}</span>
      </span>
    </button>
  );
}
