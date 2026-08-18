"use client";

import { useEffect, useState } from "react";

import { WorkRow } from "@/components/work-row";
import { UI, WORK } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";
import type { WorkItemRow } from "@/lib/supabase/types";
import {
  BUCKETS,
  addWorkItem,
  deleteWorkItem,
  fetchWorkItems,
  inBucket,
  moveWorkItem,
  nextPosition,
  setWorkItemDone,
  type Bucket,
} from "@/lib/work";

type Props = {
  userId: string;
};

/**
 * Three buckets of things that need doing.
 *
 * Nothing here is counted, and nothing here can be. There is no total, no
 * "three left", no colour that deepens as a bucket fills. A bucket with nine
 * things and a bucket with one differ only in how far down the page they go,
 * which is the only honest difference between them.
 *
 * The buckets are also not colour-coded by urgency. Red for "emergency" is the
 * obvious move and it is ruled out: the palette runs grey to green precisely
 * so that nothing on any screen shouts at you (design rule 4). The ordering
 * carries the meaning — emergency is at the top because that is where you look
 * first.
 */
export function WorkBoard({ userId }: Props) {
  const [items, setItems] = useState<WorkItemRow[]>([]);
  const [drafts, setDrafts] = useState<Record<Bucket, string>>({
    emergency: "",
    important: "",
    unimportant: "",
  });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setItems(await fetchWorkItems(createClient()));
        setLoading(false);
      } catch {
        setLoadFailed(true);
      }
    }

    load();
  }, []);

  async function handleAdd(bucket: Bucket, event: React.FormEvent) {
    event.preventDefault();
    const text = drafts[bucket].trim();
    if (text.length === 0) return;

    setSaveFailed(false);
    try {
      const created = await addWorkItem(
        createClient(),
        userId,
        bucket,
        text,
        nextPosition(items, bucket),
      );
      setItems([...items, created]);
      setDrafts({ ...drafts, [bucket]: "" });
    } catch {
      setSaveFailed(true);
    }
  }

  /** Tick or untick. Instant, then confirmed. */
  async function handleToggle(item: WorkItemRow) {
    const previous = items;
    const done = !item.done;

    setItems(
      items.map((each) => (each.id === item.id ? { ...each, done } : each)),
    );
    setSaveFailed(false);

    try {
      await setWorkItemDone(createClient(), item.id, done);
    } catch {
      setItems(previous);
      setSaveFailed(true);
    }
  }

  /** Re-triage. Things change how much they matter during a day. */
  async function handleMove(item: WorkItemRow, bucket: Bucket) {
    if (bucket === item.bucket) return;

    const previous = items;
    const position = nextPosition(items, bucket);

    setItems(
      items.map((each) =>
        each.id === item.id ? { ...each, bucket, position } : each,
      ),
    );
    setSaveFailed(false);

    try {
      await moveWorkItem(createClient(), item.id, bucket, position);
    } catch {
      setItems(previous);
      setSaveFailed(true);
    }
  }

  async function handleDelete(item: WorkItemRow) {
    const previous = items;
    setItems(items.filter((each) => each.id !== item.id));
    setSaveFailed(false);

    try {
      await deleteWorkItem(createClient(), item.id);
    } catch {
      setItems(previous);
      setSaveFailed(true);
    }
  }

  if (loadFailed) {
    return <p className="text-sm text-muted">{UI.loadFailed}</p>;
  }

  if (loading) {
    return <p className="text-sm text-muted">{UI.loading}</p>;
  }

  return (
    <>
      {BUCKETS.map((bucket) => {
        const bucketItems = inBucket(items, bucket);

        return (
          <section
            key={bucket}
            className="mb-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]"
          >
            <h2 className="mb-3 text-2xs uppercase tracking-[0.09em] text-muted">
              {WORK.buckets[bucket]}
            </h2>

            {bucketItems.length === 0 ? (
              <p className="text-sm text-muted">{WORK.emptyBucket}</p>
            ) : (
              <ul className="border-t-[0.5px] border-rule">
                {bucketItems.map((item) => (
                  <WorkRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onMove={(next) => handleMove(item, next)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </ul>
            )}

            <form onSubmit={(event) => handleAdd(bucket, event)} className="mt-3">
              <input
                type="text"
                value={drafts[bucket]}
                onChange={(event) =>
                  setDrafts({ ...drafts, [bucket]: event.target.value })
                }
                aria-label={`${WORK.addButton}: ${WORK.buckets[bucket]}`}
                placeholder={WORK.addPlaceholder}
                className="min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-field-line bg-field px-3 text-base text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
              />
              {/* Hidden from view but not from the keyboard or a screen
                  reader. A single-input form already submits on Enter. */}
              <button type="submit" className="sr-only">
                {WORK.addButton}
              </button>
            </form>
          </section>
        );
      })}

      <p className="text-sm text-muted">{WORK.standingLine}</p>

      {saveFailed && (
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          {UI.saveFailed}
        </p>
      )}
    </>
  );
}
