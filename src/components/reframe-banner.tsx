import { REFRAME_BANNER } from "@/lib/copy";

/**
 * The one thing that has to be read before anything else, so it sits above the
 * marks and is visible without scrolling.
 *
 * No "use client" here: it never changes, so it is rendered on the server and
 * is on screen before any JavaScript has loaded. The most important sentence
 * in the app should not be waiting on a network request.
 */
export function ReframeBanner() {
  return (
    <p className="mt-[18px] rounded-[var(--radius-card)] bg-banner px-[18px] py-4 text-base leading-[1.6] text-white">
      {REFRAME_BANNER.map((segment, index) =>
        segment.emphasis ? (
          // Using the position as the key is normally a bad habit, because a
          // list that reorders would reuse the wrong element. This list is a
          // fixed constant that cannot reorder, so it is safe here.
          <strong key={index} className="font-semibold text-highlight">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
