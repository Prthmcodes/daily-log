"use client";

import { AddTask } from "@/components/add-task";
import { ComposeList } from "@/components/compose-list";
import { DateBar } from "@/components/date-bar";
import { ScreenNav } from "@/components/screen-nav";
import { TaskRow } from "@/components/task-row";
import { MORNING_LIST, UI } from "@/lib/copy";
import { useList } from "@/lib/use-list";

type Props = {
  /** Passed down from the server, which has already established who you are. */
  userId: string;
};

/**
 * The morning list.
 *
 * Its own screen, its own table, and no arithmetic anywhere on it. No count,
 * no fraction, no percentage, no progress bar, no colour that responds to how
 * much is done. A ticked box and an unticked box are both just boxes.
 *
 * Yesterday's unticked tasks are not here either. They do not carry over, are
 * not shown, and are not referred to. If something still needs doing, it gets
 * typed again — and that retyping is the point, because it makes it a fresh
 * decision instead of an inherited debt.
 */
export function ListScreen({ userId }: Props) {
  const list = useList(userId);

  if (list.loadFailed) {
    return <p className="text-sm text-muted">{UI.loadFailed}</p>;
  }

  if (!list.todayK || !list.selectedKey) {
    return <p className="text-sm text-muted">{UI.loading}</p>;
  }

  return (
    <>
      <ScreenNav
        current="list"
        selectedKey={list.selectedKey}
        todayK={list.todayK}
      />

      <section className="rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
        <DateBar
          selectedKey={list.selectedKey}
          todayK={list.todayK}
          onSelect={list.select}
        />

        {list.tasks.length === 0 ? (
          <ComposeList busy={list.busy} onSubmit={list.makeList} />
        ) : (
          <>
            <ul>
              {list.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => list.toggle(task.id)}
                  onDelete={() => list.remove(task.id)}
                />
              ))}
            </ul>

            <AddTask onAdd={list.add} />

            <p className="mt-4 text-sm text-muted">
              {MORNING_LIST.standingLine}
            </p>
          </>
        )}

        {list.saveFailed && (
          <p aria-live="polite" className="mt-3 text-sm text-muted">
            {UI.saveFailed}
          </p>
        )}
      </section>
    </>
  );
}
