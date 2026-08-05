import { describe, expect, it } from "vitest";

import { splitIntoTasks } from "./tasks";

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
