import { describe, expect, it } from "vitest";

import { parseDateParam, screenHref } from "./query-date";

const TODAY = "2026-08-05";

describe("parseDateParam", () => {
  it("accepts a real day that has already happened", () => {
    expect(parseDateParam("2026-08-04", TODAY)).toBe("2026-08-04");
    expect(parseDateParam("2026-01-01", TODAY)).toBe("2026-01-01");
  });

  it("accepts today", () => {
    expect(parseDateParam(TODAY, TODAY)).toBe(TODAY);
  });

  it("refuses the future, however it is asked for", () => {
    // Spec 5.10: future days are not reachable. Disabling the forward arrow
    // is not enough on its own — the address bar is a way in too.
    expect(parseDateParam("2026-08-06", TODAY)).toBeNull();
    expect(parseDateParam("2027-01-01", TODAY)).toBeNull();
  });

  it("refuses a date that does not exist", () => {
    expect(parseDateParam("2026-02-30", TODAY)).toBeNull();
    expect(parseDateParam("2026-13-01", TODAY)).toBeNull();
  });

  it("refuses anything not shaped like a date", () => {
    expect(parseDateParam("yesterday", TODAY)).toBeNull();
    expect(parseDateParam("2026-8-5", TODAY)).toBeNull();
    expect(parseDateParam("", TODAY)).toBeNull();
    expect(parseDateParam(null, TODAY)).toBeNull();
  });

  it("falls back rather than failing", () => {
    // Every rejection returns null, which the screens read as "use today".
    // A mistyped URL should not produce an error screen.
    for (const bad of ["nonsense", "2026-99-99", "../../etc", "2030-01-01"]) {
      expect(parseDateParam(bad, TODAY)).toBeNull();
    }
  });
});

describe("screenHref", () => {
  it("carries the day you are looking at to the other screen", () => {
    expect(screenHref("/list", "2026-08-01", TODAY)).toBe(
      "/list?date=2026-08-01",
    );
    expect(screenHref("/", "2026-08-01", TODAY)).toBe("/?date=2026-08-01");
  });

  it("leaves today's URL clean", () => {
    // The everyday case is today, and it should not be cluttered with a
    // parameter that says so.
    expect(screenHref("/list", TODAY, TODAY)).toBe("/list");
    expect(screenHref("/", TODAY, TODAY)).toBe("/");
  });

  it("round-trips through parseDateParam", () => {
    const href = screenHref("/list", "2026-07-30", TODAY);
    const value = new URL(href, "https://example.test").searchParams.get("date");

    expect(parseDateParam(value, TODAY)).toBe("2026-07-30");
  });
});
