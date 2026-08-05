import { describe, expect, it } from "vitest";

import type { TaskRow } from "./supabase/types";
import { nextPosition, splitIntoTasks } from "./tasks";

/** A task as the database would hand it back. */
function task(position: number, done = false): TaskRow {
  return {
    id: `id-${position}`,
    user_id: "11111111-1111-4111-8111-111111111111",
    date: "2026-08-05",
    text: `task ${position}`,
    done,
    position,
    created_at: "2026-08-05T08:00:00Z",
    updated_at: "2026-08-05T08:00:00Z",
  };
}

describe("nextPosition", () => {
  it("starts at zero for an empty list", () => {
    expect(nextPosition([])).toBe(0);
  });

  it("goes after everything already there", () => {
    expect(nextPosition([task(0), task(1), task(2)])).toBe(3);
  });

  it("goes to the bottom even when the numbering has gaps", () => {
    // Deleting a task leaves a hole. Something added afterwards must still
    // land at the end, not back in the hole.
    expect(nextPosition([task(0), task(3), task(7)])).toBe(8);
  });

  it("does not care whether anything is done", () => {
    // Position is order, not progress. A list of finished tasks still puts
    // the next one at the bottom.
    expect(nextPosition([task(0, true), task(1, true)])).toBe(2);
  });
});

describe("splitIntoTasks", () => {
  it("makes one task per line, in the order written", () => {
    expect(splitIntoTasks("email tom\nlaundry\nread chapter 4")).toEqual([
      "email tom",
      "laundry",
      "read chapter 4",
    ]);
  });

  it("drops blank lines rather than making empty tasks", () => {
    // Typing a blank line to space things out is normal. It must not turn
    // into a task with nothing in it.
    expect(splitIntoTasks("email tom\n\n\nlaundry\n")).toEqual([
      "email tom",
      "laundry",
    ]);
  });

  it("drops lines that are only whitespace", () => {
    expect(splitIntoTasks("email tom\n   \n\t\nlaundry")).toEqual([
      "email tom",
      "laundry",
    ]);
  });

  it("trims the spaces around each line", () => {
    expect(splitIntoTasks("  email tom  \n\tlaundry ")).toEqual([
      "email tom",
      "laundry",
    ]);
  });

  it("handles Windows line endings", () => {
    // He is typing this on Windows. Splitting on "\n" leaves a carriage
    // return at the end of every line, invisible in the text and visible in
    // the layout. Trimming removes it.
    const text = "email tom\r\nlaundry\r\nread chapter 4";

    expect(splitIntoTasks(text)).toEqual([
      "email tom",
      "laundry",
      "read chapter 4",
    ]);
    // Belt and braces: no stray control characters survived.
    for (const task of splitIntoTasks(text)) {
      expect(task).not.toMatch(/[\r\n]/);
    }
  });

  it("returns nothing for an empty or blank box", () => {
    expect(splitIntoTasks("")).toEqual([]);
    expect(splitIntoTasks("\n\n")).toEqual([]);
    expect(splitIntoTasks("   \n\t  ")).toEqual([]);
  });

  it("keeps a single line with no newline at all", () => {
    expect(splitIntoTasks("just the one thing")).toEqual(["just the one thing"]);
  });

  it("leaves the text of a task alone apart from the ends", () => {
    // Internal punctuation, capitals and double spaces are the user's
    // business. This is not a formatter.
    expect(splitIntoTasks("  Ring Mum — she called twice  ")).toEqual([
      "Ring Mum — she called twice",
    ]);
  });
});
