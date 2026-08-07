"use client";

import { DateBar } from "@/components/date-bar";
import { DayGrid } from "@/components/day-grid";
import { DayLine } from "@/components/day-line";
import { ExtrasCard } from "@/components/extras-card";
import { MarksCard } from "@/components/marks-card";
import { MetricsPanel } from "@/components/metrics-panel";
import { ScreenNav } from "@/components/screen-nav";
import { UI } from "@/lib/copy";
import { averageWithin, formatAverage } from "@/lib/metrics";
import { useToday } from "@/lib/use-today";

type Props = {
  /** Passed down from the server, which has already established who you are. */
  userId: string;
};

/**
 * The today screen: layout only.
 *
 * All the state and every rule about when a `days` row may be written live in
 * the useToday hook, so this file is just an arrangement of parts.
 */
export function TodayScreen({ userId }: Props) {
  const day = useToday(userId);

  if (day.loadFailed) {
    return <p className="text-sm text-muted">{UI.loadFailed}</p>;
  }

  if (!day.todayK || !day.selectedKey) {
    return <p className="text-sm text-muted">{UI.loading}</p>;
  }

  return (
    <>
      <ScreenNav
        current="today"
        selectedKey={day.selectedKey}
        todayK={day.todayK}
      />

      <section className="rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
        <DateBar
          selectedKey={day.selectedKey}
          todayK={day.todayK}
          onSelect={day.select}
        />

        <MarksCard
          marks={day.marks}
          isLogged={day.isLogged}
          busy={day.dayLoading}
          saveFailed={day.saveFailed}
          onToggle={day.toggle}
          onLogZero={day.logZero}
        />

        {/*
          Held back until the day has loaded, and given a `key` of the date.
          Changing a component's key makes React throw the old one away and
          build a fresh one — which is what makes the textarea start from the
          right text when you move to another day, since it reads its starting
          value only when it is first created.
        */}
        {!day.dayLoading && (
          <DayLine
            key={day.selectedKey}
            userId={userId}
            dateKey={day.selectedKey}
            initialNote={day.initialNote}
            onSaved={day.noteSaved}
          />
        )}
      </section>

      {/*
        Below the marks and above the numbers, so it reads as part of the day
        rather than part of the score. The `key` makes React build a fresh one
        when you move to another date, the same way the day line works.
      */}
      <ExtrasCard
        key={day.selectedKey}
        userId={userId}
        dateKey={day.selectedKey}
      />

      <MetricsPanel
        sevenDay={formatAverage(
          averageWithin(day.loggedDays, day.sevenDayKeys),
        )}
        thirtyDay={formatAverage(
          averageWithin(day.loggedDays, day.thirtyDayKeys),
        )}
        daysLogged={day.totalLogged}
        stale={day.metricsStale}
      />

      <DayGrid
        endKey={day.todayK}
        loggedDays={day.loggedDays}
        selectedKey={day.selectedKey}
        onSelect={day.select}
      />
    </>
  );
}
