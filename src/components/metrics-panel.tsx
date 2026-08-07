"use client";

import { UI } from "@/lib/copy";

type Props = {
  sevenDay: string;
  thirtyDay: string;
  daysLogged: number;
  stale: boolean;
};

/**
 * The three numbers. Purely presentational — it is handed strings that have
 * already been worked out, so there is no arithmetic in this file at all.
 *
 * Three numbers, and none of them is a streak. There is no "best week", no
 * "days since a zero", no personal record. Every one of those is destroyed by
 * a single bad day, which is the failure this app exists to avoid.
 */
export function MetricsPanel({ sevenDay, thirtyDay, daysLogged, stale }: Props) {
  const metrics = [
    { value: sevenDay, label: UI.sevenDayAverage },
    { value: thirtyDay, label: UI.thirtyDayAverage },
    { value: String(daysLogged), label: UI.daysLogged },
  ];

  return (
    <section className="mt-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
      <div className="flex">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            // Hairline dividers instead of gaps, so the three read as one
            // group rather than three floating numbers.
            className={`flex-1 text-center ${
              index === 1 ? "border-x-[0.5px] border-rule" : ""
            }`}
          >
            <div className="text-2xl font-medium tracking-[-0.02em]">
              {metric.value}
            </div>
            <div className="mt-0.5 text-xs text-muted">{metric.label}</div>
          </div>
        ))}
      </div>

      {stale && (
        <p aria-live="polite" className="mt-3 text-xs text-muted">
          {UI.metricsStale}
        </p>
      )}
    </section>
  );
}
