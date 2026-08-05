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
    <section className="mt-4 rounded-[var(--radius-card)] border border-line bg-card px-5 py-[18px]">
      <h2 className="mb-[14px] text-[13px] font-semibold uppercase tracking-[0.07em] text-muted">
        {UI.metricsHeading}
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="py-1 text-center">
            <div className="text-[25px] font-semibold tracking-[-0.02em]">
              {metric.value}
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {stale && (
        <p aria-live="polite" className="mt-3 text-[11.5px] text-muted">
          {UI.metricsStale}
        </p>
      )}
    </section>
  );
}
